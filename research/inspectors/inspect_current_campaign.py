import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
import urllib.request
import re
from rapidocr_onnxruntime import RapidOCR
import time

ocr = RapidOCR()
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    page = context.new_page()
    print("[*] Opening link4m.org/go/HbsX8nh...")
    page.goto("https://link4m.org/go/HbsX8nh", wait_until="networkidle")
    time.sleep(3)
    
    # Check images in advertise wrapper
    imgs = page.locator("#advertise-html-wrapper img").all()
    print(f"[+] Found {len(imgs)} images in advertise wrapper")
    
    for i, img in enumerate(imgs):
        src = img.get_attribute("src") or ""
        print(f"Image {i}: {src[:60]}...")
        if src.startswith("data:image"):
            import base64
            b64_data = src.split(",")[1]
            img_bytes = base64.b64decode(b64_data)
            res, _ = ocr(img_bytes)
            print(f"  OCR {i}: {[r[1] for r in res] if res else 'empty'}")
        elif src.startswith("http"):
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://link4m.org/"})
            try:
                with urllib.request.urlopen(req) as resp:
                    res, _ = ocr(resp.read())
                    print(f"  OCR {i} ({src.split('/')[-1]}): {[r[1] for r in res] if res else 'empty'}")
            except Exception as e:
                print(f"  OCR error on {src}: {e}")
                
    browser.close()
