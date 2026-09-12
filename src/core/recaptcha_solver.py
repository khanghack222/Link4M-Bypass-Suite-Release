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

    def solve_on_page(self, page: Page, timeout_sec: int = 35) -> Dict[str, Any]:
        t0 = time.perf_counter()
        
        anchors = page.locator("iframe[src*='recaptcha/api2/anchor'], iframe[src*='recaptcha/enterprise/anchor']")
        checkbox = None
        for i in range(anchors.count()):
            try:
                box = anchors.nth(i).bounding_box()
                if box and box['width'] > 0 and box['height'] > 0 and box['y'] > 0:
                    frame = anchors.nth(i).content_frame
                    chk = frame.locator("#recaptcha-anchor")
                    if chk.count() > 0:
                        checkbox = chk
                        break
            except Exception:
                continue

        if not checkbox:
            checkbox = page.frame_locator("iframe[src*='recaptcha/api2/anchor'], iframe[src*='recaptcha/enterprise/anchor']").first.locator("#recaptcha-anchor")

        checkbox.wait_for(state="visible", timeout=8000)
        checkbox.click()
        time.sleep(1.2)

        if checkbox.get_attribute("aria-checked") == "true":
            token = page.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            elapsed = round((time.perf_counter() - t0) * 1000, 2)
            print(f"[+] Instantly solved without challenge in {elapsed}ms!", flush=True)
            return {"success": True, "token": token, "type": "instant", "time_ms": elapsed}

        time.sleep(0.6)
        bframes = page.locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']")
        active_bframe = None
        for i in range(bframes.count()):
            try:
                box = bframes.nth(i).bounding_box()
                if box and box['y'] > 0 and box['width'] > 0:
                    active_bframe = bframes.nth(i).content_frame
                    break
            except Exception:
                continue

        if not active_bframe:
            active_bframe = page.frame_locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']").first

        audio_btn = active_bframe.locator("#recaptcha-audio-button")
        audio_btn.wait_for(state="visible", timeout=8000)
        audio_btn.click()
        print("[+] Audio challenge requested!", flush=True)

        for attempt in range(1, 4):
            time.sleep(1.0)
            download_link = active_bframe.locator(".rc-audiochallenge-tdownload-link, a:has-text('Download')")
            try:
                download_link.wait_for(state="visible", timeout=7000)
                audio_url = download_link.get_attribute("href")
            except Exception:
                audio_url = None

            if not audio_url:
                err_text = active_bframe.locator(".rc-doscaptcha-header-text, .rc-audiochallenge-error-message")
                if err_text.count() > 0:
                    print(f"[!] IP restricted by Google: {err_text.inner_text()}", flush=True)
                    return {"success": False, "error": "rate_limited"}
                break

            ans = self.transcribe_audio_url(audio_url)
            print(f"[+] Audio answer: '{ans}'", flush=True)

            input_field = active_bframe.locator("#audio-response")
            input_field.fill(ans)
            active_bframe.locator("#recaptcha-verify-button").click()
            time.sleep(1.5)

            token = page.evaluate("() => document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            if (token and len(token) > 20) or checkbox.get_attribute("aria-checked") == "true":
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                print(f"[+] reCAPTCHA solved in {elapsed}ms!", flush=True)
                return {"success": True, "token": token, "type": "audio", "time_ms": elapsed}

        return {"success": False, "error": "max_attempts"}
