const readline = require("readline");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SCRIPT_PATH = path.join(ROOT_DIR, "src", "core", "bypass.py");
const DEST_FILE = path.join(ROOT_DIR, "destination_url.txt");

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
            if (out && (out.includes("link4m") || out.startsWith("http"))) {
                return out.split(/\r?\n/)[0].trim();
            }
        }
    } catch (e) {}
    return "";
}

const c = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[38;5;51m",
    blue: "\x1b[38;5;39m",
    pink: "\x1b[38;5;201m",
    purple: "\x1b[38;5;141m",
    green: "\x1b[38;5;84m",
    yellow: "\x1b[38;5;226m",
    orange: "\x1b[38;5;214m",
    red: "\x1b[38;5;196m",
    white: "\x1b[38;5;231m"
};

if (process.platform === "win32") {
    try { execSync("chcp 65001", { stdio: "ignore" }); } catch (e) {}
}

function clearScreen() {
    process.stdout.write(process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1b[2J\x1b[H");
}

function printBanner() {
    console.log(`${c.cyan}  ▄████████    ▄████████    ▄████████    ▄████████    ▄████████ `);
    console.log(`${c.blue}  ███    ███   ███    ███   ███    ███   ███    ███   ███    ███ `);
    console.log(`${c.pink}  ███    ███   ███    █▀    ███    ███   ███    █▀    ███    ███ `);
    console.log(`${c.purple}  ███    ███  ▄███▄▄▄      ▄███▄▄▄▄██▀  ▄███▄▄▄       ███    ███ `);
    console.log(`${c.green}  ███████████ ▀▀███▀▀▀     ▀▀███▀▀▀▀▀   ▀▀███▀▀▀     ███████████ `);
    console.log(`${c.yellow}  ███    ███   ███    █▄  ▀███████████   ███    █▄    ███    ███ `);
    console.log(`${c.orange}  ███    ███   ███    ███   ███    ███   ███    ███   ███    ███ `);
    console.log(`${c.red}  ███    █▀    ██████████   ███    ███   ██████████   ███    █▀  ${c.reset}`);
    console.log(`\n  ${c.bright}${c.cyan}⚡ LINK4M ULTIMATE BYPASS SUITE - 100% FREE AUTOMATION ⚡${c.reset}`);
    console.log(`  ${c.dim}${c.white}Whisper AI Captcha • RapidOCR Vision • Clipboard Auto-Detect${c.reset}\n`);
}

function formatLogLine(rawLine) {
    const line = rawLine.trim();
    if (!line) return null;

    if (line.includes("Target Link4M URL:")) {
        const u = line.split("Target Link4M URL:")[1].trim();
        return `  ${c.purple}╭─[ MỤC TIÊU ]${c.reset}  ${c.cyan}${c.bright}${u}${c.reset}`;
    }
    if (line.includes("Found sponsor SERP image:")) {
        return `  ${c.blue}├─[ OCR VISION ]${c.reset} Tìm thấy ảnh nhiệm vụ -> Đang đọc domain tài trợ...`;
    }
    if (line.includes("TARGET SPONSOR WEBSITE") || line.includes("Extracted sponsor domain:")) {
        const d = line.split("THIS MISSION:")[1] || line.split("EXTRACTED SPONSOR DOMAIN:")[1] || line;
        return `  ${c.green}├─[ WEB TÀI TRỢ ]${c.reset} ${c.yellow}${c.bright}${d.trim()}${c.reset}`;
    }
    if (line.includes("Detected traffic_key:")) {
        const k = line.split("Detected traffic_key:")[1].trim();
        return `  ${c.purple}├─[ CAMPAIGN ]${c.reset}   Traffic Key: ${c.white}${k}${c.reset}`;
    }
    if (line.includes("EXECUTING STEP")) {
        const m = line.match(/STEP\s+(\d+)/i);
        return `  ${c.orange}├─[ TIẾN TRÌNH ]${c.reset} ${c.bright}Đang thực hiện Bước ${m ? m[1] : "1"}...${c.reset}`;
    }
    if (line.includes("Button located. Clicking")) {
        return `  ${c.cyan}├─[ KÍCH HOẠT ]${c.reset}  Đã bấm nút 'LẤY MÃ' -> Bắt đầu đếm ngược!`;
    }
    if (line.includes("Remaining:")) {
        const rem = line.match(/Remaining:\s*([0-9\.]+)s/);
        return `  ${c.dim}│  ⏱️  Thời gian còn lại: ${rem ? rem[1] : "?"}s...${c.reset}`;
    }
    if (line.includes("EXTRACTED SPONSOR CODE:")) {
        const code = line.split("EXTRACTED SPONSOR CODE:")[1].trim();
        return `  ${c.green}${c.bright}├─[ LẤY MÃ XONG ]${c.reset} ${c.yellow}${c.bright}Mã nhiệm vụ: ${code}${c.reset}`;
    }
    if (line.includes("Solving reCAPTCHA")) {
        return `  ${c.pink}├─[ AI CAPTCHA ]${c.reset} ${c.bright}Đang giải Google reCAPTCHA v2 bằng Whisper AI...${c.reset}`;
    }
    if (line.includes("reCAPTCHA AI solved")) {
        return `  ${c.green}├─[ AI CAPTCHA ]${c.reset} ${c.green}${c.bright}✔ Đã giải xong Captcha v2 thành công!${c.reset}`;
    }
    if (line.includes("FINAL DESTINATION URL:")) {
        const finalUrl = line.split("FINAL DESTINATION URL:")[1].trim();
        return `  ${c.green}${c.bright}╰─[ HOÀN TẤT ]${c.reset}   Link đích: ${c.cyan}${c.bright}${finalUrl}${c.reset}`;
    }
    if (line.includes("Warning")) {
        return `  ${c.yellow}│  ⚠ ${line.replace(/\[\!\]\s*/, "")}${c.reset}`;
    }
    return `  ${c.dim}│  ${line.replace(/^\[\*\]\s*/, "")}${c.reset}`;
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function runBypass(targetUrl) {
    return new Promise((resolve) => {
        clearScreen();
        printBanner();

        console.log(`  ${c.orange}▶ ${c.bright}BẮT ĐẦU VƯỢT LINK4M TỰ ĐỘNG (100% FREE AI)${c.reset}\n`);
        console.log(`  ${c.purple}╭─────────────────────────────────────────────────────────────────────────────╮${c.reset}`);
        console.log(`  ${c.purple}│${c.reset}  ${c.yellow}${c.bright}TIẾN TRÌNH THỰC THI (LIVE ACTIVITY FEED)${c.reset}                                 ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}├─────────────────────────────────────────────────────────────────────────────┤${c.reset}`);

        if (fs.existsSync(DEST_FILE)) {
            try { fs.unlinkSync(DEST_FILE); } catch (e) {}
        }

        let capturedDestUrl = null;
        const pythonArgs = fs.existsSync(SCRIPT_PATH)
            ? ["-u", "-X", "utf8", SCRIPT_PATH, targetUrl]
            : ["-u", "-X", "utf8", "-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import bypass; bypass.run(sys.argv[1])", targetUrl];

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
                console.log(`  ${c.red}│  [ERR] ${errStr.slice(0, 100)}${c.reset}`);
            }
        });

        proc.on("close", (code) => {
            console.log(`  ${c.purple}╰─────────────────────────────────────────────────────────────────────────────╯${c.reset}\n`);

            const finalUrl = capturedDestUrl || (fs.existsSync(DEST_FILE) ? fs.readFileSync(DEST_FILE, "utf-8").trim() : null);

            if (finalUrl && !finalUrl.includes("link4m")) {
                console.log(`  ${c.green}╭─────────────────────────────────────────────────────────────────────────────╮${c.reset}`);
                console.log(`  ${c.green}│${c.reset}  ${c.bright}${c.white}Link đích:${c.reset} ${c.cyan}${c.bright}${finalUrl}${c.reset}`);
                console.log(`  ${c.green}│${c.reset}  ${c.green}✔ Đã tự động sao chép vào Clipboard (Ctrl+V để dán)!${c.reset}`);
                console.log(`  ${c.green}╰─────────────────────────────────────────────────────────────────────────────╯${c.reset}\n`);
            } else if (code === 0) {
                console.log(`  ${c.yellow}⚠ Đã hoàn tất nhưng chưa lấy được link đích.${c.reset}\n`);
            } else {
                console.log(`  ${c.red}❌ Tiến trình dừng lại (Exit Code: ${code})${c.reset}\n`);
            }
            resolve(code);
        });

        proc.on("error", (err) => {
            console.error(`\n  ${c.red}[Lỗi khi khởi chạy Python]: ${err.message}${c.reset}\n`);
            resolve(-1);
        });
    });
}

async function main() {
    while (true) {
        clearScreen();
        printBanner();

        console.log(`  ${c.purple}╭─────────────────────────────────────────────────────────────────────────────╮${c.reset}`);
        console.log(`  ${c.purple}│${c.reset}  [1] Vượt link Link4M (Tự nhận link từ Clipboard hoặc nhập mới)             ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}│${c.reset}  [2] Hướng dẫn & Giới thiệu                                                  ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}│${c.reset}  [0] Thoát                                                                   ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}╰─────────────────────────────────────────────────────────────────────────────╯${c.reset}\n`);

        const choice = await ask(`  ${c.yellow}➤ Chọn chức năng [1]: ${c.reset}`);
        if (choice === "0") {
            console.log(`\n  ${c.green}Tạm biệt! Hẹn gặp lại.${c.reset}\n`);
            process.exit(0);
        }

        if (choice === "2") {
            clearScreen();
            printBanner();
            console.log(`  ${c.cyan}THÔNG TIN BỘ CÔNG CỤ:${c.reset}`);
            console.log(`  • 100% Free: Whisper AI offline giải Captcha audio, RapidOCR nhận diện ảnh.`);
            console.log(`  • Tự động vượt qua tất cả các bước đếm ngược và lấy link đích.`);
            console.log(`  • Tự động bắt link từ Clipboard và tự động copy link đích khi xong.\n`);
            await ask(`  ${c.yellow}Nhấn Enter để quay lại menu chính...${c.reset}`);
            continue;
        }

        const clipUrl = getClipboardUrl();
        const hint = clipUrl ? ` (Enter để dùng: ${c.green}${clipUrl}${c.reset})` : "";
        let link = await ask(`\n  ${c.cyan}Nhập link Link4M cần vượt${hint}: ${c.reset}`);
        if (!link) link = clipUrl || "https://link4m.net/go/2kCcIqn";

        await runBypass(link);
        const next = await ask(`  ${c.yellow}╭─[ Nhấn Enter để vượt link tiếp theo (hoặc gõ 'q' để thoát) ]\n  ╰──➤ ${c.reset}`);
        if (next.toLowerCase() === "q") {
            console.log(`\n  ${c.green}Tạm biệt! Hẹn gặp lại.${c.reset}\n`);
            process.exit(0);
        }
    }
}

main().catch(console.error);
