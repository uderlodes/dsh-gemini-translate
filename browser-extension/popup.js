const source = document.getElementById('source');
const result = document.getElementById('result');
const status = document.getElementById('status');

function setStatus(text, isError) {
  status.textContent = text || '';
  status.classList.toggle('error', Boolean(isError));
}

async function run(direction) {
  const text = source.value.trim();
  if (!text) {
    setStatus('请先输入文字', true);
    return;
  }
  setStatus('翻译中…');
  const response = await chrome.runtime.sendMessage({ type: 'translate', text, direction });
  if (response?.error) {
    setStatus(response.error, true);
    return;
  }
  result.value = response.text || '';
  setStatus('完成');
}

document.getElementById('to-en').addEventListener('click', () => { void run('en'); });
document.getElementById('to-zh').addEventListener('click', () => { void run('zh'); });
document.getElementById('copy').addEventListener('click', async () => {
  if (!result.value) return;
  await navigator.clipboard.writeText(result.value);
  setStatus('已复制');
});
