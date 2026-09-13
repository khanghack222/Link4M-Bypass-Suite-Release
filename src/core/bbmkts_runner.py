import sys
import os
import time
import json
import base64
import re
import urllib.request
import urllib.parse
from playwright.sync_api import sync_playwright
from rapidocr_onnxruntime import RapidOCR

# Cau hinh stdout UTF-8 cho terminal Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEMP_DIR = os.path.join(ROOT_DIR, "data", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
DEST_FILE = os.path.join(ROOT_DIR, "destination_url.txt")
CODE_FILE = os.path.join(ROOT_DIR, "extracted_code.txt")

ocr_engine = None

def get_ocr():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = RapidOCR()
    return ocr_engine

def run(target_link: str = None, headless: bool = None):
    if not target_link:
        target_link = sys.argv[1].strip() if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "https://bbmkts.com/go/3p82s"
    if headless is None:
        headless = "--headless" in sys.argv or "-h" in sys.argv

    final_destination = None

    with sync_playwright() as p:
        log("[1/4] Khoi dong trinh duyet Chromium...")
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )

        # Chan cac script tracker, chan incognito popup
        context.route("**/api.js*", lambda r: r.abort())
        context.route("**/apiip.js*", lambda r: r.abort())
        context.route("**/sweetalert2*", lambda r: r.abort())
        context.route("**/firebase*", lambda r: r.abort())

        # TAB 1: KET NOI VA PHAN TICH TRANG BBMKTS
        page1 = context.new_page()

        def handle_submit_response(resp):
            nonlocal final_destination
            if '/link/submit' in resp.url:
                try:
                    data = resp.json()
                    log(f"[API] Phan hoi /link/submit: {data}")
                    if 'url' in data and data['url']:
                        final_destination = data['url']
                except Exception:
                    pass

        page1.on('response', handle_submit_response)

        # Vong lap thu nhiem vu (Toi da 3 lan thu/reroll)
        final_code = None
        for attempt in range(1, 4):
            log(f"\n--- [LAN THU {attempt}/3] Load nhiem vu tai {target_link} ---")
            try:
                page1.goto(target_link, wait_until="domcontentloaded", timeout=45000)
            except Exception as e:
                log(f"[TAB 1] Warning on load: {e}")

            time.sleep(2)
            html1 = page1.content()
            log(f"[TAB 1] Da tai DOM ({len(html1)} bytes).")

            final_code = None

            # -------------------------------------------------------------
            # KIEM TRA CHIEN DICH LOAI B (CANVAS / MA TRUC TIEP / ANH STATIC)
            # -------------------------------------------------------------
            lower_html = html1.lower()
            if any(k in lower_html for k in ['không phải chờ 200', 'không phải code chờ giây', 'tra...25', 'he thong seo']):
                final_code = "trafficseo2025"
                log(f"[NHAN DIEN HEURISTIC] Phat hien chien dich SEO Static Guide! Ma mac dinh: >>> {final_code} <<<")

            canvas_script = None
            for s in re.findall(r'<script[^>]*>(.*?)</script>', html1, re.S):
                if 'imgCanvas' in s or 'canvas' in s:
                    canvas_script = s
                    break

            if not final_code and canvas_script:
                m_img = re.search(r'[\'"](https?://[^\'"]*uploads/[^\'"]+)[\'"]', canvas_script)
                if not m_img:
                    m_img = re.search(r'[\'"](/uploads/[^\'"]+)[\'"]', canvas_script)
                
                if m_img:
                    img_u = m_img.group(1)
                    if not img_u.startswith('http'):
                        img_u = 'https://bbmkts.com' + img_u
                    
                    tmp_img = os.path.join(TEMP_DIR, "canvas_test.png")
                    try:
                        urllib.request.urlretrieve(img_u, tmp_img)
                        from PIL import Image
                        im = Image.open(tmp_img)
                        lines, _ = get_ocr()(tmp_img)
                        all_text = ' '.join([l[1] for l in (lines or [])])
                        log(f"[OCR CANVAS] {all_text}")

                        if 'Tra' in all_text and '25' in all_text:
                            final_code = "trafficseo2025"
                            log(f"[NHAN DIEN] Chien dich Dang anh Huong dan SEO! Ma mac dinh: >>> {final_code} <<<")
                        elif im.size[0] < 500 and im.size[1] < 150:
                            if lines:
                                sorted_lines = sorted(lines, key=lambda x: x[0][0][0])
                                code_cand = re.sub(r'[^0-9a-zA-Z]', '', ''.join([l[1] for l in sorted_lines]))
                                if 5 <= len(code_cand) <= 15 and code_cand.isdigit():
                                    final_code = code_cand
                                    log(f"[NHAN DIEN] Chien dich Co san ma tren anh! Ma: >>> {final_code} <<<")
                    except Exception as e:
                        log(f"[WARN] Loi xu ly anh canvas: {e}")

            # Kiem tra tat ca anh trong uploads/ neu van chua tim ra ma
            if not final_code:
                upload_imgs = re.findall(r'https?://[^\s"\'<>]+/uploads/[^\s"\'<>]+\.(?:png|jpg|jpeg|webp)', html1)
                for img_u in upload_imgs:
                    if 'icon' in img_u.lower() or 'logo' in img_u.lower():
                        continue
                    tmp_img = os.path.join(TEMP_DIR, "guide_detect_" + os.path.basename(img_u.split('?')[0]))
                    try:
                        urllib.request.urlretrieve(img_u, tmp_img)
                        lines, _ = get_ocr()(tmp_img)
                        all_text = ' '.join([l[1] for l in (lines or [])])
                        if 'Tra' in all_text and '25' in all_text:
                            final_code = "trafficseo2025"
                            log(f"[NHAN DIEN OCR UPLOAD] Anh {os.path.basename(img_u)} chua ma SEO! >>> {final_code} <<<")
                            break
                        elif 'vietnam' in all_text.lower():
                            final_code = "vietnam"
                            log(f"[NHAN DIEN OCR UPLOAD] Anh {os.path.basename(img_u)} chua ma VietNam! >>> {final_code} <<<")
                            break
                    except Exception as e:
                        pass

            # -------------------------------------------------------------
            # KIEM TRA CHIEN DICH LOAI A (LINK NGOAI / WEBSITE DOI TAC)
            # -------------------------------------------------------------
            if not final_code:
                log("[NHAN DIEN] Chien dich Website Doi tac ngoai (Countdown Button)!")
                
                # Tim anh huong dan Buoc 3
                guide_url = "https://bbmkts.com/uploads/img_6a9a2b1a162aa2_23092712.jpg"
                m_guide = re.search(r'Bước\s*3:.*?<img[^>]+src=[\'"]([^\'"]+uploads/[^\'"]+)[\'"]', html1, re.S | re.I)
                if m_guide:
                    u = m_guide.group(1)
                    guide_url = u if u.startswith('http') else 'https://bbmkts.com/' + u.lstrip('/')
                else:
                    all_imgs = re.findall(r'https?://bbmkts\.com/uploads/img_[^"\'\s>]+', html1)
                    if all_imgs:
                        guide_url = all_imgs[0]

                log(f"[TAB 1] Anh huong dan tim trang: {guide_url}")
                tmp_guide = os.path.join(TEMP_DIR, "guide_step3.jpg")
                try:
                    urllib.request.urlretrieve(guide_url, tmp_guide)
                except Exception:
                    pass

                target_url = None

                # 1. Kiem tra window.taskConfig
                try:
                    req_domains = page1.evaluate("() => window.taskConfig && window.taskConfig.requiredDomains ? window.taskConfig.requiredDomains : null")
                    if req_domains and len(req_domains) > 0:
                        target_url = f"https://{req_domains[0]}/"
                        log(f"[CONFIG] Phat hien requiredDomains tu taskConfig: {target_url}")
                except Exception:
                    pass

                # 2. Phat hien Red Bounding Box
                if not target_url:
                    try:
                        from PIL import Image
                        import numpy as np
                        im_guide = Image.open(tmp_guide).convert('RGB')
                        arr = np.array(im_guide)
                        red_mask = (arr[:, :, 0] > 180) & (arr[:, :, 1] < 60) & (arr[:, :, 2] < 60)
                        y_indices, x_indices = np.where(red_mask)
                        h_threshold = int(arr.shape[0] * 0.3)
                        mask_lower = y_indices > h_threshold
                        y_low = y_indices[mask_lower]
                        x_low = x_indices[mask_lower]
                        if len(y_low) > 0:
                            min_y, max_y = y_low.min(), y_low.max()
                            min_x, max_x = x_low.min(), x_low.max()
                            crop_im = im_guide.crop((min_x, min_y, max_x, max_y))
                            tmp_crop = os.path.join(TEMP_DIR, "crop_target.jpg")
                            crop_im.save(tmp_crop)
                            lines_crop, _ = get_ocr()(tmp_crop)
                            texts_crop = [l[1] for l in (lines_crop or [])]
                            log(f"[OCR RED BOX] {' | '.join(texts_crop)}")
                            for t in texts_crop:
                                m_u = re.search(r'https?://([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))[>/]([a-zA-Z0-9._/-]+)', t)
                                if m_u:
                                    dom = m_u.group(1).lower().strip('.')
                                    if not any(k in dom for k in ['google', 'youtube', 'facebook', 'bbmkts', 'imgur', 'aimos']):
                                        slug = m_u.group(2).strip('/')
                                        target_url = f"https://{dom}/{slug}/"
                                        break
                            if not target_url:
                                for t in texts_crop:
                                    m_d = re.search(r'https?://([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))', t) or re.search(r'([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))', t)
                                    if m_d:
                                        dom = m_d.group(1).lower().strip('.')
                                        if not any(k in dom for k in ['google', 'youtube', 'facebook', 'bbmkts', 'imgur', 'aimos']):
                                            target_url = f"https://{dom}/"
                                            break
                    except Exception as e:
                        log(f"[WARN] Loi red-box detection: {e}")

                # 3. Fallback OCR full anh
                if not target_url:
                    try:
                        lines, _ = get_ocr()(tmp_guide)
                        texts = [l[1] for l in (lines or [])]
                        for t in texts:
                            m_u = re.search(r'https?://([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))[>/]([a-zA-Z0-9._/-]+)', t)
                            if m_u:
                                dom = m_u.group(1).lower().strip('.')
                                if not any(k in dom for k in ['google', 'youtube', 'facebook', 'bbmkts', 'imgur', 'aimos']):
                                    slug = m_u.group(2).strip('/')
                                    target_url = f"https://{dom}/{slug}/"
                                    break
                        if not target_url:
                            for t in texts:
                                m_d = re.search(r'https?://([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))', t) or re.search(r'([a-zA-Z0-9.-]+\.(?:com|vn|net|org|edu|gov))', t)
                                if m_d:
                                    dom = m_d.group(1).lower().strip('.')
                                    if not any(k in dom for k in ['google', 'youtube', 'facebook', 'bbmkts', 'imgur', 'aimos']):
                                        target_url = f"https://{dom}/"
                                        break
                    except Exception:
                        pass

                # Bang map chinh xac cac landing page co dinh
                if target_url:
                    if 'luxbikes.vn' in target_url and target_url.rstrip('/') == 'https://luxbikes.vn':
                        target_url = 'https://luxbikes.vn/xe-dap-tro-luc/'
                    elif 'namvietlift.com' in target_url and target_url.rstrip('/') == 'https://namvietlift.com':
                        target_url = 'https://namvietlift.com/xe-nang-tay/'
                    elif 'truongmaisaigon.vn' in target_url and target_url.rstrip('/') == 'https://truongmaisaigon.vn':
                        target_url = 'https://truongmaisaigon.vn/ghe-xoay-van-phong/'
                    elif 'eterra.vn' in target_url and target_url.rstrip('/') == 'https://eterra.vn':
                        target_url = 'https://eterra.vn/tu-chau-lavabo-eterra/'

                all_t = ' '.join(texts_crop if 'texts_crop' in locals() else (texts if 'texts' in locals() else [])).lower()
                if not target_url:
                    if 'eterra' in all_t:
                        target_url = 'https://eterra.vn/tu-chau-lavabo-eterra/'
                    elif 'bulong' in all_t or 'hoangha' in all_t:
                        target_url = 'https://bulonghoangha.com/'
                    elif 'truongmai' in all_t:
                        target_url = 'https://truongmaisaigon.vn/ghe-xoay-van-phong/'
                    elif 'namviet' in all_t:
                        target_url = 'https://namvietlift.com/xe-nang-tay/'
                    elif 'luxbike' in all_t:
                        target_url = 'https://luxbikes.vn/xe-dap-tro-luc/'

                if not target_url:
                    target_url = "https://luxbikes.vn/xe-dap-tro-luc/"

                log(f"[TARGET] Website doi tac duoc xac dinh: {target_url}")

                # ---------------------------------------------------------
                # TAB 2: TRUY CAP WEB NGOAI VA DEM NGUOC
                # ---------------------------------------------------------
                log(f"[2/4] [TAB 2] Mo tab moi truy cap {target_url} ...")
                page2 = context.new_page()

                abx_code = None
                def handle_abx(resp):
                    nonlocal abx_code
                    if any(k in resp.url for k in ['00abx', '02abx', '03abx']):
                        try:
                            data = resp.json()
                            tok = data.get('token')
                            if tok:
                                dec = json.loads(base64.b64decode(tok.split('.')[0] + '===').decode('utf-8'))
                                abx_code = dec.get('code')
                                log(f"[API {resp.url.split('?')[0].split('/')[-1]}] Server tra ve ma goc: >>> {abx_code} <<<")
                        except Exception:
                            pass

                page2.on('response', handle_abx)

                # Patch script bb*.js
                def route_bb(route):
                    url = route.request.url
                    resp = route.fetch()
                    txt = resp.text()
                    if 'bb' in url:
                        txt = "function detectIncognito(){ return Promise.resolve({isPrivate: false}); }\n" + txt
                        txt = txt.replace('if(_0x13d311[', 'if(false&&_0x13d311[')
                        txt = txt.replace('function checkAdsClick(){', 'function checkAdsClick(){return false;')
                        log(f"[PATCH] Da bypass Incognito tren script {url.split('?')[0].split('/')[-1]}!")
                    route.fulfill(response=resp, body=txt)

                page2.route(re.compile(r'bbmkts\.com/js/bb.*'), route_bb)

                page2.add_init_script("""
                    Object.defineProperty(document, 'referrer', { get: () => 'https://www.google.com/', configurable: true });
                    Document.prototype.hasFocus = () => true;
                    document.hasFocus = () => true;
                    window.hasFocus = () => true;
                    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
                    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
                    window.detectIncognito = async () => ({ isPrivate: false, browserName: 'Chrome' });
                """)

                try:
                    page2.goto(target_url, referer="https://www.google.com/", wait_until="domcontentloaded", timeout=45000)
                except Exception as e:
                    log(f"[TAB 2] Warning on load: {e}")

                time.sleep(3)
                log("[TAB 2] Cuon trang de tim nut lay ma...")
                page2.evaluate("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)

                # Tim nut voi danh sach selector da dang
                bb = None
                selectors = [
                    '#bb', '#bb1', '#bb2', '#00xoo', '.btn-layma',
                    'button:has-text("LẤY MÃ")', 'a:has-text("LẤY MÃ")',
                    '[id*="layma"]', '[class*="layma"]'
                ]
                for sel in selectors:
                    try:
                        el = page2.query_selector(sel)
                        if el and el.is_visible():
                            bb = el
                            log(f"[TAB 2] Tim thay button lay ma qua selector: '{sel}'")
                            break
                    except Exception:
                        pass

                if not bb:
                    log("[!] Khong tim thay button lay ma tren web doi tac nay!")
                    page2.close()
                    log("[RETRY] Kich hoat 'Doi tu khoa moi' tren Tab 1 de lay nhiem vu khac...")
                    page1.bring_to_front()
                    page1.evaluate("if (typeof confirmReload === 'function') confirmReload(); else location.reload();")
                    time.sleep(4)
                    continue

                # Click button bat dau countdown
                log("[TAB 2] Click button bat dau dem nguoc...")
                bb.scroll_into_view_if_needed()
                time.sleep(1)
                bb.click()

                for i in range(95):
                    time.sleep(1)

                    # Neu server da tra ma qua API 00abx va timer tren 60s
                    if abx_code and i >= 60:
                        final_code = abx_code
                        log(f"\n==================================================")
                        log(f"   [TAB 2] DA LAY DUOC MA (QUA API 00ABX): >>> {final_code} <<<")
                        log(f"==================================================\n")
                        break

                    txt = bb.inner_text().strip().replace('\n', ' ')
                    if i % 10 == 0 or 'ĐỢI' not in txt:
                        log(f"  [Countdown {i}s] Trang thai nut: '{txt}'")

                    # Kiem tra neu trang doi tac yeu cau chuyen sang Buoc 2 (2-in-1)
                    if 'Nhấn vào đây' in txt or 'tiếp tục' in txt:
                        link2 = page2.query_selector('a[href*="traffic="]') or bb.query_selector('a')
                        if link2:
                            next_u = link2.get_attribute('href')
                            log(f"[TAB 2] Chuyen tiep sang trang Buoc 2: {next_u}")
                            page2.goto(next_u, referer=page2.url, wait_until="domcontentloaded")
                            time.sleep(3)
                            page2.evaluate("window.scrollTo(0, document.body.scrollHeight);")
                            time.sleep(2)
                            for sel in selectors:
                                try:
                                    el = page2.query_selector(sel)
                                    if el and el.is_visible():
                                        bb = el
                                        bb.click()
                                        log("[TAB 2] Da click nut Buoc 2/2 thanh cong!")
                                        break
                                except Exception:
                                    pass
                            continue

                    # Kiem tra ma tren button
                    if 'ĐỢI' not in txt and 'LẤY MÃ' not in txt and len(txt) >= 4:
                        final_code = txt
                        log(f"\n==================================================")
                        log(f"   [TAB 2] DA LAY DUOC MA THANH CONG: >>> {final_code} <<<")
                        log(f"==================================================\n")
                        break

                page2.close()

            # Neu da lay duoc ma, thoat khoi vong lap thu
            if final_code:
                break

        if not final_code:
            log("[-] Khong the lay duoc ma xac nhan sau cac lan thu!")
            browser.close()
            return None

        # -------------------------------------------------------------
        # TAB 1: NHAP MA VA SUBMIT
        # -------------------------------------------------------------
        log(f"[3/4] [TAB 1] Quay lai trang BBMKTS de mo khoa va nhap ma...")
        page1.bring_to_front()

        link_el = page1.query_selector('#link')
        if link_el:
            log("[TAB 1] Click vao link quang cao de kich hoat session...")
            try:
                link_el.click(timeout=3000)
            except Exception:
                pass
            time.sleep(2)

        inp = page1.query_selector('#input-field') or page1.query_selector('input[name="code"]')
        if inp:
            log(f"[TAB 1] Dien ma '{final_code}' vao o nhap lieu...")
            inp.fill(final_code)

        time.sleep(1)

        log(f"[TAB 1] Gui request submit ma '{final_code}' truc tiep qua fetch...")
        res = page1.evaluate("""async (code) => {
            let token = '';
            let type = '';
            let tokenInp = document.querySelector('input[name="token"]');
            if (tokenInp) token = tokenInp.value;
            
            let scripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText);
            for (let s of scripts) {
                let m = s.match(/token:\\s*['"]([A-Za-z0-9._=-]+)['"]/);
                if (m) {
                    token = m[1];
                    if (s.includes("type: 'available'")) type = 'available';
                    break;
                }
            }
            let fm = document.getElementById('fm');
            let sendCode = async (c) => {
                let body = new URLSearchParams();
                body.append('code', c.trim());
                if (token) body.append('token', token);
                if (type) body.append('type', type);
                if (fm) {
                    for (let el of fm.elements) {
                        if (el.name && el.name !== 'code' && !body.has(el.name)) {
                            body.append(el.name, el.value);
                        }
                    }
                }
                let r = await fetch('https://bbmkts.com/link/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: body.toString()
                });
                let json = await r.json();
                return { ok: true, data: json, status: r.status };
            };

            try {
                let res = await sendCode(code);
                if (res.status !== 200 && code.toLowerCase() !== code) {
                    res = await sendCode(code.toLowerCase());
                }
                return res;
            } catch (e) {
                return { ok: false, error: e.toString() };
            }
        }""", final_code)
        log(f"[TAB 1] Ket qua submit: {res}")
        if res and res.get('ok') and isinstance(res.get('data'), dict) and res['data'].get('url'):
            final_destination = res['data']['url']
            log(f"[TAB 1] Phat hien link dich tu API: {final_destination}")
        elif res and res.get('ok') and isinstance(res.get('data'), str) and res['data'].startswith('http'):
            final_destination = res['data']
            log(f"[TAB 1] Phat hien link dich: {final_destination}")
        else:
            check_btn = page1.query_selector('#formgetlink') or page1.query_selector('#check222') or page1.query_selector('button[type="submit"]')
            if check_btn:
                log("[TAB 1] Mo khoa va click nut submit (#formgetlink / #check222)...")
                page1.evaluate("""() => {
                    let b = document.getElementById('formgetlink') || document.getElementById('check222') || document.querySelector('button[type="submit"]');
                    if (b) { b.disabled = false; b.click(); }
                }""")

        # -------------------------------------------------------------
        # TRICH XUAT VA GIAI MA LINK NGOAI CUOI CUNG
        # -------------------------------------------------------------
        log("[4/4] Dang cho nhan link chuyen huong dich...")
        for sec in range(25):
            if final_destination:
                break
            try:
                cur = page1.url
                if 'bbmkts.com/go/' not in cur and 'about:blank' not in cur:
                    final_destination = cur
                    break
            except Exception:
                pass

            try:
                toast = page1.query_selector('.toast-message')
                if toast and toast.is_visible():
                    log(f"  [Toast message] {toast.inner_text()}")
            except Exception:
                pass
            time.sleep(1)

        time.sleep(2)
        try:
            cur = page1.url
            if 'bbmkts.com/go/' not in cur and 'about:blank' not in cur:
                final_destination = cur
        except Exception:
            pass

        # Bypas trang trung gian /go/file/ de trich xuat link ngoai thuc te
        if final_destination and 'bbmkts.com/go/file/' in final_destination:
            encoded_part = final_destination.split('/go/file/')[-1]
            real_url = None
            try:
                dec = base64.b64decode(encoded_part + '===').decode('utf-8')
                if dec.startswith('http'):
                    real_url = dec
            except Exception:
                pass
            
            if not real_url:
                try:
                    dec = urllib.parse.unquote(encoded_part)
                    if dec.startswith('http'):
                        real_url = dec
                except Exception:
                    pass

            if real_url:
                log(f"[GET LINK NGOAI] Da giai ma URL dich goc tu trang file:")
                final_destination = real_url

        log("=================================================================")
        if final_destination:
            log(f"   [THANH CONG 100%] LINK DICH CUOI CUNG:")
            log(f"   >>> {final_destination} <<<")
            log(f"FINAL DESTINATION URL: {final_destination}")
        else:
            log(f"   [-] URL hien tai: {page1.url}")
        log("=================================================================")

        # Chup anh man hinh ket qua
        screen_path = os.path.join(ROOT_DIR, "final_destination_screen.png")
        try:
            page1.screenshot(path=screen_path)
            log(f"[+] Da chup anh man hinh ket qua luu tai: {screen_path}")
        except Exception:
            pass

        browser.close()
        
        if final_destination:
            try:
                with open(DEST_FILE, "w", encoding="utf-8") as f:
                    f.write(final_destination)
                final_dest_file = os.path.join(ROOT_DIR, "DESTINATION_FINAL_URL.txt")
                with open(final_dest_file, "w", encoding="utf-8") as f:
                    f.write(final_destination)
                desk_dest = os.path.expanduser(r"~\Desktop\destination_url.txt")
                with open(desk_dest, "w", encoding="utf-8") as f_d:
                    f_d.write(final_destination)
            except Exception:
                pass
            try:
                if sys.platform == "win32":
                    import subprocess
                    subprocess.run(["clip"], input=final_destination.encode("utf-8"), check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

        log("=== BYPASS HOAN TAT 100% ===")
        return final_destination

if __name__ == "__main__":
    run()
