import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TARGET_LINK = "https://link4m.org/go/HbsX8nh"

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
    page = context.new_page()
    page.goto(TARGET_LINK, wait_until="networkidle")
    time.sleep(3)

    # Click the visible anchor checkbox
    anchors = page.locator("iframe[src*='recaptcha/api2/anchor']")
    print("Found anchor iframes:", anchors.count())
    for i in range(anchors.count()):
        box = anchors.nth(i).bounding_box()
        print(f"Anchor {i} bbox: {box}")
        if box and box['width'] > 0 and box['height'] > 0:
            frame = anchors.nth(i).content_frame
            chk = frame.locator("#recaptcha-anchor")
            if chk.count() > 0 and chk.is_visible():
                print(f"[+] Clicking anchor {i}...")
                chk.click()
                break

    time.sleep(3)

    # Inspect bframes
    bframes = page.locator("iframe[src*='recaptcha/api2/bframe']")
    print("Found bframe iframes:", bframes.count())
    for i in range(bframes.count()):
        box = bframes.nth(i).bounding_box()
        print(f"Bframe {i} bbox: {box}")
        if box and box['width'] > 0 and box['height'] > 0:
            frame = bframes.nth(i).content_frame
            # check buttons inside frame
            btns = frame.locator("button")
            print(f"Bframe {i} buttons count: {btns.count()}")
            for b in range(btns.count()):
                b_id = btns.nth(b).get_attribute("id") or ""
                b_title = btns.nth(b).get_attribute("title") or ""
                print(f"  btn {b}: id='{b_id}', title='{b_title}'")
            
            # check headers or error text
            texts = frame.locator(".rc-doscaptcha-header, .rc-imageselect-desc, .rc-imageselect-desc-no-canonical")
            for t in range(texts.count()):
                print(f"  text {t}: '{texts.nth(t).inner_text().strip()}'")

    page.screenshot(path=r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\recaptcha_inspect.png")
    print("Saved recaptcha_inspect.png")
    time.sleep(5)
    browser.close()
