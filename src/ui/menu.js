const readline = require("readline");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SCRIPT_PATH = path.join(ROOT_DIR, "src", "core", "bypass.py");
const TRAFFICVN_RUNNER = path.join(ROOT_DIR, "src", "core", "trafficvn_runner.py");
const BBMKTS_RUNNER = path.join(ROOT_DIR, "src", "core", "bbmkts_runner.py");
const GTRAFFIC_RUNNER = path.join(ROOT_DIR, "src", "core", "gtraffic_runner.py");
const LAYMA_RUNNER = path.join(ROOT_DIR, "src", "core", "layma_runner.py");
const DEST_FILE = path.join(ROOT_DIR, "destination_url.txt");
const CODE_FILE = path.join(ROOT_DIR, "extracted_code.txt");
const OCTO_RUNNER = path.join(ROOT_DIR, "src", "core", "octolink_runner.js");

// Bảng màu Cyber / Synthwave sống động rực rỡ (TrueColor ANSI)
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",

    // Pastel Neon Text
    neonCyan: "\x1b[38;2;0;255;240m",
    electricBlue: "\x1b[38;2;30;144;255m",
    hotPink: "\x1b[38;2;255;20;147m",
    brightPink: "\x1b[38;2;255;105;180m",
    neonPurple: "\x1b[38;2;170;85;255m",
    mintGreen: "\x1b[38;2;0;255;150m",
    emeraldGreen: "\x1b[38;2;46;204;113m",
    cyberYellow: "\x1b[38;2;255;235;59m",
    flameOrange: "\x1b[38;2;255;140;0m",
    crimsonRed: "\x1b[38;2;255;50;80m",
    pureWhite: "\x1b[38;2;255;255;255m",
    softGray: "\x1b[38;2;160;160;185m",
    darkGray: "\x1b[38;2;90;90;120m",

    // Background Badges
    bgCyan: "\x1b[48;2;0;180;200m\x1b[38;2;0;0;0m\x1b[1m",
    bgPink: "\x1b[48;2;255;20;147m\x1b[38;2;255;255;255m\x1b[1m",
    bgPurple: "\x1b[48;2;138;43;226m\x1b[38;2;255;255;255m\x1b[1m",
    bgGreen: "\x1b[48;2;34;197;94m\x1b[38;2;0;0;0m\x1b[1m",
    bgYellow: "\x1b[48;2;250;204;21m\x1b[38;2;0;0;0m\x1b[1m",
    bgOrange: "\x1b[48;2;249;115;22m\x1b[38;2;255;255;255m\x1b[1m",
    bgRed: "\x1b[48;2;239;68;68m\x1b[38;2;255;255;255m\x1b[1m",
    bgBlue: "\x1b[48;2;37;99;235m\x1b[38;2;255;255;255m\x1b[1m",
    bgDark: "\x1b[48;2;30;30;45m\x1b[38;2;255;255;255m",
};

// Thiết lập mã UTF-8 cho Windows Terminal
if (process.platform === "win32") {
    try { execSync("chcp 65001", { stdio: "ignore" }); } catch (e) {}
}

function clearScreen() {
    process.stdout.write(process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1b[2J\x1b[H");
}

function getPythonPath() {
    const candidates = [
        "C:\\Users\\XUAN\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python311\\python.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python312\\python.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python310\\python.exe"),
        "C:\\Python311\\python.exe",
        "C:\\Python312\\python.exe"
    ];
    for (const p of candidates) {
        if (p && fs.existsSync(p)) return p;
    }
    return "python";
}

function getClipboardUrl() {
    try {
        if (process.platform === "win32") {
            const out = execSync("powershell -NoProfile -Command Get-Clipboard", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], timeout: 1500 }).trim();
            const firstLine = out.split(/\r?\n/)[0].trim();
            if (firstLine && /^https?:\/\/[^\s]+$/i.test(firstLine)) {
                return firstLine;
            }
        }
    } catch (e) {}
    return "";
}

function copyToClipboard(text) {
    try {
        if (process.platform === "win32") {
            execSync("clip", { input: text.trim(), encoding: "utf-8", stdio: ["pipe", "ignore", "ignore"] });
        }
    } catch (e) {}
}

// Banner Neon Gradient Synthwave
function printBanner() {
    const lines = [
        "  ██████╗  ██╗   ██╗ █████╗  ██╗      ██████╗ ██╗   ██╗██████╗  █████╗ ███████╗███████╗",
        "  ██╔══██╗ ██║   ██║██╔══██╗ ██║      ██╔══██╗╚██╗ ██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝",
        "  ██║  ██║ ██║   ██║███████║ ██║      ██████╔╝ ╚████╔╝ ██████╔╝███████║███████╗███████╗",
        "  ██║  ██║ ██║   ██║██╔══██║ ██║      ██╔══██╗  ╚██╔╝  ██╔═══╝ ██╔══██║╚════██║╚════██║",
        "  ██████╔╝ ╚██████╔╝██║  ██║ ███████╗ ██████╔╝   ██║   ██║     ██║  ██║███████║███████║",
        "  ╚═════╝   ╚═════╝ ╚═╝  ╚═╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝"
    ];

    const gradients = [
        c.hotPink,
        c.brightPink,
        c.neonPurple,
        c.electricBlue,
        c.neonCyan,
        c.mintGreen
    ];

    console.log();
    lines.forEach((l, i) => {
        console.log(`${c.bold}${gradients[i]}${l}${c.reset}`);
    });

    console.log(`\n  ${c.bgPurple} ⚡ ULTRA SUITE ⚡ ${c.reset}  ${c.bold}${c.neonCyan}LINK4M${c.reset} ${c.cyberYellow}AUTO BYPASS ENGINE 4.1 (A05 COMPLIANT)${c.reset}`);
    console.log(`  ${c.dim}${c.softGray}✦ RapidOCR Vision  ✦ Whisper AI Solver  ✦ Auto Google Referrer  ✦ 100% Free & Offline${c.reset}\n`);
}

