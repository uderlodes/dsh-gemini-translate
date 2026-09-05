/** Gemini translation helpers used by the host plugin. */

const SYSTEM_TO_EN = `Translate into English. Keep code, Markdown, URLs, and names unchanged. Output translation only.`;

const SYSTEM_TO_ZH = `Translate into Simplified Chinese. Keep code, Markdown, URLs, and names unchanged. Output translation only.`;

export function isLikelyEnglish(text) {
  if (!text || typeof text !== 'string') return true;
  return !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text);
}

function resolveApiType(config) {
  return config.apiType === 'openai' || /\/v1$/.test(config.baseUrl || '')
    ? 'openai'
    : 'google';
}

function requestArgs(config, direction, source) {
  return {
    baseUrl: (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, ''),
    apiKey: config.apiKey,
    model: config.model || 'gemini-2.5-flash',
    systemInstruction: direction === 'zh' ? SYSTEM_TO_ZH : SYSTEM_TO_EN,
    userPrompt: source,
  };
}

async function readSseOpenAI(response, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;
      try {
        const data = JSON.parse(payload);
        const chunk = data.choices?.[0]?.delta?.content || '';
        if (chunk) {
          full += chunk;
          if (onDelta) onDelta(chunk, full);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }
  return full.trim();
}

async function callGeminiOpenAI({ baseUrl, apiKey, model, systemInstruction, userPrompt }, onDelta) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const stream = typeof onDelta === 'function';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 4096,
      stream,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (response.status === 400) {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 4096,
        stream,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
  }
  if (!response.ok) {
    throw new Error(`Gemini OpenAI API [${response.status}]: ${await response.text()}`);
  }
  if (stream) return readSseOpenAI(response, onDelta);
  const data = await response.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function callGeminiGoogle({ baseUrl, apiKey, model, systemInstruction, userPrompt }, onDelta) {
  const stream = typeof onDelta === 'function';
  const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  const url = `${baseUrl}/v1beta/models/${model}:${endpoint}${urlJoinKey(apiKey, stream)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0, maxOutputTokens: 4096 },
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini Google API [${response.status}]: ${await response.text()}`);
  }
  if (!stream) {
    const data = await response.json();
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(trimmed.slice(6));
        const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (chunk) {
          full += chunk;
          onDelta(chunk, full);
        }
      } catch {
        // ignore
      }
    }
  }
  return full.trim();
}

function urlJoinKey(apiKey, stream) {
  const prefix = stream ? '&' : '?';
  return `${prefix}key=${encodeURIComponent(apiKey)}`;
}

export async function translateText(config, text, direction, onDelta) {
  const source = typeof text === 'string' ? text.trim() : '';
  if (!source) return '';
  if (direction === 'en' && isLikelyEnglish(source)) {
    if (onDelta) onDelta(source, source);
    return source;
  }

  const apiKey = config.apiKey;
  if (!apiKey) throw new Error('未配置 Gemini API Key。请在翻译窗口的设置中填写。');

  const args = requestArgs({ ...config, apiKey }, direction, source);
  const translated = resolveApiType(config) === 'openai'
    ? await callGeminiOpenAI(args, onDelta)
    : await callGeminiGoogle(args, onDelta);
  return translated || source;
}
