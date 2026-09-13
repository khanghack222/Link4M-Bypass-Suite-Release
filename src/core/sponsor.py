import re
import time
import urllib.request
import ssl
import base64
from rapidocr_onnxruntime import RapidOCR
from config import log

_OCR_INSTANCE = None
def get_ocr():
    global _OCR_INSTANCE
    if _OCR_INSTANCE is None:
        _OCR_INSTANCE = RapidOCR()
    return _OCR_INSTANCE

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE

MEDIA_EXTS = {'jpg', 'png', 'webp', 'jpeg', 'gif', 'html', 'js', 'css', 'svg', 'mp3', 'mp4', 'json'}

def unmask_domain_candidates(raw_text: str):
    """Auto unmask domains with asterisks like shin-shih.co***.tw or site.c***"""
    results = []
    clean = raw_text.replace('★', '*').replace('x', 'x')

    # Pattern 1: domain.c***.tw / domain.co***.vn / domain.co***.tw
    for m in re.finditer(r'([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})', clean, re.IGNORECASE):
        p, cc = m.group(1).lower(), m.group(2).lower()
        results.extend([f"{p}.com.{cc}", f"{p}.co.{cc}", f"{p}.{cc}"])

    # Pattern 2: domain.c*** or domain.co***
    for m in re.finditer(r'([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+(?![a-zA-Z0-9])', clean, re.IGNORECASE):
        results.append(f"{m.group(1).lower()}.com")

    # Pattern 3: domain.n***
    for m in re.finditer(r'([a-zA-Z0-9\-]{2,})\.n\*+(?![a-zA-Z0-9])', clean, re.IGNORECASE):
        results.append(f"{m.group(1).lower()}.net")

    # Pattern 4: domain.o***
    for m in re.finditer(r'([a-zA-Z0-9\-]{2,})\.o\*+(?![a-zA-Z0-9])', clean, re.IGNORECASE):
        results.append(f"{m.group(1).lower()}.org")

    # Pattern 5: domain.v***
    for m in re.finditer(r'([a-zA-Z0-9\-]{2,})\.v\*+(?![a-zA-Z0-9])', clean, re.IGNORECASE):
        results.append(f"{m.group(1).lower()}.vn")

    # Pattern 6: split/masked domains like dawnseeker. .com or site.***.com
    for m in re.finditer(r'([a-zA-Z0-9\-]{3,})\.(?:[\s\*\.\-\_]+)(com|net|org|vn|tw|za\.com|co|site|vip)', clean, re.IGNORECASE):
        p, suf = m.group(1).lower(), m.group(2).lower()
        results.extend([f"{p}.za.{suf}", f"{p}.{suf}", f"{p}.com.{suf}", f"{p}.com", f"{p}.net", f"{p}.org"])

    return list(dict.fromkeys(results))

VALID_TLDS = [
    'com.vn', 'com.tw', 'co.uk', 'co.jp', 'za.com', 'com', 'net', 'org', 'io', 'cc',
    'me', 'vn', 'tw', 'vip', 'tv', 'co', 'site', 'top', 'online', 'xyz',
    'info', 'biz', 'club', 'games', 'app', 'live', 'ai', 'in', 'us', 'uk'
]
TLD_REGEX = '|'.join([re.escape(t) for t in sorted(VALID_TLDS, key=len, reverse=True)])

