import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
import re
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LOG_FILE = r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\test_playwright_bypass.log"

def log(msg: str):
    print(f"[{time.strftime('%X')}] {msg}", flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%X')}] {msg}\n")

with open(LOG_FILE, "w", encoding="utf-8") as f:
    f.write("=== STARTING BYPASS TEST ===\n")

log("[*] Launching Chrome with anti-detect hooks...")
with sync_playwright() as p:
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-infobars"
    ]
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=False, args=args)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768}
    )

    # CRITICAL HOOK: Bypass detectIncognito
    context.add_init_script("""
        // 1. Hook webkitTemporaryStorage to simulate huge real disk storage
        if (window.navigator && window.navigator.webkitTemporaryStorage) {
            window.navigator.webkitTemporaryStorage.queryUsageAndQuota = function(successCallback, errorCallback) {
                if (typeof successCallback === 'function') {
                    // 500 GB in bytes
                    successCallback(0, 500 * 1024 * 1024 * 1024);
                }
            };
        }
        
        // 2. Hide navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
    """)

    page = context.new_page()

    log("[*] Navigating to cor.jpn.com with Google referrer...")
    page.goto("https://www.google.com", wait_until="networkidle")
    time.sleep(1)
    page.goto("https://cor.jpn.com", wait_until="networkidle", referer="https://www.google.com/")
    time.sleep(3)

    log("[*] Scrolling down to find LẤY MÃ button...")
    for _ in range(5):
        page.evaluate("window.scrollBy(0, 800)")
        time.sleep(0.5)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(2)

    btn = page.locator("#l1DWo button, button:has-text('LẤY MÃ')")
    if btn.count() == 0:
        log("[!] Button not found! Saving screenshot...")
        page.screenshot(path=r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\test_nobtn.png")
        browser.close()
        sys.exit(1)

    log("[+] Found button! Clicking...")
    btn.first.click()
    time.sleep(2)

    # Check button text in .whatoncode
    whaton = page.locator(".whatoncode")
    log(f"[*] Immediate .whatoncode text: {whaton.inner_text() if whaton.count() > 0 else 'NOT FOUND'}")

    log("[*] Monitoring countdown and simulating mouse scroll...")
    step_finished = False
    for s in range(1, 80):
        time.sleep(1)
        # Scroll up and down slightly to keep mouse_scroll active
        if s % 2 == 0:
            page.evaluate("window.scrollBy(0, 40)")
        else:
            page.evaluate("window.scrollBy(0, -40)")

        if whaton.count() > 0:
            txt = whaton.inner_text().strip()
            if s % 10 == 0:
                log(f"  [Time {s}s] Button text: {txt}")

            # Check if Step 1 asks to click link or Step 2 is ready
            if "bước 2" in txt.lower() or "click vào" in txt.lower() or "bài viết bất kỳ" in txt.lower():
                log(f"[+] Step 1 completed! Prompt: {txt}")
                step_finished = True
                break
            
            # Check if code appeared
            m = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', txt, re.IGNORECASE)
            if m:
                log(f"🎉 GOT CODE DIRECTLY: {m.group(1)}")
                step_finished = True
                break

    if step_finished and "bước 2" in txt.lower() or "bài viết" in txt.lower():
        log("[*] Navigating to article for Step 2...")
        links = page.locator("article a, .post-title a, a[href*='cor.jpn.com']")
        if links.count() > 0:
            # Click an article link
            for idx in range(links.count()):
                href = links.nth(idx).get_attribute("href") or ""
                if "cor.jpn.com" in href and href != "https://cor.jpn.com/":
                    log(f"[*] Clicking article: {href}")
                    links.nth(idx).click()
                    break
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            log("[*] Scrolling down on article page...")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)

            btn2 = page.locator("#l1DWo button, button:has-text('LẤY MÃ')")
            if btn2.count() > 0:
                log("[+] Found button on article page! Clicking for Step 2 (15s)...")
                btn2.first.click()
                time.sleep(2)

                whaton2 = page.locator(".whatoncode")
                for s2 in range(1, 25):
                    time.sleep(1)
                    if s2 % 2 == 0:
                        page.evaluate("window.scrollBy(0, 30)")
                    else:
                        page.evaluate("window.scrollBy(0, -30)")

                    txt2 = whaton2.inner_text().strip() if whaton2.count() > 0 else ""
                    if s2 % 5 == 0:
                        log(f"  [Step 2 Time {s2}s] Button text: {txt2}")

                    m2 = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', txt2, re.IGNORECASE)
                    if m2:
                        log(f"🎉 FINAL STEP 2 CODE: {m2.group(1)}")
                        with open(r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\extracted_code.txt", "w", encoding="utf-8") as f_code:
                            f_code.write(m2.group(1))
                        break

    page.screenshot(path=r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\test_playwright_result.png")
    log("[*] Test finished. Screenshot saved to test_playwright_result.png.")
    browser.close()
