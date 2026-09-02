# Changelog

本项目的所有显著变更都会记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.1.0] - 2026-09-02

### Added

- 「消息定位」：会话头部新增 `定位` 按钮，点开后在左侧浮出面板，按会话顺序列出本 session 里所有发送过的用户消息，点击任意一条滚动定位到对应位置并短暂高亮。
- 走 `conversation.session.header.actions` 槽 + `useSession` 读取 `chat.order` / `chat.nodes`；DOM 定位用 `[data-conversation-scroll]` 容器与 `data-chat-anchor-key` 行（框架无内置 scroll-to API）。
- 新增纯函数 `extractNodeText` / `buildUserMessageIndex` 及对应单测（共 17 用例）。

## [Unreleased]

### Changed

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
