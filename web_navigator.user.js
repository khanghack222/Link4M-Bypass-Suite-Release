// ==UserScript==
// @name         Web Flow Navigator Pro
// @namespace    https://github.com/khanghack222/Link4M-Bypass-Suite-Release
// @version      3.2.0
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
        try {
            if (window.navigator && window.navigator.webkitTemporaryStorage) {
                window.navigator.webkitTemporaryStorage.queryUsageAndQuota = (cb) => cb && cb(0, 107374182400);
            }
            Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });

            let y = 600;
            Object.defineProperty(window, 'pageYOffset', {
                get: () => { y += (Math.random() > 0.5 ? 6 : -4); return y; },
                configurable: true
            });

            setInterval(() => {
                window.dispatchEvent(new Event('scroll'));
                window.dispatchEvent(new Event('mousemove'));
            }, 350);
        } catch (e) {}

        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (m, url) {
            this._u = url;
            return origOpen.apply(this, arguments);
        };
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                try {
                    if (this._u && this._u.includes('get_quest_code')) {
                        const d = JSON.parse(this.responseText);
                        handleQuest(d);
                    }
                } catch (e) {}
            });
            return origSend.apply(this, arguments);
        };

        let codeDone = false, s1Done = false;

        function handleQuest(d) {
            if (!d || !d.success) return;
            if (d.id && !s1Done) {
                s1Done = true;
                setPill('Bước 1 hoàn thành! Đang chuyển bài viết...');
                setTimeout(navArticle, 1500);
            } else if (d.html) {
                const s = String(d.html).trim();
                if (!s.includes('Vui lòng') && !s.includes('click') && s.length > 0) {
                    onCode(s);
                }
            }
        }

        function onCode(c) {
            if (codeDone) return;
            codeDone = true;
            GM_setValue('L4M_CODE', c);
            GM_setValue('L4M_STATE', 'DONE');
            setPill('Đã lấy mã: ' + c + ' | Đang gửi về Link4M...');
            try { GM_setClipboard(c); } catch (e) {}
            try { navigator.clipboard.writeText(c); } catch (e) {}
            setTimeout(() => {
                try { window.close(); } catch (e) {}
            }, 2500);
        }

        function navArticle() {
            const h = window.location.hostname;
            const p = window.location.pathname;
            const links = Array.from(document.querySelectorAll('a[href]'));
            let target = null;
            for (const a of links) {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
                try {
                    const u = new URL(href, window.location.origin);
                    if (u.hostname === h && u.pathname !== p && u.pathname.length > 3) {
                        if (!/lien-he|contact|privacy|terms|gioi-thieu/i.test(u.pathname)) {
                            target = u.href;
                            break;
                        }
                    }
                } catch (e) {}
            }
            if (target) window.location.href = target;
            else { window.location.hash = '#step2-' + Date.now(); window.location.reload(); }
        }

        function findBtn() {
            const exp = document.querySelector('#traffic-button, .whatoncode, button.whatoncode, #fC6by7 button, [id*="traffic_"] button');
            if (exp) return exp;
            for (const el of Array.from(document.querySelectorAll('button, a, div[role="button"], span'))) {
                const t = (el.innerText || el.textContent || '').trim().toUpperCase();
                if (t.includes('LẤY MÃ') || t.includes('LAY MA') || t.includes('GET CODE') || t.includes('LẤY CODE') || t.includes('NHẬN MÃ')) return el;
            }
            return null;
        }

        function setPill(msg) {
            let p = document.getElementById('l4m-pill');
            if (!p && document.body) {
                p = document.createElement('div');
                p.id = 'l4m-pill';
                p.style.cssText = 'position:fixed!important;bottom:20px!important;left:20px!important;z-index:2147483647!important;' +
                    'background:rgba(15,23,42,0.95)!important;color:#00f0ff!important;padding:8px 16px!important;border-radius:9999px!important;' +
                    'font-family:sans-serif!important;font-size:12px!important;font-weight:600!important;border:1px solid #00f0ff!important;box-shadow:0 0 15px rgba(0,240,255,0.4)!important;';
                document.body.appendChild(p);
            }
            if (p) p.innerText = '⚡ [Navigator]: ' + msg;
        }

        window.addEventListener('DOMContentLoaded', () => {
            const whaton = document.querySelector('.whatoncode, .whatoncode-wrapper, #traffic-button, [class*="traffic"]');
            const hasText = document.body && /lấy mã|lay ma|get code|nhận mã/i.test(document.body.innerText || '');
            if (!whaton && !hasText && GM_getValue('L4M_STATE', 'IDLE') === 'IDLE') return;

            let count = 0;
            const t = setInterval(() => {
                count++;
                const w = document.querySelector('.whatoncode, .whatoncode-wrapper, [class*="traffic"]');
                if (w) {
                    const txt = w.innerText || '';
                    const m = txt.match(/Mã\s*(?:KM)?:?\s*([A-Za-z0-9_\-]+)/i);
                    if (m && m[1] && m[1].length >= 4) {
                        onCode(m[1].trim());
                        clearInterval(t);
                        return;
                    }
                    if ((txt.includes('click') || txt.includes('bài viết')) && !s1Done) {
                        s1Done = true;
                        setPill('Bước 1 hoàn thành! Đang chuyển trang...');
                        setTimeout(navArticle, 1500);
                        return;
                    }
                    const tm = txt.match(/(\d+)\s*s/i);
                    if (tm) setPill('Đang đếm ngược: ' + tm[1] + 's...');
                }

                const b = findBtn();
                if (b && !b.dataset.l4m) {
                    b.dataset.l4m = '1';
                    setPill('Đã tìm thấy nút Lấy Mã, đang click...');
                    b.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => b.click(), 600);
                }
                if (count > 450) clearInterval(t);
            }, 600);
        });
        return;
    }

    /* ══════════════════════════════════════════════════════════
       2. LINK4M PAGE AUTOMATION & HUD MENU
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
        .l4m-captcha-glow { outline:3px solid #00f0ff!important; box-shadow:0 0 20px rgba(0,240,255,0.6)!important; border-radius:8px!important; }
        @keyframes l4m-pulse { 0%,100% { box-shadow:0 0 10px rgba(249,115,22,0.4); } 50% { box-shadow:0 0 20px rgba(249,115,22,0.8); } }
    `);

    function unmask(raw) {
        if (!raw) return [];
        const res = [];
        const clean = raw.replace(/★/g, '*').replace(/x/g, 'x');

        // Check dictionary keywords
        for (const [kw, dom] of Object.entries(KNOWN_CAMPAIGNS)) {
            if (raw.toLowerCase().includes(kw)) {
                res.push(dom);
                break;
            }
        }

        const p1 = /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})/gi;
        let m;
        while ((m = p1.exec(clean)) !== null) res.push(`${m[1].toLowerCase()}.com.${m[2].toLowerCase()}`, `${m[1].toLowerCase()}.${m[2].toLowerCase()}`);
        const p2 = /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+(?![a-zA-Z0-9])/gi;
        while ((m = p2.exec(clean)) !== null) res.push(`${m[1].toLowerCase()}.com`);
        const p3 = /(?:https?:\/\/)?([a-zA-Z0-9\-]{2,}\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
        while ((m = p3.exec(clean)) !== null) {
            const d = m[1].toLowerCase();
            if (!d.includes('link4m') && !d.includes('google') && !d.includes('youtube')) res.push(d);
        }
        return Array.from(new Set(res));
    }

    let targetDomain = null, submitted = false;

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
                    <div class="l4m-row"><span class="l4m-lbl">Trạng thái:</span><span class="l4m-val" id="l4m-st">Đang quét...</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Tài trợ:</span><span class="l4m-val" id="l4m-dom">--</span></div>
                    <div class="l4m-row"><span class="l4m-lbl">Mã:</span><span class="l4m-val" id="l4m-code" style="color:#4ade80;">--</span></div>
                </div>
                <div class="l4m-alert" id="l4m-alert">
                    <div class="l4m-alert-title">👉 VUI LÒNG TICK CAPTCHA</div>
                    <div class="l4m-alert-desc">Tool đã điền mã! Bạn chỉ cần tick Captcha, hệ thống sẽ tự động chuyển trang đích ngay lập tức!</div>
                </div>
                <button class="l4m-btn" id="l4m-btn">🚀 CHẠY LẠI NHIỆM VỤ</button>
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

        document.getElementById('l4m-btn').addEventListener('click', runFlow);
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

    function runFlow() {
        log('Phân tích nhiệm vụ trang...', '#00f0ff');
        const text = document.body ? document.body.innerText : '';
        const list = unmask(text);

        const hasPassword = document.querySelector("input[name='password'], #password-2, #password, .password");
        if (list.length > 0) {
            targetDomain = list[0];
            document.getElementById('l4m-dom').innerText = targetDomain;
            log('Đã phát hiện tài trợ: ' + targetDomain, '#4ade80');
            openSponsor(targetDomain);
        } else if (!hasPassword) {
            document.getElementById('l4m-st').innerText = 'Chế độ Direct (Không có tài trợ)';
            log('Chế độ trực tiếp: Hãy tick vào ô reCAPTCHA.', '#fb923c');
            highlightCaptcha();
            watchToken();
        } else {
            log('Đang chờ API nhiệm vụ trả về...', '#fb923c');
            setTimeout(runFlow, 1500);
        }
    }

    function openSponsor(dom) {
        GM_setValue('L4M_STATE', 'RUNNING');
        GM_setValue('L4M_CODE', '');
        document.getElementById('l4m-st').innerText = 'Đang tự động lấy mã...';
        log('Mở tab nhà tài trợ: https://' + dom, '#00f0ff');
        GM_openInTab('https://' + dom, { active: true, insert: true });
        watchCode();
    }

    function watchCode() {
        const t = setInterval(() => {
            const c = GM_getValue('L4M_CODE', '');
            if (c) {
                clearInterval(t);
                document.getElementById('l4m-code').innerText = c;
                log('🎉 Đã nhận mã tài trợ: ' + c, '#4ade80');
                fillAndSubmit(c);
            }
        }, 600);
    }

    function highlightCaptcha() {
        const capBox = document.querySelector('.g-recaptcha, #recaptcha-2, #recaptcha, iframe[src*="recaptcha"]');
        if (capBox) {
            capBox.classList.add('l4m-captcha-glow');
            capBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function fillAndSubmit(c) {
        document.querySelectorAll("input[name='password'], #password-2, #password, .password").forEach(inp => {
            inp.value = c;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        });
        document.querySelectorAll('#ad_banner, .modal-backdrop, [class*="overlay"]').forEach(el => el.remove());

        document.getElementById('l4m-alert').classList.add('show');
        document.getElementById('l4m-st').innerText = 'Đã điền mã! Hãy tick Captcha.';
        log('👉 Hãy tick vào ô Captcha bên dưới để tới link đích!', '#fb923c');
        highlightCaptcha();
        watchToken();
    }

    function watchToken() {
        const pollCap = setInterval(() => {
            let tk = '';
            document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
                if (el.value && el.value.length > 20) tk = el.value;
            });
            if (tk && tk.length > 20) {
                clearInterval(pollCap);
                document.getElementById('l4m-alert').classList.remove('show');
                log('✅ Đã nhận Captcha! Đang lấy link đích...', '#4ade80');
                doSubmit();
            }
        }, 400);
    }

    function doSubmit() {
        if (submitted) return;
        submitted = true;
        document.getElementById('l4m-st').innerText = 'Đang chuyển trang đích...';

        const codeVal = GM_getValue('L4M_CODE', '');
        let validToken = '';
        document.querySelectorAll('[name="g-recaptcha-response"]').forEach(el => {
            if (el.value && el.value.length > 20) validToken = el.value;
        });

        // 1. Direct API submission fallback
        try {
            const forms = [document.querySelector('#main-form-2'), document.querySelector('#main-form')].filter(Boolean);
            forms.forEach(f => {
                const formData = new FormData(f);
                if (codeVal) formData.set('password', codeVal);
                if (validToken) formData.set('g-recaptcha-response', validToken);
                const params = new URLSearchParams(formData).toString();
                const endpoint = (window.api_domain || 'https://s1.link4m.app') + '/links/get-link-info';
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
                    body: params
                }).then(r => r.json()).then(res => {
                    if (res && res.url && !res.url.includes('link4m')) {
                        window.destination_url = res.url;
                        window.location.href = res.url;
                    }
                }).catch(() => {});
            });
        } catch (e) {}

        // 2. Click buttons
        document.querySelectorAll('#main-form-2, #main-form').forEach(f => {
            const b = f.querySelector('button[type="submit"], input[type="submit"], #btn-main-2, #btn-main, .btn, .get-link');
            if (b) b.click();
        });

        // 3. Monitor for destination link
        let c = 0;
        const destT = setInterval(() => {
            c++;
            if (window.destination_url && window.destination_url.startsWith('http') && !window.destination_url.includes('link4m')) {
                clearInterval(destT);
                window.location.href = window.destination_url;
                return;
            }
            const gl = document.querySelector('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
            if (gl) {
                const h = gl.getAttribute('href') || '';
                if (h.startsWith('http') && !h.includes('link4m') && !h.includes('about:blank')) {
                    clearInterval(destT);
                    window.location.href = h;
                    return;
                }
                if (!gl.classList.contains('disabled')) gl.click();
            }
            if (c > 40) clearInterval(destT);
        }, 400);
    }

    window.addEventListener('DOMContentLoaded', () => {
        buildHUD();
        setTimeout(runFlow, 1000);
    });
})();
