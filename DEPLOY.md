# GitHub Pages 部署说明 · v1.3.1

版本：v1.3.1  
内容冻结：2026-08-08 16:11 (UTC+8)

## Pages 设置

- Source：**Deploy from a branch**
- Branch：**main**
- Directory：**/(root)**
- 不要添加 `.nojekyll`：当前版本继续依赖 Jekyll include。

## 当前发布结构

- 根目录 `index.html`：跳转到 `./v131/#overview`。
- `v131/index.html`：v1.3.1 当前页面入口。
- `v130/index.html`：v1.3.0 历史入口，保留回滚能力。
- `_includes/v130compact/`、`_includes/v130rest/`、`_includes/v130runtime/`：延续稳定基线。
- `_includes/v131runtime/r06.js`：v1.3.1 增量优化层，不直接破坏 v1.3.0 入口。
- `assets/data/route-metrics-v131.json`：60 个冻结转场的距离、时长和 polyline。

## 高德生产配置

### Web端（JS API）

前端需要公开 JS API Key。这一 Key 会进入浏览器，因此它不是 Secret；必须在高德控制台限制到 `shuhong-bnu.github.io` 域名。

安全密钥不再由访客填写。页面生产配置使用：

```text
serviceHost = https://trip-amap-proxy.shuhong001.workers.dev/_AMapService
```

### Cloudflare Worker

Worker 保存：

```text
Secret name: AMAP_SECURITY_CODE
```

真实 `securityJsCode` 不写入 GitHub、不输出日志、不发送给访客浏览器。

### Web Service 路线冻结

GitHub Actions Secret：

```text
AMAP_WEB_SERVICE_KEY
```

只在路线变化且手动运行 `.github/workflows/freeze-amap-routes.yml` 时使用；日常访客打开网页不会实时重新算 60 段路线。

## v1.3.1 验收点

- 根网址进入 `/v131/#overview`；
- `/v130/#overview` 仍可作为历史版访问；
- 三套界面和底部四入口正常；
- 高德底图无需访客手工输入 Key / securityJsCode 即可显示；
- 每天的地图区域默认折叠，展开后才加载 AMap；
- 节点默认显示图标 + 编号；“显示节点名称”按钮可在显示 / 隐藏间切换；
- 名称浮层不应相互遮挡，并与地图编号一一对应；
- 各段路线按当天先后阶段显示不同颜色，并有阶段色图例；
- 冻结距离 / 时长继续可用，页面不重新请求 Web Service 路线规划；
- 北京代表图为固定的真实天安门城楼正面图；
- 图片元数据请求有持久缓存、并发限制和懒加载；
- 北京景点池明确显示天安门城楼 A / 91；
- 预订日历明确出现 `8/13 17:00 → 抢 8/20 天安门城楼`；
- 威海景点池包含乳山银滩、大乳山、东浦湾 / 逍遥湾、海驴岛、荣成天鹅湖；
- Pages build / deploy 成功。

在线最新版：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/`

固定入口：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/v131/#overview`
