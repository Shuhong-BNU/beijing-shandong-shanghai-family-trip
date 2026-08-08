# 版本管理规则

本项目从 v1.3.1 起采用“固定版本入口 + 增量运行时 + 根入口指向最新版”的发布规则。

## 1. 固定入口不可覆盖

- `/v130/` 固定代表 v1.3.0。
- `/v131/` 固定代表 v1.3.1。
- `/v132/` 固定代表 v1.3.2。
- 后续 v1.3.3 使用新的 `/v133/`，不得把 `/v132/` 改写成 v1.3.3。
- 根目录 `index.html` 只负责跳转到当前最新版。

## 2. 历史基线冻结

- `_includes/v130compact/`、`_includes/v130rest/`、`_includes/v130runtime/` 从 v1.3.1 发布后视为历史基线，后续功能默认不得直接修改。
- v1.3.1 的新增行为放在 `_includes/v131runtime/`。
- v1.3.2 的新增行为放在 `_includes/v132runtime/`。
- 后续版本优先新增自己的版本层，而不是回写历史层。
- 若发现历史版本存在严重安全问题，需要修复时，必须在 CHANGELOG 中明确标记为历史版安全修补，不能静默修改。

## 3. 发布文件必须同步

每次正式发布至少同步：

1. 新版本入口目录（例如 `v133/`）；
2. 对应版本增量运行时目录（如需要）；
3. `version.json`；
4. `CHANGELOG.md`；
5. `README.md`；
6. `DEPLOY.md`；
7. 根 `index.html` 最新版跳转。

## 4. 分支与合并

- 功能开发使用 `feat/...` 分支。
- 发布前通过 PR 合并到 `main`。
- Pages 只从 `main / (root)` 发布。
- 合并前记录 base HEAD，避免在未知 main 上直接覆盖。

## 5. 数据版本

路线冻结数据文件名自身带版本号，例如：

```text
assets/data/route-metrics-v131.json
```

如果某个页面版本只改 UI / 内容、不改变路线几何，可继续显式复用旧路线数据文件，并在 `DEPLOY.md` / `CHANGELOG.md` 中说明“未重冻路线数据”。

路线内容变化时不要静默覆盖旧版本口径；应新建对应版本数据或在 CHANGELOG 中明确说明数据重冻原因、时间与影响范围。

## 6. Secret 与公开配置

- Web Service Key：只放 GitHub Actions Secret。
- `securityJsCode`：只放 Cloudflare Worker Secret。
- Web端 JS API Key：属于浏览器公开配置，必须配合高德域名白名单。
- Secret 不进入版本文件、提交历史、日志或截图文档。
