import os
import sys
import time
import subprocess

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(CORE_DIR, "..", ".."))
LOG_FILE = os.path.join(BASE_DIR, "e2e_bypass.log")
DEST_FILE = os.path.join(BASE_DIR, "destination_url.txt")
CODE_FILE = os.path.join(BASE_DIR, "extracted_code.txt")

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

CHROME_PATH = get_chrome_path()

def log(msg: str):
    print(f"[{time.strftime('%X')}] {msg}", flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%X')}] {msg}\n")
    except Exception:
        pass

def copy_to_clipboard(text: str):
    try:
        if sys.platform == "win32":
            subprocess.run("clip", input=text.strip().encode("utf-8"), check=True, shell=True)
    except Exception:
        pass
