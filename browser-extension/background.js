/* Chrome / Firefox MV3 service worker */

importScripts('translate.js');

const DEFAULTS = {
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: 'gemini-2.5-flash',
  apiType: 'google',
};

async function loadConfig() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

function registerMenus() {
  chrome.contextMenus.create({
    id: 'gt-en',
    title: '译成英文',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'gt-zh',
    title: '译成中文',
    contexts: ['selection'],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  const removed = chrome.contextMenus.removeAll();
  if (removed && typeof removed.then === 'function') {
    removed.then(registerMenus).catch(registerMenus);
  } else {
    registerMenus();
  }
});

async function showOnPage(tabId, title, body) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (heading, text) => {
        const id = 'gt-overlay';
        document.getElementById(id)?.remove();
        const box = document.createElement('div');
        box.id = id;
        box.style.cssText = [
          'position:fixed',
          'z-index:2147483647',
          'right:16px',
          'bottom:16px',
          'max-width:min(440px,calc(100vw - 32px))',
          'max-height:min(50vh,420px)',
          'overflow:auto',
          'padding:12px 14px',
          'border-radius:12px',
          'background:#111',
          'color:#f5f5f5',
          'font:14px/1.5 system-ui,sans-serif',
          'box-shadow:0 12px 40px rgba(0,0,0,.35)',
          'white-space:pre-wrap',
        ].join(';');
        const h = document.createElement('div');
        h.style.cssText = 'font-weight:600;margin-bottom:8px;color:#93c5fd';
        h.textContent = heading;
        const p = document.createElement('div');
        p.textContent = text;
        const close = document.createElement('button');
        close.textContent = '关闭';
        close.style.cssText = 'margin-top:10px;border:0;border-radius:8px;padding:4px 10px;cursor:pointer';
        close.onclick = () => box.remove();
        box.append(h, p, close);
        document.documentElement.append(box);
      },
      args: [title, body],
    });
  } catch (error) {
    console.warn('overlay failed', error);
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const text = (info.selectionText || '').trim();
  if (!text || !tab?.id) return;
  const direction = info.menuItemId === 'gt-zh' ? 'zh' : 'en';
  try {
    const config = await loadConfig();
    const result = await translateText(config, text, direction);
    await showOnPage(tab.id, direction === 'zh' ? '中文' : 'English', result);
  } catch (error) {
    if (tab.id) await showOnPage(tab.id, '翻译失败', error.message || String(error));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run = async () => {
    const config = await loadConfig();
    if (message?.type === 'translate') {
      return { text: await translateText(config, message.text, message.direction === 'zh' ? 'zh' : 'en') };
    }
    if (message?.type === 'list-models') {
      const probe = { ...config, ...message.config };
      return { models: await listModels(probe) };
    }
    if (message?.type === 'get-config') {
      const { apiKey, ...rest } = config;
      return { ...rest, hasApiKey: Boolean(apiKey) };
    }
    throw new Error('unknown message');
  };
  run().then(sendResponse).catch((error) => {
    sendResponse({ error: error.message || String(error) });
  });
  return true;
});
