import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page()
    page.goto("https://five888.ltd", wait_until="networkidle", referer="https://www.google.com/")
    time.sleep(3)
    container = page.locator("#XWGXmBbB")
    print(f"#XWGXmBbB count: {container.count()}")
    if container.count() > 0:
        print("HTML in container:", container.inner_html()[:200])
    # check any buttons or elements with text 'LẤY MÃ'
    elements = page.locator("text=/L[AẤaấ]Y M[AÃaã]/").all()
    print(f"Elements with LAY MA: {len(elements)}")
    for e in elements:
        print("  tag:", e.evaluate("el => el.tagName"), "text:", e.inner_text())
    browser.close()
