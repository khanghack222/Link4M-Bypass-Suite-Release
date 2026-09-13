import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import os
import time
import json
import re
import urllib.request
from playwright.sync_api import sync_playwright

from config import CHROME_PATH, ROOT_DIR, DEST_FILE, CODE_FILE, log, copy_to_clipboard
from sponsor import get_ocr, extract_domain_candidates, probe_domain_live

def is_valid_destination(u: str, sponsor_domain: str = None) -> bool:
    if not u or not isinstance(u, str) or not u.startswith("http"):
        return False
    u_low = u.lower()
    ignored = [
        "gtraffic.io", "client.gtraffic.io", "dr-client.gtraffic.io", "direct.gtraffic.io",
        "cdn.gtraffic.io", "about:blank", "google.com/recaptcha", "gstatic.com/recaptcha",
        "doubleclick.net", "googlesyndication"
    ]
    if any(d in u_low for d in ignored):
        return False
    if sponsor_domain:
        try:
            s_host = urllib.parse.urlparse(sponsor_domain).netloc.lower()
            u_host = urllib.parse.urlparse(u).netloc.lower()
            if s_host and (s_host in u_host or u_host in s_host):
                return False
        except Exception:
            pass
    return True

CAMPAIGN_RULES = [
    (['bong da', 'bóng đá', 'ca cuoc', 'cá cược', 'ca do', 'cá độ', '686'], 'https://bongda686.com'),
    (['ki tu', 'kí tự', '360', 'dac biet', 'đặc biệt'], 'https://kitu360.com'),
    (['phan van', 'phan văn', 'santos'], 'https://phanvansantos.com'),
    (['sun', 'sixtyseven'], 'https://sunwin.sixtyseven.co.in'),
    (['fun', 'greenco'], 'https://greenco.com.co'),
    (['hitclub', 'hit club', 'hit'], 'https://hitclub.com'),
    (['ok365', 'ok 365'], 'https://ok365.com')
]

def resolve_sponsor_domain(keyword_text: str, img_url: str) -> str:
    import unicodedata

    def generate_slug_variants(text: str) -> list:
        nfkd = unicodedata.normalize('NFKD', text or '')
        ascii_t = ''.join([c for c in nfkd if not unicodedata.combining(c)]).replace('đ', 'd').replace('Đ', 'D').lower()
        words = re.findall(r'[a-zA-Z0-9]+', ascii_t)
        variants = []
        if words:
            variants.append(''.join(words))
            if len(words) >= 3:
                variants.append(words[0] + words[1] + words[-1])
                variants.append(''.join(words[:-1]))
                variants.append(words[0] + words[-1])
        return list(dict.fromkeys(variants))

    def is_actual_sponsor(url: str) -> bool:
        if not url: return False
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                return any(w in html for w in [
                    'trade-btn', 'traffic-button', 'pages.dev/traffic', 'pages.dev/bt',
                    'pages.dev/andanh', 'ontops.link', 'client.gtraffic.io', 'captchano', 'verifyclf'
                ])
        except Exception:
            return False

    kw_clean = (keyword_text or "").lower().strip()
    # 1. If keyword contains or is directly a domain (e.g. bebepourlavie.info, thoitiethomnay.org)
    d_matches = re.findall(r'[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?', kw_clean)
    for dm in d_matches:
        if not dm.endswith('.png') and not dm.endswith('.jpg') and not dm.endswith('.js') and not dm.endswith('.svg'):
            live_res = probe_domain_live(dm)
            live_u = live_res[0] if isinstance(live_res, tuple) else live_res
            if live_u and is_actual_sponsor(live_u):
                log(f"[+] Found verified live sponsor from domain in keyword: {live_u}")
                return live_u
            elif live_u:
                log(f"[+] Found live sponsor candidate from keyword: {live_u}")
                return live_u

    # 2. Match known campaigns / rule triggers
    if kw_clean:
        for triggers, domain in CAMPAIGN_RULES:
            if any(t in kw_clean for t in triggers):
                log(f"[+] Match known campaign triggers {triggers} from '{kw_clean}' -> {domain}")
                return domain

    # 3. Slug variants from keyword and probe common TLDs
    slugs = generate_slug_variants(kw_clean)
    for slug in slugs:
        if len(slug) >= 3 and not slug.isdigit():
            log(f"[*] Checking slug candidate '{slug}' for live domains...")
            for tld in ['com', 'vn', 'net', 'org', 'com.vn', 'info', 'xyz', 'top', 'site', 'vip', 'io']:
                test_c = f"{slug}.{tld}"
                live_res = probe_domain_live(test_c)
                live_u = live_res[0] if isinstance(live_res, tuple) else live_res
                if live_u and is_actual_sponsor(live_u):
                    log(f"[+] Found verified live sponsor from keyword slug: {live_u}")
                    return live_u

    if not img_url:
        return None

    log(f"[*] Downloading campaign image for OCR: {img_url}")
    temp_img = os.path.join(ROOT_DIR, "data", "temp", "gtraffic_camp.png")
    os.makedirs(os.path.dirname(temp_img), exist_ok=True)
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp, open(temp_img, "wb") as f:
            f.write(resp.read())
        ocr = get_ocr()
        res, _ = ocr(temp_img)
        lines = [line[1] for line in (res or [])]
        log(f"[*] OCR extracted {len(lines)} lines from campaign image.")
        candidates = extract_domain_candidates(lines)
        if candidates:
            log(f"[*] Domain candidates from image: {candidates}")
            for c in candidates:
                live_res = probe_domain_live(c)
                live_url = live_res[0] if isinstance(live_res, tuple) else live_res
                if live_url and is_actual_sponsor(live_url):
                    log(f"[+] Found verified live sponsor from image: {live_url}")
                    return live_url
            for c in candidates:
                live_res = probe_domain_live(c)
                live_url = live_res[0] if isinstance(live_res, tuple) else live_res
                if live_url:
                    return live_url
    except Exception as e:
        log(f"[!] OCR resolution note: {e}")
    finally:
        if os.path.exists(temp_img):
            try: os.remove(temp_img)
            except Exception: pass

    return None

