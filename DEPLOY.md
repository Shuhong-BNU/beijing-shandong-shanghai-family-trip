# GitHub Pages 部署说明 · v1.3.3

版本：v1.3.3  
内容冻结：2026-08-08 16:55 (UTC+8)

## Pages 设置

- Source：**Deploy from a branch**
- Branch：**main**
- Directory：**/(root)**
- 不要添加 `.nojekyll`：当前版本继续依赖 Jekyll include。

## 当前发布结构

- 根目录 `index.html`：跳转到 `./v133/#overview`。
- `v133/index.html`：v1.3.3 当前页面入口。
- `v132/index.html`：v1.3.2 历史入口。
- `v131/index.html`：v1.3.1 历史入口。
- `v130/index.html`：v1.3.0 历史入口。
- `_includes/v130compact/`、`_includes/v130rest/`、`_includes/v130runtime/`：历史稳定基线。
- `_includes/v131runtime/r06.js`：v1.3.1 增量层。
- `_includes/v132runtime/r07.js`：v1.3.2 地理节点标签 + 逐餐真实图完整覆盖层。
- `_includes/v133runtime/r08.js`：v1.3.3 五方案全程总路线图层。
- `assets/data/route-metrics-v131.json`：60 个冻结转场的距离、时长和 polyline；v1.3.3 继续复用，未重冻路线数据。

## 高德生产配置

### Web端（JS API）

前端公开 JS API Key 会进入浏览器，因此它不是 Secret；必须在高德控制台限制到 `shuhong-bnu.github.io` 域名。

页面生产配置继续使用：

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

## v1.3.3 验收点

- 根网址进入 `/v133/#overview`；
- `/v132/#overview`、`/v131/#overview`、`/v130/#overview` 仍可访问且内容不被新版本覆盖；
- “方案速览”中 A–E 五个方案各有一张独立可折叠的高德全程总路线图；
- 总路线图在折叠状态下不创建 AMap，展开后才加载；
- “执行行程”顶部为当前选中方案显示同款可折叠总路线图；
- 总路线图覆盖该方案 8 天全部地理节点；重复到访同一地点合并 Marker，但详标列出全部 Day / 日期；
- 总图节点 Marker 有唯一编号；节点旁详标显示 Day / 日期 / 节点名称；
- 详标默认显示，可通过“隐藏节点详标 / 显示节点详标”切换；
- 拖动、缩放、容器变化后重新计算总图标签位置，尽量避免邻近名称互相遮挡；
- 总图相邻路线段使用高对比颜色，图例明确显示 `D几 + 日期 + 段序 / 分支 + 交通方式`；
- 每条 Polyline 使用方向箭头；飞机、铁路、步行、轮渡等特殊段使用虚线；
- Day 8 总图显示虹桥后的两条分支：爸妈去赣州、女友经浦东去广州；
- 每天局部地图的 v1.3.2 地理标签、碰撞规避和逐餐真实图完整覆盖继续正常；
- 冻结距离 / 时长继续可用，页面不重新请求 Web Service 路线规划；
- Pages build / deploy 成功。

在线最新版：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/`

固定入口：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/v133/#overview`