def extract_domain_candidates(ocr_lines):
    candidates = []
    raw_texts = []
    for item in (ocr_lines or []):
        if isinstance(item, str):
            t = item.strip()
            if t:
                raw_texts.append(t)
        elif isinstance(item, (list, tuple)) and len(item) > 1:
            t = str(item[1]).strip()
            if t:
                raw_texts.append(t)

    # Expand texts with OCR typo corrections
    texts = []
    full_joined = ' '.join(raw_texts)
    raw_texts.append(full_joined)
    # Remove all spaces between domain-like word tokens (e.g. bong com 686 -> bongcom686, https://bong com -> https://bong.com)
    joined_domain_parts = re.sub(r'([a-zA-Z0-9\-]+)\s*\.\s*([a-zA-Z0-9\-]+)', r'\1.\2', full_joined)
    raw_texts.append(joined_domain_parts)
    joined_space_dots = re.sub(r'([a-zA-Z0-9\-]+)\s+([a-zA-Z0-9\-]+)\s+(com|net|org|co|vn|io|686|88|win)', r'\1.\2.\3', full_joined)
    raw_texts.append(joined_space_dots)
    joined_direct_dots = re.sub(r'([a-zA-Z0-9\-]+)\s+(com|net|org|co|vn|io)\s+([a-zA-Z0-9]+)', r'\1.\2.\3', full_joined)
    raw_texts.append(joined_direct_dots)

    for text in raw_texts:
        texts.append(text)
        fixed = text
        fixed = re.sub(r'\.i0([A-Z])', r'.io \1', fixed)
        fixed = re.sub(r'\.i0(?![a-zA-Z0-9])', '.io', fixed, flags=re.IGNORECASE)
        fixed = re.sub(r'\.c0m(?![a-zA-Z0-9])', '.com', fixed, flags=re.IGNORECASE)
        fixed = re.sub(r'\.0rg(?![a-zA-Z0-9])', '.org', fixed, flags=re.IGNORECASE)
        fixed = re.sub(rf'({TLD_REGEX})([A-Z])', r'\1 \2', fixed)
        if fixed != text:
            texts.append(fixed)

    # Priority 0: Unmask any masked domains like shin-shih.co***.tw or dawnseeker. .com
    for text in texts:
        if any(sym in text for sym in ['*', '★', '...']) or re.search(r'[a-zA-Z0-9\-]{3,}\.\s*(?:\.|\*+)?\s*(?:com|net|org|vn)', text):
            for u in unmask_domain_candidates(text):
                if 'link4m' not in u and u not in candidates:
                    candidates.append(u)

    # Priority 1: Match URLs starting with http:// or https:// (allowing trailing path/sub-parts)
    for text in texts:
        for m in re.findall(r'https?:\/\/([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)', text):
            d = m.lower().rstrip('/')
            if 'link4m' not in d and d not in candidates:
                candidates.append(d)
        for m in re.finditer(r'(?:https?:\/\/)?([a-zA-Z0-9\-]+\.(?:com|net|org|co|vn|tw))\s*[\.\s_]*([a-zA-Z0-9]+)', text, re.IGNORECASE):
            d = f"{m.group(1).lower()}.{m.group(2).lower()}" if m.group(2).isdigit() else f"{m.group(1).lower()}{m.group(2).lower()}"
            if 'link4m' not in d and d not in candidates:
                candidates.append(m.group(1).lower())
                candidates.append(d)

    # Priority 1.5: Stems without valid TLDs (e.g. https://phanvansantos or https://www.ok365)
    EXPAND_TLDS = ['com', 'vn', 'net', 'org', 'info', 'com.vn', 'xyz', 'top', 'site', 'vip', 'io']
    for text in texts:
        for m in re.finditer(r'https?:\/\/([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*)', text, re.IGNORECASE):
            stem = m.group(1).lower().rstrip('/')
            if 'link4m' not in stem and 'google' not in stem:
                parts = stem.split('.')
                if len(parts) == 1 or (len(parts) == 2 and parts[0] == 'www'):
                    base = parts[-1]
                    for t in EXPAND_TLDS:
                        c1 = f"{base}.{t}"
                        c2 = f"www.{base}.{t}"
                        if c1 not in candidates: candidates.append(c1)
                        if c2 not in candidates: candidates.append(c2)

    # Priority 1.8: Alphanumeric tokens with digits in OCR (e.g. BongDa686 -> bongda686.com, ok365 -> ok365.com)
    for text in texts:
        for m in re.finditer(r'([a-zA-Z]{3,}[0-9]{1,4}|[a-zA-Z0-9]*[0-9]+[a-zA-Z0-9]*)', text):
            tok = m.group(1).lower()
            if 4 <= len(tok) <= 25 and not tok.isdigit():
                for t in ['com', 'vn', 'net', 'org', 'com.vn', 'vip', 'io', 'top']:
                    c1 = f"{tok}.{t}"
                    if c1 not in candidates: candidates.append(c1)

    # Priority 2: Match strictly valid TLDs with word boundary (?![a-zA-Z0-9])
    for text in texts:
        for m in re.finditer(rf'([a-zA-Z0-9\-]{{2,}})\.({TLD_REGEX})(?![a-zA-Z0-9])', text, re.IGNORECASE):
            full_d = f"{m.group(1).lower()}.{m.group(2).lower()}"
            if 'link4m' not in full_d and len(full_d) >= 4 and full_d not in candidates:
                candidates.append(full_d)

    # Priority 3: Match any token with dot domain (letters/digits + dot + 2..10 letter TLD)
    for text in texts:
        cleaned = re.sub(r'[^a-zA-Z0-9\.\-\/]', ' ', text)
        for part in cleaned.split():
            part = part.strip('./-')
            m = re.search(rf'(?:[a-zA-Z0-9\-]+\.)+({TLD_REGEX})', part, re.IGNORECASE)
            if m:
                d = part.lower().rstrip('/')
                if 'link4m' not in d and len(d) >= 4 and d not in candidates:
                    candidates.append(d)

    # Phân hạng candidate: ưu tiên tuyệt đối domain có Website: hoặc https:// trong OCR
    def rank_c(c):
        score = 0
        clow = c.lower()
        if 'google' in clow or 'link4m' in clow:
            return -9999
        for txt in texts:
            tlow = txt.lower().replace(' ', '')
            if f"https://{clow}" in tlow or f"http://{clow}" in tlow or f"website:{clow}" in tlow:
                score += 500
        if clow.count('.') >= 2:
            score += 40
        if any(kw in clow for kw in ['88', 'bet', 'keo', 'cai', 'casino', 'game', 'club', 'slot', 'win']):
            score += 20
        score += len(clow)
        return score

    candidates = [c for c in candidates if 'google' not in c.lower() and 'link4m' not in c.lower()]
    candidates.sort(key=rank_c, reverse=True)
    return candidates

