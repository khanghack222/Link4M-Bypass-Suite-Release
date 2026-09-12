import re
import time
import urllib.request
from rapidocr_onnxruntime import RapidOCR
from config import log

ocr_engine = RapidOCR()
TLD_REGEX = r'(?:com|net|vn|org|info|biz|ltd|co|io|in|cc|me|live|pro|club|tech|site|online|top|vip|win|app|xyz|tv|us|uk|ws|space|store|bet|game|games|asia|link|click|icu|pw|work|one|news|today|blog|us\.com|jpn\.com|za\.com|uk\.com|us\.org)'

def detect_sponsor_domain(page_link) -> str:
    """Detect sponsor domain from Link4M SERP image using RapidOCR."""
    target_img = None
    for _ in range(6):
        for img in page_link.locator("img").all():
            src = img.get_attribute("src") or ""
            if "img.link4m.net" in src and "/1_" in src:
                target_img = img
                break
        if target_img:
            break
        time.sleep(1)

    if not target_img:
        return ""

    src = target_img.get_attribute("src") or ""
    log(f"[*] Found sponsor SERP image: {src}")
    
    img_bytes = None
    try:
        img_bytes = target_img.screenshot()
    except Exception:
        pass
    if not img_bytes:
        try:
            resp = page_link.request.get(src)
            if resp.ok:
                img_bytes = resp.body()
        except Exception:
            pass

    if not img_bytes:
        return ""

    res, _ = ocr_engine(img_bytes)
    if not res:
        return ""

    candidates = []
    for line in res:
        text = line[1].strip()
        text_clean = re.sub(r'\.i0(?=[^a-zA-Z0-9]|$)', '.io', text, flags=re.IGNORECASE)
        matches = re.findall(r'([a-zA-Z0-9\-]{2,}(?:\.[a-zA-Z0-9\-]+)*\.' + TLD_REGEX + r')(?=[^a-zA-Z0-9\-]|$)', text_clean, re.IGNORECASE)
        for m in matches:
            d = m.lower().rstrip("/")
            if "link4m" not in d and d not in candidates:
                candidates.append(d)

    filtered = [c for c in candidates if c not in ["uk.com", "us.com", "jpn.com", "za.com", "us.org"]]
    log(f"[*] Extracted domain candidates from OCR: {filtered}")

    # Fast verify top candidate
    for c in filtered:
        test_u = f"https://{c}"
        try:
            req = urllib.request.Request(test_u, headers={"User-Agent": "Mozilla/5.0"})
            if urllib.request.urlopen(req, timeout=4).getcode() in (200, 301, 302):
                log(f"[+] Verified active sponsor website: {test_u}")
                return test_u
        except Exception:
            pass

    return f"https://{filtered[0]}" if filtered else ""

