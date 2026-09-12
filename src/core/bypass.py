import sys
sys.stdout.reconfigure(encoding='utf-8')

import time
import re
import urllib.request
from playwright.sync_api import sync_playwright
from recaptcha_solver import RecaptchaAudioSolver
from rapidocr_onnxruntime import RapidOCR

import os

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

BASE_DIR = os.path.abspath(os.path.join(CORE_DIR, "..", ".."))
LOG_FILE = os.path.join(BASE_DIR, "e2e_bypass.log")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
CACHE_FILE = os.path.join(DATA_DIR, "campaign_cache.json")

import json
from typing import Optional, Dict, Any

def load_cache() -> Dict[str, Any]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_cache(key: str, code: str):
    cache = load_cache()
    cache[key.lower().strip()] = {"code": code.strip(), "timestamp": time.time()}
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
        log(f"[💾 CACHE SAVED] Stored mission code '{code}' for '{key}'")
    except Exception as e:
        log(f"[!] Failed to save cache: {e}")

def get_cached_code(key: str, max_age_hours: int = 12) -> Optional[str]:
    item = load_cache().get(key.lower().strip())
    if item and isinstance(item, dict):
        if time.time() - item.get("timestamp", 0) < max_age_hours * 3600:
            return item.get("code")
    return None

def get_chrome_path():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "chrome"

CHROME_PATH = get_chrome_path()