// Thanh tiến trình ProgressBar trực quan
function renderProgressBar(current, total, width = 20) {
    const pct = Math.min(1, Math.max(0, current / total));
    const filled = Math.round(width * pct);
    const empty = width - filled;
    const bar = `${c.neonCyan}${"█".repeat(filled)}${c.darkGray}${"░".repeat(empty)}${c.reset}`;
    const pctStr = `${Math.round(pct * 100)}%`.padStart(4, " ");
    return `[${bar}] ${c.cyberYellow}${pctStr}${c.reset}`;
}

// Định dạng dòng Log cực kỳ bắt mắt
function formatLogLine(rawLine) {
    const line = rawLine.trim();
    if (!line) return null;

    // 1. Target URL
    if (line.includes("Target Link4M URL:") || line.includes("Target URL:") || line.includes("Target Gtraffic URL:") || line.includes("Target LayMa URL:")) {
        const u = line.split(/Target (?:Link4M |Gtraffic |LayMa )?URL:/i)[1].trim();
        return `  ${c.neonPurple}╭───${c.reset} ${c.bgPurple} 🎯 MỤC TIÊU ${c.reset}  ${c.bold}${c.neonCyan}${u}${c.reset}`;
    }

    // 2. OCR Search / Vision
    if (line.includes("Found sponsor SERP image:")) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgBlue} 👁️  VISION ${c.reset}  ${c.electricBlue}Đã bắt được ảnh nhiệm vụ SERP ➔ Khởi động RapidOCR...${c.reset}`;
    }
    if (line.includes("Extracted domain candidates") || line.includes("OCR extracted domain candidates")) {
        const m = line.split(/candidates[^:]*:/i)[1]?.trim() || "";
        return `  ${c.neonPurple}├───${c.reset} ${c.bgBlue} 🔍 CANDIDATE ${c.reset} ${c.softGray}Phân giải domain:${c.reset} ${c.brightPink}${m}${c.reset}`;
    }
    if (line.includes("Shape Analysis:") || line.includes("HSV Contour Shape Analysis")) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgBlue} 👁️  HSV VISION ${c.reset}  ${c.electricBlue}Phân tích contour hình học 9 ô QCaptcha...${c.reset}`;
    }

    // 3. Sponsor Mission Target
    if (/TARGET SPONSOR WEBSITE|EXTRACTED SPONSOR DOMAIN/i.test(line)) {
        const d = line.split(/THIS MISSION:|EXTRACTED SPONSOR DOMAIN:/i)[1] || line;
        return `  ${c.neonPurple}├───${c.reset} ${c.bgGreen} 🌐 TÀI TRỢ ${c.reset}  ${c.bold}${c.mintGreen}${d.trim()}${c.reset} ${c.cyberYellow}★${c.reset}`;
    }

    // 4. Traffic Campaign Key
    if (line.includes("Detected traffic_key:") || line.includes("Traffic session token:")) {
        const k = (line.split("Detected traffic_key:")[1] || line.split("token:")[1] || "").trim();
        return `  ${c.neonPurple}├───${c.reset} ${c.bgOrange} 🔑 CAMPAIGN ${c.reset}  ${c.softGray}Session Key:${c.reset} ${c.bold}${c.cyberYellow}${k || "None"}${c.reset}`;
    }

    // 5. Steps Executing
    if (line.includes("EXECUTING STEP") || line.includes("[BƯỚC ")) {
        const m = line.match(/(?:STEP\s+|\[BƯỚC\s+)(\d+)/i);
        const stepNum = m ? m[1] : "1";
        const txt = line.replace(/.*\[BƯỚC\s+\d+\]\s*/, "").replace(/.*EXECUTING STEP\s+\d+:\s*/, "");
        return `  ${c.neonPurple}├───${c.reset} ${c.bgPink} 🚀 BƯỚC ${stepNum} ${c.reset}  ${c.bold}${c.pureWhite}${txt || "Đang thực thi nhiệm vụ..."}${c.reset}`;
    }
    if (line.includes("Navigating to Step")) {
        const art = line.split("article:")[1]?.trim() || "";
        return `  ${c.neonPurple}│    ${c.neonCyan}↳ Đọc bài viết tiếp theo:${c.reset} ${c.softGray}${art}${c.reset}`;
    }

    // 6. Button Click & Countdown
    if (line.includes("Button located. Clicking") || line.includes("⚡ KÍCH HOẠT: Đã nhấn nút 'LẤY MÃ'")) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgCyan} ⚡ KÍCH HOẠT ${c.reset}  ${c.bold}${c.neonCyan}Đã nhấn nút 'LẤY MÃ' ➔ Bộ đếm bắt đầu chạy!${c.reset}`;
    }
    if (line.includes("Countdown duration =")) {
        const dur = line.split("duration =")[1].trim();
        return `  ${c.neonPurple}│    ${c.cyberYellow}⏱  Thời gian yêu cầu:${c.reset} ${c.bold}${c.pureWhite}${dur}${c.reset}`;
    }
    if (line.includes("Remaining:") || line.includes("Đếm ngược: còn")) {
        const remMatch = line.match(/(?:Remaining:\s*|còn\s*)([0-9\.]+)s/);
        const rem = remMatch ? parseFloat(remMatch[1]) : 0;
        const total = 60;
        const current = Math.max(0, total - rem);
        const pbar = renderProgressBar(current, total, 18);
        return `  ${c.neonPurple}│    ${c.flameOrange}⌛ Đếm ngược:${c.reset} ${pbar} ${c.bold}${c.cyberYellow}${rem}s${c.reset}`;
    }

    // 7. Sponsor Code Extracted
    if (line.includes("EXTRACTED SPONSOR CODE:") || line.includes("FOUND CODE IN BODY:") || line.includes("EXTRACTED GTRAFFIC CODE:") || line.includes("EXTRACTED LAYMA CODE:") || line.includes("EXTRACTED CODE ON FALLBACK:")) {
        const code = (line.split("CODE:")[1] || line.split("FALLBACK:")[1] || line.split("BODY:")[1] || "").trim();
        return `  ${c.neonPurple}├───${c.reset} ${c.bgYellow} 💎 MÃ NHẬN ĐƯỢC ${c.reset}  ${c.bold}${c.cyberYellow}►► ${code} ◄◄${c.reset}`;
    }
    if (line.includes("Filled code") && (line.includes("into Link4M input") || line.includes("into Gtraffic form"))) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgGreen} ✔ ĐIỀN FORM ${c.reset}  ${c.mintGreen}Đã nhập mã vào form xác nhận thành công!${c.reset}`;
    }

    // 8. AI reCAPTCHA & QCaptcha Solver
    if (line.includes("Solving reCAPTCHA") || line.includes("Detected Direct Captcha Gate")) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgPink} 🤖 WHISPER AI ${c.reset}  ${c.brightPink}Đang trích xuất audio & giải Google reCAPTCHA v2...${c.reset}`;
    }
    if (line.includes("Audio challenge requested")) {
        return `  ${c.neonPurple}│    ${c.hotPink}🎙 Đã tải audio challenge từ Google Captcha...${c.reset}`;
    }
    if (line.includes("Audio answer:")) {
        const ans = line.split("Audio answer:")[1].trim();
        return `  ${c.neonPurple}│    ${c.mintGreen}🧠 Whisper nhận diện giọng nói:${c.reset} ${c.bold}${c.cyberYellow}${ans}${c.reset}`;
    }
    if (line.includes("reCAPTCHA solved") || line.includes("Instantly solved without challenge") || line.includes("QCAPTCHA PASS")) {
        return `  ${c.neonPurple}├───${c.reset} ${c.bgGreen} ✔ CAPTCHA PASS ${c.reset}  ${c.bold}${c.mintGreen}QCaptcha / reCAPTCHA đã được giải thành công!${c.reset}`;
    }

    // BBMKTS Automation Logs
    if (line.includes("[TAB 1]") || line.includes("[TAB 2]")) {
        const tab = line.includes("[TAB 1]") ? "TAB 1" : "TAB 2";
        const content = line.replace(/\[\d{2}:\d{2}:\d{2}\]\s*\[TAB [12]\]\s*/, "").replace(/\[TAB [12]\]\s*/, "");
        return `  ${c.neonPurple}├───${c.reset} ${c.bgBlue} 📑 ${tab} ${c.reset}  ${c.softGray}${content}${c.reset}`;
    }
    if (line.includes("[NHAN DIEN]")) {
        const content = line.replace(/.*\[NHAN DIEN\]\s*/, "");
        return `  ${c.neonPurple}├───${c.reset} ${c.bgPink} 👁️ NHẬN DIỆN ${c.reset}  ${c.bold}${c.pureWhite}${content}${c.reset}`;
    }
    if (line.includes("[TARGET]")) {
        const content = line.replace(/.*\[TARGET\]\s*/, "");
        return `  ${c.neonPurple}├───${c.reset} ${c.bgGreen} 🎯 ĐỐI TÁC ${c.reset}  ${c.bold}${c.mintGreen}${content}${c.reset}`;
    }
    if (line.includes("[PATCH]")) {
        const content = line.replace(/.*\[PATCH\]\s*/, "");
        return `  ${c.neonPurple}│    ${c.neonCyan}⚡ ${content}${c.reset}`;
    }
    if (line.includes("[Countdown") && line.includes("Trang thai nut:")) {
        const m = line.match(/\[Countdown\s*(\d+)s\]\s*Trang thai nut:\s*['"]?(.*?)['"]?$/);
        if (m) {
            const sec = m[1];
            const status = m[2];
            return `  ${c.neonPurple}│    ${c.flameOrange}⌛ Đếm ngược (${sec}s):${c.reset} ${c.cyberYellow}${status}${c.reset}`;
        }
    }
    if (line.includes("DA LAY DUOC MA THANH CONG:") || line.includes("Ma: >>>")) {
        const m = line.match(/>>>\s*([A-Za-z0-9_\-]+)\s*<<</);
        const code = m ? m[1] : line;
        return `  ${c.neonPurple}├───${c.reset} ${c.bgYellow} 💎 MÃ NHẬN ĐƯỢC ${c.reset}  ${c.bold}${c.cyberYellow}►► ${code} ◄◄${c.reset}`;
    }

    // 9. Final Destination URL
    if (line.includes("FINAL DESTINATION URL:") || line.includes("DESTINATION URL INTERCEPTED FROM API:")) {
        const finalUrl = (line.split("FINAL DESTINATION URL:")[1] || line.split("FROM API:")[1] || "").trim();
        return `  ${c.neonPurple}╰───${c.reset} ${c.bgGreen} 🎉 HOÀN TẤT ${c.reset}  ${c.bold}${c.neonCyan}${finalUrl}${c.reset}`;
    }

    // 10. Warnings & Errors
    if (line.includes("Warning") || line.includes("[!]")) {
        const cleanMsg = line.replace(/\[\!\]\s*/, "").replace(/^Warning:\s*/, "");
        return `  ${c.neonPurple}│    ${c.flameOrange}⚠ ${cleanMsg}${c.reset}`;
    }

    // Default clean output
    const clean = line.replace(/^\[\*\]\s*/, "").replace(/^\[\+\]\s*/, "");
    return `  ${c.neonPurple}│    ${c.softGray}• ${clean}${c.reset}`;
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function showResultCard(finalUrl, durationSec) {
    console.log(`\n  ${c.neonCyan}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`  ${c.neonCyan}║${c.reset}  ${c.bgGreen} 🏆 BYPASS THÀNH CÔNG RỰC RỠ! ${c.reset}  ${c.dim}${c.softGray}Thời gian: ${durationSec}s${c.reset}                                 ${c.neonCyan}║${c.reset}`);
    console.log(`  ${c.neonCyan}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);
    console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.pureWhite}Link đích:${c.reset} ${c.bold}${c.neonCyan}${finalUrl}${c.reset}`);
    console.log(`  ${c.neonCyan}║${c.reset}  ${c.mintGreen}✔ Đã tự động sao chép link vào bộ nhớ tạm (Clipboard - Ctrl+V để dán)!${c.reset}     ${c.neonCyan}║${c.reset}`);
    console.log(`  ${c.neonCyan}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);
}

let currentHeadless = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function runBypassLink4M(targetUrl, headless = currentHeadless) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        const startTime = Date.now();
        console.log(`  ${c.bgPurple} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.neonCyan}LINK4M FULL AUTOMATION (WHISPER AI + RAPIDOCR)${c.reset}`);
        console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const baseArgs = fs.existsSync(SCRIPT_PATH)
            ? ["-u", "-X", "utf8", SCRIPT_PATH, targetUrl]
            : ["-u", "-X", "utf8", "-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import bypass; bypass.run(sys.argv[1])", targetUrl];
        const pythonArgs = headless ? [...baseArgs, "--headless"] : baseArgs;

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.includes("FINAL DESTINATION URL:")) {
                    capturedDestUrl = line.split("FINAL DESTINATION URL:")[1].trim();
                } else if (line.includes("DESTINATION URL INTERCEPTED FROM API:")) {
                    capturedDestUrl = line.split("DESTINATION URL INTERCEPTED FROM API:")[1].trim();
                }
                const formatted = formatLogLine(line);
                if (formatted) console.log(formatted);
            }
        });

        proc.stderr.on("data", (data) => {
            const errStr = data.toString("utf-8").trim();
            if (errStr && !errStr.includes("DeprecationWarning")) {
                console.log(`  ${c.neonPurple}│    ${c.crimsonRed}✖ [ERROR] ${errStr.slice(0, 110)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("link4m")) {
                copyToClipboard(finalUrl);
                showResultCard(finalUrl, durationSec);
            } else if (code === 0) {
                console.log(`\n  ${c.cyberYellow}⚠ Tiến trình hoàn tất nhưng không trích xuất được link đích hợp lệ.${c.reset}\n`);
            } else {
                console.log(`\n  ${c.crimsonRed}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.crimsonRed}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

async function runBypassOctolink(targetUrl, headless = currentHeadless) {
    clearScreen();
    printBanner();

    const startTime = Date.now();
    console.log(`  ${c.bgPink} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.hotPink}OCTOLINK ULTRA ENGINE (CANVAS PHYSICS + DEVICE GATE)${c.reset}`);
    console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);
    console.log(`  ${c.neonPurple}╭───${c.reset} ${c.bgPurple} 🎯 MỤC TIÊU ${c.reset}  ${c.bold}${c.neonCyan}${targetUrl}${c.reset}`);

    if (!fs.existsSync(OCTO_RUNNER)) {
        console.log(`  ${c.crimsonRed}❌ Không tìm thấy module Octolink tại: ${OCTO_RUNNER}${c.reset}\n`);
        return;
    }

    try {
        const { runBypass } = require(OCTO_RUNNER);
        const res = await runBypass(targetUrl, { headless }, (msg) => {
            if (msg.includes("Bắt đầu")) {
                console.log(`  ${c.neonPurple}├───${c.reset} ${c.bgBlue} 🚀 INITIATE ${c.reset}  ${c.electricBlue}${msg.replace(/^[🚀⚙️]\s*/, "")}${c.reset}`);
            } else if (msg.includes("Hook") || msg.includes("Canvas") || msg.includes("arc")) {
                console.log(`  ${c.neonPurple}├───${c.reset} ${c.bgPink} 🎨 CANVAS HOOK ${c.reset}  ${c.brightPink}${msg}${c.reset}`);
            } else if (msg.includes("THÀNH CÔNG") || msg.includes("Link đích")) {
                console.log(`  ${c.neonPurple}╰───${c.reset} ${c.bgGreen} 🎉 HOÀN TẤT ${c.reset}  ${c.mintGreen}${msg}${c.reset}`);
            } else if (msg.includes("CẢNH BÁO") || msg.includes("Lỗi") || msg.includes("Black-holed")) {
                console.log(`  ${c.neonPurple}│    ${c.flameOrange}⚠ ${msg}${c.reset}`);
            } else {
                console.log(`  ${c.neonPurple}│    ${c.softGray}• ${msg}${c.reset}`);
            }
        });

        const durationSec = Math.round((Date.now() - startTime) / 1000);
        if (res && res.success && res.finalUrl) {
            copyToClipboard(res.finalUrl);
            showResultCard(res.finalUrl, durationSec);
        } else {
            console.log(`\n  ${c.cyberYellow}⚠ Quá trình kết thúc: ${res?.reason || res?.error || "Chưa lấy được link callback"}${c.reset}\n`);
        }
    } catch (e) {
        console.error(`\n  ${c.crimsonRed}❌ Lỗi khi vượt Octolink: ${e.message}${c.reset}\n`);
    }
}

function isTrafficvnUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("trafficvn") || /trafficvn\.com/i.test(lower);
}

function runBypassTrafficVN(targetUrl, headless = currentHeadless) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        const startTime = Date.now();
        console.log(`  ${c.bgGreen} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.mintGreen}TRAFFICVN ULTRA ENGINE (CREEPJS STEALTH + RAPIDOCR + TURNSTILE)${c.reset}`);
        console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const baseTrafficArgs = fs.existsSync(TRAFFICVN_RUNNER)
            ? [TRAFFICVN_RUNNER, targetUrl]
            : ["-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import trafficvn_runner; trafficvn_runner.run(sys.argv[1])", targetUrl];
        const pythonArgs = headless ? ["-u", "-X", "utf8", ...baseTrafficArgs, "--headless"] : ["-u", "-X", "utf8", ...baseTrafficArgs];

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.includes("FINAL DESTINATION URL:")) {
                    capturedDestUrl = line.split("FINAL DESTINATION URL:")[1].trim();
                } else if (line.includes("DESTINATION URL INTERCEPTED FROM API:")) {
                    capturedDestUrl = line.split("DESTINATION URL INTERCEPTED FROM API:")[1].trim();
                }
                const formatted = formatLogLine(line);
                if (formatted) console.log(formatted);
            }
        });

        proc.stderr.on("data", (data) => {
            const errStr = data.toString("utf-8").trim();
            if (errStr && !errStr.includes("DeprecationWarning")) {
                console.log(`  ${c.neonPurple}│    ${c.crimsonRed}✖ [ERROR] ${errStr.slice(0, 110)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("trafficvn")) {
                copyToClipboard(finalUrl);
                showResultCard(finalUrl, durationSec);
            } else if (code === 0) {
                console.log(`\n  ${c.cyberYellow}⚠ Tiến trình hoàn tất nhưng không trích xuất được link đích hợp lệ.${c.reset}\n`);
            } else {
                console.log(`\n  ${c.crimsonRed}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.crimsonRed}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

function isBbmktsUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("bbmkts") || /bbmkts\.com/i.test(lower);
}

function runBypassBBMKTS(targetUrl, headless = currentHeadless) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        const startTime = Date.now();
        console.log(`  ${c.bgGreen} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.brightPink}BBMKTS ULTRA ENGINE (AUTONOMOUS DUAL-TAB + RAPIDOCR)${c.reset}`);
        console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const baseBbmktsArgs = fs.existsSync(BBMKTS_RUNNER)
            ? [BBMKTS_RUNNER, targetUrl]
            : ["-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import bbmkts_runner", targetUrl];
        const pythonArgs = headless ? ["-u", "-X", "utf8", ...baseBbmktsArgs, "--headless"] : ["-u", "-X", "utf8", ...baseBbmktsArgs];

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.includes("FINAL DESTINATION URL:")) {
                    capturedDestUrl = line.split("FINAL DESTINATION URL:")[1].trim();
                } else if (line.includes(">>> http")) {
                    const m = line.match(/>>>\s*(https?:\/\/[^\s<]+)\s*<<</);
                    if (m) capturedDestUrl = m[1].trim();
                }
                const formatted = formatLogLine(line);
                if (formatted) console.log(formatted);
            }
        });

        proc.stderr.on("data", (data) => {
            const errStr = data.toString("utf-8").trim();
            if (errStr && !errStr.includes("DeprecationWarning")) {
                console.log(`  ${c.neonPurple}│    ${c.crimsonRed}✖ [ERROR] ${errStr.slice(0, 110)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("bbmkts.com/go/")) {
                copyToClipboard(finalUrl);
                showResultCard(finalUrl, durationSec);
            } else if (code === 0) {
                console.log(`\n  ${c.cyberYellow}⚠ Tiến trình hoàn tất nhưng không trích xuất được link đích hợp lệ.${c.reset}\n`);
            } else {
                console.log(`\n  ${c.crimsonRed}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.crimsonRed}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

function isGtrafficUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("gtraffic") || /gtraffic\.io/i.test(lower);
}

function runBypassGtraffic(targetUrl, headless = currentHeadless) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        const startTime = Date.now();
        console.log(`  ${c.bgOrange} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.flameOrange}GTRAFFIC ULTRA ENGINE (MOBILE VIEWPORT + DUAL-TAB SOLVER)${c.reset}`);
        console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const baseGtrafficArgs = fs.existsSync(GTRAFFIC_RUNNER)
            ? [GTRAFFIC_RUNNER, targetUrl]
            : ["-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import gtraffic_runner; gtraffic_runner.run(sys.argv[1])", targetUrl];
        const pythonArgs = headless ? ["-u", "-X", "utf8", ...baseGtrafficArgs, "--headless"] : ["-u", "-X", "utf8", ...baseGtrafficArgs];

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.includes("FINAL DESTINATION URL:")) {
                    capturedDestUrl = line.split("FINAL DESTINATION URL:")[1].trim();
                } else if (line.includes("DESTINATION URL INTERCEPTED FROM API:")) {
                    capturedDestUrl = line.split("DESTINATION URL INTERCEPTED FROM API:")[1].trim();
                } else if (line.includes(">>> http")) {
                    const m = line.match(/>>>\s*(https?:\/\/[^\s<]+)\s*<<</);
                    if (m) capturedDestUrl = m[1].trim();
                }
                const formatted = formatLogLine(line);
                if (formatted) console.log(formatted);
            }
        });

        proc.stderr.on("data", (data) => {
            const errStr = data.toString("utf-8").trim();
            if (errStr && !errStr.includes("DeprecationWarning")) {
                console.log(`  ${c.neonPurple}│    ${c.crimsonRed}✖ [ERROR] ${errStr.slice(0, 110)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("gtraffic.io")) {
                copyToClipboard(finalUrl);
                showResultCard(finalUrl, durationSec);
            } else if (code === 0) {
                console.log(`\n  ${c.cyberYellow}⚠ Tiến trình hoàn tất nhưng không trích xuất được link đích hợp lệ.${c.reset}\n`);
            } else {
                console.log(`\n  ${c.crimsonRed}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.crimsonRed}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

function isLaymaUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("layma") || /layma\.net/i.test(lower);
}

function runBypassLayMa(targetUrl, headless = currentHeadless) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        const startTime = Date.now();
        console.log(`  ${c.bgPurple} ▶ KHỞI CHẠY ${c.reset}  ${c.bold}${c.brightPink}LAYMA.NET ULTRA ENGINE (QCAPTCHA STEALTH + HSV CONTOUR VISION)${c.reset}`);
        console.log(`  ${c.dim}${c.softGray}Chế độ: ${headless ? "Ẩn (Headless)" : "Hiện cửa sổ (Window)"}${c.reset}\n`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const baseLaymaArgs = fs.existsSync(LAYMA_RUNNER)
            ? [LAYMA_RUNNER, targetUrl]
            : ["-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import layma_runner; layma_runner.run(sys.argv[1])", targetUrl];
        const pythonArgs = headless ? ["-u", "-X", "utf8", ...baseLaymaArgs, "--headless"] : ["-u", "-X", "utf8", ...baseLaymaArgs];

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.includes("FINAL DESTINATION URL:")) {
                    capturedDestUrl = line.split("FINAL DESTINATION URL:")[1].trim();
                } else if (line.includes("DESTINATION URL INTERCEPTED FROM API:")) {
                    capturedDestUrl = line.split("DESTINATION URL INTERCEPTED FROM API:")[1].trim();
                }
                const formatted = formatLogLine(line);
                if (formatted) console.log(formatted);
            }
        });

        proc.stderr.on("data", (data) => {
            const errStr = data.toString("utf-8").trim();
            if (errStr && !errStr.includes("DeprecationWarning")) {
                console.log(`  ${c.neonPurple}│    ${c.crimsonRed}✖ [ERROR] ${errStr.slice(0, 110)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("layma.net")) {
                copyToClipboard(finalUrl);
                showResultCard(finalUrl, durationSec);
            } else if (code === 0) {
                console.log(`\n  ${c.cyberYellow}⚠ Tiến trình hoàn tất nhưng không trích xuất được link đích hợp lệ.${c.reset}\n`);
            } else {
                console.log(`\n  ${c.crimsonRed}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.crimsonRed}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

function isOctolinkUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("octolink") || lower.includes("linkhuongdan") || /octo/i.test(lower);
}

function isLink4mUrl(u) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.includes("link4m") || lower.includes("link4") || /link4m\.(net|org|co|me|vip)/i.test(lower);
}

async function dispatchUrl(url, headless = currentHeadless) {
    const target = url.trim();
    if (isOctolinkUrl(target)) {
        console.log(`\n  ${c.bgRed} ⛔ THÔNG BÁO TẠM NGỪNG DỰ ÁN OCTOLINK ⛔ ${c.reset}`);
        console.log(`  ${c.crimsonRed}Website octolink.vip đã bị Cục An ninh mạng (A05 - Bộ Công An) chặn do có dấu hiệu vi phạm Điều 321, 322 Bộ luật Hình sự.${c.reset}`);
        console.log(`  ${c.flameOrange}Dự án chính thức ngừng mọi hoạt động hỗ trợ Octolink để đảm bảo an toàn và tuân thủ pháp luật.${c.reset}\n`);
        return;
    }
    if (isLaymaUrl(target)) {
        await runBypassLayMa(target, headless);
        return;
    }
    if (isGtrafficUrl(target)) {
        await runBypassGtraffic(target, headless);
        return;
    }
    if (isBbmktsUrl(target)) {
        await runBypassBBMKTS(target, headless);
        return;
    }
    if (isTrafficvnUrl(target)) {
        if (fs.existsSync(TRAFFICVN_RUNNER)) {
            await runBypassTrafficVN(target, headless);
        } else {
            console.log(`\n  ${c.cyberYellow}⚠ Tính năng TrafficVN hiện đang trong giai đoạn thử nghiệm nội bộ (Beta) và chưa công bố.${c.reset}\n`);
        }
        return;
    }
    await runBypassLink4M(target, headless);
}

async function main() {
    while (true) {
        clearScreen();
        printBanner();

        // Khung Menu Chính Cực Kì Chuyên Nghiệp
        const modeStatus = currentHeadless
            ? `${c.mintGreen}ẨN (HEADLESS)${c.reset}  `
            : `${c.flameOrange}HIỆN (WINDOW)${c.reset}    `;

        console.log(`  ${c.neonCyan}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}                          ${c.bold}${c.cyberYellow}⚡ BẢNG ĐIỀU KHIỂN TÁC VỤ ⚡${c.reset}                         ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.neonCyan}[1]${c.reset} ${c.bold}${c.pureWhite}⚡ Vượt Link Tự Động${c.reset} ${c.dim}(Auto Detect: Link4M/BBMKTS/Gtraffic/LayMa)${c.reset}  ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.electricBlue}[2]${c.reset} ${c.bold}${c.pureWhite}🎯 Vượt Link4M Chuyên Sâu${c.reset} ${c.dim}(Whisper AI + Smart Health-Check)${c.reset}        ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.brightPink}[3]${c.reset} ${c.bold}${c.pureWhite}💎 Vượt BBMKTS Chuyên Sâu${c.reset} ${c.dim}(Autonomous Dual-Tab Engine)${c.reset}             ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.flameOrange}[4]${c.reset} ${c.bold}${c.pureWhite}🚀 Vượt Gtraffic Chuyên Sâu${c.reset} ${c.dim}(Mobile Viewport + Fast Auto Solver)${c.reset}      ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.hotPink}[5]${c.reset} ${c.bold}${c.pureWhite}🌟 Vượt LayMa.net Chuyên Sâu${c.reset} ${c.dim}(QCaptcha Stealth + HSV Vision)${c.reset}       ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.cyberYellow}[6]${c.reset} ${c.bold}${c.pureWhite}🖥️ Đổi Trình Duyệt: [${modeStatus}${c.bold}${c.pureWhite}]${c.reset} ${c.dim}(Bấm 6 để chuyển đổi)${c.reset}            ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.pureWhite}[7]${c.reset} ${c.bold}${c.pureWhite}📖 Hướng Dẫn & Tuyên Bố Pháp Lý${c.reset}                                         ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}║${c.reset}  ${c.bold}${c.crimsonRed}[0]${c.reset} ${c.bold}${c.pureWhite}🚪 Thoát Ứng Dụng${c.reset}                                                      ${c.neonCyan}║${c.reset}`);
        console.log(`  ${c.neonCyan}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);

        const clipUrl = getClipboardUrl();
        if (clipUrl) {
            const isOcto = isOctolinkUrl(clipUrl);
            if (isOcto) {
                console.log(`  ${c.bgRed} ⛔ PHÁT HIỆN LINK OCTOLINK: ${c.reset} ${c.dim}${clipUrl}${c.reset}`);
                console.log(`  ${c.crimsonRed}↳ Hệ thống từ chối xử lý link Octolink do đã bị Bộ Công An cấm.${c.reset}\n`);
            } else if (isLaymaUrl(clipUrl)) {
                console.log(`  ${c.bgPink} 🔗 LAYMA.NET PHÁT HIỆN: ${c.reset} ${c.bold}${c.brightPink}${clipUrl}${c.reset}`);
                console.log(`  ${c.dim}${c.softGray}↳ Nhấn Enter (chọn 1) để tự động vượt ngay link này!${c.reset}\n`);
            } else if (isGtrafficUrl(clipUrl)) {
                console.log(`  ${c.bgOrange} 🔗 GTRAFFIC PHÁT HIỆN: ${c.reset} ${c.bold}${c.flameOrange}${clipUrl}${c.reset}`);
                console.log(`  ${c.dim}${c.softGray}↳ Nhấn Enter (chọn 1) để tự động vượt ngay link này!${c.reset}\n`);
            } else if (isBbmktsUrl(clipUrl)) {
                console.log(`  ${c.bgPink} 🔗 BBMKTS PHÁT HIỆN: ${c.reset} ${c.bold}${c.brightPink}${clipUrl}${c.reset}`);
                console.log(`  ${c.dim}${c.softGray}↳ Nhấn Enter (chọn 1) để tự động vượt ngay link này!${c.reset}\n`);
            } else if (isTrafficvnUrl(clipUrl)) {
                console.log(`  ${c.bgGreen} 🔗 TRAFFICVN PHÁT HIỆN (BETA): ${c.reset} ${c.bold}${c.mintGreen}${clipUrl}${c.reset}`);
                console.log(`  ${c.dim}${c.softGray}↳ Nhấn Enter (chọn 1) để thử nghiệm vượt link này!${c.reset}\n`);
            } else {
                console.log(`  ${c.bgCyan} 🔗 LINK4M PHÁT HIỆN: ${c.reset} ${c.bold}${c.neonCyan}${clipUrl}${c.reset}`);
                console.log(`  ${c.dim}${c.softGray}↳ Nhấn Enter (chọn 1) để tự động chạy ngay link này!${c.reset}\n`);
            }
        }

        const inputChoice = await ask(`  ${c.bold}${c.cyberYellow}➤ Chọn chế độ hoặc Dán link trực tiếp [1]: ${c.reset}`);
        const choice = inputChoice.trim();

        // 1. Kiểm tra nếu người dùng dán trực tiếp link URL vào prompt
        if (choice.startsWith("http://") || choice.startsWith("https://")) {
            await dispatchUrl(choice);
        } else if (choice === "0") {
            console.log(`\n  ${c.mintGreen}✨ Cảm ơn bạn đã sử dụng Link4M Bypass Suite! Hẹn gặp lại! ✨${c.reset}\n`);
            process.exit(0);
        } else if (choice === "6") {
            currentHeadless = !currentHeadless;
            console.log(`\n  ${c.mintGreen}✅ Đã chuyển sang chế độ: ${currentHeadless ? "Ẩn (Headless - Siêu tốc)" : "Hiện cửa sổ (Window - Dễ quan sát)"}${c.reset}\n`);
            await sleep(1200);
            continue;
        } else if (choice === "7" || choice.toLowerCase() === "h") {
            clearScreen();
            printBanner();
            console.log(`  ${c.bold}${c.neonCyan}📋 THÔNG TIN HỆ THỐNG & TUYÊN BỐ PHÁP LÝ:${c.reset}\n`);
            console.log(`  ${c.bold}${c.crimsonRed}⛔ THÔNG BÁO DỪNG DỰ ÁN OCTOLINK:${c.reset}`);
            console.log(`     • ${c.softGray}Hệ thống octolink.vip đã bị Cục An ninh mạng (A05 - Bộ Công An) chặn do vi phạm Điều 321, 322 BLHS.${c.reset}`);
            console.log(`     • ${c.softGray}Dự án tuân thủ nghiêm ngặt pháp luật và chính thức ngừng mọi hoạt động liên quan đến Octolink.${c.reset}\n`);
            console.log(`  ${c.bold}${c.electricBlue}1. Link4M Bypass Core:${c.reset}`);
            console.log(`     • ${c.softGray}RapidOCR trên ONNX Runtime: Nhận diện chính xác domain tài trợ từ ảnh SERP.${c.reset}`);
            console.log(`     • ${c.softGray}Whisper AI Audio Solver: Tự động giải Google reCAPTCHA v2 (Form 2 Enterprise fix).${c.reset}`);
            console.log(`     • ${c.softGray}Tự động phục hồi domain bị che sao (*, ***, co***.tw, c***) và probe live HTTP/HTTPS.${c.reset}\n`);
            console.log(`  ${c.bold}${c.brightPink}2. BBMKTS Bypass Core:${c.reset}`);
            console.log(`     • ${c.softGray}Autonomous Dual-Tab Engine: Tab 1 giữ session bbmkts.com, Tab 2 thực thi countdown đối tác.${c.reset}`);
            console.log(`     • ${c.softGray}Bypass triệt để anti-incognito và chặn popup "THIẾU BƯỚC NHIỆM VỤ" via route patch.${c.reset}`);
            console.log(`     • ${c.softGray}Tự động gửi trực tiếp fetch /link/submit và giải mã link callback an toàn 100%.${c.reset}\n`);
            console.log(`  ${c.bold}${c.flameOrange}3. Gtraffic Bypass Core:${c.reset}`);
            console.log(`     • ${c.softGray}Mobile Viewport Spoofing (414x896) vượt qua CSS ẩn nút desktop của nhà tài trợ.${c.reset}`);
            console.log(`     • ${c.softGray}Tự động click nút #traffic-button-no, đếm ngược ~62s lấy mã viên nhộng và submit Tab 1.${c.reset}\n`);
            console.log(`  ${c.bold}${c.hotPink}4. LayMa.net Bypass Core (MỚI):${c.reset}`);
            console.log(`     • ${c.softGray}QCaptcha Stealth Runtime Patch: Spoof WebGL Intel UHD 620, gỡ bỏ automation probes.${c.reset}`);
            console.log(`     • ${c.softGray}HSV Contour Shape Analysis: Phân tích hình học đường bao 9 ô odd-one-out với độ chính xác 100%.${c.reset}`);
            console.log(`     • ${c.softGray}Mô phỏng quỹ đạo chuột tự nhiên, duy trì time-on-site heartbeat và giải mã link callback an toàn.${c.reset}\n`);
            console.log(`  ${c.bold}${c.cyberYellow}5. Tùy chọn Headless linh hoạt:${c.reset}`);
            console.log(`     • ${c.softGray}Phím [6]: Bật/Tắt chế độ chạy ẩn (Headless --headless=new) siêu tốc.${c.reset}\n`);
            await ask(`  ${c.cyberYellow}Nhấn Enter để quay lại menu chính...${c.reset}`);
            continue;
        } else if (choice === "5") {
            const defaultUrl = "https://layma.net/Kd1onyItr";
            const hint = clipUrl && isLaymaUrl(clipUrl) ? ` ${c.softGray}(Enter để dùng: ${c.brightPink}${clipUrl}${c.softGray})${c.reset}` : ` ${c.softGray}(Enter để dùng: ${defaultUrl})${c.reset}`;
            let link = await ask(`\n  ${c.bold}${c.brightPink}Nhập link LayMa cần vượt${hint}:${c.reset} `);
            if (!link) link = (clipUrl && isLaymaUrl(clipUrl)) ? clipUrl : defaultUrl;
            await runBypassLayMa(link);
        } else if (choice === "4") {
            const defaultUrl = "https://gtraffic.io/X3BR2OQ";
            const hint = clipUrl && isGtrafficUrl(clipUrl) ? ` ${c.softGray}(Enter để dùng: ${c.flameOrange}${clipUrl}${c.softGray})${c.reset}` : ` ${c.softGray}(Enter để dùng: ${defaultUrl})${c.reset}`;
            let link = await ask(`\n  ${c.bold}${c.flameOrange}Nhập link Gtraffic cần vượt${hint}:${c.reset} `);
            if (!link) link = (clipUrl && isGtrafficUrl(clipUrl)) ? clipUrl : defaultUrl;
            await runBypassGtraffic(link);
        } else if (choice === "3") {
            const defaultUrl = "https://bbmkts.com/go/3p82s";
            const hint = clipUrl && isBbmktsUrl(clipUrl) ? ` ${c.softGray}(Enter để dùng: ${c.brightPink}${clipUrl}${c.softGray})${c.reset}` : ` ${c.softGray}(Enter để dùng: ${defaultUrl})${c.reset}`;
            let link = await ask(`\n  ${c.bold}${c.brightPink}Nhập link BBMKTS cần vượt${hint}:${c.reset} `);
            if (!link) link = (clipUrl && isBbmktsUrl(clipUrl)) ? clipUrl : defaultUrl;
            await runBypassBBMKTS(link);
        } else if (choice === "2") {
            const hint = clipUrl && isLink4mUrl(clipUrl) ? ` ${c.softGray}(Enter để dùng: ${c.mintGreen}${clipUrl}${c.softGray})${c.reset}` : ` ${c.softGray}(Enter để dùng: https://link4m.net/go/2kCcIqn)${c.reset}`;
            let link = await ask(`\n  ${c.bold}${c.electricBlue}Nhập link Link4M cần vượt${hint}:${c.reset} `);
            if (!link) link = (clipUrl && isLink4mUrl(clipUrl)) ? clipUrl : (clipUrl || "https://link4m.net/go/2kCcIqn");
            await runBypassLink4M(link);
        } else if (choice === "beta" || choice === "trafficvn") {
            const defaultUrl = "https://trafficvn.com/get/MFGm2tAlcSn";
            const hint = clipUrl && isTrafficvnUrl(clipUrl) ? ` ${c.softGray}(Enter để dùng: ${c.mintGreen}${clipUrl}${c.softGray})${c.reset}` : ` ${c.softGray}(Enter để dùng: ${defaultUrl})${c.reset}`;
            let link = await ask(`\n  ${c.bold}${c.mintGreen}[BETA] Nhập link TrafficVN cần vượt${hint}:${c.reset} `);
            if (!link) link = (clipUrl && isTrafficvnUrl(clipUrl)) ? clipUrl : defaultUrl;
            await runBypassTrafficVN(link);
        } else {
            // Chế độ 1: Tự động phát hiện (Nếu có trong clipboard -> ưu tiên, nếu không có -> hỏi nhập)
            let link = "";
            if (clipUrl) {
                const hint = ` ${c.softGray}(Enter để dùng Clipboard: ${c.mintGreen}${clipUrl}${c.softGray})${c.reset}`;
                link = await ask(`\n  ${c.bold}${c.neonCyan}Nhập link cần vượt${hint}:${c.reset} `);
                if (!link) link = clipUrl;
            } else {
                const hint = ` ${c.softGray}(Mặc định: https://link4m.net/go/2kCcIqn)${c.reset}`;
                link = await ask(`\n  ${c.bold}${c.neonCyan}Nhập link cần vượt (Link4M / BBMKTS / Gtraffic / LayMa)${hint}:${c.reset} `);
                if (!link) link = "https://link4m.net/go/2kCcIqn";
            }

            await dispatchUrl(link);
        }

        const next = await ask(`\n  ${c.neonPurple}╭───${c.reset} ${c.bgYellow} 🔄 TIẾP TỤC? ${c.reset}  ${c.pureWhite}Nhấn Enter để tiếp tục (hoặc gõ 'q' để thoát)${c.reset}\n  ${c.neonPurple}╰──➤${c.reset} `);
        if (next.toLowerCase() === "q") {
            console.log(`\n  ${c.mintGreen}✨ Tạm biệt anh yêu Tris! Hẹn gặp lại anh! ✨${c.reset}\n`);
            process.exit(0);
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { formatLogLine, c, renderProgressBar };

