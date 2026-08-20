// ==UserScript==
// @name         BC LianChat
// @namespace    https://www.bondageprojects.com/
// @version      0.1.1
// @description  LianChat
// @author       XinLian
// @match https://*.bondageprojects.elementfx.com/R*/*
// @match https://*.bondage-europe.com/R*/*
// @match https://*.bondageprojects.com/R*/*
// @match https://*.bondage-asia.com/Club/R*
// @match https://*.bondage-asia.com/club/R*
// @connect      github.com
// @license      MIT
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';
	console.log("[LianChat] Start Load");
    // [UI-CUSTOM] dev 覆盖：localStorage.LC_DEV_SOURCE 可指向私有分发源（必须 https，如 GitHub Pages fork 或本地 https dev server）。
    // 示例（在 BC 页面 console 执行）：localStorage.setItem('LC_DEV_SOURCE', 'https://<你的仓库>.github.io/BCMod/Source/BC_LianChat.js')
    // 清除覆盖：localStorage.removeItem('LC_DEV_SOURCE')
    let devSource = null;
    try { devSource = window.localStorage.getItem('LC_DEV_SOURCE'); }
    catch (e) { console.warn('[LianChat] localStorage 不可用，使用默认源', e); }
    const script = document.createElement("script");
    const timestamp = new Date().getTime(); // 创建当前时间的时间戳
    script.src = (devSource && devSource.trim())
        ? devSource
        : `https://xinlian132243.github.io/BCMod/Source/BC_LianChat.js?timestamp=${timestamp}`;
    document.head.appendChild(script);

})();

