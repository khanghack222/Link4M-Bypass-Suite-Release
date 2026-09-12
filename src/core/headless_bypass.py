import sys
sys.stdout.reconfigure(encoding="utf-8")

import os
import re
import json
import time
from typing import Optional, Dict, Any

from curl_cffi import requests
from playwright.sync_api import sync_playwright
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import io

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from recaptcha_solver import RecaptchaAudioSolver, CHROME_PATH

BASE_DIR = os.path.abspath(os.path.join(CORE_DIR, "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
CACHE_FILE = os.path.join(DATA_DIR, "campaign_cache.json")
LOG_FILE = os.path.join(BASE_DIR, "e2e_bypass.log")
DEST_FILE = os.path.join(BASE_DIR, "destination_url.txt")
CODE_FILE = os.path.join(BASE_DIR, "extracted_code.txt")

TLD_REGEX = (
    r"(?:us\.com|jpn\.com|za\.com|uk\.com|us\.org|eu\.com|"
    r"com|net|vn|org|info|biz|ltd|co|io|in|cc|me|live|pro|club|tech|site|"
    r"online|top|vip|win|app|xyz|tv|us|uk|ws|space|store|bet|game|games|"
    r"asia|link|click|icu|pw|work|one|news|today|blog)"
)

BARE_TLDS = {"uk.com", "us.com", "jpn.com", "za.com", "us.org", "eu.com", "google.com"}

def log(msg: str):
    ts = time.strftime("%X")
    print(f"[{ts}] {msg}", flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {msg}\n")

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
        log(f"[+] CACHE SAVED: '{code}' for '{key}'")
    except Exception as e:
        log(f"[!] Failed to save cache: {e}")

def get_cached_code(key: str, max_age_hours: int = 12) -> Optional[str]:
    item = load_cache().get(key.lower().strip())
    if item and isinstance(item, dict):
        if time.time() - item.get("timestamp", 0) < max_age_hours * 3600:
            return item.get("code")
    return None

def extract_sponsor_domain_headless(html_content: str, session: requests.Session) -> Optional[str]:
    ocr = RapidOCR()
    imgs = re.findall(r"<img[^>]+src=['\"]([^'\"]+)['\"]", html_content)
    serp_imgs = [src for src in imgs if src.startswith("http") and ("upload" in src or "advertiser" in src)]

    for src in serp_imgs:
        log(f"[*] Found sponsor SERP image: {src}")
        try:
            resp = session.get(src, timeout=10)
            if not resp.ok:
                continue
            pil_img = Image.open(io.BytesIO(resp.content))
            w, h = pil_img.size
            cropped = pil_img.crop((0, 0, w, int(h * 0.45)))
            buf = io.BytesIO()
            cropped.save(buf, format="JPEG", quality=85)
            res, _ = ocr(buf.getvalue())
            if not res:
                res, _ = ocr(resp.content)
            if not res:
                continue

            candidates = []
            for line in res:
                text_clean = re.sub(r'\.i0(?=[^a-zA-Z0-9]|$)', '.io', line[1].strip(), flags=re.IGNORECASE)
                matches = re.findall(rf'([a-zA-Z0-9\-]{{2,}}(?:\.[a-zA-Z0-9\-]+)*\.{TLD_REGEX})(?=[^a-zA-Z0-9\-]|$)', text_clean, re.IGNORECASE)
                for m in matches:
                    d = m.lower().rstrip("/")
                    if "link4m" not in d and d not in candidates and d not in BARE_TLDS:
                        candidates.append(d)

            log(f"[*] Extracted domain candidates from OCR: {candidates}")
            # Verify candidates via fast request
            for c in candidates:
                try:
                    chk = session.get(f"https://{c}", timeout=6, allow_redirects=True)
                    if chk.status_code in (200, 301, 302, 403):
                        log(f"[+] Verified active sponsor website: {c}")
                        return c
                except Exception:
                    pass

            if candidates:
                top = candidates[0]
                log(f"[+] Using top candidate domain: {top}")
                return top
        except Exception as e:
            log(f"[!] OCR inspection error: {e}")
    return None


def harvest_code_headless(sponsor_domain: str) -> Optional[str]:
    """Lightweight headless Chrome. Block media. Harvest widget code."""
    log(f"[*] Micro-Worker: Opening https://{sponsor_domain} (headless, assets blocked)...")

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ]
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True, args=args)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1366, "height": 768},
            extra_http_headers={"Referer": "https://www.google.com/"},
        )
        page = context.new_page()
        page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,avi}", lambda route: route.abort())
        page.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            try { Object.defineProperty(document, 'referrer', { get: () => 'https://www.google.com/', configurable: true }); } catch(e) {}
            """
        )

        try:
            page.goto(f"https://{sponsor_domain}", wait_until="domcontentloaded", timeout=25000)
            time.sleep(2)
        except Exception as e:
            log(f"[!] Error navigating to {sponsor_domain}: {e}")

        btn = None
        for sel in (
            "button:has-text('LẤY MÃ')",
            "div[id] button:has-text('MÃ')",
            "button:has-text('GET CODE')",
            "button:has-text('CODE')",
        ):
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                btn = loc.first
                break

        if not btn:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            time.sleep(2)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)
            loc = page.locator("button:has-text('LẤY MÃ'), div[id] button")
            if loc.count() > 0:
                btn = loc.first

        if not btn:
            log("[!] Could not locate traffic button on sponsor page.")
            browser.close()
            return None

        log("[+] Button located. Clicking to start timer...")
        try:
            btn.scroll_into_view_if_needed()
            btn.click()
        except Exception:
            btn.dispatch_event("click")

        log("[*] Simulating background scrolling to keep countdown active...")
        t0 = time.time()
        code = None
        while time.time() - t0 < 140:
            time.sleep(2)
            page.mouse.wheel(0, 150)
            time.sleep(0.5)
            page.mouse.wheel(0, -100)

            content = page.content()
            m = re.search(r"Mã\s*(?:KM)?\s*:\s*([a-zA-Z0-9]{4,10})", content, re.IGNORECASE)
            if m:
                code = m.group(1).strip()
                log(f"[+] SUCCESS! EXTRACTED SPONSOR CODE: {code}")
                break

            widget_text = page.evaluate(
                """() => {
                    const el = document.querySelector('.whatoncode, .whatoncode-wrapper, [class*="code"]');
                    return el ? el.innerText : '';
                }"""
            )
            if widget_text:
                m2 = re.search(r"(?:Mã|Code|KM)\s*:\s*([a-zA-Z0-9]{4,10})", widget_text, re.IGNORECASE)
                if m2:
                    code = m2.group(1).strip()
                    log(f"[+] SUCCESS! EXTRACTED SPONSOR CODE: {code}")
                    break
                time_m = re.search(r"(\d+)\s*s", widget_text)
                if time_m:
                    log(f"[*] Remaining: {time_m.group(1)}s")

        browser.close()
        return code


def _attach_url_interceptor(page):
    final_url = {"value": None}

    def handle_response(response):
        if "/links/get-link-info" in response.url or "/links/check-captcha" in response.url:
            try:
                data = response.json()
                log(f"[+] Intercepted Link4M API response ({response.url}): {data}")
                if (data.get("success") or data.get("status")) and data.get("url"):
                    final_url["value"] = data.get("url")
                    log(f"[+] FINAL DESTINATION URL: {final_url['value']}")
                elif data.get("return"):
                    final_url["value"] = data.get("return")
                    log(f"[+] FINAL DESTINATION URL: {final_url['value']}")
            except Exception:
                pass

    page.on("response", handle_response)
    return final_url


def submit_code_headless(target_url: str, code: str) -> bool:
    log("[*] Switching back to Tab 1 (Link4M). Solving reCAPTCHA on Tab 1...")
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars",
            "--disable-dev-shm-usage",
        ]
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True, args=args)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()
        final_url = _attach_url_interceptor(page)
        page.goto(target_url, wait_until="networkidle", timeout=30000)
        time.sleep(2)

        input_box = page.locator("input[name='password']")
        if input_box.count() > 0:
            input_box.first.fill(code)
            log(f"[+] Filled mission code: {code}")
            time.sleep(1)

        solver = RecaptchaAudioSolver(headless=True)
        result = solver.solve_on_page(page)
        if result and result.get("success"):
            log("[+] reCAPTCHA AI solved successfully")

        log("[*] Triggering Link4M checkPassword...")
        submit_btn = page.locator("a.get-link, button.get-link, button[type='submit']")
        if submit_btn.count() > 0 and submit_btn.first.is_visible():
            try:
                submit_btn.first.click()
            except Exception:
                pass

        for _ in range(15):
            if final_url["value"]:
                break
            time.sleep(1)

        browser.close()

        if final_url["value"]:
            with open(DEST_FILE, "w", encoding="utf-8") as f:
                f.write(final_url["value"])
            return True
        log("[!] Did not receive destination URL from Link4M.")
        return False


def run_direct_captcha_solver(target_url: str) -> bool:
    log("[*] Direct Captcha Gate. Solving reCAPTCHA on Tab 1...")
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        page = browser.new_page()
        final_url = _attach_url_interceptor(page)
        page.goto(target_url, wait_until="networkidle", timeout=25000)
        time.sleep(2)

        solver = RecaptchaAudioSolver(headless=True)
        result = solver.solve_on_page(page)
        if result and result.get("success"):
            log("[+] reCAPTCHA AI solved successfully")
        time.sleep(3)

        btn = page.locator("a.get-link, button.get-link")
        if btn.count() > 0 and btn.first.is_visible():
            btn.first.click()

        for _ in range(10):
            if final_url["value"]:
                break
            time.sleep(1)

        browser.close()
        if final_url["value"]:
            with open(DEST_FILE, "w", encoding="utf-8") as f:
                f.write(final_url["value"])
            return True
        return False


def _fallback_browser(target_url: str) -> bool:
    log("[!] Falling back to Full Browser Automation...")
    import bypass as browser_engine

    return bool(browser_engine.run(target_url))


def run(target_url: str = None):
    if not target_url:
        target_url = sys.argv[1].strip() if len(sys.argv) > 1 else "https://link4m.net/go/2kCcIqn"

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== STARTING LINK4M HEADLESS PROTOCOL ENGINE ===\n")

    log(f"[*] Target Link4M URL: {target_url}")
    log("[*] Headless Protocol Engine (curl_cffi chrome124 + micro-worker)...")

    session = requests.Session(impersonate="chrome124")
    origin_m = re.match(r"https?://[^/]+", target_url)
    origin = origin_m.group(0) if origin_m else "https://link4m.net"

    log("[*] Analyzing active sponsor campaign...")
    try:
        r = session.get(target_url, timeout=15)
    except Exception as e:
        log(f"[!] Connection failed: {e}")
        return False

    alias_m = re.search(r"data-alias\s*=\s*['\"]([^'\"]+)", r.text)
    code_m = re.search(r"data-code\s*=\s*['\"]([^'\"]+)", r.text)
    if not alias_m or not code_m:
        log("[!] Could not parse data-alias/data-code. Falling back.")
        return _fallback_browser(target_url)

    alias = alias_m.group(1)
    page_code = code_m.group(1)
    log(f"[+] Extracted Link4M parameters: alias={alias}")

    headers = {
        "Origin": origin,
        "Referer": target_url,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
    }
    try:
        adv_resp = session.post(
            "https://s1.link4m.app/api/campaign/get-advertise",
            headers=headers,
            data={"alias": alias, "codes": page_code},
            timeout=15,
        )
        adv_data = adv_resp.json()
    except Exception as e:
        log(f"[!] Campaign API failed: {e}")
        return _fallback_browser(target_url)

    is_sponsor_mode = bool(adv_data.get("form") and adv_data.get("html"))
    if not is_sponsor_mode:
        log("[+] Detected Direct Captcha Gate Mode.")
        return run_direct_captcha_solver(target_url)

    log("[+] Detected Sponsor Quest Mode.")
    form_html = adv_data.get("form", "")
    quest_html = adv_data.get("html", "")

    sponsor_domain = extract_sponsor_domain_headless(quest_html, session)
    if not sponsor_domain:
        log("[!] Could not determine sponsor domain via OCR.")
        return _fallback_browser(target_url)

    log(f"[+] TARGET SPONSOR WEBSITE EXTRACTED SPONSOR DOMAIN: {sponsor_domain}")

    cached_code = get_cached_code(sponsor_domain)
    if cached_code:
        log(f"[+] CACHE HIT: '{cached_code}' for {sponsor_domain}. Instant bypass.")
        if submit_code_headless(target_url, cached_code):
            return True
        log("[!] Cached code rejected. Re-harvesting...")

    extracted_code = harvest_code_headless(sponsor_domain)
    if not extracted_code:
        return _fallback_browser(target_url)

    save_cache(sponsor_domain, extracted_code)
    with open(CODE_FILE, "w", encoding="utf-8") as f:
        f.write(extracted_code)

    return submit_code_headless(target_url, extracted_code)


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else None)
