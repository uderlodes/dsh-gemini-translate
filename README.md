# gemini-translate

DeepSeek Harness (DSH) plugin. Translate Chinese in the composer to English with Gemini, then send it to **whatever model is currently selected**.

中文输入 → Gemini 译成英文 → 发给当前对话模型。模型回英文后，可在该条消息下译回中文。

## Install

```bash
dsh plugin --profile web add github:uderlodes/dsh-gemini-translate
```

Restart DSH Desktop after install.

## Usage

1. Put `GEMINI_API_KEY` in DSH Models / credentials (Google AI Studio key, or an OpenAI-compatible Gemini proxy).
2. Type Chinese in the normal chat box.
3. Click **译发** (Translate & Send).
4. After the assistant replies in English, click **把这条回复译成中文** under that message.

Settings → Plugins → Gemini 翻译: API key, model, base URL, `google` vs `openai` API type. Click **探测模型** to list models from the current endpoint, then pick one and save.

## Config

Default (official Gemini):

| Field | Default |
| --- | --- |
| `apiKeyEnv` | `GEMINI_API_KEY` |
| `baseUrl` | `https://generativelanguage.googleapis.com` |
| `model` | `gemini-2.5-flash` |
| `apiType` | `google` |

For an OpenAI-compatible proxy, set `apiType: openai` and `baseUrl` to that `/v1` endpoint in plugin settings.

Do **not** also insert `id: gemini-translate` in the profile `cordis.patch.yml`. The bundle patch already inserts it once. A second insert causes `duplicate loader entry id: gemini-translate`.

## License

MIT
