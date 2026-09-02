# Contributing

感谢你想为 `dsh-chat-history` 贡献代码！这是一个很轻量的纯客户端插件，流程也很简单。

## 开发环境

只需要 [Bun](https://bun.sh)（构建 + 单测工具），没有运行时依赖。

```sh
bun scripts/build.js   # 重新生成 lib/
bun test               # 单测
bun scripts/verify.js  # 校验清单与构建产物
```

## 提交规范

- 改动 `src/` 后**必须重新构建**，把 `lib/` 预构建产物一并提交——安装端免 bun、免构建。
- 纯历史逻辑（`src/client/history.js`）改动时，请同步补/改 `test/history.test.js`。
- 提交信息用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `ci:` / `chore:`）。

## 提 PR 前

1. `bun test` 全绿。
2. `bun scripts/build.js` 成功且 `git status` 里 `lib/` 已更新。
3. `bun scripts/verify.js` 通过。

CI 会在 push / PR 时自动跑「构建 + 单测 + 校验」。

## 行为准则

- 功能改动保持「无可见 UI、纯键盘交互」的设计：历史入口就是 `↑/↓`，不加按钮。
- 注册槽的代码必须包在 `try/catch` 里降级——client 抛错会让整个 web shell 起不来。
