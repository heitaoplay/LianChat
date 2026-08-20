/* LianChat UI 热注入补丁（累积注入器）
 * 用法：node lc-hot-inject.js
 * 原理：从 Source/BC_LianChat.js 提取所有 [UI-CUSTOM] STEPn-BEGIN/END 自包含块（按 n 升序排序）
 *       → 拼成一个 IIFE → 注入 bondage 标签页。单一事实源 = 插件源码本身，避免补丁与源码漂移。
 * 幂等：注入前先执行已注册清理（window.__LC_UI_CLEANUP__）+ 兜底删除已知顶层元素
 *       （#lc-ui-style / #lc-theme-host），再重建。保证重复运行无元素/监听器累积。
 * 铁律：不 reload、不 navigate、只注入视觉/交互补丁、锁定 bondage 标签。
 * 依赖：puppeteer-core（工作区 node_modules，NODE_PATH 指定）。
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'Source', 'BC_LianChat.js');
const source = fs.readFileSync(SRC, 'utf8');

// 提取全部 STEPn 块：非贪婪 + 反向引用保证 BEGIN(n)…END(n) 配对（块间不嵌套）
const re = /\/\/ \[UI-CUSTOM\] STEP(\d+)-BEGIN([\s\S]*?)\/\/ \[UI-CUSTOM\] STEP\1-END/g;
const blocks = [];
let m;
while ((m = re.exec(source))) {
  blocks.push({ n: parseInt(m[1], 10), text: m[0] });
}
if (!blocks.length) {
  console.error('❌ 源码中未找到任何 [UI-CUSTOM] STEPn-BEGIN/END 块');
  process.exit(4);
}
blocks.sort((a, b) => a.n - b.n);
const combined = blocks.map(b => b.text).join('\n\n');
const patch = '(function () {\n  \'use strict\';\n' + combined + '\n})();';

console.log('提取到 STEP 块（按序）：' + blocks.map(b => b.n).join(' → '));

// 注入前清理：运行各 STEP 已注册的清理函数 + 兜底删已知顶层元素
const TEARDOWN = [
  '(function(){',
  '  try { if (window.__LC_UI_CLEANUP__) {',
  '    window.__LC_UI_CLEANUP__.forEach(function(fn){ try{ fn(); }catch(e){} });',
  '    window.__LC_UI_CLEANUP__ = [];',
  '  } } catch(e){}',
  '  var s = document.getElementById("lc-ui-style"); if (s) s.remove();',
  '  var h = document.getElementById("lc-theme-host"); if (h) h.remove();',
  '})();'
].join('\n');

(async () => {
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null,   // 不改用户窗口尺寸
      protocolTimeout: 60000
    });
  } catch (e) {
    console.error('❌ 连接 9222 失败：' + e.message + '\n   请确认 Chrome 已用 --remote-debugging-port=9222 启动');
    process.exit(2);
  }

  const targets = browser.targets().filter(t => t.type() === 'page');
  const bc = targets.find(t => /bondage/i.test(t.url()));
  if (!bc) {
    console.error('❌ 未找到 bondage 标签页');
    await browser.disconnect();
    process.exit(3);
  }

  const page = await bc.page();
  page.on('console', msg => {
    const t = msg.text();
    if (/LianChat-UI|UI-CUSTOM/.test(t)) console.log('[page]', t);
  });

  // 1) 幂等清理（断开旧监听器 / 删除旧元素）
  await page.evaluate(TEARDOWN);
  // 2) 注入合并补丁
  await page.evaluate(patch);

  const ok = await page.evaluate(() => ({
    style: !!document.getElementById('lc-ui-style'),
    host: !!document.getElementById('lc-theme-host'),
    theme: document.documentElement.getAttribute('data-lc-theme'),
    pref: document.documentElement.getAttribute('data-lc-theme-pref'),
    cleanup: Array.isArray(window.__LC_UI_CLEANUP__) ? window.__LC_UI_CLEANUP__.length : -1,
    cssRules: (function () {
      var s = document.getElementById('lc-ui-style');
      return s && s.sheet ? s.sheet.cssRules.length : 0;
    })()
  }));

  console.log('目标页：' + bc.url());
  console.log('注入结果：' + JSON.stringify(ok));
  console.log(ok.style && ok.host
    ? '✅ 累积补丁已注入（STEP ' + blocks.map(b => b.n).join('+') + '；cssRules=' + ok.cssRules + '）'
    : '❌ 注入失败（关键元素缺失）');

  await browser.disconnect();
})().catch(e => { console.error('错误:', e.message); process.exit(1); });
