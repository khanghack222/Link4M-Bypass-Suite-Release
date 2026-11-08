// ==UserScript==
// @name         Zitnits Link4M Auto-Bypass Loader
// @namespace    https://github.com/khanghack222/Link4M-Bypass-Suite-Release
// @version      3.5.0
// @description  Tự động hóa toàn diện Link4M: Tự lấy mã trang tài trợ ngầm, tự điền mã, tự nộp link ngay khi giải captcha xong.
// @author       Zitnits / KhangHack
// @match        *://*.link4m.net/*
// @match        *://*.link4m.co/*
// @match        *://*.link4m.app/*
// @match        *://*.link1s.com/*
// @match        *://*.link1s.net/*
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
// @updateURL    https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
// ==/UserScript==

(function () {
  'use strict';

  const hostname = window.location.hostname;
  const isLink4m = hostname.includes('link4m.') || hostname.includes('link1s.');

  /* =========================================================================
   * 1. MODULE DÀNH CHO TRANG LINK4M
   * ========================================================================= */
  if (isLink4m) {
    console.log('%c[Zitnits Link4M Loader] Active on Link4M Gateway', 'color: #00f0ff; font-weight: bold;');

    // 1.1 CSS HUD Cyberpunk
    const hudStyle = document.createElement('style');
    hudStyle.textContent = `
      #zitnits-hud-container {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: 310px;
        background: rgba(10, 14, 23, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid #00f0ff;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        color: #e0f4ff;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        line-height: 1.4;
        padding: 12px;
        user-select: none;
      }
      .zitnits-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0, 240, 255, 0.25);
        padding-bottom: 6px;
        margin-bottom: 8px;
      }
      .zitnits-hdr b { color: #00f0ff; font-size: 13px; }
      .zitnits-tag { background: #00f0ff; color: #000; font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 3px; }
      .zitnits-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
      .zitnits-code { font-family: monospace; font-size: 14px; font-weight: bold; color: #00ffaa; background: rgba(0,255,170,0.1); padding: 2px 6px; border-radius: 4px; }
      .zitnits-status { font-size: 12px; color: #ffaa00; margin-top: 4px; display: flex; align-items: center; gap: 6px; }
      .zitnits-dot { width: 7px; height: 7px; border-radius: 50%; background: #ffaa00; box-shadow: 0 0 6px #ffaa00; }
      .zitnits-dot.ready { background: #00ffaa; box-shadow: 0 0 6px #00ffaa; }
      .modal-backdrop, .modal.fade.show { display: none !important; opacity: 0 !important; }
    `;
    (document.head || document.documentElement).appendChild(hudStyle);

    let hudStatusEl = null;
    let hudCodeEl = null;
    let hudDotEl = null;
    let isSubmitted = false;

    function renderHUD() {
      if (document.getElementById('zitnits-hud-container')) return;
      const hud = document.createElement('div');
      hud.id = 'zitnits-hud-container';
      hud.innerHTML = `
        <div class="zitnits-hdr">
          <b>⚡ Zitnits Link4M Loader</b>
          <span class="zitnits-tag">v3.5.0</span>
        </div>
        <div class="zitnits-row">
          <span style="opacity:0.8;">Mã nhiệm vụ:</span>
          <span class="zitnits-code" id="zitnits-hud-code">Chờ mã...</span>
        </div>
        <div class="zitnits-status">
          <div class="zitnits-dot" id="zitnits-hud-dot"></div>
          <span id="zitnits-hud-status">Đang tìm ô nhập mật khẩu...</span>
        </div>
        <div style="font-size:11px; opacity:0.65; margin-top:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px; text-align:center;">
          Bạn chỉ cần tick Captcha — Mọi thứ còn lại tự động!
        </div>
      `;
      document.body.appendChild(hud);
      hudStatusEl = document.getElementById('zitnits-hud-status');
      hudCodeEl = document.getElementById('zitnits-hud-code');
      hudDotEl = document.getElementById('zitnits-hud-dot');
    }

    function updateHUD(text, code, isReady) {
      if (hudStatusEl) hudStatusEl.textContent = text;
      if (hudCodeEl && code) hudCodeEl.textContent = code;
      if (hudDotEl && isReady) {
        hudDotEl.classList.add('ready');
      }
    }

    // 1.2 Điền mã vào input
    function fillCode(code) {
      if (!code) return false;
      const inputs = document.querySelectorAll('input#password-2, input#password, input[name="password"], input[type="password"]');
      let filled = false;
      for (const inp of inputs) {
        if (inp.value !== code) {
          inp.value = code;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          filled = true;
        }
      }
      if (filled) {
        updateHUD('Đã nạp mã [' + code + ']. Chờ giải Captcha...', code, true);
      }
      return filled;
    }

    // Lắng nghe thay đổi mã đa tab qua GM_storage
    try {
      if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('last_sponsor_code', (name, oldVal, newVal) => {
          if (newVal) fillCode(newVal);
        });
      }
    } catch (e) {}

    // 1.3 Nhận diện Captcha hoàn thành & Auto-submit
    function checkCaptchaAndSubmit() {
      if (isSubmitted) return;

      const recaptchas = document.querySelectorAll('[name="g-recaptcha-response"]');
      let solved = false;
      for (const el of recaptchas) {
        if (el.value && el.value.trim().length > 20) {
          solved = true;
          break;
        }
      }

      const cfTokens = document.querySelectorAll('[name="cf-turnstile-response"]');
      for (const el of cfTokens) {
        if (el.value && el.value.trim().length > 20) {
          solved = true;
          break;
        }
      }

      const anchor = document.querySelector('#recaptcha-anchor');
      if (anchor && anchor.getAttribute('aria-checked') === 'true') {
        solved = true;
      }

      if (solved) {
        isSubmitted = true;
        updateHUD('Captcha hoàn tất! Đang mở khóa link đích...', null, true);

        // Kích hoạt checkPassword
        try {
          if (typeof unsafeWindow.checkPassword === 'function') {
            unsafeWindow.checkPassword();
          }
        } catch (e) {}

        // Bấm nút tiếp tục
        const btns = document.querySelectorAll('button.get-link, a.get-link, button#submit-form, #btn-main');
        for (const b of btns) {
          if (b.offsetParent !== null) {
            b.click();
          }
        }

        // Bắt link đích khi .get-link được update href
        let tries = 0;
        const pollTarget = setInterval(() => {
          tries++;
          const link = document.querySelector('.get-link, a[href*="http"]');
          if (link) {
            const href = link.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:') && href.startsWith('http')) {
              clearInterval(pollTarget);
              updateHUD('Đã mở khóa! Đang chuyển hướng...', null, true);
              setTimeout(() => { window.location.href = href; }, 600);
              return;
            }
            try { link.click(); } catch (e) {}
          }
          if (tries > 25) clearInterval(pollTarget);
        }, 500);
      }
    }

    // Chu kỳ lặp trên Link4M
    setInterval(() => {
      // Dọn dẹp backdrop che màn hình
      const overlays = document.querySelectorAll('.modal-backdrop');
      for (const ov of overlays) ov.remove();
      document.body.style.overflow = 'auto';

      renderHUD();

      // Kiểm tra mã trong GM storage
      try {
        const stored = GM_getValue('last_sponsor_code', '');
        if (stored) fillCode(stored);
      } catch (e) {}

      checkCaptchaAndSubmit();
    }, 400);

    return;
  }

  /* =========================================================================
   * 2. MODULE DÀNH CHO TRANG TÀI TRỢ / ADVERTISER SITES (What-On, v.v.)
   * ========================================================================= */
  console.log('[Zitnits Sponsor Loader] Monitoring advertiser quest...');

  // 2.1 Bypass Incognito & Quota probe
  try {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate = async () => ({ quota: 120 * 1024 * 1024 * 1024, usage: 50 * 1024 * 1024 });
    }
    if (navigator.webkitTemporaryStorage && navigator.webkitTemporaryStorage.queryUsageAndQuota) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota = (cb) => {
        if (typeof cb === 'function') cb(50 * 1024 * 1024, 120 * 1024 * 1024 * 1024);
      };
    }
  } catch (e) {}

  // 2.2 Chống đóng băng timer khi chuyển tab
  try {
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  } catch (e) {}

  setInterval(() => {
    try {
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('scroll'));
    } catch (e) {}
  }, 2000);

  let captured = false;

  function onCodeFound(code) {
    if (captured || !code) return;
    const clean = code.trim();
    if (!/^[A-Za-z0-9]{4,10}$/.test(clean)) return;

    captured = true;
    console.log('%c[Zitnits Sponsor Loader] CODE CAPTURED: ' + clean, 'color: #00ffaa; font-weight: bold; font-size: 14px;');

    try { GM_setValue('last_sponsor_code', clean); } catch (e) {}
    try { GM_setClipboard(clean); } catch (e) {}

    // Hiển thị toast thông báo
    const toast = document.createElement('div');
    toast.innerHTML = `⚡ <b>Zitnits:</b> Đã lấy mã <b>[${clean}]</b> & tự nạp cho Link4M!`;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
      background: '#0a0f18', color: '#00ffaa', border: '1px solid #00ffaa',
      padding: '10px 16px', borderRadius: '6px', fontFamily: 'sans-serif',
      boxShadow: '0 0 15px rgba(0,255,170,0.5)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
  }

  // Quét DOM tìm nút bấm và mã
  function scanSponsorDOM() {
    if (captured) return;

    // Quét mã
    const codeSelectors = ['.whatoncode', '#whatoncode', '.traffic-code', '#traffic-code', '[id*="traffic_code"]', '.layma_code', '#layma_code'];
    for (const sel of codeSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const txt = el.innerText || el.textContent;
        const m = txt && txt.match(/([A-Za-z0-9]{5,10})/);
        if (m && !/giay|second|cho|load|wait/i.test(m[1])) {
          onCodeFound(m[1]);
          return;
        }
      }
    }

    // Tự động click nút "LẤY MÃ"
    const buttons = document.querySelectorAll('button, a, div[onclick]');
    for (const b of buttons) {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      if ((txt.includes('lấy mã') || txt.includes('lay ma') || txt.includes('get code')) && !b.__zit_clicked) {
        b.__zit_clicked = true;
        try { b.click(); } catch (e) {}
      }
    }
  }

  setInterval(scanSponsorDOM, 800);
})();
