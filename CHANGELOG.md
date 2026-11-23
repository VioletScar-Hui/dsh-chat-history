# Changelog

本项目的所有显著变更都会记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.1.0] - 2026-09-02

### Added

- 「消息定位」（停靠左栏）：会话头部新增 `定位` 按钮，点开后在会话滚动区左缘停靠一条纵向列表（紧挨应用左侧边栏），按会话顺序列出本 session 里所有发送过的用户消息，一条一条可浏览、可点击——点任意一条滚动定位到对应位置并短暂高亮。
- 走 `conversation.session.header.actions` 槽 + `useSession` 读取 `chat.order` / `chat.nodes`；DOM 定位用 `[data-conversation-scroll]` 容器与 `data-chat-anchor-key` 行（框架无内置 scroll-to API）。
- 新增纯函数 `extractNodeText` / `buildUserMessageIndex` 及对应单测（共 17 用例）。

## [Unreleased]

### Changed

- 适配 DSH 0.2.1：Chat 从 `SessionSnapshot` 拆为独立的 `ChatSnapshot`，消息定位改用 `@deepseek-ai/dsh-client-ui-chat` 注入的 `useChat` 读取快照（原 `useSession` 不再暴露 `chat`）；引擎要求提升到 `>=0.2.1-rc.2`，client inject 增加 `@deepseek-ai/dsh-client-ui-chat`，并补 ChatSnapshot 空快照 / 已加载两条单测。
- 将历史存储纯逻辑抽取到 `src/client/history.js`（trim、连续去重、上限 200、提取用户文本），便于单测。

### Added

- `bun test` 单测覆盖历史存储核心逻辑。
- `scripts/verify.js` 校验插件清单与构建产物。
- GitHub Actions CI（构建 + 单测 + 校验）。

## [1.0.0] - 2026-09-02

### Added

- 首个版本：DSH 聊天输入框 CLI 风格历史记忆（`↑` 召回上一条、`↓` 前进/还原草稿）。
- 纯客户端插件：注册 `conversation.input.left` 槽，组件返回 `null` 只挂副作用。
- 启动时从当前会话 `kind === 'user'` 节点预填历史；发送时经 `InputState.phase` `submitting → plain` 迁移记入新历史。
- 连续重复去重、上限 200 条；光标不在行首 / 输入法合成 / 斜杠命令菜单不触发。
