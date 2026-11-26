/* ==========================================================================
   站点数据 —— 只改这个文件就能增删导航
   --------------------------------------------------------------------------
   结构：
   window.NAV_DATA = {
     meta:    { title, subtitle, showFavicons }
     groups:  [ { id, name, tone, items: [ { name, url, desc, icon, self } ] } ]
   }

   字段说明：
   - id        分组标识，纯英文，用于筛选按钮
   - tone      分组配色：clay（陶土）/ olive（橄榄）/ amber（芥末）/ blue（灰蓝）/ teal（青绿）/ plum（梅紫）/ slate（石板灰）/ indigo（靛）
   - name      显示名称
   - en        可选，封面底部的英文标签；不写则取 id 大写
   - url       链接地址，支持 https:// 、http:// 、obsidian:// 等
   - desc      可选，副标题；不写则自动显示域名
   - icon      可选，图标里的字符；不写则取名称首字
   - self      可选，true 表示当前标签页打开（默认新标签页）
   ========================================================================== */

window.NAV_DATA = {
  meta: {
    title: "阿莫的导航",
    subtitle: "爱好 · 阅读 · 学习 · AI · 工具，一页到位",
    // 站点图标默认关闭：图标源 icons.duckduckgo.com 在国内多数网络下不可达，
    // 开启后加载失败会逐条回退首字母。能访问时改成 true 即可。
    showFavicons: false,

    // 背景节气图：取 assets/bg/<bgYear>/ 下对应当天节气的图，按公历近似日期切换。
    // 换成 false 可整体关闭背景。
    showBackdrop: true,
    bgYear: 2025
  },

  groups: [
    {
      id: "hobby",
      name: "爱好",
      en: "HOBBY",
      tone: "olive",
      items: [
        { name: "哔哩哔哩", url: "https://www.bilibili.com", desc: "追番 · 罗小黑" },
        { name: "豆瓣", url: "https://www.douban.com", desc: "书 · 影 · 音" },
        { name: "下厨房", url: "https://www.xiachufang.com", desc: "菜谱" },
        { name: "网易云音乐", url: "https://music.163.com", desc: "歌单" },
        { name: "QQ 音乐", url: "https://y.qq.com", desc: "曲库 · 歌单" },
        { name: "纵横四海", url: "https://www.xiaoyuzhoufm.com/podcast/62694abdb221dd5908417d1e", desc: "小宇宙 · 播客" },
        { name: "小红书", url: "https://www.xiaohongshu.com", desc: "随手刷" },
        { name: "什么值得买", url: "https://www.smzdm.com", desc: "比价" }
      ]
    },

    {
      id: "luoxiaohei",
      name: "罗小黑",
      en: "LUOXIAOHEI",
      tone: "clay",
      items: [
        { name: "众生之门 · 官网", url: "https://zszm.fans", desc: "ZSZM 官方站" },
        { name: "众生之门 · 入世寻灵", url: "https://zszm.iridescently.cn", desc: "与万物同行" },
        { name: "罗小黑图片档案馆", url: "https://into.xyy.world/lxh/", desc: "24 节气 · 图片档案" }
      ]
    },

    {
      id: "cat",
      name: "猫",
      en: "CAT",
      tone: "plum",
      items: [
        { name: "NyankoDB", url: "https://nyankodb.com", desc: "猫咖啡 · 猫咪图鉴" }
      ]
    },

    {
      id: "reading",
      name: "阅读",
      en: "READING",
      tone: "teal",
      items: [
        { name: "微信读书", url: "https://weread.qq.com", desc: "书架 · 划线" },
        { name: "知树阅读", url: "https://books.zhitree.cn", desc: "个人数字图书馆" },
        { name: "识典古籍", url: "https://www.shidianguji.com", desc: "古籍在线阅读" },
        { name: "全历史", url: "https://www.allhistory.com", desc: "历史图谱" },
        { name: "江山时序", url: "https://deanchen.me", desc: "历史地图时间轴" },
        { name: "国家地理", url: "https://www.nationalgeographic.com", desc: "National Geographic" }
      ]
    },

    {
      id: "finance",
      name: "财经",
      en: "FINANCE",
      tone: "slate",
      items: [
        { name: "金十数据", url: "https://www.jin10.com", desc: "财经快讯" }
      ]
    },

    {
      id: "learning",
      name: "学习",
      en: "LEARNING",
      tone: "blue",
      items: [
        { name: "开发者路线图", url: "https://roadmap.sh", desc: "roadmap.sh · 技能路径" },
        { name: "English Rolling", url: "https://englishrolling.xyz", desc: "英语跟读 · ESL" },
        { name: "Hacker News", url: "https://news.ycombinator.com", desc: "技术社区" },
        { name: "JavaScript Weekly", url: "https://javascriptweekly.com", desc: "前端周刊" },
        { name: "前端周看", url: "https://frontendweekly.cn", desc: "每日精选" },
        { name: "前端技术文章", url: "https://fed.chanceyu.com", desc: "ChanceYu 的 RSS 聚合" }
      ]
    },

    {
      id: "ai",
      name: "AI",
      en: "LLM",
      tone: "indigo",
      items: [
        { name: "ChatGPT", url: "https://chatgpt.com", desc: "OpenAI" },
        { name: "Claude", url: "https://claude.ai", desc: "Anthropic" },
        { name: "Gemini", url: "https://gemini.google.com", desc: "Google" },
        { name: "DeepSeek", url: "https://chat.deepseek.com", desc: "深度求索" },
        { name: "豆包", url: "https://www.doubao.com", desc: "字节跳动" },
        { name: "千问", url: "https://www.qianwen.com", desc: "阿里 · 原通义" },
        { name: "Kimi", url: "https://www.kimi.com", desc: "月之暗面" },
        { name: "腾讯元宝", url: "https://yuanbao.tencent.com", desc: "腾讯" },
        { name: "智谱清言", url: "https://chatglm.cn", desc: "智谱 GLM" },
        { name: "文心", url: "https://wenxin.baidu.com", desc: "百度" },
        { name: "Arena", url: "https://arena.ai", desc: "模型竞技场 · 原 LMArena" },
        { name: "Artificial Analysis", url: "https://artificialanalysis.ai", desc: "速度 · 价格对比" },
        { name: "OpenCompass", url: "https://opencompass.org.cn", desc: "中文评测榜" },
        { name: "Hugging Face", url: "https://huggingface.co", desc: "模型 · 榜单" },
        { name: "OpenRouter", url: "https://openrouter.ai", desc: "多模型统一 API" },
        { name: "硅基流动", url: "https://siliconflow.cn", desc: "国内模型聚合 API" },
        { name: "DeepSeek 开放平台", url: "https://platform.deepseek.com", desc: "API · 用量" },
        { name: "DSH 插件库", url: "https://deepseek-harness-plugin.com", desc: "DeepSeek 插件目录" }
      ]
    },

    {
      id: "tool",
      name: "工具",
      en: "TOOLS",
      tone: "amber",
      items: [
        { name: "GitHub", url: "https://github.com", desc: "仓库 · Pages" },
        { name: "Obsidian", url: "https://obsidian.md", desc: "本地笔记 · 双链" },
        { name: "LocalSend", url: "https://localsend.org", desc: "局域网互传" },
        { name: "DeepL 翻译", url: "https://www.deepl.com/translator", desc: "中英互译" },
        { name: "正则 101", url: "https://regex101.com", desc: "正则调试" },
        { name: "Excalidraw", url: "https://excalidraw.com", desc: "手绘风画图" },
        { name: "中国天气", url: "https://www.weather.com.cn", desc: "预报" }
      ]
    }
  ]
};
