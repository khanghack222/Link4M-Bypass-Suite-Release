import sys, json, re, urllib.request, ssl, socket, concurrent.futures
sys.stdout.reconfigure(encoding='utf-8')
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

IGNORE = {
    'google.com', 'google.com.vn', 'shopee.vn', 'youtube.com', 'facebook.com',
    'tiktok.com', 'instagram.com', 'twitter.com', 'x.com', 'wikipedia.org',
    'scholar.google.com', 't.me', 'telegram.org', 'linkhuongdan.online', 'octolink.vip',
    'play.google.com', 'mudeo.app', 'apps.apple.com'
}
JUNK_TLD = ('.app', '.play')
GOOD_TLD = ('.cc', '.me', '.my', '.vip', '.tv', '.tips', '.net', '.live', '.com', '.games', '.in', '.online')

def has_traffic_widget(d):
    try:
        socket.gethostbyname(d)
    except:
        return False

    try:
        req = urllib.request.Request(
            f'https://{d}/',
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com/'
            }
        )
        html = urllib.request.urlopen(req, context=ctx, timeout=4.0).read().decode('utf-8', errors='ignore').lower()
        if 'trafficqq.io.vn' in html:
            return False
        return any(k in html for k in ['shortearn', 'octolink', 'trafficvip.vip', 'click90s', '4mmo', 'trafficvn', 'check/job'])
    except:
        return False

def resolve_domain(img_url):
    try:
        req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://linkhuongdan.online/'})
        data = urllib.request.urlopen(req, context=ctx, timeout=5).read()
    except Exception as e:
        return []
    lines, _ = engine(data)
    candidates = []
    if lines:
        for l in lines:
            text = l[1].strip()
            for p in text.split():
                p = p.strip('()[]{}<>,;:\'\"')
                m = re.search(r'(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)', p)
                if m:
                    d = m.group(1).lower()
                    if d in IGNORE or any(d.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp'] + list(JUNK_TLD)):
                        continue
                    if d not in candidates:
                        candidates.append(d)

    ranked = [d for d in candidates if d.endswith(GOOD_TLD)] + [d for d in candidates if not d.endswith(GOOD_TLD)]
    verified = []
    if ranked:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(ranked))) as executor:
            future_to_d = {executor.submit(has_traffic_widget, d): d for d in ranked[:10]}
            for future in concurrent.futures.as_completed(future_to_d):
                d = future_to_d[future]
                try:
                    if future.result():
                        verified.append(d)
                except:
                    pass

    if verified:
        verified.sort(key=lambda d: 0 if d.endswith(GOOD_TLD) else 1)
        return verified
    return [d for d in ranked if not d.endswith('.com') and not d.endswith('.app')] or ranked[:1]

if __name__ == '__main__':
    url = sys.argv[1]
    res = resolve_domain(url)
    print(json.dumps(res))

