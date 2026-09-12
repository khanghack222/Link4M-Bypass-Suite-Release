import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
import time
import re

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def run_sponsor_test(target_url="https://five888.ltd"):
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

        page = context.new_page()
        page.on("console", lambda m: print("PAGE LOG:", m.text))

        print(f"[*] Navigating to {target_url}...")
        page.goto(target_url, wait_until="networkidle", referer="https://www.google.com/")
        time.sleep(2)

        # Detect traffic key from HTML
        html = page.content()
        m_key = re.search(r'(?:what-on\.com|website-analytics\.net|traffic)[^"\']*?key=([a-zA-Z0-9]+)', html)
        traffic_key = m_key.group(1) if m_key else None
        print(f"[*] Detected traffic_key: {traffic_key}")

        # Trigger WP-Rocket scripts if present
        page.evaluate("""() => {
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

        # Set hash #ss-key to trigger forceShowButton
        if traffic_key:
            page.evaluate(f"() => {{ window.location.hash = '#ss-{traffic_key}'; if (typeof forceShowButton === 'function') forceShowButton(); }}")
            time.sleep(2)

        # Scroll down
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)

        # Find button
        selector = f"#{traffic_key} button, button:has-text('LẤY MÃ'), button:has-text('Lấy mã')" if traffic_key else "button:has-text('LẤY MÃ'), button:has-text('Lấy mã')"
        btn = page.locator(selector)
        print(f"[*] Button count: {btn.count()}")
        if btn.count() == 0:
            print("[!] Button not found!")
            browser.close()
            return None

        print("[+] Clicking button for Step 1...")
        btn.first.click()
        time.sleep(2)

        # Countdown loop
        whaton = page.locator(".whatoncode")
        step1_done = False
        code = None
        for s in range(1, 80):
            time.sleep(1)
            # scroll up/down
            if s % 2 == 0:
                page.evaluate("window.scrollBy(0, 50)")
            else:
                page.evaluate("window.scrollBy(0, -50)")

            if whaton.count() > 0:
                txt = whaton.inner_text().strip()
                if s % 5 == 0:
                    print(f"  [Step 1 - {s}s]: {txt}")
                if any(w in txt.lower() for w in ['click vào', 'link bất kỳ', 'bước 2', 'bài viết']):
                    print(f"[+] Step 1 finished with prompt: {txt}")
                    step1_done = True
                    break
                m_code = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', txt, re.IGNORECASE)
                if m_code:
                    code = m_code.group(1)
                    print(f"[+] CODE OBTAINED IN STEP 1: {code}")
                    break

        if step1_done and not code:
            print("[*] Finding internal article for Step 2...")
            links = page.locator("a[href^='https://']").all()
            article_url = None
            for a in links:
                h = a.get_attribute("href") or ""
                if target_url in h and h.strip("/") != target_url.strip("/") and not any(x in h for x in ['.jpg', '.png', '.css', '.js', 'feed', 'wp-']):
                    article_url = h
                    break

            if not article_url:
                article_url = target_url + "/huong-dan-dang-ky/"

            print(f"[*] Navigating to article: {article_url}")
            page.goto(article_url, wait_until="networkidle")
            time.sleep(2)

            page.evaluate("""() => {
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
                page.evaluate(f"() => {{ window.location.hash = '#ss-{traffic_key}'; if (typeof forceShowButton === 'function') forceShowButton(); }}")
                time.sleep(2)

            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)

            btn2 = page.locator(selector)
            print(f"[*] Step 2 button count: {btn2.count()}")
            if btn2.count() > 0:
                print("[+] Clicking button for Step 2...")
                btn2.first.click()
                time.sleep(2)

                whaton2 = page.locator(".whatoncode")
                for s in range(1, 35):
                    time.sleep(1)
                    if s % 2 == 0:
                        page.evaluate("window.scrollBy(0, 50)")
                    else:
                        page.evaluate("window.scrollBy(0, -50)")
                    if whaton2.count() > 0:
                        txt = whaton2.inner_text().strip()
                        if s % 5 == 0:
                            print(f"  [Step 2 - {s}s]: {txt}")
                        m_code = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', txt, re.IGNORECASE)
                        if m_code:
                            code = m_code.group(1)
                            print(f"\n==========================================")
                            print(f"🎉 EXTRACTED SPONSOR CODE: {code}")
                            print(f"==========================================\n")
                            break

        browser.close()
        return code

if __name__ == "__main__":
    run_sponsor_test()

