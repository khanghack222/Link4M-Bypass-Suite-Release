import sys, os, time, re, io, json, requests
sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
import cv2
import numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
from playwright.sync_api import sync_playwright

BASE_DIR = r"C:\Users\XUAN\.gemini\antigravity\scratch\Link4M_Bypass_Suite"
DEST_FILE = os.path.join(BASE_DIR, "DESTINATION_FINAL_URL.txt")
CODE_FILE = os.path.join(BASE_DIR, "extracted_code.txt")

executor = ThreadPoolExecutor(max_workers=9)
http_session = requests.Session()
http_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
})

def analyze_tile_url(args):
    idx, url = args
    if url.startswith('/'):
        url = 'https://frame.103-141-140-153.sslip.io' + url
    try:
        r = http_session.get(url, timeout=5)
        im = Image.open(io.BytesIO(r.content)).convert('RGB')
        arr = np.array(im)
        hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
        mask = (hsv[:, :, 1] > 30) | (hsv[:, :, 2] < 150)
        mask_u8 = mask.astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return (idx, 0, 0, 0)
        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.035 * peri, True)
        num_v = len(approx)
        circ = 4 * np.pi * area / (peri * peri) if peri > 0 else 0
        return (idx, num_v, round(circ, 2), round(area, 1))
    except Exception:
        return (idx, 0, 0, 0)

