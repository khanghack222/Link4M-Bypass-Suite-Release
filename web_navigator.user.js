// ==UserScript==
// @name         Web Flow Navigator Pro
// @namespace    https://github.com/khanghack222/Link4M-Bypass-Suite-Release
// @version      3.7.0
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
// @connect      *
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        window.close
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
// @downloadURL  https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js
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
       1. SPONSOR DOMAIN: GENUINE 60S COUNTDOWN & AUTO-SCROLL
       ══════════════════════════════════════════════════════════ */
    if (!IS_L4M) {
        // Prevent tab background freezing
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
            window.hasFocus = () => true;
        } catch (e) {}

        // Active heartbeat scroll so widget countdown never pauses
        setInterval(() => {
            window.scrollBy(0, 15);
            setTimeout(() => window.scrollBy(0, -15), 300);
            window.dispatchEvent(new Event('scroll'));
        }, 1500);

        function showSponsorHUD() {
            if (document.getElementById('l4m-sp-hud')) return;
            const hud = document.createElement('div');
            hud.id = 'l4m-sp-hud';
            hud.innerHTML = `
                <div style="position:fixed;bottom:20px;right:20px;z-index:2147483647;background:rgba(15,23,42,0.96);border:2px solid #00f0ff;border-radius:10px;padding:12px 18px;color:#fff;font-family:sans-serif;box-shadow:0 0 20px rgba(0,240,255,0.4);display:flex;align-items:center;gap:12px;">
                    <div style="width:14px;height:14px;border:3px solid #00f0ff;border-top-color:transparent;border-radius:50%;animation:l4m-sp-spin 0.8s linear infinite;"></div>
                    <div>
                        <div style="font-weight:700;font-size:13px;color:#00f0ff;">WEB NAVIGATOR - TIẾN TRÌNH 60S</div>
                        <div id="l4m-sp-status" style="font-size:12px;color:#38bdf8;margin-top:2px;">Đang tìm nút nhận mã...</div>
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
                    updateHUD('Đã phát hiện nút! Đang bấm để bắt đầu 60s...');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        el.click();
                        monitorCountdown();
                    }, 600);
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
                        updateHUD('Đã phát hiện nút: "' + txt + '". Bắt đầu đếm 60s...');
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            el.click();
                            monitorCountdown();
                        }, 600);
                        return;
                    }
                }
            }
        }

        function monitorCountdown() {
            updateHUD('⏳ Đang đếm ngược 60s chuẩn theo server...');
            let elapsed = 0;

            const timer = setInterval(() => {
                elapsed += 1;
                const textNodes = document.body ? document.body.innerText : '';

                // Read countdown text on screen
                const whaton = document.querySelector('.whatoncode, #traffic-code, .countdown');
                if (whaton) {
                    const t = whaton.innerText.trim();
                    if (t) updateHUD(`⏳ Tiến trình: ${t}`);
                }

                // Check for code in text
                const codePatterns = [
                    /mã\s*(?:xác\s*nhận|bảo\s*mật|của\s*bạn)?\s*[:=]\s*([a-zA-Z0-9_\-\.]{5,32})/i,
                    /mã\s*km\s*[:=]\s*([a-zA-Z0-9_\-\.]{5,32})/i,
                    /code\s*(?:is)?\s*[:=]\s*([a-zA-Z0-9_\-\.]{5,32})/i
                ];

                for (const pat of codePatterns) {
                    const match = textNodes.match(pat);
                    if (match && match[1]) {
                        const code = match[1].trim();
                        clearInterval(timer);
                        updateHUD('🎉 ĐÃ CÓ MÃ: ' + code + ' (Tự động chuyển về Link4M)');
                        GM_setValue('L4M_CODE', code);
                        GM_setClipboard(code);
                        setTimeout(() => window.close(), 1800);
                        return;
                    }
                }

                const codeBoxes = document.querySelectorAll('#traffic-code, #token, #pass, .token-code, [id*="code-result"]');
                for (const box of codeBoxes) {
                    const code = (box.innerText || box.value || '').trim();
                    if (code && code.length >= 4 && !code.includes(' ') && !code.includes('giây') && !code.includes('wait')) {
                        clearInterval(timer);
                        updateHUD('🎉 ĐÃ CÓ MÃ: ' + code + ' (Tự động chuyển về Link4M)');
                        GM_setValue('L4M_CODE', code);
                        GM_setClipboard(code);
                        setTimeout(() => window.close(), 1800);
                        return;
                    }
                }

                if (elapsed > 85) clearInterval(timer);
            }, 1000);
        }

        // Listen for API responses on sponsor site
        const origXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                try {
                    if (this.responseText && (this.responseText.includes('get_quest_code') || this.responseText.includes('code') || this.responseText.includes('token'))) {
                        const data = JSON.parse(this.responseText);
                        const c = data.html || data.code || data.data || data.c;
                        if (c && typeof c === 'string' && c.length >= 4 && c.length <= 32 && !c.includes('<') && !c.includes(' ')) {
                            showSponsorHUD();
                            updateHUD('🎉 ĐÃ LẤY ĐƯỢC MÃ TỪ API: ' + c);
                            GM_setValue('L4M_CODE', c);
                            GM_setClipboard(c);
                            setTimeout(() => window.close(), 1800);
                        }
                    }
                } catch (e) {}
            });
            return origXhrSend.apply(this, args);
        };

        window.addEventListener('DOMContentLoaded', () => {
            setInterval(scanSponsorButton, 1000);
        });
        return;
    }

    /* ══════════════════════════════════════════════════════════
       2. LINK4M MAIN DOMAIN: 100% NATIVE FLOW (ZERO BACKDOORS)
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
                if (st) st.innerText = '🎉 ĐÃ MỞ KHÓA! Đang chuyển hướng...';
                log(`🚀 ĐÃ TỚI LINK ĐÍCH: ${url}`, '#4ade80');
            } catch (e) {}
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        }
    }

    // Intercept Link4M's native API responses to catch destination instantly
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await origFetch.apply(this, args);
        try {
            const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
            if (url) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data && data.url) handleDestination(data.url);
                    if (url.includes('get-advertise') && (data.html || (data.data && data.data.html))) {
                        inspectMission(data.html || data.data.html);
                    }
                }).catch(() => {});
            }
        } catch (e) {}
        return response;
    };

    const origXhrOpenL4m = XMLHttpRequest.prototype.open;
    const origXhrSendL4m = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._l4mUrl = url;
        return origXhrOpenL4m.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            try {
                if (this._l4mUrl) {
                    const data = JSON.parse(this.responseText);
                    if (data && data.url) handleDestination(data.url);
                    if (this._l4mUrl.includes('get-advertise') && (data.html || (data.data && data.data.html))) {
                        inspectMission(data.html || data.data.html);
                    }
                }
            } catch (e) {}
        });
        return origXhrSendL4m.apply(this, args);
    };

    /* ══════════════════════════════════════════════════════════
       3. LINK4M UI HUD WITH DIRECT ACTIONS
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
        .l4m-btn { background:linear-gradient(135deg,#00f0ff,#0284c7)!important; color:#030712!important; border:none!important;
            border-radius:6px!important; padding:8px!important; font-weight:700!important; font-size:12px!important; cursor:pointer!important; text-align:center!important; }
        .l4m-btn:hover { filter:brightness(1.15)!important; }
        .l4m-log { background:#090d16!important; border:1px solid rgba(255,255,255,0.08)!important; border-radius:6px!important;
            height:95px!important; overflow-y:auto!important; padding:6px!important; font-family:monospace!important; font-size:11px!important; color:#94a3b8!important; }
        .l4m-quick-wrap { display:flex!important; gap:6px!important; }
        .l4m-input { flex:1!important; background:#090d16!important; border:1px solid rgba(255,255,255,0.15)!important; border-radius:6px!important; padding:6px 8px!important; color:#fff!important; font-size:12px!important; outline:none!important; }
        .l4m-btn-green { background:#238636!important; color:#fff!important; border:none!important; border-radius:6px!important; padding:6px 14px!important; font-weight:700!important; font-size:12px!important; cursor:pointer!important; }
        .l4m-btn-green:hover { background:#2ea043!important; }
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
                    <div class="l4m-row"><span class="l4m-lbl">Trạng thái:</span><span class="l4m-val" id="l4m-st">Sẵn sàng quét...</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Tài trợ:</span><span class="l4m-val" id="l4m-dom">--</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Mã 60s:</span><span class="l4m-val" id="l4m-code" style="color:#4ade80;">--</span></div>
                </div>
                <div class="l4m-quick-wrap">
                    <input type="text" class="l4m-input" id="l4m-quick-code" placeholder="Dán hoặc nhập mã tại đây...">
                    <button class="l4m-btn-green" id="l4m-submit-code-btn">NỘP</button>
                </div>
                <button class="l4m-btn" id="l4m-btn">🚀 MỞ TRANG LẤY MÃ (60S)</button>
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

        // Quick code submit button
        document.getElementById('l4m-submit-code-btn').addEventListener('click', () => {
            const inp = document.getElementById('l4m-quick-code');
            const val = inp ? inp.value.trim() : '';
            if (!val) {
                log('⚠️ Vui lòng nhập mã trước khi bấm Nộp!', '#fb923c');
                return;
            }
            log(`[NỘP MÃ] Điền mã "${val}" và kích hoạt nộp link...`, '#4ade80');
            fillCodeAndSubmitNatively(val);
        });

        // Main action button
        document.getElementById('l4m-btn').addEventListener('click', handleMainButtonClick);
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
       4. INTERACTIVE BUTTON CLICK HANDLER (ALWAYS LOGS & ACTS)
       ══════════════════════════════════════════════════════════ */
    function handleMainButtonClick() {
        log('👉 Bạn đã bấm nút! Đang kiểm tra toàn bộ trang...', '#00f0ff');

        // Check if password already entered in Link4M's native input
        const passInp = document.querySelector("input[name='password'], #password-2, #password, .password");
        const quickInp = document.getElementById('l4m-quick-code');
        const existingCode = (passInp ? passInp.value.trim() : '') || (quickInp ? quickInp.value.trim() : '') || GM_getValue('L4M_CODE', '');

        if (existingCode) {
            log(`🎉 Phát hiện mã có sẵn: "${existingCode}". Đang nộp mã...`, '#4ade80');
            fillCodeAndSubmitNatively(existingCode);
            return;
        }

        // If active mission with domain is known
        if (activeMission && activeMission.domain) {
            log(`🚀 Mở tab tài trợ chạy 60s: https://${activeMission.domain}`, '#4ade80');
            GM_openInTab(`https://${activeMission.domain}`, { active: true, insert: true });
            return;
        }

        // If keyword is known, open Google search
        if (activeMission && activeMission.keyword) {
            log(`🚀 Mở Google tìm từ khóa: "${activeMission.keyword}"`, '#38bdf8');
            GM_openInTab(`https://www.google.com/search?q=${encodeURIComponent(activeMission.keyword)}`, { active: true, insert: true });
            return;
        }

        // Rescan entire instruction container
        const adv = document.getElementById('advertise-html-wrapper');
        const advHtml = adv ? adv.innerHTML : '';
        const advText = adv ? adv.innerText : '';
        const bodyText = document.body ? document.body.innerText : '';

        log('🔍 Đang bóc tách chi tiết hướng dẫn nhiệm vụ...', '#94a3b8');
        const m = extractMissionDetails(advHtml + ' ' + advText + ' ' + bodyText);
        if (m) {
            inspectMission(advHtml + ' ' + advText + ' ' + bodyText);
            if (m.domain) {
                log(`🚀 Đang mở: https://${m.domain}`, '#4ade80');
                GM_openInTab(`https://${m.domain}`, { active: true, insert: true });
            } else if (m.keyword) {
                log(`🚀 Đang mở Google tìm: ${m.keyword}`, '#38bdf8');
                GM_openInTab(`https://www.google.com/search?q=${encodeURIComponent(m.keyword)}`, { active: true, insert: true });
            }
        } else {
            // Check for images
            const imgs = document.querySelectorAll('#advertise-html-wrapper img, img[src*="advertiser"], img[src*="uploads"]');
            if (imgs.length > 0) {
                log(`🖼️ Phát hiện ${imgs.length} ảnh nhiệm vụ trên trang!`, '#38bdf8');
                log('👉 Vui lòng nhìn ảnh ở Bước 2 & 3, click vào trang web đó. Tool sẽ tự chạy 60s lấy mã!', '#fb923c');
            } else {
                log('⚠️ Chưa tìm thấy nhiệm vụ. Vui lòng nhìn hướng dẫn bên dưới.', '#fb923c');
            }
        }
    }

    /* ══════════════════════════════════════════════════════════
       5. MISSION EXTRACTOR
       ══════════════════════════════════════════════════════════ */
    let activeMission = null;
    let tabAutoOpened = false;

    function extractMissionDetails(htmlOrText) {
        if (!htmlOrText) return null;
        const raw = htmlOrText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

        // 1. Accent-insensitive dictionary check
        const norm = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const [kw, dom] of Object.entries(KNOWN_CAMPAIGNS)) {
            const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (norm.includes(normKw)) {
                return { keyword: kw, domain: dom, url: `https://${dom}` };
            }
        }

        // 2. Scan all strong/bold/red elements inside instruction container
        const advBox = document.getElementById('advertise-html-wrapper') || document.body;
        if (advBox) {
            const strongs = advBox.querySelectorAll('strong, b, span[style*="bold"], span[style*="red"]');
            for (const el of strongs) {
                const t = el.innerText.trim();
                for (const [kw, dom] of Object.entries(KNOWN_CAMPAIGNS)) {
                    if (t.toLowerCase().includes(kw)) {
                        return { keyword: kw, domain: dom, url: `https://${dom}` };
                    }
                }
            }
        }

        // 3. Extract Step 2 text
        const mStep2 = raw.match(/bước\s*2[^\n\r:]*[:\.\-]?\s*([^.]+?)(?:bước\s*3|$)/i);
        let extractedKw = '';
        if (mStep2 && mStep2[1]) {
            extractedKw = mStep2[1].replace(/(?:tìm\s*kiếm|tìm\s*từ\s*kho[áa]|từ\s*kho[áa]|gõ|vào\s*google)[:\s\-]*/gi, '').trim();
            for (const [k, d] of Object.entries(KNOWN_CAMPAIGNS)) {
                if (extractedKw.toLowerCase().includes(k)) return { keyword: extractedKw, domain: d, url: `https://${d}` };
            }
        }

        // 4. Extract Step 3 domain
        const domPatterns = [
            /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})/i,
            /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+/i,
            /([a-zA-Z0-9\-]{3,}\.(?:com\.vn|com|net|org|vn|vip|games|cc|me|tv|co|top|xyz))/i,
            /(?:website|trang\s*web|vào)\s*[:\-]?\s*([a-zA-Z0-9\-\.\*]+\.[a-zA-Z]{2,})/i
        ];

        for (const p of domPatterns) {
            const m = raw.match(p);
            if (m && m[1]) {
                let d = m[1].toLowerCase().replace(/\*+/g, 'm').replace(/https?:\/\//, '').split('/')[0].trim();
                if (!d.includes('.') && !d.includes('*')) d += '.com';
                if (!d.includes('link4m') && !d.includes('google') && !d.includes('facebook') && !d.includes('youtube')) {
                    return { keyword: extractedKw || d, domain: d, url: `https://${d}` };
                }
            }
        }

        if (extractedKw && extractedKw.length >= 3) {
            return { keyword: extractedKw, domain: null, url: `https://www.google.com/search?q=${encodeURIComponent(extractedKw)}` };
        }

        return null;
    }

    function inspectMission(htmlOrText) {
        if (activeMission) return;
        const m = extractMissionDetails(htmlOrText);
        if (m) {
            activeMission = m;
            const domEl = document.getElementById('l4m-dom');
            if (domEl) domEl.innerText = m.domain || m.keyword;
            log(`🎯 Nhiệm vụ: ${m.keyword || m.domain}`, '#00f0ff');

            const btn = document.getElementById('l4m-btn');
            if (btn) {
                if (m.domain) {
                    btn.innerText = `👉 MỞ ${m.domain.toUpperCase()} (CHẠY 60S)`;
                } else {
                    btn.innerText = `👉 TÌM GOOGLE: ${m.keyword.toUpperCase()}`;
                }
            }

            if (!tabAutoOpened && m.domain) {
                tabAutoOpened = true;
                log(`🚀 Tự động mở tab tài trợ chạy 60s: ${m.domain}`, '#4ade80');
                GM_openInTab(`https://${m.domain}`, { active: false, insert: true });
            }
        }
    }

    /* ══════════════════════════════════════════════════════════
       6. NATIVE SUBMIT VIA LINK4M OFFICIAL FORM (ZERO BACKDOORS)
       ══════════════════════════════════════════════════════════ */
    function fillCodeAndSubmitNatively(code) {
        log(`🎉 Đang điền mã "${code}" vào ô nhập mã...`, '#4ade80');
        const codeEl = document.getElementById('l4m-code');
        if (codeEl) codeEl.innerText = code;

        const quickInp = document.getElementById('l4m-quick-code');
        if (quickInp && quickInp.value !== code) quickInp.value = code;

        const inputs = document.querySelectorAll("input[name='password'], #password-2, #password, .password");
        inputs.forEach(inp => {
            inp.value = code;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
            inp.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }));
        });

        // Trigger native checkPassword if available in page scope
        try {
            if (typeof window.checkPassword === 'function') {
                window.checkPassword();
            }
        } catch (e) {}

        // Native submit
        setTimeout(() => {
            const forms = document.querySelectorAll('#main-form-2, #main-form');
            forms.forEach(f => {
                const sBtn = f.querySelector('button[type="submit"], input[type="submit"], #btn-main, .get-link');
                if (sBtn) sBtn.click();
            });

            const gl = document.querySelector('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
            if (gl && !gl.classList.contains('disabled')) {
                gl.click();
            }
        }, 500);
    }

    /* ══════════════════════════════════════════════════════════
       7. REALTIME MONITOR LOOP
       ══════════════════════════════════════════════════════════ */
    function startRealtimeLoop() {
        setInterval(() => {
            if (redirected) return;

            // 1. Destination check
            if (window.destination_url && window.destination_url.startsWith('http') && !window.destination_url.includes('link4m')) {
                handleDestination(window.destination_url);
                return;
            }
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

            // 2. Check if code has arrived from sponsor tab
            const storedCode = GM_getValue('L4M_CODE', '');
            if (storedCode) {
                const passInp = document.querySelector("input[name='password'], #password-2, #password, .password");
                if (passInp && passInp.value !== storedCode) {
                    fillCodeAndSubmitNatively(storedCode);
                }
            }

            // 3. Scan mission instructions if not detected yet
            if (!activeMission) {
                const adv = document.getElementById('advertise-html-wrapper');
                const text = (adv ? adv.innerText : '') + ' ' + (document.body ? document.body.innerText : '');
                inspectMission(text);
            }
        }, 400);
    }

    function init() {
        buildHUD();
        startRealtimeLoop();

        // Clean annoying overlays
        document.querySelectorAll('#ad_banner, .modal-backdrop, [class*="overlay"]').forEach(el => el.remove());

        // Initial scan
        const adv = document.getElementById('advertise-html-wrapper') || document.body;
        if (adv) inspectMission(adv.innerHTML || adv.innerText);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