def run(target_url: str = None, headless: bool = False):
    if not target_url:
        target_url = sys.argv[1].strip() if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "https://gtraffic.io/X3BR2OQ"

    if "--headless" in sys.argv or "-h" in sys.argv or os.environ.get("GTRAFFIC_HEADLESS") == "1":
        headless = True

    log(f"[*] Target Gtraffic URL: {target_url}")
    log(f"[*] Starting Gtraffic Autonomous Engine (Headless: {headless})...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-infobars",
                "--no-first-run"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 850},
            locale="vi-VN",
            timezone_id="Asia/Ho_Chi_Minh",
            ignore_https_errors=True
        )

        final_destination = None

        # TAB 1: Gtraffic Page
        page1 = context.new_page()
        campaign_info = {}
        sponsor_domain = None

        def on_gtraffic_response(res):
            nonlocal final_destination
            u = res.url
            # Capture campaign info
            if "api/url/get" in u or ("api/url" in u and "tracking" not in u and "done" not in u):
                try:
                    data = res.json()
                    dk = data.get("data_keyword") or {}
                    kw_t = dk.get("keyword_text")
                    src_t = dk.get("source")
                    if kw_t is not None:
                        campaign_info["keyword_text"] = kw_t
                    if src_t is not None:
                        campaign_info["source"] = src_t
                    log(f"[TAB 1] Active Campaign: '{campaign_info.get('keyword_text')}' | Image: {campaign_info.get('source')}")
                except Exception:
                    pass
            # Capture final tracking URL
            if "tracking-url" in u or "api/url/done" in u:
                try:
                    data = res.json()
                    log(f"[*] API response from {u}: {data}")
                    dl = data.get("data_link")
                    if isinstance(dl, dict) and dl.get("url") and is_valid_destination(dl.get("url"), sponsor_domain):
                        final_destination = dl.get("url")
                        log(f"🎉 DESTINATION URL INTERCEPTED FROM DATA_LINK: {final_destination}")
                    elif isinstance(dl, str) and is_valid_destination(dl, sponsor_domain):
                        final_destination = dl
                        log(f"🎉 DESTINATION URL INTERCEPTED FROM DATA_LINK STR: {final_destination}")
                    for k in ["result", "url", "link", "destination", "redirect", "redirect_url"]:
                        val = data.get(k)
                        if isinstance(val, str) and is_valid_destination(val, sponsor_domain):
                            final_destination = val
                            log(f"🎉 DESTINATION URL INTERCEPTED FROM API: {final_destination}")
                            break
                except Exception as ex:
                    log(f"[!] Tracking parse note: {ex}")

        def on_page1_nav(frame):
            nonlocal final_destination
            if frame == page1.main_frame:
                u = frame.url
                if is_valid_destination(u, sponsor_domain):
                    final_destination = u
                    log(f"🎉 DESTINATION URL INTERCEPTED FROM NAVIGATION: {final_destination}")

        def on_popup_page(p):
            def on_pop_nav(frame):
                nonlocal final_destination
                if frame == p.main_frame:
                    u = frame.url
                    if is_valid_destination(u, sponsor_domain):
                        final_destination = u
                        log(f"🎉 DESTINATION URL INTERCEPTED FROM POPUP: {final_destination}")
            p.on("framenavigated", on_pop_nav)

        context.on("page", on_popup_page)
        page1.on("framenavigated", on_page1_nav)
        page1.on("response", on_gtraffic_response)

        log("[TAB 1] Navigating to Gtraffic shortlink...")
        try:
            page1.goto(target_url, wait_until="networkidle", timeout=40000)
        except Exception as e:
            log(f"[!] Warning on initial goto: {e}")
        
        # Wait for page1's own API campaign info response
        for _ in range(20):
            if campaign_info.get("keyword_text") or campaign_info.get("source"):
                break
            time.sleep(0.5)

        if not campaign_info.get("keyword_text") or not campaign_info.get("source"):
            try:
                dom_camp = page1.evaluate("""() => {
                    const img = document.querySelector('img[src*="cdn.gtraffic.io"]')?.src || '';
                    return { img };
                }""")
                if dom_camp.get("img") and not campaign_info.get("source"):
                    campaign_info["source"] = dom_camp["img"]
            except Exception:
                pass

        # Resolve sponsor domain
        kw = campaign_info.get("keyword_text", "")
        img = campaign_info.get("source", "")
        log(f"[TAB 1] Active Campaign: '{kw}' | Image: {img}")
        sponsor_domain = resolve_sponsor_domain(kw, img)

        if not sponsor_domain:
            log("[!] Could not determine sponsor website. Halting.")
            browser.close()
            return

        log(f"🎉 TARGET SPONSOR WEBSITE FOR GTRAFFIC: {sponsor_domain}")

        # TAB 2: Sponsor Website
        page2 = context.new_page()
        page2.set_viewport_size({"width": 1280, "height": 800})

        # Load real andanh.js with math helpers
        andanh_file = os.path.join(ROOT_DIR, "src", "core", "andanh.js")
        real_andanh_code = ""
        if os.path.exists(andanh_file):
            try:
                with open(andanh_file, "r", encoding="utf-8") as f_an:
                    real_andanh_code = f_an.read()
            except Exception:
                pass

        if real_andanh_code:
            page2.route("**/andanh.js", lambda route: route.fulfill(
                status=200,
                content_type="application/javascript",
                body=real_andanh_code
            ))

        # Route intercept browser-challenge.js (fulfill with expected rid token)
        def handle_browser_challenge(route):
            url = route.request.url
            import urllib.parse
            parsed = urllib.parse.urlparse(url)
            qs = urllib.parse.parse_qs(parsed.query)
            rid = qs.get("rid", [""])[0]
            log(f"[+] Bypass browser-challenge.js verified for rid: '{rid}'")
            route.fulfill(
                status=200,
                content_type="application/javascript",
                body=f"window.__browser_challenge_ok = '{rid}';"
            )
        page2.route("**/browser-challenge.js*", handle_browser_challenge)

        # 1. Neutralize detectIncognito cleanly & prevent overwriting
        page2.add_init_script("""
            Object.defineProperty(window, 'detectIncognito', {
                get: () => async () => ({ isPrivate: false, browserName: 'Chrome' }),
                set: () => {},
                configurable: false
            });
            window.alert = function() {};
            if (window.navigator && window.navigator.webkitTemporaryStorage) {
                window.navigator.webkitTemporaryStorage.queryUsageAndQuota = function(s, e) {
                    if (typeof s === 'function') s(100, 100000000000);
                };
            }
        """)

        extracted_code = None

        def on_page2_response(res):
            nonlocal extracted_code
            if extracted_code:
                return
            try:
                if any(k in res.url for k in ["api/code", "process-code"]):
                    data = res.json()
                    c = data.get("code") or data.get("data") or data.get("token") or data.get("c")
                    if isinstance(c, dict):
                        c = c.get("code") or c.get("token")
                    if c and isinstance(c, str):
                        c_str = c.strip()
                        if 4 <= len(c_str) <= 25 and not any(w in c_str.lower() for w in ["wait", "giây", "chờ", "vui"]):
                            extracted_code = c_str
                            log(f"\n==========================================")
                            log(f"💎 EXTRACTED CODE FROM NETWORK API: {extracted_code}")
                            log(f"==========================================\n")
            except Exception:
                pass

        page2.on("response", on_page2_response)

        is_direct = "direct.gtraffic.io" in target_url or "dr-client" in target_url
        ref_header = "" if is_direct else "https://www.google.com/"
        log(f"[TAB 2] Opening sponsor site (Direct={is_direct}): {sponsor_domain}")
        try:
            if ref_header:
                page2.goto(sponsor_domain, wait_until="domcontentloaded", referer=ref_header, timeout=40000)
            else:
                page2.goto(sponsor_domain, wait_until="domcontentloaded", timeout=40000)
        except Exception as e:
            log(f"[!] Warning on sponsor goto: {e}")
        time.sleep(2)

        # Clear runb, flag1, runr, cmnmf, mtkf, doneg, coo3, coo4, can cookies so click triggers freshly
        try:
            page2.evaluate("""() => {
                const cookies = ['runb', 'flag1', 'runr', 'cmnmf', 'mtkf', 'doneg', 'coo3', 'coo4', 'can'];
                cookies.forEach(c => {
                    document.cookie = c + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    document.cookie = c + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
                });
                document.querySelectorAll('body > *').forEach(el => {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                });
                document.querySelectorAll('.modal, .popup, #ad_banner').forEach(el => el.remove());
            }""")
        except Exception:
            pass

        # Locate GTraffic button (handles trade-btn-clf, traffic-button-no, trade-btn, trade-d-btn, etc.)
        btn_selector = '#trade-btn-clf, #trade-btn, #trade-d-btn, .trade-d-btn-container, #traffic-button-no, .trade-btn-clf, .trade-btn, #trade-d-btn button, #trade-d-btn a, button:has-text("LẤY MÃ"), a:has-text("LẤY MÃ"), [id*="trade-btn"]'
        log(f"[TAB 2] Scrolling to locate Gtraffic button...")

        # Scroll to bottom first
        try:
            page2.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)
        except Exception:
            pass

        btn = None
        for _ in range(15):
            candidates = page2.locator(btn_selector)
            for idx in range(candidates.count()):
                c_el = candidates.nth(idx)
                box = c_el.bounding_box()
                if box and (box['height'] > 5 or box['width'] > 5):
                    btn = c_el
                    break
            if btn:
                break
            page2.mouse.wheel(0, 500)
            time.sleep(0.3)

        # Trigger click with JavaScript for all button variants
        try:
            page2.evaluate("""() => {
                const targets = [
                    document.getElementById('trade-d-btn'),
                    document.querySelector('.trade-d-btn-container'),
                    document.getElementById('trade-btn-clf'),
                    document.getElementById('trade-btn'),
                    document.getElementById('traffic-button-no')
                ].filter(Boolean);
                for (const el of targets) {
                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    if (typeof el.onclick === 'function') el.onclick();
                    el.click();
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
            }""")
        except Exception:
            pass

        if btn:
            try:
                btn.scroll_into_view_if_needed()
                time.sleep(0.5)
                btn.click(force=True, timeout=3000)
            except Exception:
                pass

        log("⚡ KÍCH HOẠT: Đã nhấn nút 'LẤY MÃ' ➔ Bộ đếm bắt đầu chạy!")

        # Check for CaptchaNo challenge
        time.sleep(1.5)
        is_captcha = page2.evaluate("""() => {
            const c = document.querySelector('.captchano-container');
            return c && !c.classList.contains('hidden');
        }""")

        if is_captcha:
            log("[!] CaptchaNo challenge detected! Solving...")
            for _ in range(10):
                src = page2.evaluate("() => document.getElementById('captchano-img')?.src || ''")
                if src and len(src) > 50:
                    break
                time.sleep(0.5)

            opts = page2.evaluate("() => Array.from(document.querySelectorAll('input[name=\"captchano-choice\"]')).map(el => el.value)")
            chosen_opt = None
            if src.startswith("data:image"):
                import base64
                b64 = src.split(",", 1)[1]
                img_bytes = base64.b64decode(b64)
                ocr = get_ocr()
                res, _ = ocr(img_bytes)
                ocr_text = " ".join([line[1] for line in (res or [])])
                for opt in opts:
                    if opt in ocr_text:
                        chosen_opt = opt
                        break

            if not chosen_opt and opts:
                chosen_opt = opts[0]

            if chosen_opt:
                page2.evaluate(f"""() => {{
                    const r = document.querySelector('input[name="captchano-choice"][value="{chosen_opt}"]');
                    if (r) {{
                        r.checked = true;
                        r.dispatchEvent(new Event('change'));
                    }}
                    const s = document.getElementById('captchano-submit');
                    if (s) s.click();
                }}""")
                time.sleep(1.5)

        # Countdown wait loop with continuous anti-stall scrolling (~95s max)
        for s in range(1, 95):
            if extracted_code:
                break

            # Anti-stall scrolling satisfies is_scroll2 requirement
            page2.mouse.wheel(0, 100 if (s % 2 == 0) else -100)
            time.sleep(1)

            dom_data = page2.evaluate("""() => {
                const c = document.querySelector('#trade-btn-clf__content, #trade-btn__content, #traffic-button-no__content, [id$="__content"]');
                const b = document.querySelector('#trade-btn-clf, #trade-btn, #traffic-button-no, #trade-d-btn, #notice-btn, [id*="trade-btn"]');
                const inputs = Array.from(document.querySelectorAll('input[value], [data-code]')).map(el => el.value || el.dataset.code);
                return {
                    content: (c && c.textContent) || "",
                    btn: (b && b.textContent) || "",
                    inputs: inputs
                };
            }""")

            c_val = str(dom_data.get("content", "")).strip()
            if s % 10 == 0 or (s >= 55 and s % 2 == 0) or (c_val and not c_val.isdigit()):
                if s % 10 == 0 or s >= 55:
                    log(f"  [Countdown] {s}s elapsed | Content: '{c_val}'")

            # Check if content has transformed into code
            if c_val and not c_val.isdigit() and len(c_val) >= 4:
                cleaned = re.sub(r'^(?:Code|M[ãa]|M[ãa]\s*x[áa]c\s*nh[ậa]n|M[ãa]\s*KM)[\s\:\-]+', '', c_val, flags=re.IGNORECASE).strip()
                if cleaned and not any(w in cleaned.lower() for w in ["giây", "chờ", "vui lòng", "robot"]):
                    extracted_code = cleaned
                    log(f"\n==========================================")
                    log(f"💎 EXTRACTED GTRAFFIC CODE FROM CONTENT: {extracted_code}")
                    log(f"==========================================\n")
                    break

            # Check inputs / data-code
            for val in dom_data.get("inputs", []):
                v_clean = str(val).strip()
                if re.match(r'^[A-Za-z0-9]{5,20}$', v_clean) and not any(w in v_clean.lower() for w in ["giay", "giây", "code", "wait"]):
                    extracted_code = v_clean
                    log(f"\n==========================================")
                    log(f"💎 EXTRACTED CODE FROM INPUT/DATA-ATTR: {extracted_code}")
                    log(f"==========================================\n")
                    break

        if not extracted_code:
            # Final fallback check in DOM
            final_t = page2.evaluate("() => document.getElementById('trade-btn-clf')?.innerText || document.getElementById('traffic-button-no')?.innerText || document.body.innerText || ''").strip()
            for m in re.finditer(r'\b([A-Za-z0-9]{5,20})\b', final_t):
                w = m.group(1)
                if w.lower() not in ["traffic", "button", "content", "google", "sponsor", "script", "vietnam", "mobile", "sunwin", "code", "robot"]:
                    extracted_code = w
                    log(f"💎 EXTRACTED CODE ON FALLBACK: {extracted_code}")
                    break

        try: page2.close()
        except Exception: pass

        if not extracted_code:
            log("[!] Could not retrieve verification code from sponsor button. Halting.")
            browser.close()
            return

        # Write code to extracted_code.txt
        try:
            with open(CODE_FILE, "w", encoding="utf-8") as fc:
                fc.write(extracted_code)
        except Exception:
            pass

        # Switch back to TAB 1 to submit code
        log("[TAB 1] Switching back to Gtraffic tab to submit code...")
        page1.bring_to_front()
        time.sleep(1)

        # Fill code
        inp = page1.locator('input[placeholder*="Nhập mã xác nhận"], input[placeholder*="Nhập mã"], input[placeholder*="xác nhận"]').first
        if inp.count() > 0:
            inp.click()
            inp.fill(extracted_code)
            inp.dispatch_event("input")
            inp.dispatch_event("change")
            log(f"[+] Filled code '{extracted_code}' into Gtraffic form!")

        time.sleep(1)
        # Click submit button
        submit_btn = page1.locator('button:has-text("Nhập mã xác nhận"), button:has-text("NHẬP MÃ XÁC NHẬN"), button:has-text("XÁC NHẬN")').first
        if submit_btn.count() > 0:
            submit_btn.click()
            log("[+] Clicked 'NHẬP MÃ XÁC NHẬN'!")

        # Wait for destination URL (listen to network response, DOM link reveal, or navigation)
        log("[*] Waiting for destination URL unlock (up to 40s)...")
        for sec in range(40):
            time.sleep(1)
            if is_valid_destination(final_destination, sponsor_domain):
                break
            # Check DOM for revealed link <a>
            try:
                revealed_links = page1.evaluate("""() => {
                    return Array.from(document.querySelectorAll('a[href]'))
                        .map(a => a.href)
                        .filter(h => h && h.startsWith('http') && !h.includes('gtraffic.io') && !h.includes('facebook') && !h.includes('twitter') && !h.includes('instagram') && !h.includes('telegram') && !h.includes('linkedin'));
                }""")
                for lk in (revealed_links or []):
                    if is_valid_destination(lk, sponsor_domain):
                        final_destination = lk
                        log(f"🎉 DESTINATION URL FOUND IN DOM LINK: {final_destination}")
                        break
            except Exception:
                pass
            if is_valid_destination(final_destination, sponsor_domain):
                break
            curr_url = page1.url
            if is_valid_destination(curr_url, sponsor_domain):
                final_destination = curr_url
                break

        if is_valid_destination(final_destination, sponsor_domain):
            log(f"\n==========================================")
            log(f"🎉 FINAL DESTINATION URL: {final_destination}")
            log(f"==========================================\n")
            try:
                with open(DEST_FILE, "w", encoding="utf-8") as f:
                    f.write(str(final_destination))
                desk = os.path.expanduser(r"~\Desktop\destination_url.txt")
                with open(desk, "w", encoding="utf-8") as fd:
                    fd.write(str(final_destination))
            except Exception:
                pass
            copy_to_clipboard(str(final_destination))
        else:
            log("[!] Warning: Could not unlock final destination URL from Gtraffic.")

        browser.close()

if __name__ == "__main__":
    run()
