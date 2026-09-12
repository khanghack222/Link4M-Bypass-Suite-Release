import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
import time
import base64
import urllib.request
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

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
    print("[*] Opening link4m...")
    page.goto("https://link4m.org/go/HbsX8nh", wait_until="networkidle")
    time.sleep(3)

    # Save page html
    html = page.locator("#advertise-html-wrapper").inner_html()
    with open(r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\live_campaign.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[+] Saved live_campaign.html ({len(html)} bytes)")

    # Find images
    imgs = page.locator("#advertise-html-wrapper img").all()
    print(f"[+] Found {len(imgs)} images:")
    for i, img in enumerate(imgs):
        src = img.get_attribute("src") or ""
        if src.startswith("data:image"):
            b64 = src.split(",")[1]
            raw = base64.b64decode(b64)
            res, _ = ocr(raw)
            print(f"  [Image {i} (base64)]: {[r[1] for r in res] if res else 'empty'}")
        elif src.startswith("http"):
            print(f"  [Image {i} (url)]: {src}")
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://link4m.org/"})
            try:
                with urllib.request.urlopen(req) as resp:
                    res, _ = ocr(resp.read())
                    print(f"    OCR: {[r[1] for r in res] if res else 'empty'}")
            except Exception as e:
                print(f"    OCR error: {e}")

    browser.close()
