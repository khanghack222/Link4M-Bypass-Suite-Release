import os
import re
import time
import tempfile
import urllib.request
import subprocess
import whisper
from typing import Optional, Dict, Any
from playwright.sync_api import sync_playwright, Page, FrameLocator

def get_chrome_path():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "chrome"

def get_ffmpeg_path():
    candidates = [
        "ffmpeg",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe"
    ]
    for c in candidates:
        if c == "ffmpeg":
            try:
                subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return "ffmpeg"
            except Exception:
                continue
        elif os.path.exists(c):
            return c
    return "ffmpeg"

FFMPEG_PATH = get_ffmpeg_path()
CHROME_PATH = get_chrome_path()

class RecaptchaAudioSolver:
    def __init__(self, headless: bool = False, executable_path: str = CHROME_PATH, model_name: str = "base.en"):
        self.headless = headless
        self.executable_path = executable_path
        print(f"[*] Loading Whisper '{model_name}' model for 100% free offline audio transcription...")
        self.model = whisper.load_model(model_name)
        print("[+] Whisper model loaded and ready!")

    def transcribe_audio_url(self, audio_url: str) -> str:
        """Download mp3 from audio_url, convert to wav via ffmpeg, and transcribe via local Whisper."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            mp3_file = os.path.join(tmp_dir, "captcha.mp3")
            wav_file = os.path.join(tmp_dir, "captcha.wav")

            # Download mp3
            req = urllib.request.Request(
                audio_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp, open(mp3_file, "wb") as f:
                f.write(resp.read())

            # Convert to wav via ffmpeg (16kHz mono is optimal for whisper)
            cmd = [FFMPEG_PATH, "-y", "-i", mp3_file, "-ac", "1", "-ar", "16000", wav_file]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            # Transcribe using offline Whisper
            result = self.model.transcribe(wav_file, language="en", fp16=False)
            raw_text = result.get("text", "").strip()
            clean_text = re.sub(r'[^a-zA-Z0-9\s]', '', raw_text).strip().lower()
            return clean_text

    def solve_on_page(self, page: Page, timeout_sec: int = 40) -> Dict[str, Any]:
        """
        Locates and solves reCAPTCHA v2 on the provided Playwright page using Whisper.
        Returns token and execution time.
        """
        t0 = time.perf_counter()
        print("[*] Locating active reCAPTCHA anchor iframe...")

        # Find visible anchor iframe (supports standard v2 & enterprise)
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
                        print(f"[+] Selected active anchor iframe index {i}")
                        break
            except Exception:
                continue

        if not checkbox:
            checkbox = page.frame_locator("iframe[src*='recaptcha/api2/anchor'], iframe[src*='recaptcha/enterprise/anchor']").first.locator("#recaptcha-anchor")

        checkbox.wait_for(state="visible", timeout=10000)
        checkbox.click()
        print("[+] Checkbox clicked!")

        time.sleep(2.0)

        # Check if already solved without challenge
        checked = checkbox.get_attribute("aria-checked")
        if checked == "true":
            token = page.evaluate("() => document.getElementById('g-recaptcha-response')?.value || document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            elapsed = round((time.perf_counter() - t0) * 1000, 2)
            print(f"[+] Instantly solved without challenge in {elapsed}ms!")
            return {"success": True, "token": token, "type": "instant", "time_ms": elapsed}

        # Challenge popup appeared: find active visible bframe
        print("[*] Challenge frame detected, locating active bframe...")
        time.sleep(1.0)
        bframes = page.locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']")
        active_bframe = None
        for i in range(bframes.count()):
            try:
                box = bframes.nth(i).bounding_box()
                if box and box['y'] > 0 and box['width'] > 0:
                    active_bframe = bframes.nth(i).content_frame
                    print(f"[+] Found active visible challenge bframe index {i}!")
                    break
            except Exception:
                continue

        if not active_bframe:
            active_bframe = page.frame_locator("iframe[src*='recaptcha/api2/bframe'], iframe[src*='recaptcha/enterprise/bframe']").first

        # Wait for audio button
        audio_btn = active_bframe.locator("#recaptcha-audio-button")
        audio_btn.wait_for(state="visible", timeout=10000)
        audio_btn.click()
        print("[+] Clicked audio button!")

        time.sleep(2.0)

        # Multi-attempt loop for audio challenge (supports multi-step challenges)
        last_text = ""
        for attempt in range(1, 4):
            # Check for IP block (dos captcha)
            dos_msg = active_bframe.locator(".rc-doscaptcha-header")
            if dos_msg.count() > 0 and dos_msg.is_visible():
                raise RuntimeError("Google blocked audio challenge: 'Your computer or network may be sending automated queries'.")

            # Check if already solved
            checked = checkbox.get_attribute("aria-checked")
            token = page.evaluate("() => document.getElementById('g-recaptcha-response')?.value || document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
            if checked == "true" or (token and len(token) > 20):
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                print(f"[+] reCAPTCHA successfully solved in {elapsed}ms!")
                return {
                    "success": True,
                    "token": token,
                    "transcribed_text": last_text,
                    "type": "audio",
                    "time_ms": elapsed
                }

            # Get audio download link
            audio_link = active_bframe.locator("a.rc-audiochallenge-tdownload-link").first
            try:
                audio_link.wait_for(state="visible", timeout=8000)
            except Exception:
                # Check again if checkbox passed
                checked = checkbox.get_attribute("aria-checked")
                if checked == "true":
                    token = page.evaluate("() => document.getElementById('g-recaptcha-response')?.value || document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
                    elapsed = round((time.perf_counter() - t0) * 1000, 2)
                    return {"success": True, "token": token, "type": "audio", "time_ms": elapsed}
                break

            audio_url = audio_link.get_attribute("href")
            print(f"[+] Attempt {attempt}: Audio challenge URL: {audio_url}")

            # Transcribe audio with Whisper
            print(f"[*] Transcribing audio with local Whisper model (Round {attempt})...")
            last_text = self.transcribe_audio_url(audio_url)
            print(f"[+] Transcribed text answer: '{last_text}'")

            # Fill response and verify
            response_input = active_bframe.locator("#audio-response")
            response_input.fill(last_text)
            time.sleep(0.5)

            verify_btn = active_bframe.locator("#recaptcha-verify-button")
            verify_btn.click()
            print("[+] Clicked verify button!")
            time.sleep(2.5)

        # Final check
        checked = checkbox.get_attribute("aria-checked")
        token = page.evaluate("() => document.getElementById('g-recaptcha-response')?.value || document.querySelector('[name=\"g-recaptcha-response\"]')?.value || ''")
        elapsed = round((time.perf_counter() - t0) * 1000, 2)
        if checked == "true" or (token and len(token) > 20):
            print(f"[+] reCAPTCHA successfully solved in {elapsed}ms!")
            return {
                "success": True,
                "token": token,
                "transcribed_text": last_text,
                "type": "audio",
                "time_ms": elapsed
            }
        else:
            raise RuntimeError("Verification did not succeed after audio submission.")

def solve_url(url: str, headless: bool = False) -> Dict[str, Any]:
    solver = RecaptchaAudioSolver(headless=headless)
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars"
        ]
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=headless, args=args)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=45000)
        result = solver.solve_on_page(page)
        browser.close()
        return result

if __name__ == "__main__":
    demo_url = "https://www.google.com/recaptcha/api2/demo"
    print(f"[*] Testing RecaptchaAudioSolver on {demo_url}...")
    try:
        res = solve_url(demo_url, headless=False)
        print("\n===============================")
        print("RESULT:")
        print("Success:", res.get("success"))
        print("Token snippet:", (res.get("token") or "")[:40] + "...")
        print("Time:", res.get("time_ms"), "ms")
        print("===============================\n")
    except Exception as e:
        print(f"[!] Error: {e}")
