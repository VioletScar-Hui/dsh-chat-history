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
		var React = __toESM(require("react"));
		
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
		    const draftRef = React.useRef("");
		    draftRef.current = input ? input.draft : "";
		    const phaseRef = React.useRef("plain");
		    phaseRef.current = input ? input.phase : "plain";
		    const actionsRef = React.useRef(null);
		    actionsRef.current = actions;
		    const prevPhaseRef = React.useRef(input ? input.phase : "plain");
		    React.useEffect(() => {
		      const sid = props.sessionId;
		      if (sid == null || store.seeded.has(sid))
		        return;
		      store.seeded.add(sid);
		      seedSession(props.session);
		    }, [props.sessionId]);
		    React.useEffect(() => {
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
		    React.useEffect(() => {
		      if (store.navIndex >= 0) {
		        if (input && input.draft !== store.history[store.navIndex]) {
		          store.navIndex = -1;
		          store.savedDraft = null;
		        }
		      }
		    }, [input ? input.draft : ""]);
		    React.useEffect(() => {
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
		        const h = store.history;
		        const draft = draftRef.current;
		        let intercepted = false;
		        let setText = null;
		        if (e.key === "ArrowUp") {
		          if (store.navIndex >= 0) {
		            intercepted = true;
		            if (store.navIndex > 0) {
		              store.navIndex -= 1;
		              setText = h[store.navIndex];
		            }
		          } else if (h.length > 0 && t.selectionStart === 0) {
		            store.savedDraft = draft;
		            store.navIndex = h.length - 1;
		            setText = h[store.navIndex];
		            intercepted = true;
		          }
		        } else {
		          if (store.navIndex >= 0) {
		            intercepted = true;
		            if (store.navIndex < h.length - 1) {
		              store.navIndex += 1;
		              setText = h[store.navIndex];
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
		}
		
		return module.exports;
	}
});
