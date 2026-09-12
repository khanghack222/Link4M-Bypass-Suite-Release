import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print("CONSOLE:", msg.text))
    page.on("pageerror", lambda err: print("PAGEERROR:", err))
    page.add_init_script("""
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
    page.goto("https://five888.ltd/#ss-XWGXmBbB", wait_until="networkidle", referer="https://www.google.com/")
    print("Final URL:", page.url)
    html = page.content()
    print("Is what-on in HTML?", "what-on" in html)
    print("Is XWGXmBbB in HTML?", "XWGXmBbB" in html)
    # Trigger rocket lazyload scripts
    print("Triggering rocketlazyloadscript...")
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
    time.sleep(3)
    container = page.locator("#XWGXmBbB")
    print("Container innerHTML after trigger:", container.inner_html())
    btn = page.locator("#XWGXmBbB button")
    print("Button count before click:", btn.count())
    if btn.count() > 0:
        print("Clicking button...")
        btn.first.click()
        time.sleep(2)

        extracted_sponsor_code = None
        def on_response(res):
            global extracted_sponsor_code
            if "get_quest_code.html" in res.url:
                try:
                    data = res.json()
                    print(f"\n[+] INTERCEPTED get_quest_code response: {data}\n")
                    if data.get("success"):
                        if "id" in data:
                            print(f"[+] Step 1 Quest ID acquired: {data['id']}")
                        else:
                            extracted_sponsor_code = data.get("html")
                            print(f"\n🎉🎉🎉 EXTRACTED CODE: {extracted_sponsor_code} 🎉🎉🎉\n")
                except Exception as e:
                    print("[!] Parse error on get_quest_code:", e)

        page.on("response", on_response)

        # Step 1 loop
        print("[*] Monitoring Step 1 countdown...")
        step1_done = False
        direction = 1
        for s in range(1, 90):
            time.sleep(1)
            # simulate genuine mouse wheel and scroll up/down
            direction = -direction if s % 6 == 0 else direction
            delta = 120 * direction
            page.mouse.wheel(0, delta)
            page.evaluate(f"() => {{ window.scrollBy(0, {delta}); window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('mousewheel')); }}")
            if s % 5 == 0:
                dt = page.evaluate("() => document.getElementById('XWGXmBbB') ? document.getElementById('XWGXmBbB').dataset.time : null")
                print(f"  [Step 1 - {s}s] dataset.time: {dt}")
            # check quest in localStorage
            has_quest = page.evaluate("() => { for (let k in localStorage) { if (k.includes('_quest')) return true; } return false; }")
            if has_quest:
                print(f"[+] Step 1 completed! Found quest in localStorage at {s}s!")
                step1_done = True
                break

        if step1_done and not extracted_sponsor_code:
            print("[*] Finding article link for Step 2...")
            links = page.locator("a[href^='https://']").all()
            article_url = None
            for a in links:
                h = a.get_attribute("href") or ""
                if "five888.ltd" in h and h.strip("/") != "https://five888.ltd" and not any(x in h for x in ['.jpg', '.png', '.css', '.js', 'feed', 'wp-']):
                    article_url = h
                    break
            if not article_url:
                article_url = "https://five888.ltd/huong-dan-dang-ky/"

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
            page.evaluate("() => { window.location.hash = '#ss-XWGXmBbB'; if (typeof forceShowButton === 'function') forceShowButton(); }")
            time.sleep(2)

            btn2 = page.locator("#XWGXmBbB button")
            print(f"[*] Step 2 button count: {btn2.count()}")
            if btn2.count() > 0:
                print("[+] Clicking Step 2 button...")
                btn2.first.click()
                time.sleep(2)

                print("[*] Monitoring Step 2 countdown (15s)...")
                direction2 = 1
                for s in range(1, 35):
                    time.sleep(1)
                    direction2 = -direction2 if s % 4 == 0 else direction2
                    delta2 = 120 * direction2
                    page.mouse.wheel(0, delta2)
                    page.evaluate(f"() => {{ window.scrollBy(0, {delta2}); window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('mousewheel')); }}")
                    if s % 3 == 0:
                        dt = page.evaluate("() => document.getElementById('XWGXmBbB') ? document.getElementById('XWGXmBbB').dataset.time : null")
                        print(f"  [Step 2 - {s}s] dataset.time: {dt}")
                    if extracted_sponsor_code:
                        break

        print(f"\nFINAL CODE RESULT: {extracted_sponsor_code}\n")
    browser.close()

