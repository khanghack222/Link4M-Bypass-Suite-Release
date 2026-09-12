from playwright.sync_api import sync_playwright
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page()
    page.goto("https://tylekeongoaihanganh.com", wait_until="networkidle", referer="https://www.google.com/")
    time.sleep(3)
    container = page.locator("#YS0bwyox")
    print(f"#YS0bwyox count: {container.count()}")
    if container.count() > 0:
        print("Container innerHTML:", container.inner_html())
    browser.close()
