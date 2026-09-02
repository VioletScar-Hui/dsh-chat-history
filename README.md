# dsh-chat-history

给 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 聊天输入框加上 **CLI 风格的历史记忆**：在输入框里按 `↑` 召回上一条发过的内容、按 `↓` 前进或还原草稿，就像在 shell 里翻历史命令一样。

纯客户端插件（无宿主副作用），装上之后**重启不丢**。

## ✨ 特性

- **上下键历史召回** —— `↑` 回到更早的消息，`↓` 回到更新的消息，再按 `↓` 还原你正在编辑的草稿
- **启动即预填** —— 打开会话时自动把当前会话里**你之前发过的消息**载入历史，马上就能翻
- **新消息自动记入** —— 发送后自动追加到历史，连续重复去重、上限 200 条
- **不打扰输入** —— 光标不在行首时不抢 `↑/↓`（不影响编辑中文本）；输入法合成、斜杠命令菜单里也不触发
- **纯内存** —— 不写磁盘、不跨重载重复，每会话独立

## 📦 安装

```sh
dsh plugin --profile web add github:VioletScar-Hui/dsh-chat-history
```

装完刷新页面即可（浏览器刷新生效，无需重启宿主）。

## 🚀 使用

1. 打开任意会话，点击聊天输入框。
2. 光标在**行首**时按 `↑`：召回你上一条发过的消息；继续按 `↑` 往前翻。
3. 按 `↓`：往后翻；翻到最新时再按 `↓`，还原成你本来在编辑的草稿。
4. 直接改文字即可退出浏览状态，正常发送。

## 🔧 实现

- 注册 `conversation.input.left`（list 槽，工具行内，additive），组件返回 `null` 只挂副作用，绝不做 DOM hack。
- 键盘监听在 `document` **捕获阶段**，只认 `textarea[data-phase]`（composer 文本域唯一稳定属性）。
- 历史来源：`ConversationSnapshot.nodes` 里 `kind === 'user'` 节点；发送检测靠 `InputState.phase` 的 `submitting → plain` 迁移。

## 📄 License

[MIT](./LICENSE)
