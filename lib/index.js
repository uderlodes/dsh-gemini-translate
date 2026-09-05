/**
 * Host half of the Gemini translate plugin.
 * Registers a settings namespace (plugin list + plugin config) and an HTTP
 * route the browser translation window uses to translate and persist config.
 */
import z from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';
import { listModels, translateText } from './translator.js';

export const name = 'gemini-translate';
export const inject = ['webServer'];

const DEFAULT_API_KEY_ENV = 'GEMINI_API_KEY';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const ROUTE_PREFIX = '/dsh-gemini-translate';

export const GEMINI_TRANSLATE_SETTINGS_NAMESPACE = settingsNamespace('gemini-translate');

export const Config = z.object({
  apiKey: z.string().role('secret'),
  apiKeyEnv: z.string().default(DEFAULT_API_KEY_ENV),
  baseUrl: z.string().default(DEFAULT_BASE_URL),
  model: z.string().default(DEFAULT_MODEL),
  apiType: z.string().default('google'),
});

function publicConfig(config) {
  return {
    apiKeyEnv: config.apiKeyEnv || DEFAULT_API_KEY_ENV,
    baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    model: config.model || DEFAULT_MODEL,
    apiType: config.apiType === 'openai' ? 'openai' : 'google',
    hasApiKey: Boolean(config.apiKey && config.apiKey.length > 0)
      || Boolean(process.env[config.apiKeyEnv || DEFAULT_API_KEY_ENV]),
  };
}

async function resolveApiKey(ctx, config) {
  if (config.apiKey && config.apiKey.length > 0) return config.apiKey;
  const envName = config.apiKeyEnv || DEFAULT_API_KEY_ENV;
  try {
    const credentials = ctx.get('credentials');
    if (credentials !== undefined) {
      const resolved = await credentials.resolve(credentialRef(envName));
      if (resolved?.value) return resolved.value;
    }
  } catch {
    // fall through
  }
  const ambient = process.env[envName];
  return ambient && ambient.length > 0 ? ambient : '';
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function pathnameOf(req) {
  try {
    return new URL(req.url || '/', 'http://127.0.0.1').pathname;
  } catch {
    return String(req.url || '/').split('?')[0];
  }
}

export function apply(ctx, config) {
  let current = () => config;

  installSettingsSection(ctx, GEMINI_TRANSLATE_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source;
    },
    onChange: () => {},
  });

  async function handle(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const pathname = pathnameOf(req);
    const cfg = current() || config;

    if ((pathname === ROUTE_PREFIX || pathname === `${ROUTE_PREFIX}/health`) && req.method === 'GET') {
      const pub = publicConfig(cfg);
      pub.hasApiKey = pub.hasApiKey || Boolean(await resolveApiKey(ctx, cfg));
      sendJson(res, 200, { status: 'ok', plugin: name, ...pub });
      return;
    }

    if (pathname === `${ROUTE_PREFIX}/config` && req.method === 'GET') {
      const pub = publicConfig(cfg);
      pub.hasApiKey = pub.hasApiKey || Boolean(await resolveApiKey(ctx, cfg));
      sendJson(res, 200, pub);
      return;
    }

    if (pathname === `${ROUTE_PREFIX}/config` && (req.method === 'PUT' || req.method === 'POST')) {
      try {
        const body = await readJsonBody(req);
        const patch = {};
        if (typeof body.baseUrl === 'string' && body.baseUrl.trim()) patch.baseUrl = body.baseUrl.trim();
        if (typeof body.model === 'string' && body.model.trim()) patch.model = body.model.trim();
        if (typeof body.apiType === 'string' && body.apiType.trim()) {
          patch.apiType = body.apiType.trim() === 'openai' ? 'openai' : 'google';
        }
        if (typeof body.apiKeyEnv === 'string' && body.apiKeyEnv.trim()) patch.apiKeyEnv = body.apiKeyEnv.trim();
        if (typeof body.apiKey === 'string' && body.apiKey.trim()) patch.apiKey = body.apiKey.trim();

        const settings = ctx.get('settings');
        if (!settings?.update) throw new Error('settings service is not available');
        await settings.update(GEMINI_TRANSLATE_SETTINGS_NAMESPACE, patch);
        sendJson(res, 200, publicConfig(current()));
      } catch (error) {
        ctx.logger?.warn?.('[gemini-translate] save config failed: %s', error?.message || error);
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if ((pathname === `${ROUTE_PREFIX}/models`) && (req.method === 'GET' || req.method === 'POST')) {
      try {
        const body = req.method === 'POST' ? await readJsonBody(req) : {};
        const live = current() || cfg;
        const probe = {
          ...live,
          ...typeof body.baseUrl === 'string' && body.baseUrl.trim() ? { baseUrl: body.baseUrl.trim() } : {},
          ...typeof body.apiType === 'string' && body.apiType.trim() ? { apiType: body.apiType.trim() } : {},
          apiKey: (typeof body.apiKey === 'string' && body.apiKey.trim())
            ? body.apiKey.trim()
            : await resolveApiKey(ctx, live),
        };
        const models = await listModels(probe);
        sendJson(res, 200, { models, count: models.length });
      } catch (error) {
        ctx.logger?.warn?.('[gemini-translate] list models failed: %s', error?.message || error);
        sendJson(res, 500, { error: error?.message || String(error) });
      }
      return;
    }

    if (pathname === `${ROUTE_PREFIX}/translate` && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const text = typeof body.text === 'string' ? body.text : '';
        const direction = body.direction === 'zh' ? 'zh' : 'en';
        const live = current() || cfg;
        const request = {
          ...live,
          apiKey: await resolveApiKey(ctx, live),
        };
        if (body.stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          const translated = await translateText(request, text, direction, (delta, full) => {
            res.write(`data: ${JSON.stringify({ delta, text: full, direction })}\n\n`);
          });
          res.write(`data: ${JSON.stringify({ done: true, text: translated, direction })}\n\n`);
          res.end();
          return;
        }
        const translated = await translateText(request, text, direction);
        sendJson(res, 200, { text: translated, direction });
      } catch (error) {
        ctx.logger?.warn?.('[gemini-translate] translate failed: %s', error?.message || error);
        if (!res.headersSent) {
          sendJson(res, 500, { error: error?.message || String(error) });
        } else {
          res.write(`data: ${JSON.stringify({ error: error?.message || String(error) })}\n\n`);
          res.end();
        }
      }
      return;
    }

    sendJson(res, 404, { error: `not found: ${pathname}` });
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req, res) => {
      Promise.resolve(handle(req, res)).catch((error) => {
        ctx.logger?.warn?.('[gemini-translate] route error: %s', error?.message || error);
        if (!res.headersSent) sendJson(res, 500, { error: error?.message || String(error) });
      });
    },
  }), 'gemini-translate: http route');

  ctx.logger?.info?.('[gemini-translate] plugin mounted. Configure Gemini in the translation window above the composer.');
}
