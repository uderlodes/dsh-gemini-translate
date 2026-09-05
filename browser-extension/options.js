const apiKey = document.getElementById('apiKey');
const baseUrl = document.getElementById('baseUrl');
const apiType = document.getElementById('apiType');
const model = document.getElementById('model');
const modelSelect = document.getElementById('modelSelect');
const status = document.getElementById('status');

function setStatus(text, isError) {
  status.textContent = text || '';
  status.classList.toggle('error', Boolean(isError));
}

async function load() {
  const cfg = await chrome.storage.local.get({
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
    apiType: 'google',
  });
  baseUrl.value = cfg.baseUrl || '';
  apiType.value = cfg.apiType === 'openai' ? 'openai' : 'google';
  model.value = cfg.model || '';
  apiKey.placeholder = cfg.apiKey ? '已配置，留空保持不变' : '填写 API Key';
}

document.getElementById('save').addEventListener('click', async () => {
  const current = await chrome.storage.local.get({ apiKey: '' });
  const next = {
    baseUrl: baseUrl.value.trim(),
    apiType: apiType.value,
    model: model.value.trim(),
  };
  if (apiKey.value.trim()) next.apiKey = apiKey.value.trim();
  else next.apiKey = current.apiKey || '';
  await chrome.storage.local.set(next);
  apiKey.value = '';
  apiKey.placeholder = next.apiKey ? '已配置，留空保持不变' : '填写 API Key';
  setStatus('已保存');
});

document.getElementById('probe').addEventListener('click', async () => {
  setStatus('正在探测模型…');
  const current = await chrome.storage.local.get({ apiKey: '' });
  const response = await chrome.runtime.sendMessage({
    type: 'list-models',
    config: {
      baseUrl: baseUrl.value.trim(),
      apiType: apiType.value,
      apiKey: apiKey.value.trim() || current.apiKey,
      model: model.value.trim(),
    },
  });
  if (response?.error) {
    setStatus(response.error, true);
    return;
  }
  const models = response.models || [];
  modelSelect.innerHTML = '';
  if (!models.length) {
    modelSelect.hidden = true;
    setStatus('没有探测到模型', true);
    return;
  }
  if (model.value && !models.includes(model.value)) {
    models.unshift(model.value);
  }
  for (const id of models) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    modelSelect.append(option);
  }
  modelSelect.value = model.value && models.includes(model.value) ? model.value : models[0];
  model.value = modelSelect.value;
  model.hidden = true;
  modelSelect.hidden = false;
  setStatus(`探测到 ${models.length} 个模型，用下拉框选择后点保存`);
});

modelSelect.addEventListener('change', () => {
  model.value = modelSelect.value;
  setStatus(`已选择 ${model.value}，点保存生效`);
});

void load();