def log(msg: str):
    print(f"[{time.strftime('%X')}] {msg}", flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%X')}] {msg}\n")

def harvest_code_browser(context, sponsor_url: str) -> Optional[str]:
    log(f"[*] Tab 2: Opening Google.com then navigating to {sponsor_url}...")
    page_sponsor = context.new_page()
    try:
        page_sponsor.goto("https://www.google.com", wait_until="domcontentloaded", timeout=30000)
    except Exception:
        pass
    time.sleep(1)

    try:
        page_sponsor.goto(sponsor_url, wait_until="domcontentloaded", referer="https://www.google.com/", timeout=45000)
    except Exception as e:
        log(f"[!] Warning navigating to sponsor URL: {e}")
    time.sleep(2)

    # Detect traffic key from HTML or scripts
    html_sponsor = page_sponsor.content()
    m_key = re.search(r'(?:what-on\.com|website-analytics\.net|traffic)[^"\']*?key=([a-zA-Z0-9]+)', html_sponsor)
    traffic_key = m_key.group(1) if m_key else None
    if not traffic_key:
        div_ids = page_sponsor.evaluate("() => Array.from(document.querySelectorAll('div[id]')).map(d => d.id).filter(id => /^[a-zA-Z0-9]{8}$/.test(id))")
        if div_ids:
            traffic_key = div_ids[0]
    log(f"[*] Detected traffic_key: {traffic_key}")

    page_sponsor.evaluate("""() => {
        document.querySelectorAll('script[type="rocketlazyloadscript"]').forEach(s => {
            const newScript = document.createElement('script');
            if (s.hasAttribute('data-rocket-src')) {
                let src = s.getAttribute('data-rocket-src');
                if (src.startsWith('//')) src = 'https:' + src;
                newScript.src = src;
            } else {
                newScript.textContent = s.textContent;
            }
            document.body.appendChild(newScript);
        });
    }""")
    time.sleep(2)

    if traffic_key:
        page_sponsor.evaluate(f"() => {{ window.location.hash = '#ss-{traffic_key}'; if (typeof forceShowButton === 'function') forceShowButton(); }}")
        time.sleep(2)

    log("[*] Scrolling to footer on sponsor site...")
    page_sponsor.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1.5)

    log("[*] Finding 'LẤY MÃ' button on sponsor site...")
    btn_selector = f"[id='{traffic_key}'] button, [id='{traffic_key}'] [type='button'], [id='{traffic_key}'] a, [id='{traffic_key}'], button:has-text('LẤY MÃ'), button:has-text('Lấy mã'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), a:has-text('Lấy mã'), .whatoncode" if traffic_key else "button:has-text('LẤY MÃ'), button:has-text('Lấy mã'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), a:has-text('Lấy mã'), .whatoncode"
    btn = page_sponsor.locator(btn_selector)
    if btn.count() == 0:
        log("[!] Could not find LẤY MÃ button! Trying to scroll and retry...")
        page_sponsor.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        btn = page_sponsor.locator(btn_selector)

    if btn.count() == 0:
        log("[!] Button still not found.")
        page_sponsor.close()
        return None

    code_found = None
    def on_sponsor_resp(res):
        nonlocal code_found
        if "get_quest_code.html" in res.url:
            try:
                data = res.json()
                log(f"[+] INTERCEPTED get_quest_code: {data}")
                if data.get("success"):
                    if "id" in data:
                        log(f"[+] Quest ID captured: {data['id']}")
                    else:
                        code_found = data.get("html")
                        log(f"🎉 EXTRACTED SPONSOR CODE FROM API: {code_found}")
            except Exception as e:
                log(f"[!] Sponsor resp parse error: {e}")

    page_sponsor.on("response", on_sponsor_resp)

    current_step = 1
    max_steps = 3
    visited_urls = set([sponsor_url.rstrip("/")])

    while current_step <= max_steps and not code_found:
        log(f"\n==========================================")
        log(f"[*] EXECUTING STEP {current_step} ON SPONSOR SITE")
        log(f"==========================================")

        if current_step > 1:
            article_target = None
            try:
                links = page_sponsor.locator("a[href^='https://']").all()
                for a in links:
                    h = a.get_attribute("href") or ""
                    h_clean = h.rstrip("/")
                    if sponsor_url in h and h_clean not in visited_urls and not any(x in h for x in [".jpg", ".png", ".webp", ".css", ".js", "feed", "wp-", "#"]):
                        article_target = h
                        visited_urls.add(h_clean)
                        break
            except Exception:
                pass

            if not article_target:
                article_target = sponsor_url + f"/bai-viet-{current_step}/"
                visited_urls.add(article_target.rstrip("/"))

            log(f"[*] Navigating to Step {current_step} article: {article_target}")
            try:
                page_sponsor.goto(article_target, wait_until="domcontentloaded", timeout=45000)
            except Exception as e:
                log(f"[!] Warning on article navigation: {e}")
            time.sleep(2)

            page_sponsor.evaluate("""() => {
                document.querySelectorAll('script[type="rocketlazyloadscript"]').forEach(s => {
                    const newScript = document.createElement('script');
                    if (s.hasAttribute('data-rocket-src')) {
                        let src = s.getAttribute('data-rocket-src');
                        if (src.startsWith('//')) src = 'https:' + src;
                        newScript.src = src;
                    } else {
                        newScript.textContent = s.textContent;
                    }
                    document.body.appendChild(newScript);
                });
            }""")
            time.sleep(1.5)

            if traffic_key:
                page_sponsor.evaluate(f"() => {{ window.location.hash = '#ss-{traffic_key}'; if (typeof forceShowButton === 'function') forceShowButton(); }}")
                time.sleep(1.5)

            page_sponsor.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)

            btn = page_sponsor.locator(btn_selector)
            if btn.count() == 0:
                log(f"[!] Step {current_step}: Button not found immediately, scrolling more...")
                page_sponsor.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
                btn = page_sponsor.locator(btn_selector)

            if btn.count() == 0:
                log(f"[!] Step {current_step}: Button still not found. Skipping...")
                break

        log(f"[+] Step {current_step}: Button located. Clicking...")
        page_sponsor.evaluate("() => document.querySelectorAll('#hpps-popup, .hpps-popup, .popup, .modal, [class*=\"popup\"], [id*=\"popup\"]').forEach(e => e.remove())")
        try:
            btn.first.click(force=True)
        except Exception:
            btn.first.evaluate("el => el.click()")
        time.sleep(2)

        detected_sec = page_sponsor.evaluate(f"() => {{ const el = document.getElementById('{traffic_key}'); return el && el.dataset.time ? parseFloat(el.dataset.time) : 60; }}")
        log(f"[*] Step {current_step}: Detected countdown duration = {detected_sec}s")

        wait_limit = int(detected_sec) + 15 if detected_sec else 75
        log(f"[*] Waiting for countdown (max {wait_limit}s)...")

        for sec in range(1, wait_limit + 1):
            if code_found:
                break
            time.sleep(1)
            delta = 60 if sec % 2 == 0 else -40
            page_sponsor.evaluate(f"() => {{ window.scrollBy(0, {delta}); window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('mousewheel')); }}")

            rem = page_sponsor.evaluate(f"() => {{ const el = document.getElementById('{traffic_key}'); return el && el.dataset.time ? parseFloat(el.dataset.time) : null; }}")
            if sec % 5 == 0 or (rem is not None and rem <= 5):
                log(f"  [Step {current_step} - {sec}s] Remaining: {rem}s")

            if code_found:
                log(f"🎉 Code acquired during Step {current_step} at {sec}s!")
                break

            has_quest = page_sponsor.evaluate("() => { for (let k in localStorage) { if (k.includes('_quest')) return true; } return false; }")
            if rem is not None and rem <= 0:
                time.sleep(2)
                if code_found or has_quest:
                    log(f"[+] Step {current_step} countdown completed at {sec}s!")
                    break

        if not code_found:
            current_step += 1

    if not code_found:
        body_text = page_sponsor.evaluate("() => document.body.innerText")
        m_body = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', body_text)
        if m_body:
            code_found = m_body.group(1)
            log(f"[+] FOUND CODE IN BODY TEXT: {code_found}")

    page_sponsor.close()
    return code_found

