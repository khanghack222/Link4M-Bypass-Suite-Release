// ==UserScript==
// @name         Web Flow Navigator Pro
// @namespace    https://github.com/khanghack222/Link4M-Bypass-Suite-Release
// @version      3.3.0
// @description  Optimizes web page navigation, article transition, and streamlines user workflow.
// @author       Khang
// @match        *://*.link4m.org/*
// @match        *://link4m.org/*
// @match        *://*.link4m.net/*
// @match        *://link4m.net/*
// @match        *://*.link4m.co/*
// @match        *://link4m.co/*
// @match        *://*.link4m.app/*
// @match        *://link4m.app/*
// @match        *://*/*
// @exclude      *://*.google.com/*
// @exclude      *://*.youtube.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        window.close
// @updateURL    https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
// @downloadURL  https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
// @run-at       document_start
// ==/UserScript==

(function () {
    'use strict';

    const IS_L4M = /(?:link4m\.(?:org|net|co|app))/i.test(window.location.hostname);

    const KNOWN_CAMPAIGNS = {
        "789club": "khovatlieunoithatdanang.com",
        "van phu pham da nang": "khovatlieunoithatdanang.com",
        "văn phòng phẩm đà nẵng": "khovatlieunoithatdanang.com",
        "h19": "memberqq.me",
        "luck8": "ayoslots.co",
        "keonhacai": "recsport.tv",
        "keo nha cai": "recsport.tv",
        "kèo nhà cái": "recsport.tv",
        "nohu": "aviator-slot.games",
        "nohu90": "aviator-slot.games",
        "ex88": "ex8898.com",
        "ao88": "d55slot.vip",
        "nh88": "preciouscollection.co.in",
        "mm88": "preciouscollection.co.in",
        "uy88": "santuy88slot.net",
        "hitclub": "hitclube.cc",
        "agobet": "agobet.cc"
    };

    /* ══════════════════════════════════════════════════════════
       1. SPONSOR DOMAIN AUTOMATION (What-on / Gtraffic / Layma)
       ══════════════════════════════════════════════════════════ */
    if (!IS_L4M) {
        // Prevent background tab freezing
        const origAdd = window.addEventListener;
        window.addEventListener = function (type, listener, options) {
            if (['visibilitychange', 'webkitvisibilitychange', 'blur'].includes(type)) return;
            return origAdd.call(this, type, listener, options);
        };
        document.addEventListener = function (type, listener, options) {
            if (['visibilitychange', 'webkitvisibilitychange', 'blur'].includes(type)) return;
            return origAdd.call(this, type, listener, options);
        };
        try {
            Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
            Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true });
        } catch (e) {}

        // Accelerate timers (10x faster)
        const origST = window.setTimeout;
        const origSI = window.setInterval;
        window.setTimeout = function (fn, delay, ...args) {
            return origST.call(this, fn, Math.max(2, Math.floor(delay * 0.1)), ...args);
        };
        window.setInterval = function (fn, delay, ...args) {
            return origSI.call(this, fn, Math.max(2, Math.floor(delay * 0.1)), ...args);
        };

        function showSponsorHUD() {
            if (document.getElementById('l4m-sp-hud')) return;
            const hud = document.createElement('div');
            hud.id = 'l4m-sp-hud';
            hud.innerHTML = `
                <div style="position:fixed;bottom:20px;right:20px;z-index:2147483647;background:rgba(15,23,42,0.95);border:2px solid #00f0ff;border-radius:10px;padding:12px 18px;color:#fff;font-family:sans-serif;box-shadow:0 0 20px rgba(0,240,255,0.4);display:flex;align-items:center;gap:12px;">
                    <div style="width:14px;height:14px;border:3px solid #00f0ff;border-top-color:transparent;border-radius:50%;animation:l4m-sp-spin 0.8s linear infinite;"></div>
                    <div>
                        <div style="font-weight:700;font-size:13px;color:#00f0ff;">WEB NAVIGATOR PRO - SPONSOR</div>
                        <div id="l4m-sp-status" style="font-size:11px;color:#94a3b8;margin-top:2px;">Đang tìm nút nhiệm vụ...</div>
                    </div>
                </div>
                <style>@keyframes l4m-sp-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            (document.body || document.documentElement).appendChild(hud);
        }

        function updateHUD(text) {
            const el = document.getElementById('l4m-sp-status');
            if (el) el.innerText = text;
        }

        let buttonClicked = false;
        function scanSponsorButton() {
            if (buttonClicked) return;
            const selectors = [
                '#traffic-button', '#traffic-button-2', 'button#traffic', 'button#code',
                '.traffic-btn', 'a[href*="what-on.com"]', 'a[href*="website-analytics.net"]',
                '[id*="get-code"]', '[id*="lay-ma"]', '[class*="btn-traffic"]', 'div[onclick*="traffic"]'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) {
                    buttonClicked = true;
                    showSponsorHUD();
                    updateHUD('Đã phát hiện nút nhận mã! Tự động kích hoạt...');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { el.click(); monitorSponsorCode(); }, 800);
                    return;
                }
            }

            const allBtn = document.querySelectorAll('button, a, div, span');
            for (const el of allBtn) {
                const txt = (el.innerText || '').toLowerCase().trim();
                if (txt === 'lấy mã' || txt === 'lay ma' || txt === 'get code' || txt.includes('nhận mã ngay')) {
                    if (el.offsetParent !== null) {
                        buttonClicked = true;
                        showSponsorHUD();
                        updateHUD('Đã phát hiện: "' + txt + '". Kích hoạt...');
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => { el.click(); monitorSponsorCode(); }, 800);
                        return;
                    }
                }
            }
        }

        function monitorSponsorCode() {
            updateHUD('Đang đếm ngược lấy mã...');
            const codeWatcher = setInterval(() => {
                const textNodes = document.body ? document.body.innerText : '';
                const codePatterns = [
                    /mã\s*(?:xác\s*nhận|bảo\s*mật|của\s*bạn)?\s*[:=]\s*([a-zA-Z0-9_\-\.]{5,32})/i,
                    /code\s*(?:is)?\s*[:=]\s*([a-zA-Z0-9_\-\.]{5,32})/i
                ];
                for (const pat of codePatterns) {
                    const match = textNodes.match(pat);
                    if (match && match[1]) {
                        const code = match[1].trim();
                        clearInterval(codeWatcher);
                        updateHUD('✅ ĐÃ LẤY ĐƯỢC MÃ: ' + code);
                        GM_setValue('L4M_CODE', code);
                        GM_setClipboard(code);
                        setTimeout(() => window.close(), 2000);
                        return;
                    }
                }

                const codeBoxes = document.querySelectorAll('#traffic-code, #token, #pass, .token-code, [id*="code-result"]');
                for (const box of codeBoxes) {
                    const code = (box.innerText || box.value || '').trim();
                    if (code && code.length >= 4 && !code.includes(' ') && !code.includes('giây')) {
                        clearInterval(codeWatcher);
                        updateHUD('✅ ĐÃ LẤY ĐƯỢC MÃ: ' + code);
                        GM_setValue('L4M_CODE', code);
                        GM_setClipboard(code);
                        setTimeout(() => window.close(), 2000);
                        return;
                    }
                }
            }, 500);
        }

        window.addEventListener('DOMContentLoaded', () => {
            setInterval(scanSponsorButton, 1000);
        });
        return;
    }

    /* ══════════════════════════════════════════════════════════
       2. LINK4M MAIN DOMAIN: INSTANT NETWORK INTERCEPTION
       ══════════════════════════════════════════════════════════ */
    let redirected = false;

    function handleDestination(url) {
        if (!url || redirected) return;
        if (url.startsWith('http') && !url.includes('link4m') && !url.includes('about:blank')) {
            redirected = true;
            console.log('[Web Navigator Pro] 🎉 DESTINATION DETECTED:', url);
            GM_setClipboard(url);
            try {
                const st = document.getElementById('l4m-st');
                if (st) st.innerText = '🎉 ĐÃ CÓ LINK ĐÍCH! Đang chuyển hướng...';
            } catch (e) {}
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        }
    }

    // Intercept Fetch API
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await origFetch.apply(this, args);
        try {
            const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
            if (url && (url.includes('/links/check-captcha') || url.includes('/links/get-link-info') || url.includes('/links/'))) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data && data.url) handleDestination(data.url);
                }).catch(() => {});
            }
        } catch (e) {}
        return response;
    };

    // Intercept XMLHttpRequest
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._reqUrl = url;
        return origXhrOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            try {
                if (this._reqUrl && (this._reqUrl.includes('/links/check-captcha') || this._reqUrl.includes('/links/get-link-info') || this._reqUrl.includes('/links/'))) {
                    const data = JSON.parse(this.responseText);
                    if (data && data.url) handleDestination(data.url);
                }
            } catch (e) {}
        });
        return origXhrSend.apply(this, args);
    };

    /* ══════════════════════════════════════════════════════════
       3. LINK4M UI HUD & INTERACTIVE CONTROLS
       ══════════════════════════════════════════════════════════ */
    GM_addStyle(`
        #l4m-hud { position:fixed!important; top:16px!important; right:16px!important; width:340px!important; z-index:2147483647!important;
            background:rgba(13,17,23,0.96)!important; backdrop-filter:blur(16px)!important; border:1px solid rgba(0,240,255,0.4)!important;
            border-radius:12px!important; box-shadow:0 20px 45px rgba(0,0,0,0.8), 0 0 20px rgba(0,240,255,0.25)!important;
            font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important; color:#f0f6fc!important; overflow:hidden!important; }
        #l4m-hud * { box-sizing:border-box!important; }
        .l4m-head { display:flex!important; justify-content:space-between!important; align-items:center!important; padding:10px 14px!important;
            background:linear-gradient(90deg,#1e293b,#0f172a)!important; border-bottom:1px solid rgba(255,255,255,0.1)!important; cursor:grab!important; }
        .l4m-title { font-size:13px!important; font-weight:800!important; background:linear-gradient(135deg,#00f0ff,#38bdf8)!important;
            -webkit-background-clip:text!important; -webkit-text-fill-color:transparent!important; }
        .l4m-body { padding:12px!important; display:flex!important; flex-direction:column!important; gap:10px!important; }
        .l4m-card { background:#161b22!important; border:1px solid rgba(255,255,255,0.08)!important; border-radius:8px!important; padding:10px!important; font-size:12px!important; }
        .l4m-row { display:flex!important; justify-content:space-between!important; margin-bottom:4px!important; }
        .l4m-lbl { color:#8b949e!important; }
        .l4m-val { font-weight:600!important; color:#58a6ff!important; }
        .l4m-alert { display:none; background:rgba(234,88,12,0.25)!important; border:1px solid #f97316!important; border-radius:8px!important;
            padding:10px!important; text-align:center!important; animation:l4m-pulse 1.5s infinite!important; }
        .l4m-alert.show { display:block!important; }
        .l4m-alert-title { font-weight:800!important; font-size:12px!important; color:#fb923c!important; }
        .l4m-alert-desc { font-size:11px!important; color:#fdba74!important; margin-top:3px!important; }
        .l4m-btn { background:linear-gradient(135deg,#00f0ff,#0284c7)!important; color:#030712!important; border:none!important;
            border-radius:6px!important; padding:8px!important; font-weight:700!important; font-size:12px!important; cursor:pointer!important; text-align:center!important; }
        .l4m-btn:hover { filter:brightness(1.15)!important; }
        .l4m-log { background:#090d16!important; border:1px solid rgba(255,255,255,0.08)!important; border-radius:6px!important;
            height:75px!important; overflow-y:auto!important; padding:6px!important; font-family:monospace!important; font-size:11px!important; color:#94a3b8!important; }
        .l4m-captcha-glow { outline:3px solid #00f0ff!important; box-shadow:0 0 25px rgba(0,240,255,0.7)!important; border-radius:8px!important; }
        @keyframes l4m-pulse { 0%,100% { box-shadow:0 0 10px rgba(249,115,22,0.4); } 50% { box-shadow:0 0 20px rgba(249,115,22,0.8); } }
    `);

    function buildHUD() {
        if (document.getElementById('l4m-hud')) return;
        const hud = document.createElement('div');
        hud.id = 'l4m-hud';
        hud.innerHTML = `
            <div class="l4m-head" id="l4m-drag">
                <span class="l4m-title">⚡ WEB NAVIGATOR PRO</span>
                <span id="l4m-min" style="cursor:pointer;color:#94a3b8;font-size:16px;">_</span>
            </div>
            <div class="l4m-body" id="l4m-cnt">
                <div class="l4m-card">
                    <div class="l4m-row"><span class="l4m-lbl">Trạng thái:</span><span class="l4m-val" id="l4m-st">Sẵn sàng...</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Tài trợ:</span><span class="l4m-val" id="l4m-dom">--</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Mã:</span><span class="l4m-val" id="l4m-code" style="color:#4ade80;">--</span></div>
                </div>
                <div class="l4m-alert" id="l4m-alert">
                    <div class="l4m-alert-title">👉 VUI LÒNG TICK CAPTCHA</div>
                    <div class="l4m-alert-desc">Hãy tick vào ô reCAPTCHA trên màn hình, hệ thống sẽ tự động mở khóa link đích ngay!</div>
                </div>
                <button class="l4m-btn" id="l4m-btn">🚀 MỞ KHÓA LINK NGAY</button>
                <div class="l4m-log" id="l4m-logs"></div>
            </div>
        `;
        document.body.appendChild(hud);

        const h = document.getElementById('l4m-drag');
        let drag = false, sx, sy, il, it;
        h.addEventListener('mousedown', (e) => {
            drag = true; sx = e.clientX; sy = e.clientY;
            const r = hud.getBoundingClientRect();
            il = r.left; it = r.top;
            const onM = (ev) => {
                if (!drag) return;
                hud.style.right = 'auto';
                hud.style.left = (il + ev.clientX - sx) + 'px';
                hud.style.top = (it + ev.clientY - sy) + 'px';
            };
            const onU = () => { drag = false; window.removeEventListener('mousemove', onM); window.removeEventListener('mouseup', onU); };
            window.addEventListener('mousemove', onM);
            window.addEventListener('mouseup', onU);
        });

        document.getElementById('l4m-min').addEventListener('click', () => {
            const c = document.getElementById('l4m-cnt');
            c.style.display = c.style.display === 'none' ? 'flex' : 'none';
        });

        document.getElementById('l4m-btn').addEventListener('click', forceUnlock);
    }

    function log(msg, clr) {
        const l = document.getElementById('l4m-logs');
        if (!l) return;
        const div = document.createElement('div');
        div.style.color = clr || '#94a3b8';
        div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        l.appendChild(div);
        l.scrollTop = l.scrollHeight;
    }

    /* ══════════════════════════════════════════════════════════
       4. CAPTCHA DETECTOR & INSTANT SUBMISSION ENGINE
       ══════════════════════════════════════════════════════════ */
    let lastCaptchaToken = null;
    let submitTriggered = false;

    function getLinkSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || '';
    }

    function highlightCaptcha() {
        const capBox = document.querySelector('.g-recaptcha, #recaptcha-2, #recaptcha, iframe[src*="recaptcha"]');
        if (capBox) {
            capBox.classList.add('l4m-captcha-glow');
            capBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function forceUnlock() {
        log('Đang kích hoạt mở khóa link...', '#00f0ff');
        let token = '';
        document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
            if (el.value && el.value.length > 20) token = el.value;
        });

        if (!token) {
            log('⚠️ Chưa có Captcha! Hãy tick vào ô reCAPTCHA.', '#fb923c');
            highlightCaptcha();
            const alertBox = document.getElementById('l4m-alert');
            if (alertBox) alertBox.classList.add('show');
            return;
        }

        executeBypassRequests(token);
    }

    function executeBypassRequests(token) {
        if (submitTriggered) return;
        submitTriggered = true;

        log('⚡ Đang gửi xác thực Captcha tới server...', '#4ade80');
        const st = document.getElementById('l4m-st');
        if (st) st.innerText = 'Đang lấy link đích...';

        const slug = getLinkSlug();
        const apiDomain = window.api_domain || 'https://s1.link4m.app';

        // 1. Try /links/check-captcha
        GM_xmlhttpRequest({
            method: 'POST',
            url: `${apiDomain}/links/check-captcha`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: `g-recaptcha-response=${encodeURIComponent(token)}&alias=${encodeURIComponent(slug)}&code=`,
            onload: function (res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data && data.success && data.url) {
                        handleDestination(data.url);
                        return;
                    }
                } catch (e) {}
            }
        });

        // 2. Try /links/get-link-info
        const passInput = document.querySelector("input[name='password'], #password-2, #password, .password");
        const currentCode = (passInput ? passInput.value : '') || GM_getValue('L4M_CODE', '');

        GM_xmlhttpRequest({
            method: 'POST',
            url: `${apiDomain}/links/get-link-info`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: `g-recaptcha-response=${encodeURIComponent(token)}&alias=${encodeURIComponent(slug)}&password=${encodeURIComponent(currentCode)}`,
            onload: function (res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data && data.success && data.url) {
                        handleDestination(data.url);
                        return;
                    }
                } catch (e) {}
            }
        });

        // 3. Unlock button & click
        const gl = document.querySelector('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
        if (gl) {
            gl.classList.remove('disabled');
            gl.removeAttribute('disabled');
            gl.click();
        }

        // 4. Call Link4M's internal callbacks
        try {
            if (typeof window.checkCaptcha === 'function') window.checkCaptcha();
            if (typeof window.checkPassword === 'function') window.checkPassword();
        } catch (e) {}
    }

    /* ══════════════════════════════════════════════════════════
       5. CONTINUOUS RECAPTCHA & DESTINATION MONITOR (Runs 24/7)
       ══════════════════════════════════════════════════════════ */
    function startRealtimeMonitor() {
        setInterval(() => {
            if (redirected) return;

            // A. Check window.destination_url
            if (window.destination_url && window.destination_url.startsWith('http') && !window.destination_url.includes('link4m')) {
                handleDestination(window.destination_url);
                return;
            }

            // B. Check .get-link href
            const gl = document.querySelector('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
            if (gl) {
                const href = gl.getAttribute('href') || '';
                if (href.startsWith('http') && !href.includes('link4m') && !href.includes('about:blank')) {
                    handleDestination(href);
                    return;
                }
                if (!gl.classList.contains('disabled') && !gl.hasAttribute('disabled')) {
                    gl.click();
                }
            }

            // C. Detect Captcha Token in real time!
            document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
                if (el.value && el.value.length > 20 && el.value !== lastCaptchaToken) {
                    lastCaptchaToken = el.value;
                    log('✅ Phát hiện Captcha đã tick xong! Đang mở khóa link...', '#4ade80');
                    const alertBox = document.getElementById('l4m-alert');
                    if (alertBox) alertBox.classList.remove('show');
                    executeBypassRequests(lastCaptchaToken);
                }
            });

            // D. Auto-fill code if stored
            const storedCode = GM_getValue('L4M_CODE', '');
            if (storedCode) {
                const passInputs = document.querySelectorAll("input[name='password'], #password-2, #password, .password");
                passInputs.forEach(inp => {
                    if (inp.value !== storedCode) {
                        inp.value = storedCode;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        inp.dispatchEvent(new Event('change', { bubbles: true }));
                        log('🎉 Đã điền mã: ' + storedCode, '#4ade80');
                        const codeEl = document.getElementById('l4m-code');
                        if (codeEl) codeEl.innerText = storedCode;
                    }
                });
            }
        }, 350);
    }

    /* ══════════════════════════════════════════════════════════
       6. SPONSOR DOMAIN DETECTION
       ══════════════════════════════════════════════════════════ */
    function scanMission() {
        const text = document.body ? document.body.innerText : '';

        // 1. Check known campaigns
        for (const [kw, dom] of Object.entries(KNOWN_CAMPAIGNS)) {
            if (text.toLowerCase().includes(kw)) {
                return { keyword: kw, domain: dom };
            }
        }

        // 2. Regex for keywords
        const kwMatch = text.match(/(?:tìm từ khóa|từ khóa|gõ từ khóa)[:\s*]+([A-Za-z0-9_\-\s]{3,30})/i);
        if (kwMatch && kwMatch[1]) {
            const kw = kwMatch[1].trim();
            for (const [k, d] of Object.entries(KNOWN_CAMPAIGNS)) {
                if (kw.toLowerCase().includes(k)) return { keyword: kw, domain: d };
            }
        }

        // 3. Regex for masked domain
        const domMatch = text.match(/([a-zA-Z0-9\-]{3,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})/i) ||
                         text.match(/([a-zA-Z0-9\-]{3,})\.(?:co|c)\*+(?![a-zA-Z0-9])/i) ||
                         text.match(/([a-zA-Z0-9\-]{3,}\.(?:com|net|org|vn|co|vip|games|cc|me))/i);
        if (domMatch && domMatch[1]) {
            const d = domMatch[1].toLowerCase().replace(/\*+/g, 'm');
            const fullDom = d.includes('.') ? d : `${d}.com`;
            if (!fullDom.includes('link4m') && !fullDom.includes('google')) {
                return { keyword: fullDom, domain: fullDom };
            }
        }

        return null;
    }

    function initPage() {
        buildHUD();
        startRealtimeMonitor();

        // Remove annoying ad popups
        document.querySelectorAll('#ad_banner, .modal-backdrop, [class*="overlay"]').forEach(el => el.remove());

        // Check mission
        setTimeout(() => {
            const mission = scanMission();
            if (mission) {
                const domEl = document.getElementById('l4m-dom');
                if (domEl) domEl.innerText = mission.domain;
                log(`Phát hiện tài trợ: ${mission.domain}`, '#4ade80');

                // Prompt user to open sponsor tab if not opened
                const btn = document.getElementById('l4m-btn');
                if (btn) {
                    btn.innerText = `👉 MỞ TRANG ${mission.domain.toUpperCase()}`;
                    btn.onclick = () => {
                        GM_openInTab('https://' + mission.domain, { active: true, insert: true });
                    };
                }
            } else {
                log('Trang sẵn sàng: Chỉ cần tick Captcha để tới link đích!', '#38bdf8');
                highlightCaptcha();
                const alertBox = document.getElementById('l4m-alert');
                if (alertBox) alertBox.classList.add('show');
            }
        }, 800);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }
})();
