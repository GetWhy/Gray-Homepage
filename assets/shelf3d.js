/* ==========================================================================
   3D 书架 —— three.js 渲染的杂志陈列
   --------------------------------------------------------------------------
   - 每本杂志是一个有厚度的盒体，底边为旋转轴，可以「向后靠」在层板上
   - 封面用 canvas 程序化绘制（纯色 + 文字 + 几何装饰），不依赖图片
   - 悬停：抬起、立正、放大，封面内浮出「查看」
   - 点击：飞到镜头前放大，其余杂志虚化变灰，再点「打开」才筛选站点
   - 不支持 WebGL 时静默退出，页面回退到 CSS 书架（.shelf）
   ========================================================================== */

import * as THREE from './vendor/three.module.min.js';

init();

async function init() {
  const data = window.NAV_DATA;
  const api = window.NAV_API;
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('stageCanvas');
  if (!data || !api || !stage || !canvas || stage.dataset.bound) {
    return;
  }
  stage.dataset.bound = '1';

  const openBtn = document.getElementById('stageOpen');
  const enterBtn = document.getElementById('stageEnter');
  const closeBtn = document.getElementById('stageClose');
  const focusName = document.getElementById('stageFocusName');
  const focusDesc = document.getElementById('stageFocusDesc');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    return;
  }

  /* ---------- 数据 ---------- */
  function itemsOf(group) {
    const list = [];
    if (Array.isArray(group.sections)) {
      group.sections.forEach((sub) => (sub.items || []).forEach((item) => list.push(item)));
    } else if (Array.isArray(group.items)) {
      group.items.forEach((item) => list.push(item));
    }
    return list;
  }

  // 与 style.css 的 :root 保持一致；封面颜色不随深浅色主题变化
  const TONES = {
    clay: '#b4552f',
    olive: '#6e7b4e',
    amber: '#b8862a',
    blue: '#4a6e8a',
    teal: '#3f7a6e',
    plum: '#7d6182',
    slate: '#5d6a70',
    indigo: '#51508f'
  };
  const SHAPES = ['circle', 'grid', 'stripe', 'arc'];
  // 第一排立正，第二排向后靠（弧度；rotateX 为负 = 顶部远离镜头）。
  // 不加左右歪斜：相邻两本一左一右会让书缝变成 V 形，看起来像没摆正。
  const TILT_X = [0, 0, 0, 0, -0.05, -0.17, -0.21, -0.15];
  const TILT_Z = [0, 0, 0, 0, 0, 0, 0, 0];

  const pad2 = (n) => (n < 10 ? '0' + n : String(n));

  const entries = (data.groups || [])
    .filter((group) => group && group.name)
    .map((group, index) => ({
      id: group.id || group.name,
      name: group.name,
      en: group.en || String(group.id || '').toUpperCase(),
      count: itemsOf(group).length,
      sample: itemsOf(group).slice(0, 3).map((item) => item.name),
      tone: group.tone || 'clay',
      index
    }));
  if (!entries.length) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 720px)');

  /* ---------- 封面纹理 ---------- */
  const S = 640;
  const K = S / 208;
  const SERIF = '"LXGW WenKai","Songti SC","Noto Serif CJK SC","SimSun",Georgia,serif';
  const SANS = '"LXGW WenKai",-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';

  function drawCover(entry, compact) {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    ctx.fillStyle = TONES[entry.tone] || TONES.clay;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(48,32,22,0.26)';
    ctx.fillRect(0, 0, S, S);

    const shape = SHAPES[entry.index % SHAPES.length];
    ctx.save();
    ctx.lineWidth = K;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(178 * K, 30 * K, 62 * K, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.26)';
      ctx.stroke();
    } else if (shape === 'grid') {
      ctx.strokeStyle = 'rgba(255,255,255,0.17)';
      for (let x = 79 * K; x <= S; x += 13 * K) {
        ctx.beginPath();
        ctx.moveTo(x, 112 * K);
        ctx.lineTo(x, S);
        ctx.stroke();
      }
      for (let y = 112 * K; y <= S; y += 13 * K) {
        ctx.beginPath();
        ctx.moveTo(79 * K, y);
        ctx.lineTo(S, y);
        ctx.stroke();
      }
    } else if (shape === 'stripe') {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      const dx = S * Math.tan((22 * Math.PI) / 180);
      ctx.beginPath();
      for (let x = -dx; x < S; x += 11 * K) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + dx, S);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.arc(38 * K, 188 * K, 84 * K, Math.PI * 0.55, Math.PI * 2.05);
      ctx.stroke();
    }
    ctx.restore();

    const pad = 15 * K;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (compact) {
      // 堆叠时每本只露出顶部一条：标题和序号并排放进这一条里，像书脊标签。
      // 基线要留出汉字下沿（约 0.15em）的位置，否则字底会被下一本压住
      ctx.font = '500 ' + 22 * K + 'px ' + SERIF;
      ctx.fillStyle = '#f7f2e7';
      ctx.fillText(entry.name, pad, 36 * K);
      ctx.font = '500 ' + 10 * K + 'px ' + SANS;
      ctx.fillStyle = 'rgba(247,242,231,0.6)';
      ctx.textAlign = 'right';
      ctx.fillText(pad2(entry.index + 1), S - pad, 34 * K);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = 'rgba(247,242,231,0.6)';
      ctx.font = '500 ' + 10 * K + 'px ' + SANS;
      ctx.fillText(pad2(entry.index + 1), pad, pad + 8 * K);

      ctx.fillStyle = '#f7f2e7';
      ctx.font = '500 ' + 26 * K + 'px ' + SERIF;
      ctx.fillText(entry.name, pad, pad + 40 * K);
    }

    ctx.globalAlpha = 0.74;
    ctx.font = '400 ' + 10.5 * K + 'px ' + SANS;
    const base = S - pad - 3 * K;
    ctx.fillText(entry.en, pad, base);
    ctx.textAlign = 'right';
    ctx.fillText(pad2(entry.count), S - pad, base);
    ctx.globalAlpha = 1;
    return c;
  }

  function toTexture(source) {
    const tex = new THREE.CanvasTexture(source);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function drawBlurred(source) {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');
    ctx.filter = 'grayscale(0.75) blur(7px) brightness(0.82)';
    ctx.drawImage(source, 0, 0);
    return c;
  }

  /* ---------- 场景 ---------- */
  const W = 1;
  const H = 1;
  const THICK = 0.045;
  const SHELF_H = 0.07;
  // 堆叠布局：每本露出顶部 STACK_STEP 高的一条；悬停时抬起 LIFT
  const STACK_STEP = 0.22;
  const LIFT = 0.28;
  const FOV = 32;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9aa93, 1.25));

  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  // 光偏正上方：层板的投影主要落在正下方，两端不会拖出大块斜影
  sun.position.set(1.3, 7.5, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 3.5;
  sun.shadow.camera.bottom = -3.5;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 20;
  sun.shadow.bias = -0.0006;
  sun.target.position.set(0, -0.6, 0);
  scene.add(sun, sun.target);

  // 层板正下方的柔和投影：平行光的阴影边缘是硬的，投在墙上会变成两端带斜线的梯形，
  // 所以改用一张渐变贴图，观感更接近真实层板下方的漫射阴影
  const shadowTexture = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const ctx = c.getContext('2d');
    const down = ctx.createLinearGradient(0, 0, 0, 128);
    down.addColorStop(0, 'rgba(58,50,43,0.5)');
    down.addColorStop(0.3, 'rgba(58,50,43,0.16)');
    down.addColorStop(1, 'rgba(58,50,43,0)');
    ctx.fillStyle = down;
    ctx.fillRect(0, 0, 64, 128);
    const across = ctx.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(0,0,0,0)');
    across.addColorStop(0.08, 'rgba(0,0,0,1)');
    across.addColorStop(0.92, 'rgba(0,0,0,1)');
    across.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = across;
    ctx.fillRect(0, 0, 64, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const shadowMats = [];

  const shelfMat = new THREE.MeshStandardMaterial({
    color: readShelfColor(),
    roughness: 0.55,
    metalness: 0,
    transparent: true
  });
  const shelfGroup = new THREE.Group();
  scene.add(shelfGroup);

  function readShelfColor() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--shelf-board').trim();
    return value || '#ffffff';
  }

  // 主题切换时同步层板颜色
  new MutationObserver(() => {
    shelfMat.color.set(readShelfColor());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // canvas 画出来的字形取决于字体是否已就绪，所以等文楷加载完再生成封面纹理
  if (document.fonts && document.fonts.load) {
    try {
      await document.fonts.load('400 24px "LXGW WenKai"');
      await document.fonts.load('500 24px "LXGW WenKai"');
    } catch (err) {
      /* 字体没加载成功就用兜底字形，不影响功能 */
    }
  }

  const geometry = new THREE.BoxGeometry(W, H, THICK);
  geometry.translate(0, H / 2, 0); // 旋转轴挪到底边

  const books = [];
  const meshes = [];
  const bookByMesh = new Map();

  entries.forEach((entry) => {
    const sharpCanvas = drawCover(entry);
    const sharp = toTexture(sharpCanvas);
    const blur = toTexture(drawBlurred(sharpCanvas));
    const spine = toTexture(drawCover(entry, true));

    const front = new THREE.MeshStandardMaterial({ map: sharp, roughness: 0.86, metalness: 0, transparent: true });
    const side = new THREE.MeshStandardMaterial({ color: 0xf1e9da, roughness: 0.92, metalness: 0, transparent: true });
    const back = new THREE.MeshStandardMaterial({ color: new THREE.Color(TONES[entry.tone] || TONES.clay).multiplyScalar(0.55), roughness: 0.95, metalness: 0, transparent: true });

    const mesh = new THREE.Mesh(geometry, [side, side, side, side, front, back]);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    const book = {
      entry,
      group,
      mesh,
      front,
      side,
      back,
      sharp,
      blur,
      spine,
      base: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
      cur: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1 },
      dimmed: false,
      intro: 0,
      delay: 0
    };
    books.push(book);
    meshes.push(mesh);
    bookByMesh.set(mesh, book);
  });

  /* ---------- 状态 ---------- */
  let stacked = false;
  let state = 'idle'; // idle | hover | focus
  let hovered = null;
  let focused = null;
  let focusGoal = null;
  let shelfOpacity = 1;
  let startTime = performance.now();

  function setOpacity(book, value) {
    book.front.opacity = value;
    book.side.opacity = value;
    book.back.opacity = value;
  }

  // 堆叠布局里，只有顶部露出一条的用书脊排版；完整露出的最后一本和被放大的那本用整幅封面；虚化的用模糊版
  function refreshMap(book) {
    const last = books[books.length - 1];
    const map = book.dimmed ? book.blur : stacked && book !== focused && book !== last ? book.spine : book.sharp;
    if (book.front.map !== map) {
      book.front.map = map;
      book.front.needsUpdate = true;
    }
  }

  function setDimmed(book, value) {
    book.dimmed = value;
    book.mesh.castShadow = !value;
    refreshMap(book);
  }

  function targetFor(book) {
    const b = book.base;
    if (state === 'focus') {
      if (book === focused) {
        return { ...focusGoal, o: 1 };
      }
      return { x: b.x, y: b.y, z: b.z, rx: b.rx, ry: b.ry, rz: b.rz, s: 1, o: stacked ? 0.04 : 0.36 };
    }
    if (state === 'hover' && hovered) {
      if (stacked) {
        // 堆叠布局：被悬停的那本和它上面的书一起抬起。上面的书相对位置不变，序号不会被盖住；
        // 下面的书不动，于是它被「抽出来」一截。舞台顶部已为这次抬起预留了 LIFT，不会被裁。
        const lift = book.entry.index <= hovered.entry.index ? LIFT : 0;
        return { x: b.x, y: b.y + lift, z: b.z, rx: b.rx, ry: b.ry, rz: b.rz, s: 1, o: 1 };
      }
      if (book === hovered) {
        // 底边留在层板上、以底边为轴放大，像被向上抽出来一截；
        // 保留原有的倾角，否则同一排里会出现一本正对、其余向后靠
        return { x: b.x, y: b.y, z: b.z + 0.04, rx: b.rx, ry: b.ry, rz: b.rz, s: 1.16, o: 1 };
      }
    }
    return { x: b.x, y: b.y, z: b.z, rx: b.rx, ry: b.ry, rz: b.rz, s: 1, o: 1 };
  }

  /* ---------- 布局 ---------- */
  function layout() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) {
      return;
    }
    stacked = narrow.matches;

    // 依据视口宽高比决定每排几本：宽屏 2 排，窄屏纵向堆叠
    const count = books.length;
    let boundsW;
    let boundsH;
    let boundsCy;

    while (shelfGroup.children.length) {
      shelfGroup.remove(shelfGroup.children[0]);
    }
    shadowMats.length = 0;

    function addShelf(length, y) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, SHELF_H, 0.62), shelfMat);
      mesh.position.set(0, y - SHELF_H / 2, 0);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      shelfGroup.add(mesh);

      const mat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
      shadowMats.push(mat);
      const shade = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.95), mat);
      shade.position.set(0, y - SHELF_H - 0.475, -0.33);
      shade.renderOrder = -1;
      shelfGroup.add(shade);
    }

    if (stacked) {
      const step = STACK_STEP;
      books.forEach((book, i) => {
        book.base = { x: 0, y: -i * step, z: i * 0.07, rx: -0.03, ry: 0, rz: 0 };
        book.delay = i * 60;
      });
      const bottom = -(count - 1) * step;
      addShelf(W + 0.16, bottom);
      boundsW = W + 0.16;
      boundsH = (count - 1) * step + H + SHELF_H + LIFT;
      boundsCy = (H + LIFT - ((count - 1) * step + SHELF_H)) / 2;
    } else {
      const rows = Math.max(1, Math.ceil(count / 5));
      const cols = Math.ceil(count / rows);
      const gap = 0.09;
      const rowGap = 0.42;
      const rowW = cols * W + (cols - 1) * gap;
      const level = H + rowGap + SHELF_H;

      books.forEach((book, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const rowBottom = -row * level;
        const lastRowCount = count - row * cols;
        const rowCount = Math.min(cols, lastRowCount);
        // 最后一排不足时居中摆放
        const rowOffset = ((cols - rowCount) * (W + gap)) / 2;
        book.base = {
          x: -rowW / 2 + W / 2 + col * (W + gap) + rowOffset,
          y: rowBottom,
          z: 0,
          rx: TILT_X[i % TILT_X.length],
          ry: 0,
          rz: TILT_Z[i % TILT_Z.length]
        };
        book.delay = i * 75;
      });
      for (let r = 0; r < rows; r += 1) {
        addShelf(rowW + 0.6, -r * level);
      }
      boundsW = rowW + 0.6;
      boundsH = (rows - 1) * level + H + SHELF_H + 0.3;
      boundsCy = (H + 0.3 - ((rows - 1) * level + SHELF_H)) / 2;
    }

    // 把相机推到刚好装下整个书架的位置
    const half = Math.tan((FOV * Math.PI) / 360);
    const aspect = width / height;
    const distance = Math.max(boundsH / 2 / half, boundsW / 2 / (half * aspect)) * (stacked ? 1.05 : 1.07);
    // 相机完全平视：只要带一点俯视角，画面两侧的竖边就会向中间收，
    // 离中心越远越明显（最左那本看着是歪的）。代价是看不到层板顶面，层板靠自身厚度和投影来表现。
    const tilt = 0;
    camera.aspect = aspect;
    camera.position.set(0, boundsCy + distance * Math.sin(tilt), distance * Math.cos(tilt));
    camera.lookAt(0, boundsCy, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    renderer.setSize(width, height, false);

    books.forEach(refreshMap);
    if (focused) {
      focusGoal = computeFocusGoal();
    }
  }

  // 把选中的杂志放到镜头正前方：桌面偏右（左边留给标题），窄屏居中偏下
  function computeFocusGoal() {
    // 堆叠模式下其余杂志沿深度方向排在前面，放大的这本必须比它们都更靠近镜头，
    // 否则半透明的杂志会绘制在它上面，把它盖灰
    const maxZ = Math.max(...books.filter((book) => book !== focused).map((book) => book.base.z));
    const d = Math.min(4.2, camera.position.z - (maxZ + 0.6));
    const visH = 2 * d * Math.tan((FOV * Math.PI) / 360);
    const visW = visH * camera.aspect;
    let scale;
    let cx;
    let cy;
    if (stacked) {
      scale = Math.min((visW * 0.86) / W, (visH * 0.5) / H);
      cx = 0;
      cy = -visH * 0.07;
    } else {
      scale = Math.min((visH * 0.64) / H, (visW * 0.4) / W);
      cx = visW * 0.08;
      cy = 0;
    }
    const center = camera.localToWorld(new THREE.Vector3(cx, cy, -d));
    // 桌面略微后仰并侧转，看得出是一本有厚度的册子；
    // 窄屏画面小，同样的侧转会让顶边明显倾斜，所以几乎正对
    const tiltX = stacked ? -0.06 : -0.12;
    const tiltY = stacked ? 0 : -0.06;
    return { x: center.x, y: center.y - (H * scale) / 2, z: center.z, rx: tiltX, ry: tiltY, rz: 0, s: scale };
  }

  /* ---------- 交互 ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    return hits.length ? bookByMesh.get(hits[0].object) : null;
  }

  function syncStageClass() {
    stage.classList.toggle('is-hover', state === 'hover');
    stage.classList.toggle('is-focus', state === 'focus');
  }

  function focusOn(book) {
    focused = book;
    glow(hovered, 0);
    hovered = null;
    state = 'focus';
    focusGoal = computeFocusGoal();
    books.forEach((other) => setDimmed(other, other !== book));
    books.forEach(refreshMap);
    focusName.textContent = book.entry.name;
    const e = book.entry;
    focusDesc.textContent = e.sample.join('、') + (e.count > e.sample.length ? ' 等 ' + e.count + ' 个站点' : ' · 共 ' + e.count + ' 个站点');
    syncStageClass();
  }

  function exitFocus(scrollToList) {
    if (state !== 'focus') {
      return;
    }
    const id = focused ? focused.entry.id : null;
    state = 'idle';
    focused = null;
    hovered = null;
    books.forEach((book) => setDimmed(book, false));
    books.forEach(refreshMap);
    syncStageClass();
    if (scrollToList && id) {
      api.selectGroup(id);
      window.setTimeout(() => {
        const target = document.getElementById('groups');
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }, 180);
    }
  }

  function glow(book, value) {
    if (book) {
      book.front.emissive.setScalar(value);
    }
  }

  function setHovered(book) {
    if (state === 'focus') {
      return;
    }
    if (hovered && hovered !== book) {
      glow(hovered, 0);
    }
    if (book && stacked) {
      glow(book, 0.09);
    }
    hovered = book;
    state = book ? 'hover' : 'idle';
    syncStageClass();
  }

  let down = null;
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    setHovered(pick(event.clientX, event.clientY));
  });
  canvas.addEventListener('pointerleave', () => setHovered(null));
  canvas.addEventListener('pointerdown', (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!down) {
      return;
    }
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved > 10) {
      return;
    }
    // 悬停中的杂志是抬起过的，点击可能落在它让出的空隙里，此时按悬停的那本算
    const book = pick(event.clientX, event.clientY) || (state === 'hover' ? hovered : null);
    if (state === 'focus') {
      if (book && book !== focused) {
        focusOn(book);
      } else if (!book || book === focused) {
        exitFocus(false);
      }
      return;
    }
    if (book) {
      focusOn(book);
    }
  });
  canvas.addEventListener('pointercancel', () => {
    down = null;
  });

  openBtn.addEventListener('click', () => {
    if (hovered) {
      focusOn(hovered);
    }
  });
  enterBtn.addEventListener('click', () => exitFocus(true));
  closeBtn.addEventListener('click', () => exitFocus(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      exitFocus(false);
    }
  });

  /* ---------- 每帧 ---------- */
  const tmp = new THREE.Vector3();

  function project(x, y, z) {
    tmp.set(x, y, z).project(camera);
    return {
      x: ((tmp.x + 1) / 2) * stage.clientWidth,
      y: ((1 - tmp.y) / 2) * stage.clientHeight
    };
  }

  function updateOverlay() {
    if (state === 'hover' && hovered) {
      const cur = hovered.cur;
      const lift = stacked ? 1 - STACK_STEP - LIFT / 2 : 0.17;
      const p = project(cur.x, cur.y + lift * cur.s, cur.z);
      openBtn.style.left = p.x + 'px';
      openBtn.style.top = p.y - 14 + 'px';
    } else if (state === 'focus' && focused) {
      const p = project(focused.cur.x, focused.cur.y, focused.cur.z);
      enterBtn.style.left = p.x + 'px';
      enterBtn.style.top = p.y + 18 + 'px';
    }
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const smooth = reduceMotion ? 1 : 1 - Math.exp(-dt * 11);

    books.forEach((book) => {
      const g = book.group;
      const c = book.cur;

      // 入场：从下方带更大的倾角落到位
      if (book.intro < 1) {
        const t = reduceMotion ? 1 : Math.min(Math.max((now - startTime - book.delay) / 720, 0), 1);
        book.intro = easeOut(t);
        const k = 1 - book.intro;
        const b = book.base;
        c.x = b.x;
        c.y = b.y - 0.9 * k;
        c.z = b.z + 0.4 * k;
        c.rx = b.rx * (3.2 * k + book.intro);
        c.rz = b.rz * (2.5 * k + book.intro);
        c.s = 1;
        c.o = Math.max(book.intro, 0.001);
        setOpacity(book, c.o);
      } else {
        const target = targetFor(book);
        c.x += (target.x - c.x) * smooth;
        c.y += (target.y - c.y) * smooth;
        c.z += (target.z - c.z) * smooth;
        c.rx += (target.rx - c.rx) * smooth;
        c.ry += (target.ry - c.ry) * smooth;
        c.rz += (target.rz - c.rz) * smooth;
        c.s += (target.s - c.s) * smooth;
        c.o += (target.o - c.o) * smooth;
        setOpacity(book, c.o);
      }

      g.position.set(c.x, c.y, c.z);
      g.rotation.set(c.rx, c.ry, c.rz);
      g.scale.setScalar(c.s);
    });

    const shelfTarget = state === 'focus' ? (stacked ? 0.1 : 0.4) : 1;
    shelfOpacity += (shelfTarget - shelfOpacity) * smooth;
    shelfMat.opacity = shelfOpacity;
    shadowMats.forEach((mat) => { mat.opacity = 0.62 * shelfOpacity; });

    updateOverlay();
    renderer.render(scene, camera);
    window.requestAnimationFrame(frame);
  }

  /* ---------- 尺寸变化 ---------- */
  let lastSize = '';
  function onResize() {
    const size = stage.clientWidth + 'x' + stage.clientHeight + (narrow.matches ? 's' : 'w');
    if (size === lastSize) {
      return;
    }
    lastSize = size;
    layout();
  }
  new ResizeObserver(onResize).observe(stage);
  if (narrow.addEventListener) {
    narrow.addEventListener('change', onResize);
  } else if (narrow.addListener) {
    narrow.addListener(onResize);
  }

  /* ---------- 启动 ---------- */
  stage.hidden = false;
  document.body.classList.add('has-shelf3d');
  onResize();
  if (!lastSize) {
    return; // 舞台没有尺寸，保持 CSS 书架
  }
  startTime = performance.now();
  last = startTime;
  window.requestAnimationFrame((now) => {
    stage.classList.add('is-on');
    frame(now);
  });
}