def run(target_url: str = None):
    if not target_url:
        if len(sys.argv) > 1:
            target_url = sys.argv[1].strip()
        else:
            target_url = "https://link4m.net/go/2kCcIqn"

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== STARTING DYNAMIC E2E AUTOMATION ===\n")

    log(f"[*] Target Link4M URL: {target_url}")
    log("[*] Starting full end-to-end automation with real Chrome...")
    
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars",
            "--ignore-certificate-errors",
            "--allow-running-insecure-content"
        ]
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=False, args=args)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 768},
            ignore_https_errors=True
        )

        # ANTI-DETECT & INCOGNITO BYPASS HOOK
        context.add_init_script("""
            if (window.navigator && window.navigator.webkitTemporaryStorage) {
                window.navigator.webkitTemporaryStorage.queryUsageAndQuota = function(successCallback, errorCallback) {
                    if (typeof successCallback === 'function') {
                        successCallback(0, 500 * 1024 * 1024 * 1024);
                    }
                };
            }
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)

        # Tab 1: Mở Link4M để giữ phiên
        log(f"[*] Tab 1: Opening {target_url}...")
        page_link = context.new_page()

        # Network interceptor for Link4M API responses
        final_destination_url = None
        def handle_response(response):
            nonlocal final_destination_url
            if "/links/get-link-info" in response.url or "/links/check-captcha" in response.url:
                try:
                    data = response.json()
                    log(f"[+] Intercepted Link4M API response ({response.url}): {data}")
                    if (data.get("success") or data.get("status")) and data.get("url"):
                        final_destination_url = data.get("url")
                        log(f"🎉 DESTINATION URL INTERCEPTED FROM API: {final_destination_url}")
                    elif data.get("return"):
                        final_destination_url = data.get("return")
                        log(f"🎉 DESTINATION/REDIRECT URL INTERCEPTED: {final_destination_url}")
                    elif not data.get("success") and not data.get("status"):
                        log(f"[!] Link4M API returned info/error: {data.get('info') or data.get('message')}")
                except Exception as e:
                    log(f"[!] Parse error on Link4M API response: {e}")

        page_link.on("response", handle_response)

        # Popup handler
        def handle_popup(popup):
            nonlocal final_destination_url
            try:
                popup.wait_for_load_state(timeout=5000)
                u = popup.url
                if u and is_valid_destination(u) and (not sponsor_url or sponsor_url not in u):
                    final_destination_url = u
                    log(f"🎉 POPUP DESTINATION URL: {final_destination_url}")
            except Exception:
                pass

        context.on("page", handle_popup)

        try:
            page_link.goto(target_url, wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            log(f"[!] Warning on initial goto: {e}")
        time.sleep(3)

        # Analyze Link4M page mode: Sponsor Quest vs Direct Captcha Gate
        log("[*] Analyzing Link4M page mode (Sponsor Quest vs Direct Captcha Gate)...")
        is_direct_captcha = False
        target_img_element = None
        ocr = RapidOCR()

        for check_i in range(10):
            # Check for sponsor SERP image
            imgs = page_link.locator("img").all()
            for img in imgs:
                src = img.get_attribute("src") or ""
                if "img.link4m.net" in src and "/1_" in src:
                    target_img_element = img
                    break
            if target_img_element:
                log("[+] Detected Sponsor Quest Mode (SERP image found)")
                break

            # Check for Direct Captcha Gate indicators
            has_pwd = page_link.locator("input.password, input[name='password']").count() > 0
            has_recaptcha = page_link.locator(".g-recaptcha, iframe[src*='recaptcha']").count() > 0
            has_direct_header = page_link.locator("text='Vui lòng check captcha', text='CHECK CAPTCHA', text='check captcha'").count() > 0

            if has_recaptcha and (has_direct_header or (not has_pwd and check_i >= 4)):
                log("[!] Gặp màn hình lỗi Check Captcha. Tự động reload tải lại nhiệm vụ...")
                try:
                    page_link.reload(wait_until="domcontentloaded", timeout=30000)
                    time.sleep(3)
                except Exception:
                    pass
                # Kiểm tra lại sau khi reload
                imgs_after = page_link.locator("img").all()
                for img in imgs_after:
                    src = img.get_attribute("src") or ""
                    if "img.link4m.net" in src and "/1_" in src:
                        target_img_element = img
                        break
                if target_img_element:
                    log("[+] Reload thành công: Đã load lại nhiệm vụ tìm mã!")
                    break
                is_direct_captcha = True
                log("[+] Vẫn ở Direct Captcha Gate: Tiếp tục giải captcha trực tiếp.")
                break

            time.sleep(1)

        if is_direct_captcha:
            log("[*] Direct Captcha Mode: Solving reCAPTCHA on Tab 1 with Whisper AI...")
            solver = RecaptchaAudioSolver(headless=False, model_name="base.en")
            try:
                rc_res = solver.solve_on_page(page_link)
                log(f"[+] reCAPTCHA AI solved successfully: {rc_res.get('type')} ({rc_res.get('time_ms')}ms)")
            except Exception as e:
                log(f"[!] AI solver note: {e}")

            # Check if solved or wait up to 30s
            token = page_link.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            if not (token and len(token) > 20):
                log("[*] Waiting up to 30s if captcha token is being registered...")
                for _ in range(30):
                    time.sleep(1)
                    token = page_link.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
                    if token and len(token) > 20:
                        log("[+] Captcha token confirmed!")
                        break

            time.sleep(1)
            log("[*] Triggering Link4M checkCaptcha()...")
            page_link.evaluate("""() => {
                if (typeof recaptcha_callback === 'function') {
                    recaptcha_callback();
                } else if (typeof checkCaptcha === 'function') {
                    checkCaptcha();
                }
            }""")
        else:
            # Sponsor Quest Flow
            if not target_img_element:
                for _ in range(5):
                    imgs = page_link.locator("img").all()
                    for img in imgs:
                        src = img.get_attribute("src") or ""
                        if "img.link4m.net" in src and "/1_" in src:
                            target_img_element = img
                            break
                    if target_img_element:
                        break
                    time.sleep(1)

            sponsor_url = None
            if target_img_element:
                src = target_img_element.get_attribute("src") or ""
                log(f"[*] Found sponsor SERP image: {src}")
                img_bytes = None
                try:
                    resp = page_link.request.get(src, timeout=10000)
                    if resp.ok:
                        img_bytes = resp.body()
                except Exception:
                    pass
                if not img_bytes:
                    try:
                        img_bytes = target_img_element.screenshot()
                    except Exception:
                        pass

                if img_bytes:
                    res = None
                    try:
                        from PIL import Image
                        import io
                        pil_img = Image.open(io.BytesIO(img_bytes))
                        w, h = pil_img.size
                        # Smart crop top 45% (URL and title section) to speed up OCR 2.5x
                        cropped = pil_img.crop((0, 0, w, int(h * 0.45)))
                        buf = io.BytesIO()
                        cropped.save(buf, format="JPEG", quality=85)
                        res, _ = ocr(buf.getvalue())
                    except Exception:
                        res, _ = ocr(img_bytes)

                    # Fallback to full image if cropped OCR returned nothing
                    if not res:
                        try:
                            res, _ = ocr(img_bytes)
                        except Exception:
                            pass

                    if res:
                        TLD_REGEX = r'(?:com|net|vn|org|info|biz|ltd|co|io|in|cc|me|live|pro|club|tech|site|online|top|vip|win|app|xyz|tv|us|uk|ws|space|store|bet|game|games|asia|link|click|icu|pw|work|one|news|today|blog|us\.com|jpn\.com|za\.com|uk\.com|us\.org)'
                        candidates = []
                        for line in res:
                            text = line[1].strip()
                            text_clean = re.sub(r'\.i0(?=[^a-zA-Z0-9]|$)', '.io', text, flags=re.IGNORECASE)
                            matches = re.findall(r'([a-zA-Z0-9\-]{2,}(?:\.[a-zA-Z0-9\-]+)*\.' + TLD_REGEX + r')(?=[^a-zA-Z0-9\-]|$)', text_clean, re.IGNORECASE)
                            for m in matches:
                                d = m.lower().rstrip("/")
                                if "link4m" not in d and d not in candidates:
                                    candidates.append(d)

                        filtered = [c for c in candidates if c not in ["uk.com", "us.com", "jpn.com", "za.com", "us.org"]]
                        log(f"[*] Extracted domain candidates from OCR: {filtered}")

                        import urllib.request
                        for c in filtered:
                            test_u = "https://" + c
                            try:
                                req = urllib.request.Request(test_u, headers={"User-Agent": "Mozilla/5.0"})
                                code = urllib.request.urlopen(req, timeout=5).getcode()
                                if code == 200 or code == 301 or code == 302:
                                    sponsor_url = test_u
                                    log(f"[+] Verified active sponsor website: {sponsor_url}")
                                    break
                            except Exception:
                                pass

                        if not sponsor_url and filtered:
                            sponsor_url = "https://" + filtered[0]
                            log(f"[+] Using top domain candidate: {sponsor_url}")

            if not sponsor_url:
                log("[!] Could not auto-detect sponsor domain. Halting to prevent wrong mission code.")
                browser.close()
                return

            log(f"🎉 TARGET SPONSOR WEBSITE FOR THIS MISSION: {sponsor_url}")

            sponsor_domain = re.sub(r'^https?://', '', sponsor_url).split('/')[0].lower().strip()
            cached_code = get_cached_code(sponsor_domain)
            code_found = None

            if cached_code:
                log(f"⚡ [CACHE HIT] Found active cached code '{cached_code}' for {sponsor_domain}!")
                log("⚡ [INSTANT BYPASS] Skipping sponsor website & 60s countdown (0s wait)!")
                code_found = cached_code
            else:
                code_found = harvest_code_browser(context, sponsor_url)

            if not code_found:
                log('[!] Could not extract code. Exiting...')
                browser.close()
                return

            save_cache(sponsor_domain, code_found)

            log(f"\n==========================================")
            log(f"🎉 SUCCESS! EXTRACTED SPONSOR CODE: {code_found}")
            log(f"==========================================\n")

            with open(os.path.join(BASE_DIR, "extracted_code.txt"), "w", encoding="utf-8") as f_code:
                f_code.write(code_found)

            # Switch back to Tab 1 (Link4M)
            log("[*] Switching back to Tab 1 (Link4M) to fill code...")
            page_link.bring_to_front()
            time.sleep(1)

            # Fill password field
            pwd_input = page_link.locator("input[name='password'], input.password").first
            pwd_input.fill(code_found)
            pwd_input.dispatch_event("input")
            pwd_input.dispatch_event("keyup")
            pwd_input.dispatch_event("change")
            log(f"[+] Filled code '{code_found}' into Link4M input!")

            page_link.evaluate("() => { if (window.$ && $('#main-form').length) { window.check_form = $('#main-form'); } }")

            # Solve reCAPTCHA on Tab 1 with local Whisper solver
            log("[*] Solving reCAPTCHA on Tab 1 with local Whisper AI solver...")
            solver = RecaptchaAudioSolver(headless=False, model_name="base.en")
            try:
                rc_res = solver.solve_on_page(page_link)
                log(f"[+] reCAPTCHA AI solved successfully: {rc_res.get('type')} ({rc_res.get('time_ms')}ms)")
            except Exception as e:
                log(f"[!] AI solver note: {e}")

            # Check if solved or need fallback
            token = page_link.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            if not (token and len(token) > 20):
                log("[*] Waiting up to 45s if captcha is still being verified...")
                for _ in range(45):
                    time.sleep(1)
                    token = page_link.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
                    get_link = page_link.locator(".get-link").first
                    classes = get_link.get_attribute("class") or ""
                    if (token and len(token) > 20) or ("disabled" not in classes) or final_destination_url:
                        log("[+] Captcha verified or link unlocked!")
                        break

            time.sleep(1)
            if not final_destination_url:
                log("[*] Triggering Link4M checkPassword()...")
                page_link.evaluate("""() => {
                    if (window.$ && $('#main-form').length) {
                        window.check_form = $('#main-form');
                    }
                    if (typeof checkPassword === 'function') {
                        checkPassword();
                    }
                }""")

        def is_valid_destination(u):
            if not u or not u.startswith("http"):
                return False
            return not any(d in u for d in ["link4m.org", "link4m.net", "link4m.co", "link4m.me", "about:blank"])

        # Wait for API response or get-link button update
        log("[*] Waiting for destination URL unlock...")
        for _ in range(15):
            if is_valid_destination(final_destination_url):
                break
            time.sleep(1)
            get_link_btn = page_link.locator(".get-link").first
            if get_link_btn.count() > 0:
                href = get_link_btn.get_attribute("href")
                if is_valid_destination(href):
                    final_destination_url = href
                    log(f"[+] Found destination in .get-link href: {href}")
                    break

        if not is_valid_destination(final_destination_url):
            log("[*] Clicking get-link button...")
            get_link_btn = page_link.locator(".get-link").first
            if get_link_btn.count() > 0:
                try:
                    get_link_btn.click(force=True)
                except Exception:
                    pass
                time.sleep(4)
            if is_valid_destination(page_link.url):
                final_destination_url = page_link.url

        if is_valid_destination(final_destination_url):
            log(f"\n==========================================")
            log(f"🎉 FINAL DESTINATION URL: {final_destination_url}")
            log(f"==========================================\n")
            with open(os.path.join(BASE_DIR, "destination_url.txt"), "w", encoding="utf-8") as f:
                f.write(str(final_destination_url))
        else:
            log(f"[!] Warning: Destination URL still points to link4m or not unlocked.")

        page_link.screenshot(path=os.path.join(BASE_DIR, "final_result_screen.png"))
        log("[*] Saved final screenshot. Closing browser in 5 seconds...")
        time.sleep(5)
        browser.close()
        log("[*] Full automation completed successfully.")

if __name__ == "__main__":
    run()
