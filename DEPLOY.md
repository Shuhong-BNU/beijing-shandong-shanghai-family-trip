# GitHub Pages 部署说明 · v1.3.0

版本：v1.3.0  
内容冻结：2026-08-08 11:38 (UTC+8)

## Pages 设置

- Source：**Deploy from a branch**
- Branch：**main**
- Directory：**/(root)**
- 不要添加 `.nojekyll`：v1.3.0 继续依赖 Jekyll include。

## 当前发布结构

- 根目录 `index.html`：跳转到 `./v130/#overview`。
- `v130/index.html`：v1.3.0 Jekyll 页面入口。
- `_includes/v130compact/`：页面头部、方案速览、执行壳、尾部。
- `_includes/v130rest/`：完整研究正文分片。
- `_includes/v130runtime/`：高德算路、内嵌地图、真实图片、评分、成本与界面逻辑。
- `v122/`、`v121/`、`v120/`、`v110/`、`v100/`：历史版本继续保留。

## 高德配置

v1.3.0 **不在仓库内写入 Key**。页面“执行行程 → 高德内嵌地图设置”允许用户在当前浏览器录入：

1. 高德 Web 端 JS API Key；
2. `securityJsCode`；
3. 可选 Web Service Key（跨城铁路参考）；
4. 本站每日未缓存算路上限。

配置保存在 localStorage。建议在高德控制台限制 `shuhong-bnu.github.io` 域名。

本站上限与 30 天缓存用于降低意外调用，不代表高德官方账单硬上限。

## v1.3.0 验收点

- 根网址进入 `/v130/#overview`；
- “方案速览 / 执行行程 / 完整研究”正常切换；
- A–E 方案选择同步；
- 方案总流程可折叠且只显示 8 天摘要；
- 每天节点显示日期与所在城市；
- 飞机段显示大圆距离与锁定航班时长；
- 未配置高德 Key 时显示地图配置提示，但流程 / 表格不失效；
- 配置有效高德 Key 后，陆地段能够返回实际路线公里数 / 预计时长并画在页面内；
- 跨城日不会把全国尺度和市内路线强行挤在一张图中；
- 景点总表 / 城市分表保留 100 分评分并增加真实图片列；
- 美食表增加真实缩略图；
- 图片失败时回退图标；
- 抢票、成本、来源等原模块保留；
- Pages build / deploy 成功。

在线最新版：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/`

固定入口：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/v130/#overview`
