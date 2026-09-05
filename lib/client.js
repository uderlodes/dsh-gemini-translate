window.__ModuleLoader__.load({
  id: "gemini-translate",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
    var h = React.createElement;

    var CSS_ID = "gemini-translate/window.css.v8";
    var CSS = [
      ".gtw-chip{height:28px;padding:0 10px;border:none;border-radius:999px;cursor:pointer;font-size:12px;font-weight:500;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;gap:4px}",
      ".gtw-chip:disabled{opacity:.5;cursor:default}",
      ".gtw-chip-err{color:var(--dsw-alias-state-error-primary, #f87171)}",
      ".gtw-zh{margin:8px 0 4px;padding:10px 12px;border-left:3px solid var(--dsw-alias-brand-primary, #3b82f6);background:var(--dsw-alias-bg-layer-3, transparent);border-radius:0 8px 8px 0;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;white-space:pre-wrap}",
      ".gtw-zh-err{color:var(--dsw-alias-state-error-primary, #f87171);font-size:12px;margin:6px 0}",
      ".gtw-zh-btn{height:26px;margin:6px 0;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px}",
      ".gtw-zh-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
      ".gtw-zh-btn:disabled{opacity:.5;cursor:default}",
      ".gtw-pcard{list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3, transparent);overflow:hidden}",
      ".gtw-pcard-head{width:100%;display:flex;align-items:center;gap:8px;padding:12px 14px;border:none;background:transparent;color:inherit;cursor:pointer;text-align:left}",
      ".gtw-pcard-head:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".gtw-pcard-text{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}",
      ".gtw-pcard-name{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
      ".gtw-pcard-desc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}",
      ".gtw-pcard-chevron{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}",
      ".gtw-pcard-body{display:flex;flex-direction:column;gap:10px;padding:0 14px 14px;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".gtw-card-settings{display:flex;flex-direction:column;gap:10px;padding:4px 0 8px}",
      ".gtw-card-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
      ".gtw-card-desc{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}",
      ".gtw-field{display:flex;flex-direction:column;gap:4px}",
      ".gtw-label{color:var(--dsw-alias-label-secondary);font-size:12px}",
      ".gtw-input{height:32px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base, transparent);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font:inherit;font-size:13px}",
      ".gtw-btn{height:30px;padding:0 12px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;background:var(--dsw-alias-brand-primary, #3b82f6);color:#fff;align-self:flex-start}",
      ".gtw-btn:disabled{opacity:.5;cursor:default}",
      ".gtw-btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}",
      ".gtw-btn-ghost{background:var(--dsw-alias-bg-module-platform, transparent);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2)}",
      ".gtw-models{max-height:180px;overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px}",
      ".gtw-model{display:block;width:100%;text-align:left;border:none;background:transparent;color:var(--dsw-alias-label-primary);padding:6px 8px;border-radius:6px;cursor:pointer;font:inherit;font-size:12px}",
      ".gtw-model:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".gtw-model-on{background:var(--dsw-alias-brand-primary, #3b82f6);color:#fff}",
      ".gtw-status{color:var(--dsw-alias-label-tertiary);font-size:12px}"
    ].join("");

    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_ID) + "]") === null) {
      var tag = document.createElement("style");
      tag.dataset.plugin = "gemini-translate";
      tag.dataset.pluginCss = CSS_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    var zhMap = {};
    var zhListeners = new Set();
    function zhKey(seq, messageId) {
      return String(messageId || "") + "#" + String(seq || "");
    }
    function setZh(key, patch) {
      zhMap[key] = Object.assign({}, zhMap[key] || {}, patch);
      zhListeners.forEach(function (fn) { fn(); });
    }
    function useZh(key) {
      var pair = React.useState(zhMap[key] || null);
      var setValue = pair[1];
      React.useEffect(function () {
        function onChange() { setValue(zhMap[key] || null); }
        zhListeners.add(onChange);
        return function () { zhListeners.delete(onChange); };
      }, [key]);
      return pair[0];
    }

    function hasCJK(text) {
      return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || "");
    }

    function extractAssistantText(snapshot, messageId, seq) {
      if (!snapshot) return "";
      var nodes = snapshot.nodes || [];
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!node || node.kind !== "assistant") continue;
        if (messageId && node.messageId === messageId) return textOf(node);
        if (seq != null && node.seq === seq) return textOf(node);
      }
      return "";
    }
    function textOf(node) {
      var blocks = node.blocks || [];
      var parts = [];
      for (var j = 0; j < blocks.length; j++) {
        if (blocks[j] && blocks[j].kind === "text" && blocks[j].text) parts.push(blocks[j].text);
      }
      return parts.join("\n");
    }

    function api(path, options) {
      return fetch("/dsh-gemini-translate" + path, Object.assign({
        headers: { "Content-Type": "application/json" },
      }, options || {})).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body && body.error ? body.error : ("HTTP " + res.status));
          return body;
        });
      });
    }

    function streamTranslate(text, direction, onDelta) {
      return fetch("/dsh-gemini-translate/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, direction: direction, stream: true }),
      }).then(function (res) {
        if (!res.ok || !res.body) {
          return res.json().then(function (body) {
            throw new Error(body && body.error ? body.error : ("HTTP " + res.status));
          });
        }
        var ctype = (res.headers.get("content-type") || "").toLowerCase();
        if (ctype.indexOf("json") !== -1 && ctype.indexOf("event-stream") === -1) {
          return res.json().then(function (body) {
            var full = (body && body.text) || "";
            if (onDelta) onDelta(full);
            return full;
          });
        }
        var reader = res.body.getReader();
        var decoder = new TextDecoder("utf-8");
        var buffer = "";
        var full = "";
        var pump = function () {
          return reader.read().then(function (result) {
            if (result.done) return full;
            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (line.indexOf("data: ") !== 0) continue;
              var data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (typeof data.text === "string") {
                full = data.text;
                if (onDelta) onDelta(full);
              }
            }
            return pump();
          });
        };
        return pump();
      });
    }

    function TranslateSendButton(props) {
      var busyPair = React.useState(false);
      var busy = busyPair[0];
      var setBusy = busyPair[1];
      var errPair = React.useState("");
      var err = errPair[0];
      var setErr = errPair[1];

      var liveDraft = "";
      if (typeof props.useInput === "function") {
        try { liveDraft = props.useInput(function (s) { return s && s.draft; }) || ""; } catch (_) {}
      }
      var ownerDraft = props.input && typeof props.input.draft === "string" ? props.input.draft : "";
      var draftRef = React.useRef("");
      draftRef.current = liveDraft || ownerDraft;
      var actionsRef = React.useRef(props.inputActions);
      actionsRef.current = props.inputActions;

      var onMouseDown = function (ev) {
        ev.preventDefault();
      };

      var onClick = function () {
        if (busy) return;
        var inputActions = actionsRef.current;
        var draft = (draftRef.current || "").trim();
        if (!inputActions || typeof inputActions.setDraft !== "function") {
          setErr("没有可用输入框");
          return;
        }
        if (!draft) {
          setErr("请先输入中文");
          return;
        }
        if (!hasCJK(draft)) {
          if (typeof inputActions.submit === "function") inputActions.submit();
          setErr("");
          return;
        }
        setBusy(true);
        setErr("");
        api("/translate", {
          method: "POST",
          body: JSON.stringify({ text: draft, direction: "en" }),
        }).then(function (data) {
          return (data && data.text) || "";
        }).then(function (english) {
          var text = (english || draft).trim();
          inputActions.setDraft(text);
          window.setTimeout(function () {
            if (typeof inputActions.submit === "function") inputActions.submit();
            setBusy(false);
          }, 0);
        }).catch(function (e) {
          setErr(e && e.message ? e.message : String(e));
          setBusy(false);
        });
      };

      return h("button", {
        type: "button",
        className: err ? "gtw-chip gtw-chip-err" : "gtw-chip",
        title: err || "把输入框里的中文译成英文，再发给当前模型",
        disabled: busy,
        onMouseDown: onMouseDown,
        onClick: onClick,
      }, busy ? "翻译中…" : (err ? String(err).slice(0, 24) : "译发"));
    }

    function ReplyChinese(props) {
      var seq = props && props.seq;
      var useSession = props && props.useSession;
      var messageId = "";
      var sourceText = "";
      if (typeof useSession === "function") {
        try {
          var info = useSession(function (snapshot) {
            var nodes = (snapshot && snapshot.nodes) || [];
            for (var i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              if (node && node.kind === "assistant" && node.seq === seq) {
                return { messageId: node.messageId || "", text: textOf(node) };
              }
            }
            return { messageId: "", text: extractAssistantText(snapshot, null, seq) };
          });
          messageId = info && info.messageId || "";
          sourceText = info && info.text || "";
        } catch (_) {}
      }
      var key = zhKey(seq, messageId);
      var state = useZh(key);

      var onClick = function () {
        if (!sourceText.trim()) return;
        setZh(key, { busy: true, error: "", text: "" });
        streamTranslate(sourceText, "zh", function (zh) {
          setZh(key, { busy: false, error: "", text: zh });
        }).then(function (zh) {
          setZh(key, { busy: false, error: "", text: zh || "" });
        }).catch(function (err) {
          setZh(key, { busy: false, error: err && err.message ? err.message : String(err), text: "" });
        });
      };

      if (state && state.text) {
        return h("div", { className: "gtw-zh" }, "中文：" + "\n" + state.text);
      }
      if (state && state.error) {
        return h("div", null,
          h("div", { className: "gtw-zh-err" }, state.error),
          h("button", { type: "button", className: "gtw-zh-btn", onClick: onClick }, "重试译成中文")
        );
      }
      return h("button", {
        type: "button",
        className: "gtw-zh-btn",
        disabled: !sourceText || (state && state.busy),
        onClick: onClick,
      }, state && state.busy ? "正在译成中文…" : "把这条回复译成中文");
    }

    function SettingsCard() {
      var openPair = React.useState(false);
      var open = openPair[0];
      var setOpen = openPair[1];
      var cfg = React.useState({
        model: "",
        baseUrl: "",
        apiType: "openai",
        apiKey: "",
        hasApiKey: false,
      });
      var setCfg = cfg[1];
      cfg = cfg[0];
      var busy = React.useState(false);
      var setBusy = busy[1];
      busy = busy[0];
      var status = React.useState("");
      var setStatus = status[1];
      status = status[0];
      var modelsPair = React.useState([]);
      var models = modelsPair[0];
      var setModels = modelsPair[1];
      var probingPair = React.useState(false);
      var probing = probingPair[0];
      var setProbing = probingPair[1];

      React.useEffect(function () {
        api("/config").then(function (data) {
          setCfg(function (prev) { return Object.assign({}, prev, data, { apiKey: "" }); });
        }).catch(function () {});
      }, []);

      var save = function () {
        setBusy(true);
        var patch = { model: cfg.model, baseUrl: cfg.baseUrl, apiType: cfg.apiType };
        if (cfg.apiKey && cfg.apiKey.trim()) patch.apiKey = cfg.apiKey.trim();
        api("/config", { method: "PUT", body: JSON.stringify(patch) }).then(function (data) {
          setCfg(function (prev) { return Object.assign({}, prev, data, { apiKey: "" }); });
          setStatus("已保存");
        }).catch(function (err) {
          setStatus(err && err.message ? err.message : String(err));
        }).finally(function () { setBusy(false); });
      };

      var probe = function () {
        setProbing(true);
        setStatus("正在探测模型…");
        var body = { baseUrl: cfg.baseUrl, apiType: cfg.apiType };
        if (cfg.apiKey && cfg.apiKey.trim()) body.apiKey = cfg.apiKey.trim();
        api("/models", { method: "POST", body: JSON.stringify(body) }).then(function (data) {
          var list = (data && data.models) || [];
          setModels(list);
          setStatus(list.length ? ("探测到 " + list.length + " 个模型，请用下拉框选择") : "没有探测到模型");
        }).catch(function (err) {
          setModels([]);
          setStatus(err && err.message ? err.message : String(err));
        }).finally(function () { setProbing(false); });
      };

      return h("li", { className: "gtw-pcard" },
        h("button", {
          type: "button",
          className: "gtw-pcard-head",
          "aria-expanded": open ? "true" : "false",
          onClick: function () { setOpen(!open); },
        },
          h("span", { className: "gtw-pcard-text" },
            h("span", { className: "gtw-pcard-name" }, "Gemini 翻译"),
            h("span", { className: "gtw-pcard-desc" }, cfg.model ? ("当前模型 " + cfg.model) : "输入框「译发」把中文译成英文再发送")
          ),
          h("span", { className: "gtw-pcard-chevron" }, open ? "▾" : "▸")
        ),
        open ? h("div", { className: "gtw-pcard-body" },
          h("div", { className: "gtw-field" },
            h("label", { className: "gtw-label" }, cfg.hasApiKey ? "API Key（已配置，留空不变）" : "API Key"),
            h("input", {
              className: "gtw-input",
              type: "password",
              value: cfg.apiKey || "",
              onChange: function (ev) { setCfg(Object.assign({}, cfg, { apiKey: ev.target.value })); },
            })
          ),
          h("div", { className: "gtw-field" },
            h("label", { className: "gtw-label" }, "Base URL"),
            h("input", {
              className: "gtw-input",
              value: cfg.baseUrl || "",
              onChange: function (ev) { setCfg(Object.assign({}, cfg, { baseUrl: ev.target.value })); },
            })
          ),
          h("div", { className: "gtw-field" },
            h("label", { className: "gtw-label" }, "接口类型"),
            h("select", {
              className: "gtw-input",
              value: cfg.apiType || "openai",
              onChange: function (ev) { setCfg(Object.assign({}, cfg, { apiType: ev.target.value })); },
            },
              h("option", { value: "openai" }, "openai"),
              h("option", { value: "google" }, "google")
            )
          ),
          h("div", { className: "gtw-field" },
            h("label", { className: "gtw-label" }, "模型"),
            models.length ? h("select", {
              className: "gtw-input",
              value: cfg.model || models[0],
              onChange: function (ev) {
                setCfg(Object.assign({}, cfg, { model: ev.target.value }));
                setStatus("已选择 " + ev.target.value + "，点保存生效");
              },
            }, (function () {
              var ids = models.slice();
              if (cfg.model && ids.indexOf(cfg.model) === -1) ids.unshift(cfg.model);
              return ids.map(function (id) {
                return h("option", { key: id, value: id }, id);
              });
            })()) : h("input", {
              className: "gtw-input",
              value: cfg.model || "",
              onChange: function (ev) { setCfg(Object.assign({}, cfg, { model: ev.target.value })); },
            })
          ),
          h("div", { className: "gtw-btn-row" },
            h("button", { type: "button", className: "gtw-btn gtw-btn-ghost", disabled: probing, onClick: probe }, probing ? "探测中…" : "探测模型"),
            h("button", { type: "button", className: "gtw-btn", disabled: busy, onClick: save }, "保存")
          ),
          h("div", { className: "gtw-status" }, status)
        ) : null
      );
    }

    var inject = ["slots"];

    function apply(ctx) {
      ctx.slots.inject("conversation.input.right", function () {
        return ctx.slots.register({
          name: "conversation.input.right",
          id: "gemini-translate-send",
          order: 20,
        }, TranslateSendButton);
      });
      ctx.slots.inject("conversation.chat.turnTail", function () {
        return ctx.slots.register({
          name: "conversation.chat.turnTail",
          id: "gemini-translate-zh",
          select: function (owner) {
            if (!owner || owner.seq == null) return null;
            return true;
          },
        }, ReplyChinese);
      });
      ctx.slots.inject("settings.plugin.item", function () {
        return ctx.slots.register({
          name: "settings.plugin.item",
          key: "gemini-translate",
        }, SettingsCard);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
