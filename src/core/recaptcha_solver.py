import os
import re
import time
import tempfile
import urllib.request
import whisper
from typing import Dict, Any
from playwright.sync_api import Page
from config import CHROME_PATH

_SHARED_MODEL = None

def get_whisper_model(name: str = "tiny.en"):
    global _SHARED_MODEL
    if _SHARED_MODEL is None:
        print(f"[*] Loading Whisper '{name}' (ultra-fast cached)...", flush=True)
        _SHARED_MODEL = whisper.load_model(name)
        print("[+] Whisper model loaded.", flush=True)
    return _SHARED_MODEL

class RecaptchaAudioSolver:
    def __init__(self, headless: bool = True, executable_path: str = CHROME_PATH, model_name: str = "tiny.en"):
        self.headless = headless
        self.executable_path = executable_path
        self.model = get_whisper_model(model_name)

    def transcribe_audio_url(self, audio_url: str) -> str:
        # Priority 0: Microservice API on Render
        try:
            from captcha_api_client import solve_audio_recaptcha
            res_text = solve_audio_recaptcha(audio_url=audio_url)
            if res_text:
                return res_text.strip().lower()
        except Exception:
            pass

        # Priority 1: Local Whisper
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            req = urllib.request.Request(audio_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp, open(tmp_path, "wb") as f:
                f.write(resp.read())
            res = self.model.transcribe(tmp_path, language="en", fp16=False)
            return re.sub(r'[^a-zA-Z0-9\s]', '', res.get("text", "")).strip().lower()
        finally:
            if os.path.exists(tmp_path):
                try: os.remove(tmp_path)
                except Exception: pass

    def _sync_tokens(self, page: Page, token: str):
        if not token:
            return
        page.evaluate("""(tok) => {
            document.querySelectorAll('[name="g-recaptcha-response"]').forEach(el => {
                el.value = tok;
            });
        }""", token)

    def solve_on_page(self, page: Page, timeout_sec: int = 35, container_selector: str = None) -> Dict[str, Any]:
        t0 = time.perf_counter()
        
        # 1. Wait and collect all valid anchor frames
        candidate_anchors = []
        target_css = f"{container_selector} iframe[src*='recaptcha/api2/anchor'], {container_selector} iframe[src*='recaptcha/enterprise/anchor']" if container_selector else "iframe[src*='recaptcha/api2/anchor'], iframe[src*='recaptcha/enterprise/anchor']"
        for _wait in range(20):
            anchors = page.locator(target_css).all()
            for idx, a in enumerate(anchors):
                try:
                    box = a.bounding_box()
                    if not box or box.get('height', 0) < 30 or box.get('width', 0) < 100:
                        continue
                    cf = a.content_frame
                    if not cf:
                        continue
                    chk = cf.locator("#recaptcha-anchor")
                    if chk.count() == 0:
                        continue
                    
                    body_text = cf.locator("body").inner_text() or ""
                    has_quota_error = any(w in body_text.lower() for w in ["quota", "exceeding", "bị lỗi", "error"])
                    
                    y_pos = box['y'] if box else 0
                    
                    # Detect if this anchor belongs to #recaptcha-2 or #main-form-2
                    is_in_form2 = False
                    try:
                        is_in_form2 = a.evaluate("el => el.closest('#main-form-2') !== null || el.closest('#recaptcha-2') !== null")
                    except Exception:
                        pass
                    
                    candidate_anchors.append({
                        "anchor": a,
                        "frame": cf,
                        "chk": chk,
                        "y": y_pos,
                        "has_error": has_quota_error,
                        "is_in_form2": is_in_form2,
                        "index": idx
                    })
                except Exception:
                    continue
            if candidate_anchors:
                break
            time.sleep(0.5)

        if not candidate_anchors:
            return {"success": False, "error": "no_anchors_found"}

        # Sort: healthy first (has_error == False), then form2, then bottom-most
        candidate_anchors.sort(key=lambda x: (not x["has_error"], 1 if x["is_in_form2"] else 0, x["y"]), reverse=True)

        for cand in candidate_anchors:
            try:
                a = cand["anchor"]
                chk = cand["chk"]
                cf = cand["frame"]
                
                try:
                    a.scroll_into_view_if_needed()
                    time.sleep(0.3)
                except Exception:
                    pass

                try:
                    chk.click(force=True, timeout=4000)
                except Exception:
                    cf.evaluate("() => { const el = document.getElementById('recaptcha-anchor'); if (el) el.click(); }")
                time.sleep(2.0)

                if chk.get_attribute("aria-checked") == "true":
                    token = page.evaluate("() => { for (const el of document.querySelectorAll('[name=\"g-recaptcha-response\"]')) { if (el.value && el.value.length > 20) return el.value; } return ''; }")
                    elapsed = round((time.perf_counter() - t0) * 1000, 2)
                    print(f"[+] Instantly solved without challenge in {elapsed}ms!", flush=True)
                    self._sync_tokens(page, token)
                    return {"success": True, "token": token, "type": "instant", "time_ms": elapsed}

                # Locate active visible bframe using evaluated DOM styles
                active_bframe = None
                for _ in range(25):
                    active_idx = page.evaluate("""() => {
                        const iframes = Array.from(document.querySelectorAll("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']"));
                        for (let i = 0; i < iframes.length; i++) {
                            const f = iframes[i];
                            const p = f.parentElement;
                            const rect = f.getBoundingClientRect();
                            const pRect = p ? p.getBoundingClientRect() : null;
                            const style = window.getComputedStyle(f);
                            const pStyle = p ? window.getComputedStyle(p) : null;
                            
                            const isHidden = style.visibility === 'hidden' || style.display === 'none' || (pStyle && (pStyle.visibility === 'hidden' || pStyle.display === 'none' || pStyle.opacity === '0'));
                            const isOffscreen = rect.top < -3000 || (pRect && pRect.top < -3000);
                            
                            const w = rect.width || f.offsetWidth;
                            const h = rect.height || f.offsetHeight;
                            if (w > 150 && h > 150 && !isHidden && !isOffscreen) {
                                return i;
                            }
                        }
                        return -1;
                    }""")
                    
                    if active_idx >= 0:
                        bframes = page.locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']").all()
                        if active_idx < len(bframes):
                            try:
                                bframes[active_idx].scroll_into_view_if_needed()
                            except Exception:
                                pass
                            active_bframe = bframes[active_idx].content_frame
                            if active_bframe:
                                break

                    # Fallback: check content frames directly
                    bframes = page.locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']").all()
                    for bf in bframes:
                        try:
                            b_cf = bf.content_frame
                            if b_cf and b_cf.locator("#recaptcha-audio-button, #recaptcha-verify-button, .rc-imageselect, .rc-doscaptcha-header-text").count() > 0:
                                active_bframe = b_cf
                                break
                        except Exception:
                            pass
                    if active_bframe:
                        break
                    time.sleep(0.3)

                if not active_bframe:
                    print(f"[!] No visible bframe for candidate anchor {cand['index']}. Trying next candidate...", flush=True)
                    continue

                audio_btn = active_bframe.locator("#recaptcha-audio-button")
                try:
                    audio_btn.wait_for(state="attached", timeout=6000)
                except Exception:
                    pass

                # Check if audio challenge is disabled by Google
                btn_class = audio_btn.get_attribute("class") or ""
                if "rc-button-disabled" in btn_class or audio_btn.get_attribute("disabled"):
                    print("[!] Audio challenge is disabled by Google for this session/IP", flush=True)
                    continue

                try:
                    audio_btn.scroll_into_view_if_needed()
                    time.sleep(0.2)
                    audio_btn.click(force=True, timeout=3000)
                except Exception:
                    try:
                        active_bframe.evaluate("() => { const b = document.getElementById('recaptcha-audio-button'); if (b) b.click(); }")
                    except Exception:
                        pass
                print("[+] Audio challenge requested!", flush=True)

                solved = False
                for attempt in range(1, 5):
                    time.sleep(1.2)
                    download_link = active_bframe.locator(".rc-audiochallenge-tdownload-link, a:has-text('Download')")
                    try:
                        download_link.wait_for(state="visible", timeout=7000)
                        audio_url = download_link.get_attribute("href")
                    except Exception:
                        audio_url = None

                    if not audio_url:
                        chk_val = chk.get_attribute("aria-checked")
                        if chk_val == "true":
                            solved = True
                            break
                        err_text = active_bframe.locator(".rc-doscaptcha-header-text, .rc-audiochallenge-error-message")
                        if err_text.count() > 0 and err_text.is_visible():
                            print(f"[!] IP restricted by Google: {err_text.inner_text()}", flush=True)
                            return {"success": False, "error": "rate_limited"}
                        break

                    ans = self.transcribe_audio_url(audio_url)
                    print(f"[+] Audio answer (attempt {attempt}): '{ans}'", flush=True)

                    input_field = active_bframe.locator("#audio-response")
                    input_field.fill(ans)
                    active_bframe.locator("#recaptcha-verify-button").click()
                    time.sleep(2.0)

                    token = page.evaluate("() => { for (const el of document.querySelectorAll('[name=\"g-recaptcha-response\"]')) { if (el.value && el.value.length > 20) return el.value; } return ''; }")
                    if (token and len(token) > 20) or chk.get_attribute("aria-checked") == "true":
                        solved = True
                        break

                if solved:
                    token = page.evaluate("() => { for (const el of document.querySelectorAll('[name=\"g-recaptcha-response\"]')) { if (el.value && el.value.length > 20) return el.value; } return ''; }")
                    elapsed = round((time.perf_counter() - t0) * 1000, 2)
                    print(f"[+] reCAPTCHA solved in {elapsed}ms!", flush=True)
                    self._sync_tokens(page, token)
                    return {"success": True, "token": token, "type": "audio", "time_ms": elapsed}

            except Exception as e:
                print(f"[!] Error on candidate {cand['index']}: {e}", flush=True)
                continue

        return {"success": False, "error": "all_candidates_failed"}
