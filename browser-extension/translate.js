/* Shared translation core. Loaded via importScripts in the service worker. */

const SYSTEM_TO_EN = 'Translate into English. Keep code, Markdown, URLs, and names unchanged. Output translation only.';
const SYSTEM_TO_ZH = 'Translate into Simplified Chinese. Keep code, Markdown, URLs, and names unchanged. Output translation only.';

function isLikelyEnglish(text) {
  if (!text || typeof text !== 'string') return true;
  return !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text);
}

function resolveApiType(config) {
  return config.apiType === 'openai' || /\/v1$/.test(config.baseUrl || '')
    ? 'openai'
    : 'google';
}

async function callOpenAI(config, systemInstruction, userPrompt) {
  const baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;
  const payload = {
    model: config.model || 'gemini-2.5-flash',
    temperature: 0,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ ...payload, reasoning_effort: 'low' }),
  });
  if (response.status === 400) {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  }
  if (!response.ok) {
    throw new Error(`API [${response.status}]: ${await response.text()}`);
  }
  const data = await response.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function callGoogle(config, systemInstruction, userPrompt) {
  const baseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
  const model = config.model || 'gemini-2.5-flash';
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0, maxOutputTokens: 4096 },
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini [${response.status}]: ${await response.text()}`);
  }
  const data = await response.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

async function translateText(config, text, direction) {
  const source = typeof text === 'string' ? text.trim() : '';
  if (!source) return '';
  if (direction === 'en' && isLikelyEnglish(source)) return source;
  if (!config.apiKey) throw new Error('未配置 API Key。请先在扩展设置里填写。');
  const system = direction === 'zh' ? SYSTEM_TO_ZH : SYSTEM_TO_EN;
  const translated = resolveApiType(config) === 'openai'
    ? await callOpenAI(config, system, source)
    : await callGoogle(config, system, source);
  return translated || source;
}

function modelIdOf(entry) {
  if (typeof entry === 'string' && entry.length > 0) return entry;
  if (!entry || typeof entry !== 'object') return '';
  const raw = entry.id || entry.name || entry.display_name || '';
  if (typeof raw !== 'string') return '';
  return raw.replace(/^models\//, '');
}

async function listModels(config) {
  if (!config.apiKey) throw new Error('未配置 API Key，无法探测模型。');
  const baseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
  let ids = [];
  if (resolveApiType(config) === 'openai') {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!response.ok) throw new Error(`探测模型失败 [${response.status}]: ${await response.text()}`);
    const data = await response.json();
    const rows = Array.isArray(data) ? data : (data.data || data.models || []);
    ids = rows.map(modelIdOf).filter(Boolean);
  } else {
    const response = await fetch(`${baseUrl}/v1beta/models?key=${encodeURIComponent(config.apiKey)}`, {
      headers: { 'x-goog-api-key': config.apiKey },
    });
    if (!response.ok) throw new Error(`探测模型失败 [${response.status}]: ${await response.text()}`);
    const data = await response.json();
    ids = (data.models || []).map(modelIdOf).filter(Boolean);
  }
  const unique = [...new Set(ids)];
  unique.sort((a, b) => {
    const ag = /^gemini/i.test(a) ? 0 : 1;
    const bg = /^gemini/i.test(b) ? 0 : 1;
    if (ag !== bg) return ag - bg;
    return a.localeCompare(b);
  });
  return unique.slice(0, 300);
}
