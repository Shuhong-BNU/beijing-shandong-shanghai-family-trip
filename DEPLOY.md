# GitHub Pages 部署说明

版本：v1.1.0  
内容冻结：2026-08-07 23:22:46 (UTC+8)

## 当前发布结构

- 根目录 `index.html`：跳转到 `/v110/#full`。
- `v110/index.html`：Jekyll 页面入口。
- `_includes/v110/*.html`：v1.1.0 的静态片段；GitHub Pages 在构建阶段拼成一张连续 HTML。
- `v110/version.json` / 根目录 `version.json`：版本与时间戳元数据。

## Pages 设置

当前连接器不能直接修改仓库 Pages 设置，因此如果尚未开启，需要在 GitHub 网页端执行一次：

1. 打开仓库 **Settings → Pages**。
2. `Build and deployment` 的 Source 选择 **Deploy from a branch**。
3. Branch 选择 **main**，目录选择 **/(root)**，保存。
4. 不要添加 `.nojekyll`：v1.1.0 依赖 Jekyll 的 `{% include %}` 在构建阶段拼装页面。
5. 发布后访问：`https://shuhong-bnu.github.io/beijing-shandong-shanghai-family-trip/v110/#full`。

## 为什么不是一个超大源文件

本次通过 ChatGPT GitHub 连接器写入仓库。为了避免 20+ 万字符单文件在连接器传输中被截断，v1.1.0 的源 HTML 按安全边界拆入 `_includes/v110/`；Jekyll 构建后浏览器收到的仍是同一张完整页面。

## 地图依赖

页面运行时从 CDN 加载 Leaflet、Leaflet PolylineDecorator 和 Mermaid，并使用 OpenStreetMap 瓦片。地图线段用于表达空间关系、方向和交通方式，不替代当天实时导航。

## 验收点

发布后应检查：

- 根网址自动进入 `v110/#full`；
- “五方案+地图”能看到 5 个方案总图；
- 每个方案的 8 个日期都可展开并显示地图；
- “完整研究”目录可折叠；
- 景点点评按四城分类；
- 抢票清单、逐餐建议、租车比较、成本计算器正常；
- 外部来源链接可点击；
- 成人/60+人数变化时，同行人数和固定票务同步更新。
