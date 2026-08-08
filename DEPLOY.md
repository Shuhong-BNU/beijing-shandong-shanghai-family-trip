# GitHub Pages 部署说明 · v1.2.1

版本：v1.2.1  
内容冻结：2026-08-08 10:18 (UTC+8)

## Pages 设置

- Source：**Deploy from a branch**
- Branch：**main**
- Directory：**/(root)**
- 不要添加 `.nojekyll`：v1.2.1、v1.2.0 与 v1.1.0 都依赖 Jekyll include。

## 当前发布结构

- 根目录 `index.html`：跳转到 `./v121/#overview`。
- `v121/index.html`：v1.2.1 Jekyll 页面入口。
- `_includes/v121compact/*.html`：v1.2.1 构建分片。
- `v120/`、`v110/`、`v100/`：历史版本永久保留。
- `v121/version.json` / 根目录 `version.json`：当前版本元数据。

## v1.2.1 路线实现

逐日路线默认采用纯前端执行流程图，不依赖 OpenStreetMap 在线瓦片。节点数据与经纬度仍保留，但默认视觉层优先表达顺序、交通方式、关键时间和转场关系，避免手机端长标签重叠。

## v1.2.1 景点池

- 全部景点总表；
- 北京 / 青岛 / 威海 / 上海城市分表；
- 100 分评分；
- 分表按“优先级 → 评分”排序；
- 保留通用简评与本次旅行判断。

## 验收点

- 根网址进入 `/v121/#overview`；
- “方案速览 / 执行行程 / 完整研究”正常切换；
- A–E 方案选择同步到执行行程；
- 执行行程只显示当前方案；
- 8 天执行流程图无文字互相遮挡；
- 景点总表出现且可查看四城全部景点；
- 四城分表显示城市内排名、优先级与 100 分评分；
- 预订 / 研究 / 成本模块保留；
- Pages build / deploy 成功。

在线最新版：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/`
