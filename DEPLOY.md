# GitHub Pages 部署说明 · v1.3.2

版本：v1.3.2  
内容冻结：2026-08-08 16:27 (UTC+8)

## Pages 设置

- Source：**Deploy from a branch**
- Branch：**main**
- Directory：**/(root)**
- 不要添加 `.nojekyll`：当前版本继续依赖 Jekyll include。

## 当前发布结构

- 根目录 `index.html`：跳转到 `./v132/#overview`。
- `v132/index.html`：v1.3.2 当前页面入口。
- `v131/index.html`：v1.3.1 历史入口。
- `v130/index.html`：v1.3.0 历史入口。
- `_includes/v130compact/`、`_includes/v130rest/`、`_includes/v130runtime/`：历史稳定基线。
- `_includes/v131runtime/r06.js`：v1.3.1 增量层。
- `_includes/v132runtime/r07.js`：v1.3.2 地理节点标签 + 逐餐真实图完整覆盖层。
- `assets/data/route-metrics-v131.json`：60 个冻结转场的距离、时长和 polyline；v1.3.2 未重冻路线数据。

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

## v1.3.2 验收点

- 根网址进入 `/v132/#overview`；
- `/v131/#overview` 与 `/v130/#overview` 仍可访问且内容不被新版本覆盖；
- 三套界面和底部四入口正常；
- 高德底图无需访客手工输入 securityJsCode 即可显示；
- 每天地图默认折叠，展开后才创建 AMap 实例；
- 默认节点显示图标 + 编号；
- 点击“显示节点名称”后，每个名称直接出现在对应地理节点旁，而不是顶部列表；
- 拖动、缩放地图后名称跟随对应坐标；缩放结束/拖动结束/容器变化后重新进行标签排布；
- 节点名称完整显示，不使用省略号；密集节点尽量通过多方向候选位置避免互相遮挡；
- 各段路线继续按当天先后阶段显示不同颜色，并保留阶段色图例；
- 冻结距离 / 时长继续可用，页面不重新请求 Web Service 路线规划；
- 逐餐表所有餐次均有“真实图”内容；无单一代表菜的餐次使用固定真实中餐代表图；
- 逐餐图片采用确定图片 URL + lazy loading + async decoding，单图失败有固定真实图回退；
- v1.3.1 的天安门城楼 A / 91、8/13 17:00 预约动作、胶东自驾走廊景点池继续保留；
- Pages build / deploy 成功。

在线最新版：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/`

固定入口：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/v132/#overview`