from concurrent.futures import ThreadPoolExecutor

def _probe_single_proto(proto_url: str):
    try:
        req = urllib.request.Request(
            proto_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=2.5) as resp:
            if resp.getcode() in (200, 301, 302):
                html = resp.read(65536).decode('utf-8', errors='ignore')
                has_script = any(k in html.lower() for k in ['traffic', 'widget', 'what-on', 'website-analytics', 'service-v', 'lấy mã', 'lay ma'])
                return (proto_url, has_script)
    except Exception:
        pass
    return ("", False)

def resolve_ip_google(domain: str) -> str:
    try:
        url = f"https://dns.google/resolve?name={domain}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=1.5) as r:
            import json
            data = json.loads(r.read())
            for ans in data.get('Answer', []):
                if ans.get('type') == 1:
                    return ans['data']
    except Exception:
        pass
    return ""

def probe_domain_live(domain: str):
    targets = [f"https://{domain}", f"http://{domain}"]
    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = [ex.submit(_probe_single_proto, t) for t in targets]
        best_url = ""
        has_best_script = False
        for f in futures:
            res_url, has_sc = f.result()
            if res_url:
                if has_sc:
                    return (res_url, True)
                if not best_url:
                    best_url = res_url
        if best_url:
            return (best_url, has_best_script)
    ip = resolve_ip_google(domain)
    if ip:
        return (f"https://{domain}", False)
    return ("", False)

