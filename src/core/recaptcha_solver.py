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

def get_whisper_model(name: str = "base.en"):
    global _SHARED_MODEL
    if _SHARED_MODEL is None:
        print(f"[*] Loading Whisper '{name}' (cached)...", flush=True)
        _SHARED_MODEL = whisper.load_model(name)
        print("[+] Whisper model loaded.", flush=True)
    return _SHARED_MODEL

class RecaptchaAudioSolver:
    def __init__(self, headless: bool = False, executable_path: str = CHROME_PATH, model_name: str = "base.en"):
        self.headless = headless
        self.executable_path = executable_path
        self.model = get_whisper_model(model_name)

    def transcribe_audio_url(self, audio_url: str) -> str:
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

    def solve_on_page(self, page: Page, timeout_sec: int = 35) -> Dict[str, Any]:
        t0 = time.perf_counter()
        
        # 1. Collect all anchor frames and their properties
        anchors = page.locator("iframe[src*='recaptcha/api2/anchor'], iframe[src*='recaptcha/enterprise/anchor']").all()
        if not anchors:
            return {"success": False, "error": "no_anchors_found"}

        candidate_anchors = []
        for idx, a in enumerate(anchors):
            try:
                box = a.bounding_box()
                cf = a.content_frame
                if not cf:
                    continue
                chk = cf.locator("#recaptcha-anchor")
                if chk.count() == 0:
                    continue
                
                body_text = cf.locator("body").inner_text() or ""
                has_quota_error = any(w in body_text.lower() for w in ["quota", "exceeding", "bị lỗi"])
                
                y_pos = box['y'] if box else 0
                candidate_anchors.append({
                    "anchor": a,
                    "frame": cf,
                    "chk": chk,
                    "y": y_pos,
                    "has_error": has_quota_error,
                    "index": idx
                })
            except Exception:
                continue

        # Sort: healthy first (has_error == False), then bottom-first (higher Y)
        candidate_anchors.sort(key=lambda x: (not x["has_error"], x["y"]), reverse=True)

        for cand in candidate_anchors:
            try:
                a = cand["anchor"]
                chk = cand["chk"]
                
                try:
                    a.scroll_into_view_if_needed()
                    time.sleep(0.4)
                except Exception:
                    pass

                chk.click()
                time.sleep(1.5)

                if chk.get_attribute("aria-checked") == "true":
                    token = page.evaluate("() => { for (const el of document.querySelectorAll('[name=\"g-recaptcha-response\"]')) { if (el.value && el.value.length > 20) return el.value; } return ''; }")
                    elapsed = round((time.perf_counter() - t0) * 1000, 2)
                    print(f"[+] Instantly solved without challenge in {elapsed}ms!", flush=True)
                    self._sync_tokens(page, token)
                    return {"success": True, "token": token, "type": "instant", "time_ms": elapsed}

                # Locate active visible bframe
                active_bframe = None
                for _ in range(8):
                    bframes = page.locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']").all()
                    for bf in bframes:
                        try:
                            bbox = bf.bounding_box()
                            if bbox and bbox['y'] > 0 and bbox['width'] > 0 and bf.is_visible():
                                b_cf = bf.content_frame
                                if b_cf and b_cf.locator("#recaptcha-audio-button").count() > 0:
                                    active_bframe = b_cf
                                    break
                        except Exception:
                            pass
                    if active_bframe:
                        break
                    time.sleep(0.5)

                if not active_bframe:
                    print(f"[!] No visible bframe for candidate anchor {cand['index']}. Trying next candidate...", flush=True)
                    continue

                audio_btn = active_bframe.locator("#recaptcha-audio-button")
                audio_btn.wait_for(state="visible", timeout=6000)
                audio_btn.click()
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