def run(target_url: str = None, headless: bool = None):
    if not target_url:
        target_url = sys.argv[1].strip() if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "https://layma.net/pohWNZgba"
    if headless is None:
        headless = "--headless" in sys.argv or "-h" in sys.argv or os.environ.get("LAYMA_HEADLESS") == "1"

    sponsor_domain = "agilafc.com"
    traffic_key = "4AzF9IZh9"

    print("=" * 60)
    print(f"🚀 LINK4M / LAYMA BYPASS ENGINE - TARGET: {target_url}")
    print("=" * 60)
    print(f"[*] Target LayMa URL: {target_url}")
    print(f"[*] Sponsor Domain: https://{sponsor_domain} (Platform: Google, Key: {traffic_key})")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--window-size=1280,720'
            ]
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 720}
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            try {
                Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
                Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
                window.hasFocus = () => true;
            } catch (e) {}
        """)

        # 1. Open LayMa page
        page_layma = context.new_page()
        final_destination_url = None
        direct_redirect_url = None

        def on_nav(frame):
            nonlocal final_destination_url
            if frame == page_layma.main_frame:
                u = frame.url
                if u and u.startswith("http") and "layma.net" not in u:
                    final_destination_url = u
                    print(f"🎯 Bắt được chuyển trang đích tức thì: {final_destination_url}")
        page_layma.on("framenavigated", on_nav)

        def on_layma_res(res):
            nonlocal final_destination_url, direct_redirect_url
            if any(ep in res.url for ep in ["/api/traffic/checkcode", "/checkcode"]):
                try:
                    raw = res.text()
                    m_go = re.search(r"https?://[^\s\"\'<>]*/api/traffic/go/[A-Za-z0-9_\-]+", raw)
                    if m_go:
                        direct_redirect_url = m_go.group(0)
                        print(f"🎯 Bắt được direct_redirect_url từ text: {direct_redirect_url}")
                    else:
                        data = res.json()
                        u = data.get("redirectUrl") or data.get("RedirectUrl") or data.get("url")
                        if u and u.startswith("http"):
                            direct_redirect_url = u
                            print(f"🎯 Nhận redirectUrl từ JSON: {direct_redirect_url}")
                except Exception:
                    pass
        page_layma.on("response", on_layma_res)

        print(f"[*] Step 1: Navigating to LayMa shortlink: {target_url}...")
        page_layma.goto(target_url, wait_until="domcontentloaded")
        time.sleep(2)

        camp_id = page_layma.locator("#campainId").inner_text().strip()
        print(f"[+] Campaign ID on LayMa: {camp_id}")

        # 2. Open Sponsor page (agilafc.com)
        page_sponsor = context.new_page()
        extracted_layma_code = None

        def route_frame_js(route):
            res = route.fetch()
            text = res.text()
            text = text.replace("function automationProbe() {", "function automationProbe() { return { artifacts: [], missingApis: [] };")
            text = text.replace("function webglInfo() {", "function webglInfo() { return { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)' };")
            text = text.replace("webdriver: navigator.webdriver === true,", "webdriver: false,")
            text = text.replace("untrustedEvents: behavior.untrustedEvents,", "untrustedEvents: 0,")
            text = text.replace("mouseEvents: behavior.mouseEvents,", "mouseEvents: 142,")
            text = text.replace("solveMs: Math.round(performance.now() - state.startedAt),", "solveMs: Math.max(3800, Math.round(performance.now() - state.startedAt)),")
            text = text.replace("const state = {", "window.__qc_state = null; const state = window.__qc_state = {")
            text = text.replace("async function skipType(reason) {", "window.__qc_skip = skipType; async function skipType(reason) {")
            text = text.replace("async function submit(override, extra = {}) {", "window.__qc_submit = submit; async function submit(override, extra = {}) {")
            route.fulfill(response=res, body=text)

        def route_traffic_js(route):
            res = route.fetch()
            text = res.text()

            # Force flatform = 'google'
            text = re.sub(r"var\s+flatform\s*=\s*checkReferer\(referrer\);", "var flatform = 'google';", text)
            text = re.sub(r"flatform\s*=\s*checkReferer\(referrer\);", "flatform = 'google';", text)
            text = text.replace("var flatform = 'tructiep';", "var flatform = 'google';")

            # Force Solution 1 (1 single page, 1 step)
            text = text.replace(
                'randomSolution = Math.floor((Math.random() * 2));',
                'randomSolution = 0;'
            )
            # Bypass incognito
            text = text.replace(
                'var detectIncognito = function () {',
                'var detectIncognito = function () { return Promise.resolve({ isPrivate: false, browserName: "Chrome" }); }; var _old_detect = function() {'
            )
            # Fix DOM container null
            text = text.replace(
                'document.getElementById("xacthucButton").style.display = "block";',
                'if (!document.getElementById("xacthucButton")) { showTrackingMessage(""); } document.getElementById("xacthucButton").style.display = "block";'
            )
            # Bypass wait satisfied check
            text = text.replace('function canOpenGetCode(element) {', 'function canOpenGetCode(element) { return true;')
            text = text.replace('function isGetCodeWaitSatisfied(element) {', 'function isGetCodeWaitSatisfied(element) { return true;')
            text = text.replace('function haltIfSpeedHack() {', 'function haltIfSpeedHack() { return false;')
            text = text.replace('function detectSpeedHack() {', 'function detectSpeedHack() { return false;')
            text = text.replace('function submitGetCodeRequest(element, solution, captchaPayload, isRetry) {', 'window.__submitGetCode = submitGetCodeRequest; function submitGetCodeRequest(element, solution, captchaPayload, isRetry) {')
            text = text.replace('function checkButtonClick(step = 4){', 'window.__checkButtonClick = checkButtonClick; function checkButtonClick(step = 4){')
            text = re.sub(r"checkScrollUpDown\w*\([^)]*\);\s*return true;", "return false;", text)
            text = re.sub(r"checkClickManHinh\w*\([^)]*\);\s*return true;", "return false;", text)
            route.fulfill(response=res, body=text)

        page_sponsor.route("**/frame.js", route_frame_js)
        page_sponsor.route("**/Traffic/Index/*", route_traffic_js)
        page_sponsor.route("**/traffic/index/*", route_traffic_js)

        def on_sponsor_res(res):
            nonlocal extracted_layma_code
            if "/api/traffic/getcode" in res.url:
                try:
                    data = res.json()
                    print(f"[+] /api/traffic/getcode response: {data}")
                    c_val = data.get("html") if isinstance(data, dict) else data
                    if c_val and "không hợp lệ" not in str(c_val) and "Chưa hoàn thành" not in str(c_val):
                        extracted_layma_code = str(c_val).strip()
                        print(f"🎉 SUCCESS! EXTRACTED LAYMA CODE: {extracted_layma_code}")
                except Exception:
                    pass
        page_sponsor.on("response", on_sponsor_res)

        print(f"[*] Step 2: Navigating to sponsor: https://{sponsor_domain} with Google Referer...")
        page_sponsor.goto(
            f"https://{sponsor_domain}",
            referer="https://www.google.com/",
            wait_until="domcontentloaded"
        )
        time.sleep(2)

        # Click the LẤY MÃ button
        time.sleep(1.0)
        clicked = page_sponsor.evaluate(f"""() => {{
            const el = document.getElementById('{traffic_key}');
            if (el) {{
                const sp = el.querySelector('span') || el;
                sp.click();
                return true;
            }}
            return false;
        }}""")
        if clicked:
            print("⚡ Kích hoạt nút LẤY MÃ thành công! Bắt đầu đếm ngược 60s...")
        else:
            print("[!] Thử query selector click nút lấy mã...")
            page_sponsor.evaluate("() => { const b = document.querySelector('[class*=\"Ran\"], button[id], div[id*=\"4Az\"]'); if (b) b.click(); }")

        # Wait 60 seconds with scrolling to keep session active
        dir_w = 1
        for sec in range(65, 0, -1):
            time.sleep(1.0)
            if sec % 10 == 0:
                print(f"  ⌛ Đang chờ máy chủ xác nhận thời gian on-site: còn {sec}s...")
                dir_w = -dir_w
                try: page_sponsor.mouse.wheel(0, 150 * dir_w)
                except Exception: pass

        print("[*] Hết thời gian chờ (60s+)! Mở modal xác thực QCaptcha...")
        page_sponsor.evaluate("() => { if (typeof window.__checkButtonClick === 'function') window.__checkButtonClick(4); }")

        try:
            frame_el = page_sponsor.wait_for_selector('iframe[src*="sslip.io"], iframe[src*="frame.html"]', timeout=30000)
            cf = frame_el.content_frame()
            cf.wait_for_selector('#box', timeout=30000)
            time.sleep(1)
            print("[*] Nhấn checkbox xác thực 'Tôi là con người'...")
            cf.click('#box', force=True)
        except Exception as e:
            print(f"[!] Warning waiting for frame/box: {e}")

        def get_qc_frame():
            for f in page_sponsor.frames:
                if any(k in f.url for k in ['sslip.io', 'frame.html']):
                    if not f.is_detached():
                        return f
            return None

        last_cid = None

        # Solve QCaptcha loop
        print("[*] Bắt đầu tự động giải QCaptcha challenge...")
        for round_idx in range(30):
            time.sleep(1.0)

            token = page_sponsor.evaluate('''() => {
                const api = window.hcaptcha || window.qcaptcha;
                return api && typeof api.getResponse === 'function' ? api.getResponse() : null;
            }''')
            if token:
                print(f"[🎉] QCaptcha Token Verified: {token[:40]}...")
                print("[*] Gửi token lên máy chủ lấy mã...")
                page_sponsor.evaluate('''([tok, key]) => {
                    const el = document.getElementById(key);
                    if (typeof window.__submitGetCode === 'function') {
                        window.__submitGetCode(el, '0', { qCaptchaToken: tok });
                    }
                    for (const b of document.querySelectorAll('#qcaptcha-modal-content button, button')) {
                        if (b.innerText.includes('Xác thực và lấy mã')) {
                            b.click();
                            break;
                        }
                    }
                }''', [token, traffic_key])
                break

            cur_cf = get_qc_frame()
            if not cur_cf:
                continue

            ch_info = cur_cf.evaluate('''() => {
                if (window.__qc_state && window.__qc_state.challenge) {
                    const ch = window.__qc_state.challenge;
                    return {
                        cid: ch.cid,
                        type: ch.type,
                        spec: ch.spec,
                        assets: (ch.assets || []).map(a => a.url)
                    };
                }
                return null;
            }''')

            if not ch_info:
                continue

            if ch_info['cid'] == last_cid:
                time.sleep(1.0)
                continue

            c_type = ch_info['type']
            assets = ch_info['assets']
            spec = ch_info['spec'] or {}
            q_text = (spec.get('questionKey') or spec.get('question', {}).get('vi', '') or '').lower()
            last_cid = ch_info['cid']
            print(f"[+] Nhận dạng Challenge: {c_type} ('{q_text}')")

            if c_type in ['grid3x3', 'oddoneout', 'relational']:
                args_list = [(i, u) for i, u in enumerate(assets)]
                features = list(executor.map(analyze_tile_url, args_list))
                features.sort(key=lambda x: x[0])

                target = []
                if 'khác nhóm' in q_text or 'khác' in q_text or c_type == 'oddoneout':
                    v_counts = [f[1] for f in features]
                    for i, v in enumerate(v_counts):
                        if v_counts.count(v) == 1:
                            target = [i]
                            break
                    if not target:
                        circs = [round(f[2], 1) for f in features]
                        for i, c in enumerate(circs):
                            if circs.count(c) == 1:
                                target = [i]
                                break
                elif 'tam giác' in q_text or 'triangle' in q_text:
                    target = [f[0] for f in features if f[1] == 3]
                elif 'vuông' in q_text or 'square' in q_text or 'chữ nhật' in q_text or 'rectangle' in q_text:
                    target = [f[0] for f in features if f[1] == 4]
                elif 'ngũ giác' in q_text or 'pentagon' in q_text:
                    target = [f[0] for f in features if f[1] == 5]
                elif 'lục giác' in q_text or 'hexagon' in q_text:
                    target = [f[0] for f in features if f[1] == 6]
                elif 'tròn' in q_text or 'circle' in q_text:
                    target = [f[0] for f in features if f[2] > 0.75]
                else:
                    v_counts = [f[1] for f in features]
                    for i, v in enumerate(v_counts):
                        if v_counts.count(v) == 1:
                            target = [i]
                            break

                if not target:
                    target = [0]

                print(f"   ➔ Đáp án chọn: {target}")
                cur_cf.evaluate('''(ans) => {
                    if (typeof window.__qc_submit === 'function') {
                        window.__qc_submit(ans);
                    }
                }''', target)
                time.sleep(0.6)

            elif c_type == 'order':
                args_list = [(i, u) for i, u in enumerate(assets)]
                features = list(executor.map(analyze_tile_url, args_list))
                features.sort(key=lambda x: x[0])
                direction = spec.get('direction', 'desc')
                if 'nhỏ đến lớn' in q_text or direction == 'asc':
                    sorted_by_area = sorted(features, key=lambda x: x[3])
                else:
                    sorted_by_area = sorted(features, key=lambda x: x[3], reverse=True)
                target = [f[0] for f in sorted_by_area]
                print(f"   ➔ Thứ tự sắp xếp: {target}")
                cur_cf.evaluate('''(ans) => {
                    if (typeof window.__qc_submit === 'function') {
                        window.__qc_submit(ans);
                    }
                }''', target)
                time.sleep(0.6)

            else:
                print(f"   ➔ Đổi dạng challenge ({c_type})...")
                cur_cf.evaluate('''() => {
                    if (typeof window.__qc_skip === 'function') {
                        window.__qc_skip();
                    }
                }''')
                time.sleep(0.4)

        # Wait for extracted code (turbo loop)
        for _ in range(25):
            if extracted_layma_code:
                break
            c_dom = page_sponsor.evaluate(f'''() => {{
                const el = document.getElementById('{traffic_key}');
                if (el) {{
                    const m = (el.innerText || '').match(/([A-Za-z0-9_\\-]{{4,20}})/);
                    if (m && !/lay|ma|click|link|sau|kiem/i.test(m[1])) return m[1];
                }}
                const cb = document.getElementById('trackingMessageContainer');
                if (cb) {{
                    const m = (cb.innerText || '').match(/([A-Za-z0-9_\\-]{{4,20}})/);
                    if (m && !/lay|ma|click|link|sau|kiem/i.test(m[1])) return m[1];
                }}
                return null;
            }}''')
            if c_dom and "Chưa hoàn thành" not in str(c_dom):
                extracted_layma_code = c_dom
                break
            time.sleep(0.25)

        if not extracted_layma_code:
            print("[!] Không lấy được mã LayMa. Kết thúc.")
            browser.close()
            return

        with open(CODE_FILE, "w", encoding="utf-8") as f_c:
            f_c.write(extracted_layma_code)

        # 3. Submit Code to LayMa
        print(f"\n[*] Step 3: Nhập mã '{extracted_layma_code}' vào form LayMa: {target_url}...")
        page_layma.bring_to_front()
        time.sleep(0.3)

        page_layma.evaluate('''(code) => {
            // Hook window.open and resolveCheckCodeRedirect to skip 3s countdown
            window.open = function(u) {
                if (u && typeof u === 'string') window.location.href = u;
            };
            const oldResolve = window.resolveCheckCodeRedirect;
            window.resolveCheckCodeRedirect = function(res) {
                const u = oldResolve ? oldResolve(res) : (typeof res === 'string' ? res : (res && res.redirectUrl));
                if (u && typeof u === 'string') {
                    window.location.href = u;
                }
                return u;
            };

            const inp = document.getElementById('codeInput') || document.querySelector('input[name="code"]');
            if (inp) {
                inp.value = code;
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                inp.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (typeof redeemCode === 'function') {
                redeemCode();
            } else {
                const btn = document.getElementById('btn-xac-nhan') || document.querySelector('button[onclick*="submitCode"]');
                if (btn) btn.click();
            }
        }''', extracted_layma_code)
        print("✔ Đã gửi xác nhận mã trên LayMa!")

        # Wait for redirect or resolve direct_redirect_url instantly
        for wait_i in range(80):
            if direct_redirect_url:
                print(f"[*] Xử lý chuyển hướng ngay từ direct_redirect_url: {direct_redirect_url}...")
                try:
                    r_redir = http_session.get(direct_redirect_url, allow_redirects=True, timeout=8)
                    if r_redir.url and "layma.net" not in r_redir.url:
                        final_destination_url = r_redir.url
                        break
                except Exception as ex:
                    pass

            if final_destination_url and "layma.net" not in final_destination_url:
                break
            time.sleep(0.1)
            curr = page_layma.url
            if curr and curr.startswith("http") and "layma.net" not in curr:
                final_destination_url = curr
                break

        if final_destination_url:
            print("\n" + "=" * 70)
            print(f"🎉🎉🎉 FINAL DESTINATION URL: {final_destination_url}")
            print("=" * 70 + "\n")
            with open(DEST_FILE, "w", encoding="utf-8") as f_d:
                f_d.write(final_destination_url)
        else:
            print("[!] Đang kiểm tra DOM phản hồi của LayMa...")
            dom_status = page_layma.evaluate('''() => {
                const th = document.getElementById('thongbao');
                const cd = document.getElementById('countRedirect');
                return {
                    thongbao: th ? th.innerText : null,
                    countRedirect: cd ? cd.innerText : null,
                    url: window.location.href
                };
            }''')
            print(f"[!] DOM status: {dom_status}")

        time.sleep(2)
        browser.close()

if __name__ == "__main__":
    run()
