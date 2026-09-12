import sys
sys.stdout.reconfigure(encoding="utf-8")
import os
import time
from playwright.sync_api import sync_playwright

from config import CHROME_PATH, BASE_DIR, LOG_FILE, DEST_FILE, CODE_FILE, log, copy_to_clipboard
from recaptcha_solver import RecaptchaAudioSolver
from sponsor import detect_sponsor_domain, solve_sponsor_quest

def is_valid_destination(u: str) -> bool:
    if not u or not u.startswith("http"):
        return False
    return not any(d in u for d in ["link4m.org", "link4m.net", "link4m.co", "link4m.me", "about:blank"])

def run(target_url: str = None, headless: bool = False):
    if not target_url:
        target_url = sys.argv[1].strip() if len(sys.argv) > 1 else "https://link4m.net/go/2kCcIqn"

    # Check CLI flags
    if "--headless" in sys.argv or os.environ.get("LINK4M_HEADLESS") == "1":
        headless = True

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== STARTING DYNAMIC E2E AUTOMATION ===\n")

    log(f"[*] Target Link4M URL: {target_url}")
    log(f"[*] Starting automation engine (Headless: {headless})...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-infobars",
                "--disable-dev-shm-usage",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--no-first-run",
                "--no-default-browser-check"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
            ignore_https_errors=True
        )
        context.add_init_script("""
            // 1. Quota & Webdriver bypass
            if (window.navigator && window.navigator.webkitTemporaryStorage) {
                window.navigator.webkitTemporaryStorage.queryUsageAndQuota = (s) => { if (typeof s === 'function') s(0, 500*1024*1024*1024); };
            }
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

            // 2. Fake Google Referrer
            try {
                Object.defineProperty(document, 'referrer', {
                    get: () => 'https://www.google.com/',
                    configurable: true
                });
            } catch (e) {}

            // 3. Always Active (Anti-Blur / Anti-Tab Switch / Fake Visibility)
            try {
                Object.defineProperty(document, 'hidden', {
                    get: () => false,
                    configurable: true
                });

                Object.defineProperty(document, 'visibilityState', {
                    get: () => 'visible',
                    configurable: true
                });

                Object.defineProperty(document, 'webkitVisibilityState', {
                    get: () => 'visible',
                    configurable: true
                });

                window.hasFocus = () => true;

                const blockedEvents = [
                    'visibilitychange',
                    'webkitvisibilitychange',
                    'blur',
                    'mouseleave'
                ];

                blockedEvents.forEach(eventType => {
                    window.addEventListener(eventType, (e) => {
                        e.stopImmediatePropagation();
                    }, true);

                    document.addEventListener(eventType, (e) => {
                        e.stopImmediatePropagation();
                    }, true);
                });
            } catch (e) {}
        """)

        page_link = context.new_page()
        final_destination_url = None

        def handle_resp(res):
            nonlocal final_destination_url
            if "/links/get-link-info" in res.url or "/links/check-captcha" in res.url:
                try:
                    data = res.json()
                    log(f"[+] Intercepted Link4M API response: {data}")
                    u = data.get("url") or data.get("return")
                    if u and is_valid_destination(u):
                        final_destination_url = u
                        log(f"🎉 DESTINATION URL INTERCEPTED FROM API: {final_destination_url}")
                except Exception:
                    pass

        page_link.on("response", handle_resp)

        try:
            page_link.goto(target_url, wait_until="domcontentloaded", timeout=40000)
        except Exception as e:
            log(f"[!] Warning on initial goto: {e}")
        time.sleep(2.0)

        has_recaptcha = page_link.locator(".g-recaptcha, iframe[src*='recaptcha']").count() > 0
        has_pwd = page_link.locator("input.password, input[name='password']").count() > 0
        is_direct = has_recaptcha and not has_pwd

        solver = RecaptchaAudioSolver(headless=False, model_name="base.en")

        if is_direct:
            log("[+] Detected Direct Captcha Gate Mode")
            try:
                solver.solve_on_page(page_link)
            except Exception as e:
                log(f"[!] AI solver note: {e}")
            time.sleep(1.2)
            page_link.evaluate("""() => {
                if (typeof recaptcha_callback === 'function') recaptcha_callback();
                else if (typeof checkCaptcha === 'function') checkCaptcha();
            }""")
        else:
            sponsor_url = detect_sponsor_domain(page_link)
            if not sponsor_url:
                log("[!] Could not auto-detect sponsor domain. Halting.")
                browser.close()
                return

            log(f"🎉 TARGET SPONSOR WEBSITE FOR THIS MISSION: {sponsor_url}")
            code_found = solve_sponsor_quest(context, sponsor_url)
            if not code_found:
                log("[!] Could not extract mission code. Halting.")
                browser.close()
                return

            log(f"\n==========================================")
            log(f"🎉 SUCCESS! EXTRACTED SPONSOR CODE: {code_found}")
            log(f"==========================================\n")

            try:
                with open(CODE_FILE, "w", encoding="utf-8") as f_code:
                    f_code.write(code_found)
            except Exception:
                pass

            page_link.bring_to_front()
            time.sleep(0.6)

            pwd_input = page_link.locator("input[name='password'], input.password").first
            pwd_input.fill(code_found)
            pwd_input.dispatch_event("input")
            pwd_input.dispatch_event("change")
            log(f"[+] Filled code '{code_found}' into Link4M input!")

            try:
                solver.solve_on_page(page_link)
            except Exception as e:
                log(f"[!] AI solver note: {e}")

            time.sleep(1.0)
            if not final_destination_url:
                page_link.evaluate("""() => {
                    if (window.$ && $('#main-form').length) window.check_form = $('#main-form');
                    if (typeof checkPassword === 'function') checkPassword();
                }""")

        log("[*] Waiting for destination URL unlock...")
        for _ in range(12):
            if is_valid_destination(final_destination_url):
                break
            time.sleep(1)
            btn_link = page_link.locator(".get-link").first
            if btn_link.count() > 0:
                h = btn_link.get_attribute("href")
                if is_valid_destination(h):
                    final_destination_url = h
                    break

        if not is_valid_destination(final_destination_url):
            btn_link = page_link.locator(".get-link").first
            if btn_link.count() > 0:
                try:
                    btn_link.click(force=True)
                except Exception:
                    pass
                time.sleep(2.0)
            if is_valid_destination(page_link.url):
                final_destination_url = page_link.url

        if is_valid_destination(final_destination_url):
            log(f"\n==========================================")
            log(f"🎉 FINAL DESTINATION URL: {final_destination_url}")
            log(f"==========================================\n")
            try:
                with open(DEST_FILE, "w", encoding="utf-8") as f:
                    f.write(str(final_destination_url))
            except Exception:
                pass
            copy_to_clipboard(str(final_destination_url))
        else:
            log("[!] Warning: Destination URL still points to link4m or not unlocked.")

        try:
            page_link.screenshot(path=os.path.join(BASE_DIR, "final_result_screen.png"))
        except Exception:
            pass

        log("[*] Full automation completed successfully.")
        time.sleep(1.5)
        browser.close()

if __name__ == "__main__":
    run()