def solve_sponsor_quest(context, sponsor_url: str) -> str:
    """Execute multi-step mission on sponsor website and return extracted code."""
    log(f"[*] Opening sponsor site via Google referrer: {sponsor_url}")
    page = context.new_page()
    try:
        page.goto("https://www.google.com", wait_until="domcontentloaded", timeout=20000)
    except Exception:
        pass
    time.sleep(1)

    try:
        page.goto(sponsor_url, wait_until="domcontentloaded", referer="https://www.google.com/", timeout=45000)
    except Exception as e:
        log(f"[!] Warning navigating to sponsor: {e}")
    time.sleep(2)

    # Detect traffic key
    html = page.content()
    m_key = re.search(r'(?:what-on\.com|website-analytics\.net|traffic)[^"\']*?key=([a-zA-Z0-9]+)', html)
    traffic_key = m_key.group(1) if m_key else None
    if not traffic_key:
        div_ids = page.evaluate("() => Array.from(document.querySelectorAll('div[id]')).map(d => d.id).filter(id => /^[a-zA-Z0-9]{8}$/.test(id))")
        if div_ids:
            traffic_key = div_ids[0]
    log(f"[*] Detected traffic_key: {traffic_key}")

    code_found = None
    def on_response(res):
        nonlocal code_found
        if "get_quest_code.html" in res.url:
            try:
                data = res.json()
                if data.get("success") and data.get("html"):
                    code_found = data.get("html")
                    log(f"🎉 EXTRACTED SPONSOR CODE FROM API: {code_found}")
            except Exception:
                pass
    page.on("response", on_response)

    btn_sel = f"[id='{traffic_key}'] button, [id='{traffic_key}'] a, [id='{traffic_key}'], button:has-text('LẤY MÃ'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), .whatoncode" if traffic_key else "button:has-text('LẤY MÃ'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), .whatoncode"

    def prep_page():
        page.evaluate("""() => {
            document.querySelectorAll('script[type="rocketlazyloadscript"]').forEach(s => {
                const ns = document.createElement('script');
                if (s.hasAttribute('data-rocket-src')) {
                    let src = s.getAttribute('data-rocket-src');
                    ns.src = src.startsWith('//') ? 'https:' + src : src;
                } else {
                    ns.textContent = s.textContent;
                }
                document.body.appendChild(ns);
            });
            document.querySelectorAll('#hpps-popup, .hpps-popup, .popup, .modal, [class*=\"popup\"]').forEach(e => e.remove());
        }""")
        if traffic_key:
            page.evaluate(f"() => {{ window.location.hash = '#ss-{traffic_key}'; if (typeof forceShowButton === 'function') forceShowButton(); }}")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    visited = {sponsor_url.rstrip("/")}
    for step in range(1, 4):
        if code_found:
            break
        log(f"\n[*] EXECUTING STEP {step} ON SPONSOR SITE")

        if step > 1:
            article = None
            try:
                for a in page.locator("a[href^='https://']").all():
                    h = (a.get_attribute("href") or "").rstrip("/")
                    if sponsor_url in h and h not in visited and not any(x in h for x in [".jpg", ".png", ".webp", ".css", ".js", "feed", "wp-", "#"]):
                        article = h
                        visited.add(h)
                        break
            except Exception:
                pass
            if not article:
                article = f"{sponsor_url}/bai-viet-{step}/"
                visited.add(article.rstrip("/"))
            log(f"[*] Navigating to Step {step} article: {article}")
            try:
                page.goto(article, wait_until="domcontentloaded", timeout=40000)
            except Exception:
                pass
            time.sleep(2)

        prep_page()
        time.sleep(1.5)

        btn = page.locator(btn_sel).first
        if btn.count() == 0:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1.5)
            btn = page.locator(btn_sel).first

        if btn.count() == 0:
            log(f"[!] Step {step}: Button not found, skipping...")
            continue

        log(f"[+] Step {step}: Button located. Clicking...")
        try:
            btn.click(force=True)
        except Exception:
            btn.evaluate("el => el.click()")
        time.sleep(2)

        sec_dur = page.evaluate(f"() => {{ const el = document.getElementById('{traffic_key}'); return el && el.dataset.time ? parseFloat(el.dataset.time) : 60; }}")
        log(f"[*] Step {step}: Countdown duration = {sec_dur}s")

        dir_wheel = 1
        for sec in range(1, int(sec_dur) + 30):
            time.sleep(1)
            dir_wheel = -dir_wheel if sec % 5 == 0 else dir_wheel
            page.mouse.wheel(0, 120 * dir_wheel)
            
            rem = page.evaluate(f"() => {{ const el = document.getElementById('{traffic_key}'); return el && el.dataset.time ? parseFloat(el.dataset.time) : null; }}")
            if sec % 5 == 0 or (rem is not None and rem <= 5):
                log(f"  [Step {step} - {sec}s] Remaining: {rem}s")

            if code_found or (rem is not None and rem <= 0):
                time.sleep(2)
                break

    if not code_found:
        body = page.evaluate("() => document.body.innerText")
        m = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code)[\s\:\-]+([A-Za-z0-9]{4,8})', body)
        if m:
            code_found = m.group(1)
            log(f"[+] FOUND CODE IN BODY: {code_found}")

    try:
        page.close()
    except Exception:
        pass

    return code_found
