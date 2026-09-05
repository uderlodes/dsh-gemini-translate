# Gemini Translate（Chrome / Firefox）

浏览器扩展：用 **Gemini** 或任意 **OpenAI 兼容模型** 翻译。

- 工具栏弹窗：输入文字，译成英文 / 中文
- 网页划词：右键「译成英文」或「译成中文」，结果浮在页面上
- 设置页：API Key、Base URL、接口类型、探测模型下拉框

和 DSH 插件同一套翻译逻辑。

## 安装

### Chrome / Edge

1. 打开 `chrome://extensions`
2. 打开「开发者模式」
3. 「加载已解压的扩展程序」，选本目录 `browser-extension`

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`
2. 「临时载入附加组件」
3. 选本目录里的 `manifest.json`

Firefox 临时扩展关掉浏览器后会卸掉；长期使用需要签名或 `about:config` 里允许未签名扩展（仅开发用）。

## 配置

1. 点击扩展图标 → **设置**
2. 官方 Gemini：
   - 接口类型 `google`
   - Base URL `https://generativelanguage.googleapis.com`
   - 模型如 `gemini-2.5-flash`
   - 填 Google AI Studio API Key
3. 中转 / DeepSeek / 其他模型：
   - 接口类型 `openai`
   - Base URL 填到 `/v1`（例如 `https://api.deepseek.com/v1`）
   - 点 **探测模型**，下拉选择，再保存

不要把 API Key 提交到 Git。
