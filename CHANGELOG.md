# Changelog

本项目的所有显著变更都会记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

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
