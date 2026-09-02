window.__ModuleLoader__.load({
	id: "@violet/dsh-chat-history",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var __create = Object.create;
		var __getProtoOf = Object.getPrototypeOf;
		var __defProp = Object.defineProperty;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		function __accessProp(key) {
		  return this[key];
		}
		var __toESMCache_node;
		var __toESMCache_esm;
		var __toESM = (mod, isNodeMode, target) => {
		  var canCache = mod != null && typeof mod === "object";
		  if (canCache) {
		    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
		    var cached = cache.get(mod);
		    if (cached)
		      return cached;
		  }
		  target = mod != null ? __create(__getProtoOf(mod)) : {};
		  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
		  for (let key of __getOwnPropNames(mod))
		    if (!__hasOwnProp.call(to, key))
		      __defProp(to, key, {
		        get: __accessProp.bind(mod, key),
		        enumerable: true
		      });
		  if (canCache)
		    cache.set(mod, to);
		  return to;
		};
		var __toCommonJS = (from) => {
		  var entry = (__moduleCache ??= new WeakMap).get(from), desc;
		  if (entry)
		    return entry;
		  entry = __defProp({}, "__esModule", { value: true });
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (var key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(entry, key))
		        __defProp(entry, key, {
		          get: __accessProp.bind(from, key),
		          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		        });
		  }
		  __moduleCache.set(from, entry);
		  return entry;
		};
		var __moduleCache;
		var __returnValue = (v) => v;
		function __exportSetter(name, newValue) {
		  this[name] = __returnValue.bind(null, newValue);
		}
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, {
		      get: all[name],
		      enumerable: true,
		      configurable: true,
		      set: __exportSetter.bind(all, name)
		    });
		};
		
		// src/client/index.js
		var exports_client = {};
		__export(exports_client, {
		  name: () => name,
		  inject: () => inject,
		  apply: () => apply
		});
		module.exports = __toCommonJS(exports_client);
		var React2 = __toESM(require("react"));
		
		// src/client/history.js
		var MAX_HISTORY = 200;
		function appendHistory(history, text) {
		  const t = String(text ?? "").trim();
		  if (t === "")
		    return history;
		  if (history.length && history[history.length - 1] === t)
		    return history;
		  history.push(t);
		  if (history.length > MAX_HISTORY)
		    history.splice(0, history.length - MAX_HISTORY);
		  return history;
		}
		function extractUserTexts(nodes) {
		  const texts = [];
		  if (!Array.isArray(nodes))
		    return texts;
		  for (const node of nodes) {
		    if (!node || node.kind !== "user" || !Array.isArray(node.content))
		      continue;
		    let text = "";
		    for (const block of node.content) {
		      if (block && block.type === "text" && typeof block.text === "string")
		        text += block.text;
		    }
		    if (text !== "")
		      texts.push(text);
		  }
		  return texts;
		}
		function createHistoryStore() {
		  return { history: [], navIndex: -1, savedDraft: null, pending: null, seeded: new Set };
		}
		function extractNodeText(data) {
		  if (!data || !Array.isArray(data.content))
		    return "";
		  let text = "";
		  for (const block of data.content) {
		    if (block && block.type === "text" && typeof block.text === "string")
		      text += block.text;
		  }
		  return text;
		}
		function buildUserMessageIndex(chat) {
		  const list = [];
		  if (!chat || !Array.isArray(chat.order) || !chat.nodes || typeof chat.nodes.get !== "function")
		    return list;
		  for (const key of chat.order) {
		    const node = chat.nodes.get(key);
		    if (!node || node.kind !== "user")
		      continue;
		    const text = extractNodeText(node.data);
		    if (text === "")
		      continue;
		    list.push({ key, text });
		  }
		  return list;
		}
		
		// src/client/nav.js
		var React = __toESM(require("react"));
		var h = React.createElement;
		var styleInjected = false;
		function ensureStyle() {
		  if (styleInjected)
		    return;
		  styleInjected = true;
		  if (typeof document === "undefined")
		    return;
		  const style = document.createElement("style");
		  style.textContent = `
		.dshch-nav-item{display:flex;align-items:center;gap:8px;text-align:left;background:transparent;border:none;border-radius:8px;padding:6px 8px;cursor:pointer;color:var(--dsw-alias-label-primary,#111827);font-family:inherit;font-size:13px;line-height:18px;width:100%}
		.dshch-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
		.dshch-nav-item:active{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09))}
		.dshch-nav-item .dshch-nav-num{flex:none;min-width:18px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-caption,#9ca3af);font-size:12px}
		.dshch-nav-item .dshch-nav-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dshch-nav-panel::-webkit-scrollbar{width:8px}
		.dshch-nav-panel::-webkit-scrollbar-thumb{background:var(--dsw-alias-scrollbar-bg-l2,rgba(0,0,0,.12));border-radius:4px}
		`;
		  document.head.appendChild(style);
		}
		ensureStyle();
		function findScroller(fromEl) {
		  let el = fromEl;
		  while (el) {
		    const s = el.querySelector("[data-conversation-scroll]");
		    if (s)
		      return s;
		    el = el.parentElement;
		  }
		  return document.querySelector("[data-conversation-scroll]");
		}
		function findAnchor(scroller, key) {
		  if (!scroller)
		    return null;
		  for (const row of scroller.querySelectorAll("[data-chat-anchor-key]")) {
		    if (row.dataset.chatAnchorKey === key)
		      return row;
		  }
		  return null;
		}
		function SessionNav(props) {
		  const useSession = props.useSession;
		  const [open, setOpen] = React.useState(false);
		  const rootRef = React.useRef(null);
		  const order = useSession((s) => s.chat.order);
		  const nodes = useSession((s) => s.chat.nodes);
		  const items = React.useMemo(() => buildUserMessageIndex({ order, nodes }), [order, nodes]);
		  React.useEffect(() => {
		    if (!open)
		      return;
		    function onKey(e) {
		      if (e.key === "Escape")
		        setOpen(false);
		    }
		    function onDown(e) {
		      if (rootRef.current && !rootRef.current.contains(e.target))
		        setOpen(false);
		    }
		    document.addEventListener("keydown", onKey);
		    document.addEventListener("mousedown", onDown);
		    return () => {
		      document.removeEventListener("keydown", onKey);
		      document.removeEventListener("mousedown", onDown);
		    };
		  }, [open]);
		  function jumpTo(key) {
		    const scroller = findScroller(rootRef.current);
		    const row = findAnchor(scroller, key);
		    if (!row)
		      return;
		    try {
		      row.scrollIntoView({ behavior: "smooth", block: "center" });
		    } catch (_) {
		      try {
		        row.scrollIntoView();
		      } catch (_2) {}
		    }
		    const prev = row.style.boxShadow;
		    row.style.boxShadow = "0 0 0 2px var(--dsw-alias-state-business-primary,#4d6bfe)";
		    setTimeout(() => {
		      row.style.boxShadow = prev;
		    }, 1600);
		  }
		  const icon = h("svg", {
		    width: 14,
		    height: 14,
		    viewBox: "0 0 16 16",
		    fill: "none",
		    "aria-hidden": true
		  }, h("path", {
		    d: "M3 3.5h10M3 8h10M3 12.5h6",
		    stroke: "currentColor",
		    strokeWidth: 1.5,
		    strokeLinecap: "round"
		  }));
		  const panel = open ? h("div", {
		    className: "dshch-nav-panel",
		    style: {
		      position: "fixed",
		      top: 64,
		      left: 16,
		      zIndex: 1200,
		      width: 300,
		      maxHeight: "min(70vh, 600px)",
		      display: "flex",
		      flexDirection: "column",
		      background: "var(--dsw-alias-bg-base,#fff)",
		      border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
		      borderRadius: 12,
		      boxShadow: "var(--dsw-shadow-lv2,0 8px 24px rgba(0,0,0,.14))",
		      overflow: "hidden"
		    }
		  }, h("div", {
		    style: {
		      display: "flex",
		      alignItems: "center",
		      justifyContent: "space-between",
		      padding: "10px 12px",
		      flex: "none",
		      borderBottom: "1px solid var(--dsw-alias-border-l2,#e5e7eb)"
		    }
		  }, h("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--dsw-alias-label-primary,#111827)" } }, `消息定位（${items.length}）`), h("button", {
		    type: "button",
		    title: "关闭",
		    onClick: () => setOpen(false),
		    style: {
		      background: "transparent",
		      border: "none",
		      cursor: "pointer",
		      fontSize: 18,
		      lineHeight: 1,
		      padding: "0 4px",
		      color: "var(--dsw-alias-label-secondary,#4b5563)"
		    }
		  }, "×")), h("div", {
		    style: {
		      overflowY: "auto",
		      padding: 6,
		      flex: "1 1 auto",
		      display: "flex",
		      flexDirection: "column",
		      gap: 2
		    }
		  }, items.length === 0 ? h("div", {
		    style: {
		      padding: "20px 12px",
		      textAlign: "center",
		      fontSize: 13,
		      color: "var(--dsw-alias-label-tertiary,#9ca3af)"
		    }
		  }, "本会话还没有发送过的消息") : items.map((it, i) => h("button", {
		    key: it.key,
		    type: "button",
		    className: "dshch-nav-item",
		    title: it.text,
		    onClick: () => jumpTo(it.key)
		  }, h("span", { className: "dshch-nav-num" }, String(i + 1)), h("span", { className: "dshch-nav-text" }, it.text))))) : null;
		  return h("div", { ref: rootRef, style: { display: "contents" } }, h("button", {
		    type: "button",
		    onClick: () => setOpen((v) => !v),
		    title: "定位本会话发送过的消息",
		    "aria-expanded": open,
		    style: {
		      display: "inline-flex",
		      alignItems: "center",
		      gap: 5,
		      background: "var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))",
		      border: "none",
		      borderRadius: 12,
		      padding: "4px 10px",
		      fontSize: 13,
		      lineHeight: "20px",
		      fontWeight: 500,
		      color: "var(--dsw-alias-label-secondary,#4b5563)",
		      cursor: "pointer",
		      fontFamily: "inherit"
		    }
		  }, icon, "定位"), panel);
		}
		
		// src/client/index.js
		var name = "dsh-chat-history";
		var inject = ["slots"];
		function apply(ctx) {
		  const store = createHistoryStore();
		  function pushHistory(text) {
		    appendHistory(store.history, text);
		  }
		  function seedSession(session) {
		    for (const text of extractUserTexts(session ? session.nodes : null)) {
		      appendHistory(store.history, text);
		    }
		  }
		  function placeCaret(ta, text) {
		    const len = text.length;
		    const applyCaret = () => {
		      try {
		        ta.setSelectionRange(len, len);
		      } catch (_) {}
		      try {
		        ta.focus();
		      } catch (_) {}
		    };
		    if (typeof requestAnimationFrame === "function") {
		      requestAnimationFrame(() => requestAnimationFrame(applyCaret));
		    } else {
		      applyCaret();
		    }
		  }
		  function ChatHistory(props) {
		    const input = props.useInput((s) => s);
		    const actions = props.inputActions;
		    const draftRef = React2.useRef("");
		    draftRef.current = input ? input.draft : "";
		    const phaseRef = React2.useRef("plain");
		    phaseRef.current = input ? input.phase : "plain";
		    const actionsRef = React2.useRef(null);
		    actionsRef.current = actions;
		    const prevPhaseRef = React2.useRef(input ? input.phase : "plain");
		    React2.useEffect(() => {
		      const sid = props.sessionId;
		      if (sid == null || store.seeded.has(sid))
		        return;
		      store.seeded.add(sid);
		      seedSession(props.session);
		    }, [props.sessionId]);
		    React2.useEffect(() => {
		      const phase = input ? input.phase : "plain";
		      const prev = prevPhaseRef.current;
		      prevPhaseRef.current = phase;
		      if (prev !== "submitting" && phase === "submitting") {
		        if (input && input.draft && input.draft.trim() !== "")
		          store.pending = input.draft;
		      } else if (prev === "submitting" && phase === "plain") {
		        if (store.pending) {
		          pushHistory(store.pending);
		          store.pending = null;
		          store.navIndex = -1;
		          store.savedDraft = null;
		        }
		      }
		    }, [input ? input.phase : "plain", input ? input.draft : ""]);
		    React2.useEffect(() => {
		      if (store.navIndex >= 0) {
		        if (input && input.draft !== store.history[store.navIndex]) {
		          store.navIndex = -1;
		          store.savedDraft = null;
		        }
		      }
		    }, [input ? input.draft : ""]);
		    React2.useEffect(() => {
		      function onKeyDown(e) {
		        if (e.defaultPrevented || e.isComposing)
		          return;
		        const t = e.target;
		        if (!t || t.tagName !== "TEXTAREA" || !t.hasAttribute("data-phase"))
		          return;
		        if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
		          return;
		        if (phaseRef.current !== "plain")
		          return;
		        const actionsNow = actionsRef.current;
		        if (!actionsNow)
		          return;
		        const h2 = store.history;
		        const draft = draftRef.current;
		        let intercepted = false;
		        let setText = null;
		        if (e.key === "ArrowUp") {
		          if (store.navIndex >= 0) {
		            intercepted = true;
		            if (store.navIndex > 0) {
		              store.navIndex -= 1;
		              setText = h2[store.navIndex];
		            }
		          } else if (h2.length > 0 && t.selectionStart === 0) {
		            store.savedDraft = draft;
		            store.navIndex = h2.length - 1;
		            setText = h2[store.navIndex];
		            intercepted = true;
		          }
		        } else {
		          if (store.navIndex >= 0) {
		            intercepted = true;
		            if (store.navIndex < h2.length - 1) {
		              store.navIndex += 1;
		              setText = h2[store.navIndex];
		            } else {
		              store.navIndex = -1;
		              setText = store.savedDraft != null ? store.savedDraft : "";
		              store.savedDraft = null;
		            }
		          }
		        }
		        if (!intercepted)
		          return;
		        e.preventDefault();
		        e.stopPropagation();
		        if (setText !== null) {
		          actionsNow.setDraft(setText);
		          placeCaret(t, setText);
		        }
		      }
		      document.addEventListener("keydown", onKeyDown, true);
		      return () => document.removeEventListener("keydown", onKeyDown, true);
		    }, []);
		    return null;
		  }
		  ctx.slots.inject("conversation.input.left", () => {
		    try {
		      return ctx.slots.register({ name: "conversation.input.left", id: "chat-history", order: 0 }, ChatHistory);
		    } catch (error) {
		      console.error("[dsh-chat-history] conversation.input.left register failed:", error);
		      return () => {};
		    }
		  });
		  ctx.slots.inject("conversation.session.header.actions", () => {
		    try {
		      return ctx.slots.register({ name: "conversation.session.header.actions", id: "chat-history-nav", order: 10 }, SessionNav);
		    } catch (error) {
		      console.error("[dsh-chat-history] conversation.session.header.actions register failed:", error);
		      return () => {};
		    }
		  });
		}
		
		return module.exports;
	}
});