def detect_sponsor_domain(page_link):
    all_texts = []
    base64_images = []

    # Step 1: Extract from Link4M page DOM text directly
    try:
        page_text = page_link.locator("body").inner_text()
        all_texts.extend(page_text.splitlines())
    except Exception:
        pass

    # Step 2: Extract from target sponsor images and base64 images
    for _ in range(8):
        try:
            imgs_info = page_link.evaluate("""() => {
                const res = [];
                document.querySelectorAll('img').forEach(img => {
                    const s = img.src || '';
                    if (s.startsWith('data:image/')) {
                        res.push({ type: 'b64', src: s });
                    } else if (s.includes('img.link4m.net') || s.includes('advertiser') || /\\d+_\\d+\\.(?:jpg|png)/.test(s)) {
                        res.push({ type: 'url', src: s });
                    }
                });
                return res;
            }""")
            if imgs_info:
                break
        except Exception:
            pass
        time.sleep(0.2)

    ocr = get_ocr()
    def _fetch_one_img(item):
        try:
            if item['type'] == 'b64':
                b64_str = item['src'].split(',', 1)[1] if ',' in item['src'] else item['src']
                return base64.b64decode(b64_str)
            else:
                req = urllib.request.Request(item['src'], headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://link4m.net/'})
                with urllib.request.urlopen(req, context=_SSL_CTX, timeout=3.5) as r:
                    return r.read()
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=min(len(imgs_info or [1]), 4)) as ex:
        all_img_bytes = list(ex.map(_fetch_one_img, imgs_info or []))

    for img_bytes in all_img_bytes:
        if not img_bytes:
            continue
        try:
            res, _ = ocr(img_bytes)
            if res:
                for line in res:
                    if len(line) > 1:
                        t = line[1].strip()
                        all_texts.append(t)
                try:
                    items = []
                    for box, text, conf in res:
                        cy = (box[0][1] + box[2][1]) / 2.0
                        min_x = min(p[0] for p in box)
                        items.append((cy, min_x, text))
                    items.sort(key=lambda x: x[0])
                    clusters = []
                    for it in items:
                        if not clusters or abs(clusters[-1][0] - it[0]) > 15:
                            clusters.append([it[0], [it]])
                        else:
                            clusters[-1][1].append(it)
                    for _, box_list in clusters:
                        box_list.sort(key=lambda x: x[1])
                        c_line = ' '.join(b[2] for b in box_list)
                        all_texts.append(c_line)
                except Exception:
                    pass
        except Exception:
            pass

    candidates = extract_domain_candidates(all_texts)
    log(f"[*] Extracted domain candidates (including unmasked): {candidates}")

    # Sắp xếp và phân hạng các ứng viên:
    def rank_candidate(c):
        score = 0
        clow = c.lower()
        for txt in all_texts:
            tlow = txt.lower()
            if f"https://{clow}" in tlow or f"http://{clow}" in tlow or f"website:{clow}" in tlow.replace(' ', ''):
                score += 500
        if clow.count('.') >= 2:
            score += 40
        if any(kw in clow for kw in ['88', 'bet', 'keo', 'cai', 'casino', 'game', 'club', 'slot', 'win']):
            score += 20
        prefix = clow.split('.')[0]
        if len(prefix) <= 3 and not prefix.isdigit():
            score -= 15
        score += len(clow) * 0.1
        return score

    candidates.sort(key=rank_candidate, reverse=True)

    # Probe live domain: domains with verified active sponsor scripts get TOP priority!
    script_urls = []
    live_urls = []
    for c in candidates:
        live_url, has_sc = probe_domain_live(c)
        if live_url:
            if has_sc and live_url not in script_urls:
                script_urls.append(live_url)
            elif live_url not in live_urls:
                live_urls.append(live_url)

    final_live = script_urls + [u for u in live_urls if u not in script_urls]
    if final_live:
        log(f"[+] Verified live sponsor website candidates (priority sorted): {final_live}")
        return final_live

    if candidates:
        fallbacks = [f"https://{c}" for c in candidates]
        log(f"[+] Fallback to candidate list: {fallbacks}")
        return fallbacks

    return []

