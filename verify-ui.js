// 实机验证：FAB 四边吸附 + 暗色对比度。全部可逆（拖拽后归位、主题测完切回 light）。
const puppeteer = require('/Users/amoy_johnny/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core');
const http = require('http');

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
  });
}

(async () => {
  const ver = await getJSON('http://localhost:9222/json/version');
  const browser = await puppeteer.connect({ browserWSEndpoint: ver.webSocketDebuggerUrl, defaultViewport: null });
  const pages = await browser.pages();
  let target = null;
  for (const p of pages) {
    const u = p.url();
    if (u.includes('bondage-asia.com/club/R131') && !u.includes('Scripts/')) {
      const has = await p.evaluate(() => !!document.getElementById('floatingMessageButton') && !!window.__LC_FAB_SNAP__).catch(() => false);
      if (has) { target = p; break; }
    }
  }
  if (!target) { console.log('NO_TARGET'); await browser.disconnect(); return; }
  console.log('TARGET:', target.url());

  // 1) wireFabSnap 激活标志
  const snapFlag = await target.evaluate(() => window.__LC_FAB_SNAP__ === true);
  console.log('wireFabSnap active:', snapFlag);

  // 2) 当前 FAB 定位（初始）
  const before = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const cs = getComputedStyle(f);
    return { left: cs.left, top: cs.top, right: cs.right, bottom: cs.bottom, w: f.offsetWidth, h: f.offsetHeight };
  });
  console.log('FAB before:', JSON.stringify(before));

  // 3) 拖拽到顶部中间，验证吸附到 top 边
  const box = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, iw: window.innerWidth, ih: window.innerHeight };
  });
  const tx = Math.round(box.iw / 2), ty = 24;
  await target.mouse.move(box.x, box.y);
  await target.mouse.down();
  await target.mouse.move((box.x + tx) / 2, (box.y + ty) / 2, { steps: 5 });
  await target.mouse.move(tx, ty, { steps: 5 });
  await target.mouse.up();
  await new Promise(r => setTimeout(r, 450));

  const afterTop = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const cs = getComputedStyle(f);
    let ls = null; try { ls = localStorage.getItem('floatingMessageButtonPositionSnap'); } catch (e) {}
    return { left: cs.left, top: cs.top, right: cs.right, bottom: cs.bottom, ls };
  });
  console.log('FAB after TOP-drag:', JSON.stringify(afterTop));

  // 4) 拖拽到左边，验证吸附 left 边
  const box2 = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await target.mouse.move(box2.x, box2.y);
  await target.mouse.down();
  await target.mouse.move(24, Math.round(box2.y), { steps: 8 });
  await target.mouse.up();
  await new Promise(r => setTimeout(r, 450));
  const afterLeft = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const cs = getComputedStyle(f);
    return { left: cs.left, top: cs.top, right: cs.right, bottom: cs.bottom };
  });
  console.log('FAB after LEFT-drag:', JSON.stringify(afterLeft));

  // 5) 归位到底部右侧（保持整洁）
  const box3 = await target.evaluate(() => {
    const f = document.getElementById('floatingMessageButton');
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, iw: window.innerWidth, ih: window.innerHeight };
  });
  await target.mouse.move(box3.x, box3.y);
  await target.mouse.down();
  await target.mouse.move(box3.iw - 60, box3.ih - 60, { steps: 10 });
  await target.mouse.up();
  await new Promise(r => setTimeout(r, 450));

  // 6) 暗色模式对比度验证（切 dark → 读色 → 切回 light）
  const dark = await target.evaluate(() => {
    const html = document.documentElement;
    html.setAttribute('data-lc-theme', 'dark');
    html.setAttribute('data-lc-theme-pref', 'dark');
    const add = document.querySelector('.lc-add-sender');
    const convSpan = document.querySelector('.lc-conv-list [id^="character-info-panel-"] span');
    const head = document.querySelector('.lc-panel-head > div:first-child > div');
    const read = (el) => { if (!el) return null; const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color }; };
    return { addSender: read(add), convText: read(convSpan), headTitle: read(head) };
  });
  console.log('DARK addSender:', JSON.stringify(dark.addSender));
  console.log('DARK convText :', JSON.stringify(dark.convText));
  console.log('DARK headTitle:', JSON.stringify(dark.headTitle));
  // 还原
  await target.evaluate(() => {
    const html = document.documentElement;
    html.setAttribute('data-lc-theme', 'light');
    html.setAttribute('data-lc-theme-pref', 'light');
  });

  await browser.disconnect();
  console.log('DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
