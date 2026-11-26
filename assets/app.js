(function () {
  "use strict";

  var data = window.NAV_DATA || {};
  var meta = data.meta || {};
  // 分组可以是扁平的 items，也可以再用 sections 分二级
  function itemsOf(group) {
    var list = [];
    if (Array.isArray(group.sections)) {
      group.sections.forEach(function (sub) {
        (sub.items || []).forEach(function (item) {
          list.push(item);
        });
      });
    } else if (Array.isArray(group.items)) {
      list = group.items;
    }
    return list;
  }

  var groups = (data.groups || []).filter(function (group) {
    return group && group.name && itemsOf(group).length > 0;
  });

  var el = {
    title: document.getElementById("siteTitle"),
    subtitle: document.getElementById("siteSubtitle"),
    clockTime: document.getElementById("clockTime"),
    clockDate: document.getElementById("clockDate"),
    themeBtn: document.getElementById("themeBtn"),
    search: document.getElementById("searchInput"),
    filters: document.getElementById("filters"),
    shelf: document.getElementById("shelf"),
    container: document.getElementById("groups"),
    empty: document.getElementById("empty"),
    footCount: document.getElementById("footCount")
  };

  if (meta.title) {
    document.title = meta.title;
    el.title.textContent = meta.title;
  }
  if (meta.subtitle) {
    el.subtitle.textContent = meta.subtitle;
  }

  var activeGroup = "all";
  var keyword = "";
  var WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  /* 主题切换 ------------------------------------------------------------ */
  el.themeBtn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("nav-theme", next);
    } catch (e) {
      /* 隐私模式下 localStorage 不可写，忽略即可 */
    }
  });

  /* 时钟 ---------------------------------------------------------------- */
  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function tickClock() {
    var now = new Date();
    el.clockTime.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
    el.clockDate.textContent =
      now.getMonth() + 1 + "月" + now.getDate() + "日 " + WEEK[now.getDay()];
  }

  tickClock();
  setInterval(tickClock, 20000);

  /* 节气背景 ------------------------------------------------------------ */
  // 2025 年这套图来自 into.xyy.world/lxh，按公历近似日期切分，误差 ±1 天
  var TERMS = [
    { key: "xiaohan", name: "小寒", m: 1, d: 5 },
    { key: "dahan", name: "大寒", m: 1, d: 20 },
    { key: "lichun", name: "立春", m: 2, d: 3 },
    { key: "yushui", name: "雨水", m: 2, d: 18 },
    { key: "jingzhe", name: "惊蛰", m: 3, d: 5 },
    { key: "chunfen", name: "春分", m: 3, d: 20 },
    { key: "qingming", name: "清明", m: 4, d: 4 },
    { key: "guyu", name: "谷雨", m: 4, d: 20 },
    { key: "lixia", name: "立夏", m: 5, d: 5 },
    { key: "xiaoman", name: "小满", m: 5, d: 21 },
    { key: "mangzhong", name: "芒种", m: 6, d: 5 },
    { key: "xiazhi", name: "夏至", m: 6, d: 21 },
    { key: "xiaoshu", name: "小暑", m: 7, d: 7 },
    { key: "dashu", name: "大暑", m: 7, d: 22 },
    { key: "liqiu", name: "立秋", m: 8, d: 7 },
    { key: "chushu", name: "处暑", m: 8, d: 23 },
    { key: "bailu", name: "白露", m: 9, d: 7 },
    { key: "qiufen", name: "秋分", m: 9, d: 23 },
    { key: "hanlu", name: "寒露", m: 10, d: 8 },
    { key: "shuangjiang", name: "霜降", m: 10, d: 23 },
    { key: "lidong", name: "立冬", m: 11, d: 7 },
    { key: "xiaoxue", name: "小雪", m: 11, d: 22 },
    { key: "daxue", name: "大雪", m: 12, d: 7 },
    { key: "dongzhi", name: "冬至", m: 12, d: 21 }
  ];

  function currentTerm() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    // 1 月 1—4 日仍属上一年冬至
    var hit = TERMS[TERMS.length - 1];
    for (var i = 0; i < TERMS.length; i += 1) {
      var term = TERMS[i];
      if (month > term.m || (month === term.m && day >= term.d)) {
        hit = term;
      }
    }
    return hit;
  }

  function applyBackdrop() {
    var term = currentTerm();
    var year = meta.bgYear || 2025;
    var label = document.getElementById("termLabel");
    var layer = document.getElementById("backdropImg");

    if (label) {
      label.textContent = term.name;
    }
    if (!layer || meta.showBackdrop === false) {
      return;
    }

    var src = "./assets/bg/" + year + "/" + term.key + ".webp";
    layer.style.backgroundImage = 'url("' + src + '")';
    window.requestAnimationFrame(function () {
      layer.classList.add("is-on");
    });
  }

  /* 辅助 ---------------------------------------------------------------- */
  function hostOf(url) {
    try {
      return new URL(url, location.href).hostname.replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  function initialOf(text) {
    var trimmed = String(text || "").trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : "·";
  }

  function setActiveFilter(id) {
    activeGroup = id;
    Array.prototype.forEach.call(el.filters.children, function (node) {
      node.classList.toggle("is-active", node.dataset.group === id);
    });
    if (el.shelf) {
      // 书架不再有「全部」封面，选中全部时让所有封面保持满饱和
      el.shelf.classList.toggle("is-all", id === "all");
      Array.prototype.forEach.call(el.shelf.children, function (node) {
        var on = node.dataset.group === id;
        node.classList.toggle("is-active", on);
        node.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  /* 卡片 ---------------------------------------------------------------- */
  function buildCard(item, group, index, subName) {
    var host = hostOf(item.url);
    var tone = group.tone || "clay";

    var card = document.createElement("a");
    card.className = "card";
    card.href = item.url;
    if (item.self) {
      card.target = "_self";
    } else {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }
    card.style.setProperty("--tone", "var(--tone-" + tone + ")");
    card.style.setProperty("--tone-soft", "var(--tone-" + tone + "-soft)");
    card.style.setProperty("--i", String(index));

    var icon = document.createElement("div");
    icon.className = "card__icon";

    var letter = document.createElement("span");
    letter.className = "card__letter";
    letter.textContent = initialOf(item.icon || item.name);
    icon.appendChild(letter);

    if (host && meta.showFavicons !== false) {
      var favicon = document.createElement("img");
      favicon.className = "card__favicon";
      favicon.alt = "";
      favicon.loading = "lazy";
      favicon.referrerPolicy = "no-referrer";
      favicon.src = "https://icons.duckduckgo.com/ip3/" + host + ".ico";
      favicon.addEventListener("load", function () {
        letter.style.visibility = "hidden";
      });
      favicon.addEventListener("error", function () {
        favicon.remove();
      });
      icon.appendChild(favicon);
    }

    var body = document.createElement("div");
    body.className = "card__body";

    var name = document.createElement("div");
    name.className = "card__name";
    name.textContent = item.name;

    var sub = document.createElement("div");
    sub.className = "card__meta";
    sub.textContent = item.desc || host || "";

    body.appendChild(name);
    body.appendChild(sub);
    card.appendChild(icon);
    card.appendChild(body);

    card.dataset.search = [item.name, item.desc || "", host, group.name, subName || ""]
      .join(" ")
      .toLowerCase();

    return card;
  }

  /* 渲染 ---------------------------------------------------------------- */
  function render() {
    el.filters.textContent = "";
    var chips = [{ id: "all", name: "全部" }].concat(
      groups.map(function (group) {
        return { id: group.id || group.name, name: group.name };
      })
    );

    chips.forEach(function (chip) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter" + (chip.id === activeGroup ? " is-active" : "");
      btn.dataset.group = chip.id;
      btn.textContent = chip.name;
      btn.addEventListener("click", function () {
        setActiveFilter(chip.id);
        applyFilter(true);
      });
      el.filters.appendChild(btn);
    });

    el.container.textContent = "";

    groups.forEach(function (group) {
      var gid = group.id || group.name;
      var tone = group.tone || "clay";

      var section = document.createElement("section");
      section.className = "group";
      section.dataset.group = gid;
      section.style.setProperty("--tone", "var(--tone-" + tone + ")");

      var head = document.createElement("div");
      head.className = "group__head";

      var bar = document.createElement("span");
      bar.className = "group__bar";

      var label = document.createElement("h2");
      label.className = "group__name";
      label.textContent = group.name;

      var count = document.createElement("span");
      count.className = "group__count";

      head.appendChild(bar);
      head.appendChild(label);
      head.appendChild(count);

      section.appendChild(head);

      var order = 0;
      var subs =
        group.sections && group.sections.length
          ? group.sections
          : [{ name: "", items: group.items || [] }];

      subs.forEach(function (sub) {
        var wrap = document.createElement("div");
        wrap.className = "subsection";

        if (sub.name) {
          var subHead = document.createElement("div");
          subHead.className = "subhead";

          var dot = document.createElement("span");
          dot.className = "subhead__dot";

          var label = document.createElement("h3");
          label.className = "subhead__name";
          label.textContent = sub.name;

          subHead.appendChild(dot);
          subHead.appendChild(label);
          wrap.appendChild(subHead);
        }

        var grid = document.createElement("div");
        grid.className = "grid";
        (sub.items || []).forEach(function (item) {
          if (item && item.name && item.url) {
            grid.appendChild(buildCard(item, group, order++, sub.name));
          }
        });

        wrap.appendChild(grid);
        section.appendChild(wrap);
      });

      el.container.appendChild(section);
    });
  }

  /* 分组书架 ------------------------------------------------------------ */
  var SHAPES = ["circle", "grid", "stripe", "arc"];
  // 书架上的杂志不是摆得笔直的：TILTS 是左右歪斜，TILT_X 是前后仰角（负值向后靠）
  var TILTS = [-0.9, 0.5, -0.4, 0.8, -0.7, 0.4, -1, 0.6];
  var TILT_X = [11, 7, 13, 5, 9, 8, 12, 6];

  function buildCover(entry, index) {
    var slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.style.setProperty("--i", String(index));
    slot.style.setProperty("--tilt", TILTS[index % TILTS.length] + "deg");
    slot.style.setProperty("--tilt-x", TILT_X[index % TILT_X.length] + "deg");
    slot.dataset.group = entry.id;
    slot.dataset.shape = SHAPES[index % SHAPES.length];
    slot.setAttribute("aria-pressed", "false");
    slot.setAttribute("aria-label", entry.name + "，共 " + entry.count + " 个站点");

    slot.style.setProperty("--tone", "var(--tone-" + (entry.tone || "clay") + ")");

    var cover = document.createElement("span");
    cover.className = "cover";

    var no = document.createElement("span");
    no.className = "cover__no";
    no.textContent = pad(index + 1);

    var title = document.createElement("span");
    title.className = "cover__title";
    title.textContent = entry.name;

    var foot = document.createElement("span");
    foot.className = "cover__foot";

    var en = document.createElement("span");
    en.className = "cover__en";
    en.textContent = entry.en;

    var count = document.createElement("span");
    count.className = "cover__count";
    count.textContent = pad(entry.count);

    var open = document.createElement("span");
    open.className = "cover__open";
    open.textContent = "打开";

    foot.appendChild(en);
    foot.appendChild(count);
    cover.appendChild(no);
    cover.appendChild(title);
    cover.appendChild(foot);
    cover.appendChild(open);
    slot.appendChild(cover);

    slot.addEventListener("click", function () {
      setActiveFilter(entry.id);
      applyFilter(true);
    });

    return slot;
  }

  function renderShelf() {
    if (!el.shelf) {
      return;
    }
    el.shelf.textContent = "";

    var entries = groups.map(function (group) {
      return {
        id: group.id || group.name,
        name: group.name,
        en: group.en || String(group.id || "").toUpperCase(),
        count: itemsOf(group).length,
        tone: group.tone
      };
    });

    entries.forEach(function (entry, index) {
      el.shelf.appendChild(buildCover(entry, index));
    });
  }

  /* 筛选与搜索 ---------------------------------------------------------- */
  var canAnimate =
    typeof Element.prototype.animate === "function" &&
    !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // 只给「刚被筛出来」的卡片补一段淡入；消失的卡片直接移除，
  // 避免输入时连续淡出造成拖沓
  function fadeIn(cards) {
    if (!canAnimate || !cards.length) {
      return;
    }
    cards.forEach(function (card) {
      card.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 240, easing: "cubic-bezier(0.22, 0.68, 0.35, 1)" }
      );
    });
  }

  function applyFilter(animate) {
    var query = keyword.trim().toLowerCase();
    var total = 0;
    var revealed = [];

    Array.prototype.forEach.call(el.container.children, function (section) {
      var gid = section.dataset.group;
      var count = 0;

      Array.prototype.forEach.call(section.querySelectorAll(".card"), function (card) {
        var inGroup = activeGroup === "all" || activeGroup === gid;
        var hit = !query || card.dataset.search.indexOf(query) !== -1;
        var show = inGroup && hit;
        if (show && card.hidden && animate) {
          revealed.push(card);
        }
        card.hidden = !show;
        if (show) {
          count++;
        }
      });

      Array.prototype.forEach.call(section.querySelectorAll(".subsection"), function (sub) {
        sub.hidden = sub.querySelectorAll(".card:not([hidden])").length === 0;
      });

      section.hidden = count === 0;
      var badge = section.querySelector(".group__count");
      if (badge) {
        badge.textContent = String(count);
      }
      total += count;
    });

    fadeIn(revealed);

    el.empty.hidden = total !== 0;
    el.footCount.textContent = "共 " + total + " 个站点";
  }

  el.search.addEventListener("input", function () {
    keyword = el.search.value;
    if (keyword.trim() && activeGroup !== "all") {
      setActiveFilter("all");
    }
    applyFilter(true);
  });

  el.search.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      el.search.value = "";
      keyword = "";
      applyFilter(true);
      el.search.blur();
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    var first = null;
    var sections = el.container.querySelectorAll(".group:not([hidden])");
    for (var i = 0; i < sections.length && !first; i++) {
      first = sections[i].querySelector(".card:not([hidden])");
    }

    if (first) {
      var target = first.target === "_self" ? "_self" : "_blank";
      window.open(first.getAttribute("href"), target, "noopener");
      return;
    }

    var value = el.search.value.trim();
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) {
      window.open("https://" + value, "_blank", "noopener");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    var node = document.activeElement;
    var tag = node ? node.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (node && node.isContentEditable)) {
      return;
    }
    event.preventDefault();
    el.search.focus();
    el.search.select();
  });

  /* 启动 ---------------------------------------------------------------- */
  applyBackdrop();
  render();
  renderShelf();
  setActiveFilter(activeGroup);
  applyFilter();

  // 首屏入场走完（最晚 310ms + 400ms）后关掉 CSS stagger，
  // 之后筛选只由 fadeIn 接管，避免动画重播
  window.setTimeout(function () {
    document.body.classList.add("is-settled");
  }, 900);

  // 供 3D 书架（shelf3d.js）调用：选中某个分组并刷新列表
  window.NAV_API = {
    selectGroup: function (id) {
      setActiveFilter(id);
      applyFilter(true);
    }
  };

  if (!groups.length) {
    el.empty.hidden = false;
    el.empty.textContent = "还没有站点。打开 data/links.js，往 groups 里加一条就行。";
  }
})();
