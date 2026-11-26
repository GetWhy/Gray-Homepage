# 导航页 · nav

个人用的单页导航，纯静态、零构建、零依赖。部署到 GitHub Pages 后在任何设备打开同一个地址即可。

## 目录

```
nav/
├─ index.html          页面骨架
├─ assets/
│  ├─ style.css        样式（含深浅色主题）
│  ├─ app.js           渲染、搜索、筛选、时钟、节气背景
│  └─ bg/2025/         24 张节气插画（webp）
├─ data/
│  └─ links.js         站点数据 —— 只改这里
└─ .nojekyll           告诉 Pages 不要走 Jekyll 处理
```

## 本地预览

直接双击 `index.html` 即可。若想用本地服务（更接近线上）：

```bash
cd D:/Ai/projects/nav
python -m http.server 5178
# 打开 http://localhost:5178
```

## 发布到 GitHub Pages

### 1. 建仓库并推送

```bash
cd D:/Ai/projects/nav
git init -b main
git add .
git commit -m "feat: 个人导航页初始版本"
git remote add origin https://github.com/<你的用户名>/nav.git
git push -u origin main
```

> 仓库必须是 **public**（免费账号的 Pages 只对公开仓库开放），仓库名建议 `nav`。

### 2. 开启 Pages

GitHub 仓库页 → **Settings → Pages** → **Build and deployment**

- Source 选 `Deploy from a branch`
- Branch 选 `main`，目录选 `/ (root)`
- 保存，等 1–2 分钟

访问地址：`https://<你的用户名>.github.io/nav/`

### 3. 以后更新

改完 `data/links.js` 直接：

```bash
git add . && git commit -m "chore: 更新链接" && git push
```

页面约 1 分钟后自动重建。

## 维护链接

只编辑 `data/links.js`：

```js
{
  id: "hobby",          // 分组标识，英文
  name: "爱好",          // 显示名称
  tone: "olive",        // 配色：clay / olive / amber / blue / teal / plum / slate / indigo
  items: [
    { name: "豆瓣", url: "https://www.douban.com", desc: "书 · 影 · 音" }
  ]
}
```

可选字段：

| 字段 | 作用 |
| --- | --- |
| `desc` | 卡片副标题，不写则显示域名 |
| `icon` | 图标里的字符，不写则取名称首字 |
| `self` | `true` 时在当前标签页打开 |

## 说明与注意

- **图标**：默认使用名称首字生成彩色方块（`meta.showFavicons: false`）。若你的网络能访问 `icons.duckduckgo.com`，可设为 `true` 换取真实站点图标，取不到时自动回退首字母。
- **隐私**：这是公开仓库，链接清单对外可见。不要放带 token、内网口令或私人地址的 URL。需要私密可改用 GitHub 私有仓库 + Cloudflare Pages（免费额度内支持私有源）。
- 移动端已适配，可「添加到主屏幕」当轻应用使用。

## 节气背景

页面背景按当天所处节气自动换成对应插画。图源为罗小黑 24 节气档案（2025 年），已下载到 `assets/bg/2025/`，文件名用拼音（`xiaoxue.webp`、`daxue.webp`），避开中文路径在 Git 与 URL 上的编码问题。

- **节气判定**：`app.js` 的 `TERMS` 是一张公历近似日期表，误差 ±1 天；1 月 1—4 日归入上一年的冬至。判定结果同时显示在时钟右侧（如「· 小雪」）。
- **浮现方式**：`.backdrop` 是一层 `position: fixed` 的图 + 渐变压暗。`mask-image` 在视口 150—250px 之间做渐变，所以标题和搜索框始终落在无图的干净区域，图从书架位置才开始出现；再往下逐渐淡到 0.3。
- **换年份**：新图按同样命名放进 `assets/bg/<年份>/`，把 `data/links.js` 里的 `meta.bgYear` 改掉即可。想整体关掉背景，设 `meta.showBackdrop: false`。
- **强度**：`.backdrop__img.is-on` 的 `opacity`（当前 `0.9`）控制画面浓度；`.backdrop::after` 的白色渐变负责把图压到不影响阅读的程度，浅色/深色主题各一套。

> 图片版权归原作者，此处仅作个人页面背景使用，请不要二次分发。

## 一级导航：书架

分组以「杂志封面立在层板上」的形式排布，由 `data/links.js` 的 `groups` 自动生成，每组一张。筛选「全部」由下方胶囊承担，书架上不再单列一张。

- **封面**：正方形，底色取该组的 `tone`，内容为中文名 + 英文标签（`en`）+ 条目数。
- **层板**：每格 `.slot` 底部自带一段 10px 的板（`::after`），卡片间隙仅 3px，相邻板首尾相接连成一条长板；排与排之间的 `gap: 46px` 是层板下方的空白墙面，改小会让板贴到下一排、阴影被盖住。
- **装饰图形**：按序号循环四种（圆环 / 网格 / 斜纹 / 圆弧），改 `app.js` 的 `SHAPES` 数组即可增减。
- **交互**：点击封面筛选该组，未选中的封面降饱和（选中「全部」时全部保持满饱和）；下方胶囊保留作快速索引，两者状态同步。
- **响应式**：桌面 4 列，八张封面正好两排（4 + 4）；≤720px 变成横向滑动（`scroll-snap`）。

## 动效

| 位置 | 效果 | 调整入口 |
| --- | --- | --- |
| 首屏 | 标题 → 搜索框 → 筛选条 → 卡片依次上浮 | `style.css` 各 `animation` 的 delay；卡片间隔为 `var(--i) * 22ms` |
| 卡片悬停 | 上浮 2px、左侧分类色条展开、图标微放大并轻转、名称转为分类色、暖色投影 | `.card:hover` 与 `.card::before` |
| 卡片按下 | 轻微回压至 0.985 | `.card:active` |
| 筛选 / 搜索 | 新筛出的卡片淡入 240ms，消失的立即移除 | `app.js` 的 `fadeIn()` |
| 主题切换 | 底色、卡面、文字 0.3s 过渡 | `body` 与 `.card` 的 `transition` |
| 搜索聚焦 | 放大镜转陶土色、`/` 键帽淡出右移 | `.search:focus-within` |

整体节奏由两个变量控制：`--ease-out`（常规缓动）与 `--ease-spring`（回弹），都在 `:root` 里。

系统开启「减少动态效果」时，上述动画与过渡全部关闭（`prefers-reduced-motion` 媒体查询 + JS 侧的 `canAnimate` 判断）。

## 配色

| 变量 | 浅色 | 用途 |
| --- | --- | --- |
| `--bg` | `#faf6ee` | 页面底色 |
| `--text` | `#3a322b` | 正文 |
| `--accent` | `#b4552f` | 聚焦、强调（陶土） |
| `--tone-olive` | `#6e7b4e` | 爱好分组（橄榄） |
| `--tone-amber` | `#b8862a` | 工具分组（芥末） |
| `--tone-teal` | `#3f7a6e` | 阅读分组（青绿） |
| `--tone-plum` | `#7d6182` | 猫分组（梅紫） |
| `--tone-slate` | `#5d6a70` | 财经分组（石板灰） |
| `--tone-indigo` | `#51508f` | AI 分组（靛） |

深色主题在 `[data-theme="dark"]` 块中覆写，右上角按钮切换，选择记在 `localStorage`。
