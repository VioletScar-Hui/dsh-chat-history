# 实现架构

## 概览

`@violet/dsh-chat-history` 是一个**纯客户端** DSH 插件：host 半为空壳，浏览器半挂载历史记忆副作用。

```
src/
├── index.js            # host 空壳（name + apply(_ctx)），仅让 cordis 行可解析
└── client/
    ├── index.js        # client 入口：inject=['slots']，注册 conversation.input.left
    └── history.js      # 纯历史存储逻辑（无 React/ctx，可单测）
```

## 构建

`scripts/build.js`（bun）产出两个产物：

| 产物 | 格式 | 说明 |
| --- | --- | --- |
| `lib/index.js` | ESM | host 空壳，external 化 `@deepseek-ai/*` 与 `node:*` |
| `lib/client.js` | CJS | 用 `window.__ModuleLoader__.load({ id, factory })` 包裹，external 化 react 全家桶与 `@deepseek-ai/*` |

`lib/` 作为预构建产物提交，安装端**无需 bun、无需构建**（`dsh plugin add` 直接读 `exports["./client"]`）。

## client 运行期

`apply(ctx)` 内：

1. **注册槽**：`ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name, id: 'chat-history', order: 0 }, ChatHistory))`。整个注册包在 `try/catch` 里降级——client 抛错会让 web shell 整段 boot 失败，绝不能为这个功能让 GUI 宕掉。
2. **每会话存储**：`createHistoryStore()` 返回 `{ history, navIndex, savedDraft, pending, seeded: Set }`。
3. **`ChatHistory` 组件**：返回 `null`，只通过 React hooks 挂四个副作用。

### 副作用 1：启动预填

```js
React.useEffect(() => {
  const sid = props.sessionId
  if (sid == null || store.seeded.has(sid)) return
  store.seeded.add(sid)
  seedSession(props.session)   // 扫 nodes 里 kind==='user' 节点的 text 片段
}, [props.sessionId])
```

`seedSession` 用 `extractUserTexts(session.nodes)` 取出用户消息文本，逐条 `appendHistory`（自带 trim + 连续去重 + 上限 200）。

### 副作用 2：发消息检测

靠 `InputState.phase` 的 `submitting → plain` 迁移：

- `plain → submitting`：把当前 `input.draft` 暂存到 `store.pending`。
- `submitting → plain`：把 `store.pending` 正式 `pushHistory`，并复位 `navIndex`/`savedDraft`。

### 副作用 3：手动改草稿退出浏览态

若处于浏览态（`navIndex >= 0`）且用户改动了草稿（`input.draft !== store.history[navIndex]`），立即退出浏览态。

### 副作用 4：键盘捕获

`document.addEventListener('keydown', onKeyDown, true)`（**捕获阶段**），`onKeyDown` 逐层拦截：

```js
if (e.defaultPrevented || e.isComposing) return                 // 已处理 / 输入法合成
const t = e.target
if (!t || t.tagName !== 'TEXTAREA' || !t.hasAttribute('data-phase')) return  // 只认 composer
if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
if (phaseRef.current !== 'plain') return                        // 斜杠菜单等非 plain 不触发
```

`↑` 逻辑：

- 已处于浏览态 → `navIndex - 1`，取更早一条。
- 未处于浏览态且 `t.selectionStart === 0`（光标在行首）→ 存 `savedDraft`，跳到最新一条。

`↓` 逻辑：`navIndex + 1`；到末尾后再按 → 还原 `savedDraft`（或清空）。

命中的历史文本通过 `actions.setDraft(text)` 写回，再用双 `requestAnimationFrame` 把光标 `setSelectionRange(len, len)` 放到末尾（`placeCaret`）。

## 关键设计取舍

- **无可见 UI**：历史入口就是键盘上的 `↑/↓`，不在输入框加按钮，避免打扰既有布局。
- **光标在行首才触发**：与 shell 的 readline 一致——只有空行或行首时才翻历史，编辑中文本时 `↑/↓` 仍归编辑器。
- **纯内存 + 每会话 seed**：不引入持久化后端，宿主重启后从会话节点重新预填，天然免迁移。
- **捕获阶段 + `defaultPrevented` 检查**：既能在目标元素处理前拦截，又不与编辑器/输入法/命令菜单抢事件。
