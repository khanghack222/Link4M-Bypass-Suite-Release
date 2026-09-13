#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
⚡ LINK4M BYPASS SUITE - UNIFIED AUTONOMOUS ENGINE ⚡
Auto-detects link type (GTraffic, Direct GTraffic, BBMKTS, LayMa, TrafficVN, Link4M)
and executes the appropriate bypass runner with zero manual intervention.
"""

import sys
import os
import time
import re
import argparse
import subprocess

# Configure UTF-8 for Windows Terminal
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Auto-detect and switch to Python 3.11 if current interpreter lacks playwright
try:
    import playwright
except ImportError:
    candidates = [
        r"C:\Users\XUAN\AppData\Local\Programs\Python\Python311\python.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Python\Python311\python.exe"),
        os.path.expanduser(r"~\AppData\Local\Programs\Python\Python312\python.exe"),
        r"C:\Python311\python.exe",
        r"C:\Python312\python.exe"
    ]
    for p in candidates:
        if os.path.exists(p) and p != sys.executable:
            os.execv(p, [p] + sys.argv)

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CORE_DIR = os.path.join(ROOT_DIR, "src", "core")
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

DEST_FILE = os.path.join(ROOT_DIR, "destination_url.txt")
FINAL_DEST_FILE = os.path.join(ROOT_DIR, "DESTINATION_FINAL_URL.txt")

# ANSI Neon Palette for Windows Terminal
C_RESET = "\x1b[0m"
C_BOLD = "\x1b[1m"
C_DIM = "\x1b[2m"
C_CYAN = "\x1b[38;2;0;255;240m"
C_BLUE = "\x1b[38;2;30;144;255m"
C_PINK = "\x1b[38;2;255;20;147m"
C_BPINK = "\x1b[38;2;255;105;180m"
C_PURPLE = "\x1b[38;2;170;85;255m"
C_GREEN = "\x1b[38;2;0;255;150m"
C_YELLOW = "\x1b[38;2;255;235;59m"
C_ORANGE = "\x1b[38;2;255;140;0m"
C_RED = "\x1b[38;2;255;50;80m"
C_WHITE = "\x1b[38;2;255;255;255m"
C_GRAY = "\x1b[38;2;160;160;185m"

BG_CYAN = "\x1b[48;2;0;180;200m\x1b[38;2;0;0;0m\x1b[1m"
BG_PINK = "\x1b[48;2;255;20;147m\x1b[38;2;255;255;255m\x1b[1m"
BG_PURPLE = "\x1b[48;2;138;43;226m\x1b[38;2;255;255;255m\x1b[1m"
BG_GREEN = "\x1b[48;2;34;197;94m\x1b[38;2;0;0;0m\x1b[1m"
BG_YELLOW = "\x1b[48;2;250;204;21m\x1b[38;2;0;0;0m\x1b[1m"
BG_ORANGE = "\x1b[48;2;249;115;22m\x1b[38;2;255;255;255m\x1b[1m"
BG_RED = "\x1b[48;2;239;68;68m\x1b[38;2;255;255;255m\x1b[1m"
BG_BLUE = "\x1b[48;2;37;99;235m\x1b[38;2;255;255;255m\x1b[1m"


def print_banner():
    banner = [
        r"  ██████╗  ██╗   ██╗ █████╗  ██╗      ██████╗ ██╗   ██╗██████╗  █████╗ ███████╗███████╗",
        r"  ██╔══██╗ ██║   ██║██╔══██╗ ██║      ██╔══██╗╚██╗ ██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝",
        r"  ██║  ██║ ██║   ██║███████║ ██║      ██████╔╝ ╚████╔╝ ██████╔╝███████║███████╗███████╗",
        r"  ██║  ██║ ██║   ██║██╔══██║ ██║      ██╔══██╗  ╚██╔╝  ██╔═══╝ ██╔══██║╚════██║╚════██║",
        r"  ██████╔╝ ╚██████╔╝██║  ██║ ███████╗ ██████╔╝   ██║   ██║     ██║  ██║███████║███████║",
        r"  ╚═════╝   ╚═════╝ ╚═╝  ╚═╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝"
    ]
    colors = [C_PINK, C_BPINK, C_PURPLE, C_BLUE, C_CYAN, C_GREEN]
    print()
    for i, line in enumerate(banner):
        print(f"{C_BOLD}{colors[i]}{line}{C_RESET}")
    print(f"\n  {BG_PURPLE} ⚡ AUTO BYPASS SUITE ⚡ {C_RESET}  {C_BOLD}{C_CYAN}UNIVERSAL SHORTLINK BYPASS ENGINE{C_RESET}")
    print(f"  {C_DIM}{C_GRAY}✦ GTraffic / Direct GTraffic  ✦ BBMKTS  ✦ LayMa.net  ✦ TrafficVN  ✦ Link4M{C_RESET}\n")


def get_clipboard_url() -> str:
    """Reads URL directly from Windows Clipboard."""
    try:
        if sys.platform == "win32":
            res = subprocess.run(
                ["powershell", "-NoProfile", "-Command", "Get-Clipboard"],
                capture_output=True,
                text=True,
                timeout=2
            )
            raw = res.stdout.strip()
            first_line = raw.splitlines()[0].strip() if raw else ""
            if first_line.startswith("http://") or first_line.startswith("https://"):
                return first_line
    except Exception:
        pass
    return ""


def copy_to_clipboard(text: str):
    """Copies destination link to Windows Clipboard."""
    try:
        if sys.platform == "win32":
            subprocess.run("clip", input=text.strip().encode("utf-8"), check=True, shell=True)
    except Exception:
        pass


def classify_url(url: str) -> str:
    """Accurately classifies the target URL to select the corresponding engine."""
    u = url.strip().lower()
    if "octolink" in u or "linkhuongdan" in u:
        return "OCTOLINK"
    if "gtraffic.io" in u or "direct.gtraffic.io" in u or "dr-client.gtraffic.io" in u or "client.gtraffic.io" in u:
        return "GTRAFFIC"
    if "bbmkts.com" in u or "yeumoney.com" in u:
        return "BBMKTS"
    if "layma.net" in u:
        return "LAYMA"
    if "trafficvn.com" in u:
        return "TRAFFICVN"
    if "link4m." in u or "link4" in u:
        return "LINK4M"
    return "GENERIC"


def show_result_card(final_url: str, duration_sec: int, engine_name: str):
    """Displays a clean synthwave result card."""
    print(f"\n  {C_CYAN}╔══════════════════════════════════════════════════════════════════════════════╗{C_RESET}")
    print(f"  {C_CYAN}║{C_RESET}  {BG_GREEN} 🏆 BYPASS THÀNH CÔNG RỰC RỠ! {C_RESET}  {C_YELLOW}[{engine_name}]{C_RESET}  {C_DIM}{C_GRAY}Thời gian: {duration_sec}s{C_RESET}               {C_CYAN}║{C_RESET}")
    print(f"  {C_CYAN}╠══════════════════════════════════════════════════════════════════════════════╣{C_RESET}")
    print(f"  {C_CYAN}║{C_RESET}  {C_BOLD}{C_WHITE}Link đích:{C_RESET} {C_BOLD}{C_CYAN}{final_url}{C_RESET}")
    print(f"  {C_CYAN}║{C_RESET}  {C_GREEN}✔ Đã tự động sao chép link vào Clipboard (Ctrl+V để dán)!{C_RESET}             {C_CYAN}║{C_RESET}")
    print(f"  {C_CYAN}╚══════════════════════════════════════════════════════════════════════════════╝{C_RESET}\n")


def save_destination_url(final_url: str):
    """Saves final destination link to project files and Desktop."""
    if not final_url:
        return
    try:
        with open(DEST_FILE, "w", encoding="utf-8") as f:
            f.write(final_url.strip())
        with open(FINAL_DEST_FILE, "w", encoding="utf-8") as f:
            f.write(final_url.strip())
        desk_path = os.path.expanduser(r"~\Desktop\destination_url.txt")
        with open(desk_path, "w", encoding="utf-8") as fd:
            fd.write(final_url.strip())
    except Exception:
        pass
    copy_to_clipboard(final_url)


def read_captured_destination() -> str:
    """Reads final destination from project output files."""
    for path in [FINAL_DEST_FILE, DEST_FILE]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    u = f.read().strip()
                    if u.startswith("http"):
                        return u
            except Exception:
                pass
    return ""


def execute_bypass(target_url: str, headless: bool = False) -> str:
    """Executes the specialized bypass runner according to the URL category."""
    target_url = target_url.strip()
    category = classify_url(target_url)

    # Clean up old destination files
    for p in [DEST_FILE, FINAL_DEST_FILE]:
        if os.path.exists(p):
            try: os.remove(p)
            except Exception: pass

    start_time = time.time()

    if category == "OCTOLINK":
        print(f"\n  {BG_RED} ⛔ THÔNG BÁO TẠM NGỪNG DỰ ÁN OCTOLINK ⛔ {C_RESET}")
        print(f"  {C_RED}Website octolink.vip đã bị Cục An ninh mạng (A05 - Bộ Công An) chặn do có dấu hiệu vi phạm Điều 321, 322 BLHS.{C_RESET}")
        print(f"  {C_ORANGE}Dự án chính thức ngừng mọi hoạt động hỗ trợ Octolink để đảm bảo an toàn và tuân thủ pháp luật.{C_RESET}\n")
        return ""

    if category == "GTRAFFIC":
        print(f"  {BG_ORANGE} ▶ KHỞI CHẠY {C_RESET}  {C_BOLD}{C_ORANGE}GTRAFFIC & DIRECT GTRAFFIC AUTONOMOUS ENGINE{C_RESET}")
        print(f"  {C_DIM}{C_GRAY}Mục tiêu: {target_url} | Headless: {headless}{C_RESET}\n")
        import gtraffic_runner
        gtraffic_runner.run(target_url, headless=headless)

    elif category == "BBMKTS":
        print(f"  {BG_PINK} ▶ KHỞI CHẠY {C_RESET}  {C_BOLD}{C_BPINK}BBMKTS AUTONOMOUS DUAL-TAB ENGINE{C_RESET}")
        print(f"  {C_DIM}{C_GRAY}Mục tiêu: {target_url} | Headless: {headless}{C_RESET}\n")
        import bbmkts_runner
        bbmkts_runner.run(target_url, headless=headless)

    elif category == "LAYMA":
        print(f"  {BG_PURPLE} ▶ KHỞI CHẠY {C_RESET}  {C_BOLD}{C_PURPLE}LAYMA.NET QCAPTCHA STEALTH & HSV ENGINE{C_RESET}")
        print(f"  {C_DIM}{C_GRAY}Mục tiêu: {target_url} | Headless: {headless}{C_RESET}\n")
        import layma_runner
        layma_runner.run(target_url, headless=headless)

    elif category == "TRAFFICVN":
        print(f"  {BG_GREEN} ▶ KHỞI CHẠY {C_RESET}  {C_BOLD}{C_GREEN}TRAFFICVN TURNSTILE & CREEPJS ENGINE (BETA){C_RESET}")
        print(f"  {C_DIM}{C_GRAY}Mục tiêu: {target_url} | Headless: {headless}{C_RESET}\n")
        import trafficvn_runner
        trafficvn_runner.run(target_url, headless=headless)

    else:
        # Default Link4M runner
        print(f"  {BG_CYAN} ▶ KHỞI CHẠY {C_RESET}  {C_BOLD}{C_CYAN}LINK4M RAPIDOCR & WHISPER AI ENGINE{C_RESET}")
        print(f"  {C_DIM}{C_GRAY}Mục tiêu: {target_url} | Headless: {headless}{C_RESET}\n")
        import bypass
        bypass.run(target_url, headless=headless)

    duration = int(time.time() - start_time)
    final_dest = read_captured_destination()

    if final_dest and final_dest.startswith("http"):
        save_destination_url(final_dest)
        show_result_card(final_dest, duration, category)
        return final_dest
    else:
        print(f"\n  {C_YELLOW}⚠ Tiến trình hoàn tất nhưng chưa trích xuất được link đích.{C_RESET}\n")
        return ""


def run_loop_watcher(headless: bool = False):
    """Continuous Clipboard Watcher Mode: auto-bypasses whenever a shortlink is copied."""
    print(f"  {BG_GREEN} 🔄 CHẾ ĐỘ GIÁM SÁT CLIPBOARD TỰ ĐỘNG (LOOP WATCHER) 🔄 {C_RESET}")
    print(f"  {C_GRAY}Đang lắng nghe Clipboard... Hãy copy bất kỳ link shortlink nào (Ctrl+C).{C_RESET}")
    print(f"  {C_DIM}Nhấn Ctrl+C trong terminal để dừng lại.{C_RESET}\n")

    last_url = ""
    while True:
        try:
            curr_url = get_clipboard_url()
            if curr_url and curr_url != last_url:
                cat = classify_url(curr_url)
                if cat != "OCTOLINK":
                    print(f"\n  {BG_BLUE} 📥 PHÁT HIỆN LINK MỚI: {C_RESET} {C_BOLD}{C_CYAN}{curr_url}{C_RESET}")
                    last_url = curr_url
                    res = execute_bypass(curr_url, headless=headless)
                    if res:
                        last_url = res  # prevent re-triggering on own destination URL
            time.sleep(1.5)
        except KeyboardInterrupt:
            print(f"\n  {C_GREEN}👋 Đã dừng chế độ giám sát.{C_RESET}\n")
            break
        except Exception as e:
            time.sleep(2)


def main():
    parser = argparse.ArgumentParser(
        description="⚡ Link4M Bypass Suite - Universal Auto Bypass Engine ⚡",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("url", nargs="?", default=None, help="Target shortlink URL to bypass")
    parser.add_argument("--head", "-w", "--window", action="store_true", help="Run with visible browser window")
    parser.add_argument("--headless", "-hl", action="store_true", help="Run in headless browser mode (default)")
    parser.add_argument("--loop", "-l", action="store_true", help="Continuously monitor clipboard for new shortlinks")

    args = parser.parse_args()

    # Headless decision: default to windowed if not specified or headless if flag passed
    headless = True if args.headless else False
    if args.head:
        headless = False

    print_banner()

    # Loop Mode
    if args.loop:
        run_loop_watcher(headless=headless)
        return

    target_url = args.url

    # Check clipboard if URL argument was not provided
    if not target_url:
        clip_url = get_clipboard_url()
        if clip_url:
            cat = classify_url(clip_url)
            print(f"  {BG_PURPLE} 🔗 PHÁT HIỆN LINK TỪ CLIPBOARD: {C_RESET} {C_BOLD}{C_CYAN}{clip_url}{C_RESET} {C_YELLOW}[{cat}]{C_RESET}")
            ans = input(f"  {C_BOLD}{C_YELLOW}➤ Nhấn [Enter] để vượt ngay link này, hoặc nhập link khác: {C_RESET}").strip()
            target_url = ans if ans.startswith("http") else clip_url
        else:
            default_demo = "https://gtraffic.io/X3BR2OQ"
            ans = input(f"  {C_BOLD}{C_CYAN}➤ Nhập link cần vượt {C_DIM}(Enter để dùng demo {default_demo}){C_RESET}: ").strip()
            target_url = ans if ans.startswith("http") else default_demo

    execute_bypass(target_url, headless=headless)


if __name__ == "__main__":
    main()