def _solve_single_sponsor(context, sponsor_url: str) -> str:
    log(f"[*] Opening sponsor site via Google referrer: {sponsor_url}")
    page = context.new_page()

    # 1. Neutralize detectIncognito cleanly
    page.add_init_script("""
        if (window.navigator && window.navigator.webkitTemporaryStorage) {
            window.navigator.webkitTemporaryStorage.queryUsageAndQuota = function(success, error) {
                if (typeof success === 'function') success(100, 100000000000);
            };
        }
        window.mouse_scroll = true;
        window.traffic_click = true;
    """)

    def route_handler(route):
        req = route.request
        if req.resource_type in ["image", "media", "font"]:
            route.abort()
            return
        u = req.url.lower()
        if any(k in u for k in ["service", "widget", "traffic", "what-on", "website-analytics", "yoads"]):
            try:
                res = route.fetch()
                body = res.text()
                # Bypass detectIncognito checks in scripts
                body = body.replace('if(result.isPrivate){', 'if(false){')
                body = re.sub(r'var check_ref\s*=\s*false;', 'var check_ref = true;', body)
                # Keep scroll/active state
                body = body.replace('!mouse_scroll', 'false')
                body = body.replace('mouse_scroll = !1', 'mouse_scroll = true')
                body = body.replace('mouse_scroll = false', 'mouse_scroll = true')
                body = body.replace('traffic_blurred\n\t\t\t\t\t\t\t\t\t\t\t||', '')
                body = body.replace('traffic_blurred ||', '')
                route.fulfill(response=res, body=body)
                return
            except Exception:
                pass
        route.continue_()

    page.route("**/*", route_handler)

    try:
        page.goto(sponsor_url, wait_until="domcontentloaded", referer="https://www.google.com/", timeout=40000)
    except Exception as e:
        log(f"[!] Sponsor goto note: {e}")
        try: page.close()
        except Exception: pass
        return None
    time.sleep(0.4)

    html = page.content()
    m_key = re.search(r'(?:what-on\.com|website-analytics\.net|traffic)[^"\']*?key=([a-zA-Z0-9]+)', html)
    traffic_key = m_key.group(1) if m_key else None
    if not traffic_key:
        layout_blacklist = {'masthead', 'colophon', 'comments', 'site-nav', 'primary', 'secondary', 'content', 'wrapper', 'sidebar', 'footer', 'header', 'main-menu', 'wide-nav'}
        div_ids = page.evaluate("""() => Array.from(document.querySelectorAll('div[id]'))
            .map(d => d.id)
            .filter(id => (/^[a-zA-Z0-9]{8}$/.test(id) || /countdown|traffic|layma/i.test(id)))
        """)
        div_ids = [i for i in (div_ids or []) if i.lower() not in layout_blacklist]
        if div_ids:
            traffic_key = div_ids[0]
    log(f"[*] Detected traffic_key: {traffic_key}")

    def clean_code_str(text: str) -> str:
        if not text:
            return ""
        clean = re.sub(r'<[^>]+>', '', str(text))
        clean = re.sub(r'^(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code|M[ãa])[\s\:\-]+', '', clean, flags=re.IGNORECASE)
        return clean.strip()

    def is_valid_sponsor_code(text: str) -> bool:
        t = clean_code_str(text)
        if not t or len(t) < 4 or len(t) > 25:
            return False
        if any(w in t.lower() for w in ['click', 'vui lòng', 'vui long', 'link', 'bước', 'buoc', 'lay ma', 'lấy mã', 'chờ', 'seconds', 'giây']):
            return False
        return bool(re.match(r'^[A-Za-z0-9_\-]{4,25}$', t))

    code_found = None
    def on_resp(res):
        nonlocal code_found
        if any(ep in res.url for ep in ["get_quest_code.html", "get_code", "ajax_code", "lay_ma", "process-site", "check-site", "iatum"]):
            try:
                data = res.json()
                log(f"[*] API Response raw from {res.url[:70]}: {data}")
                raw = data.get("html") or data.get("code") or data.get("data") or data.get("c")
                if raw:
                    val = clean_code_str(raw)
                    if is_valid_sponsor_code(val):
                        code_found = val
                        log(f"🎉 EXTRACTED SPONSOR CODE FROM API: {code_found}")
                    else:
                        log(f"[*] API intermediate message: {val}")
            except Exception as ex:
                pass
    page.on("response", on_resp)

    btn_sel = f"[id='{traffic_key}'] button, [id='{traffic_key}'] a, [id='{traffic_key}'], button:has-text('LẤY MÃ'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), .whatoncode" if traffic_key else "button:has-text('LẤY MÃ'), button:has-text('LAY MA'), a:has-text('LẤY MÃ'), .whatoncode"

    def prep():
        page.evaluate(f"""() => {{
            document.querySelectorAll('script[type="rocketlazyloadscript"]').forEach(s => {{
                const ns = document.createElement('script');
                if (s.hasAttribute('data-rocket-src')) {{
                    let src = s.getAttribute('data-rocket-src');
                    ns.src = src.startsWith('//') ? 'https:' + src : src;
                }} else {{
                    ns.textContent = s.textContent;
                }}
                document.body.appendChild(ns);
            }});
            document.querySelectorAll('#hpps-popup, .hpps-popup, .popup, .modal, [class*="popup"]').forEach(e => e.remove());
            if ('{traffic_key}') {{
                window.location.hash = '#ss-{traffic_key}';
                if (typeof forceShowButton === 'function') forceShowButton();
            }}
            window.scrollTo(0, document.body.scrollHeight);

            // Active scroll heartbeat to defeat mouse_scroll timer pause in service-v3.js
            if (!window.heartbeat_scroll) {{
                let dir = 1;
                window.heartbeat_scroll = setInterval(() => {{
                    window.scrollBy(0, 25 * dir);
                    dir = -dir;
                    window.dispatchEvent(new Event('scroll'));
                }}, 750);
            }}
        }}""")

    visited = {sponsor_url.rstrip("/")}
    for step in range(1, 4):
        if code_found:
            break
        log(f"\n[*] EXECUTING STEP {step} ON SPONSOR SITE")

        if step > 1:
            article = None
            try:
                article_candidates = page.evaluate("""(sp_url) => {
                    const links = [];
                    const origin = new URL(sp_url).origin;
                    document.querySelectorAll('a[href]').forEach(a => {
                        try {
                            const u = new URL(a.href, window.location.href);
                            if (u.origin === origin && u.pathname.length > 2 && !u.pathname.includes('wp-admin') && !u.pathname.includes('feed') && !u.href.includes('#')) {
                                links.push(u.href.replace(/\\/$/, ''));
                            }
                        } catch (e) {}
                    });
                    return Array.from(new Set(links));
                }""", sponsor_url)
                for cand in (article_candidates or []):
                    if cand not in visited and not any(cand.endswith(ext) for ext in [".jpg", ".png", ".webp", ".css", ".js", ".svg"]):
                        article = cand
                        visited.add(cand)
                        break
            except Exception:
                pass
            if not article or article == sponsor_url:
                article = sponsor_url.rstrip("/")
                sep = "&" if "?" in article else "?"
                art_url = f"{article}{sep}step={step}#ss-{traffic_key}" if traffic_key else f"{article}{sep}step={step}"
            else:
                art_url = f"{article}#ss-{traffic_key}" if traffic_key and "#" not in article else article
            log(f"[*] Navigating to Step {step} article: {art_url}")
            try:
                page.goto(art_url, wait_until="domcontentloaded", timeout=35000)
            except Exception:
                pass
            time.sleep(1.0)

        prep()
        time.sleep(0.5)

        btn = page.locator(btn_sel).first
        if btn.count() == 0:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(0.4)
            btn = page.locator(btn_sel).first

        if btn.count() == 0:
            log(f"[!] Step {step}: Button not found, skipping...")
            if step == 1 and not traffic_key:
                log(f"[!] Bước 1 không có traffic_key và nút nhiệm vụ, dừng trang này để thử ứng viên khác.")
                try: page.close()
                except Exception: pass
                return None
            continue

        log(f"[+] Step {step}: Button located. Clicking...")
        try:
            btn.click(force=True)
        except Exception:
            btn.evaluate("el => el.click()")
        time.sleep(0.4)

        sec_dur = page.evaluate(f"() => {{ const el = document.getElementById('{traffic_key}'); return el && el.dataset.time ? parseFloat(el.dataset.time) : 60; }}")
        log(f"[*] Step {step}: Countdown duration = {sec_dur}s")

        dir_wheel = 1
        max_ticks = int((sec_dur + 15) * 2)
        for tick in range(1, max(max_ticks, 40)):
            time.sleep(0.5)
            if tick % 4 == 0:
                dir_wheel = -dir_wheel
                page.mouse.wheel(0, 120 * dir_wheel)

            rem = page.evaluate(f"""() => {{
                const el = document.getElementById('{traffic_key}');
                if (el && el.dataset.time) return parseFloat(el.dataset.time);
                const btn = document.querySelector(".completed, [class*='completed'], [id='{traffic_key}'] button, [id='{traffic_key}'], button");
                if (btn) {{
                    const m = (btn.innerText || '').match(/(\\d+)\\s*(?:giây|s)/i);
                    if (m) return parseFloat(m[1]);
                }}
                return null;
            }}""")
            if rem is not None:
                if tick % 6 == 0 or rem <= 3:
                    log(f"  [Step {step}] Remaining: {rem}s")
                if rem <= 0:
                    page.evaluate("() => { if (typeof checkButtonClick === 'function') checkButtonClick(); }")
                    if step == 1:
                        # Kiểm tra xem mã có xuất hiện luôn ở bước 1 không (single-step sponsor / traffic.com.vn)
                        for _ in range(16):
                            time.sleep(0.5)
                            if code_found:
                                break
                            try:
                                dom_t = page.evaluate(f"""() => {{
                                    const el = document.getElementById('{traffic_key}');
                                    if (el) {{
                                        const d = el.getElementsByTagName('div')[0];
                                        if (d && d.innerText) return d.innerText;
                                        return el.dataset.code || el.value || el.innerText || '';
                                    }}
                                    const cBtn = document.querySelector('.completed, [class*="completed"]');
                                    if (cBtn && cBtn.innerText) return cBtn.innerText;
                                    return null;
                                }}""")
                                if dom_t:
                                    cleaned = clean_code_str(dom_t)
                                    if is_valid_sponsor_code(cleaned):
                                        code_found = cleaned
                                        log(f"🎉 EXTRACTED SPONSOR CODE FROM DOM IN STEP 1: {code_found}")
                                        break
                            except Exception:
                                pass
                            has_quest = page.evaluate(f"() => {{ for (let k in localStorage) {{ if (k.includes('quest')) return true; }} return false; }}")
                            if has_quest:
                                break
                    else:
                        log(f"[*] Step {step} countdown finished! Waiting for mission code from API/DOM...")
                        for _ in range(30):
                            time.sleep(0.5)
                            if code_found:
                                break
                            try:
                                dom_t = page.evaluate(f"""() => {{
                                    const el = document.getElementById('{traffic_key}');
                                    if (el) {{
                                        const d = el.getElementsByTagName('div')[0];
                                        if (d && d.innerText) return d.innerText;
                                        return el.dataset.code || el.value || el.innerText || '';
                                    }}
                                    return null;
                                }}""")
                                if dom_t:
                                    cleaned = clean_code_str(dom_t)
                                    if is_valid_sponsor_code(cleaned):
                                        code_found = cleaned
                                        log(f"🎉 EXTRACTED SPONSOR CODE FROM DOM IN STEP {step}: {code_found}")
                                        break
                            except Exception:
                                pass
                    break

            if code_found:
                break

        if code_found:
            break

    if not code_found:
        time.sleep(1.5)
        dom_val = page.evaluate(f"""() => {{
            const elDirect = document.getElementById('{traffic_key}');
            if (elDirect) {{
                const t = (elDirect.dataset.code || elDirect.value || elDirect.innerText || '').trim();
                if (/^[A-Za-z0-9_\\-]{{4,20}}$/.test(t) && !/lay|ma|click|link|buoc/i.test(t)) return t;
            }}
            const selList = [
                "[id='{traffic_key}']",
                "[id='{traffic_key}'] button",
                "[id='{traffic_key}'] span",
                "[id='{traffic_key}'] div",
                '.whatoncode',
                '.ma-xac-nhan',
                '#ma-km',
                '#token',
                '[data-code]'
            ];
            for (const s of selList) {{
                try {{
                    const el = document.querySelector(s);
                    if (el) {{
                        const t = (el.dataset.code || el.value || el.innerText || '').trim();
                        if (/^[A-Za-z0-9_\\-]{{4,20}}$/.test(t) && !/lay|ma|click|link|buoc/i.test(t)) return t;
                    }}
                }} catch (e) {{}}
            }}
            return null;
        }}""")
        if dom_val and is_valid_sponsor_code(dom_val):
            code_found = clean_code_str(dom_val)
            log(f"🎉 EXTRACTED SPONSOR CODE FROM DOM: {code_found}")

    if not code_found:
        body = page.evaluate("() => document.body.innerText")
        m = re.search(r'(?:M[ãa]\s*KM|M[ãa]\s*x[áa]c\s*nh[ậa]n|Code|M[ãa])[\s\:\-]+([A-Za-z0-9]{4,15})', body)
        if m and is_valid_sponsor_code(m.group(1)):
            code_found = clean_code_str(m.group(1))
            log(f"[+] FOUND CODE IN BODY: {code_found}")

    try:
        page.close()
    except Exception:
        pass

    return code_found

def solve_sponsor_quest(context, sponsor_url_or_list) -> str:
    urls = [sponsor_url_or_list] if isinstance(sponsor_url_or_list, str) else sponsor_url_or_list
    for idx, sponsor_url in enumerate(urls):
        if not sponsor_url:
            continue
        log(f"\n[*] [{idx+1}/{len(urls)}] Đang thử nghiệm trang tài trợ: {sponsor_url}")
        code = _solve_single_sponsor(context, sponsor_url)
        if code:
            return code
        log(f"[-] Trang {sponsor_url} không tìm thấy mã nhiệm vụ, tự động chuyển sang ứng viên tiếp theo...")
    return None
