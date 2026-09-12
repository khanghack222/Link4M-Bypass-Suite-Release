const readline = require("readline");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const HEADLESS_PATH = path.join(ROOT_DIR, "src", "core", "headless_bypass.py");
const SCRIPT_PATH = path.join(ROOT_DIR, "src", "core", "bypass.py");
const DEST_FILE = path.join(ROOT_DIR, "destination_url.txt");
const CODE_FILE = path.join(ROOT_DIR, "extracted_code.txt");

function getPythonPath() {
    const candidates = [
        "C:\\Users\\XUAN\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python311\\python.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python312\\python.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python310\\python.exe"),
        "C:\\Python311\\python.exe",
        "C:\\Python312\\python.exe"
    ];
    for (const c of candidates) {
        if (c && fs.existsSync(c)) return c;
    }
    return "python";
}

// Bảng màu ANSI Neon Cyberpunk
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
    white: "\x1b[38;5;231m",
    gray: "\x1b[38;5;244m",
    darkGray: "\x1b[38;5;238m",
};

if (process.platform === "win32") {
    try {
        require("child_process").execSync("chcp 65001", { stdio: "ignore" });
    } catch (e) {}
}

function clearScreen() {
    try {
        console.clear();
    } catch (e) {
        process.stdout.write("\x1b[2J\x1b[0f");
    }
}

function printBanner() {
    console.log(`\n${c.pink}   ▄████████    ▄████████    ▄████████    ▄████████    ▄████████ `);
    console.log(`${c.purple}  ███    ███   ███    ███   ███    ███   ███    ███   ███    ███ `);
    console.log(`${c.blue}  ███    ███   ███    █▀    ███    ███   ███    █▀    ███    ███ `);
    console.log(`${c.cyan}  ███    ███  ▄███▄▄▄      ▄███▄▄▄▄██▀  ▄███▄▄▄       ███    ███ `);
    console.log(`${c.green}▀███████████ ▀▀███▀▀▀     ▀▀███▀▀▀▀▀   ▀▀███▀▀▀     ▀███████████ `);
    console.log(`${c.yellow}  ███    ███   ███    █▄  ▀███████████   ███    █▄    ███    ███ `);
    console.log(`${c.orange}  ███    ███   ███    ███   ███    ███   ███    ███   ███    ███ `);
    console.log(`${c.red}  ███    █▀    ██████████   ███    ███   ██████████   ███    █▀  ${c.reset}`);
    console.log(`\n  ${c.bright}${c.cyan}⚡ LINK4M ULTIMATE BYPASS SUITE - HEADLESS PROTOCOL & CACHE ⚡${c.reset}`);
    console.log(`  ${c.dim}${c.white}Offline Whisper AI Captcha • RapidOCR Vision • 0s Cache Bypass • Headless Engine${c.reset}\n`);
}

function formatLogLine(rawLine) {
    const line = rawLine.trim();
    if (!line) return null;

    // Filter noisy debug lines
    if (line.startsWith("===") || line.includes("Saving final screenshot")) return null;

    // Phân loại và định dạng log đẹp mắt
    if (line.includes("Target Link4M URL:")) {
        const url = line.split("Target Link4M URL:")[1].trim();
        return `  ${c.purple}╭─[ MỤC TIÊU ]${c.reset}  ${c.cyan}${c.bright}${url}${c.reset}`;
    }
    if (line.includes("Analyzing active sponsor") || line.includes("Analyzing Link4M page mode")) {
        return `  ${c.blue}├─[ PHÂN TÍCH ]${c.reset} Đang nhận diện chiến dịch tài trợ trên Link4M...`;
    }
    if (line.includes("CACHE HIT") || line.includes("Instant bypass")) {
        return `  ${c.green}${c.bright}├─[ CACHE 0s ]${c.reset}  Mã đã lưu sẵn -> Bỏ qua đếm ngược!`;
    }
    if (line.includes("Headless Protocol Engine") || line.includes("impersonating Chrome")) {
        return `  ${c.cyan}├─[ ENGINE ]${c.reset}    Headless Protocol (curl_cffi + micro-worker)`;
    }
    if (line.includes("Micro-Worker")) {
        return `  ${c.blue}├─[ WORKER ]${c.reset}    Chrome headless, chặn ảnh/font, RAM thấp`;
    }
    if (line.includes("Found sponsor SERP image:")) {
        return `  ${c.blue}├─[ OCR VISION ]${c.reset} Tìm thấy ảnh nhiệm vụ -> Đang đọc domain tài trợ...`;
    }
    if (line.includes("TARGET SPONSOR WEBSITE") || line.includes("Extracted sponsor domain:")) {
        const d = line.split("EXTRACTED SPONSOR DOMAIN:")[1] || line.split("THIS MISSION:")[1] || line;
        return `  ${c.green}├─[ WEB TÀI TRỢ ]${c.reset} ${c.yellow}${c.bright}${d.trim()}${c.reset}`;
    }
    if (line.includes("Tab 2: Opening Google.com")) {
        return `  ${c.blue}├─[ ĐIỀU HƯỚNG ]${c.reset} Mở web tài trợ thông qua Referrer hợp lệ...`;
    }
    if (line.includes("Detected traffic_key:")) {
        const k = line.split("Detected traffic_key:")[1].trim();
        return `  ${c.purple}├─[ CAMPAIGN ]${c.reset}   Traffic Key: ${c.white}${k}${c.reset}`;
    }
    if (line.includes("EXECUTING STEP")) {
        const m = line.match(/STEP\s+(\d+)/i);
        const stepNum = m ? m[1] : "1";
        return `  ${c.orange}├─[ TIẾN TRÌNH ]${c.reset} ${c.bright}Đang thực hiện Bước ${stepNum}...${c.reset}`;
    }
    if (line.includes("Navigating to Step")) {
        return `  ${c.dim}│  ↳ Đang chuyển tiếp sang bài viết nhiệm vụ...${c.reset}`;
    }
    if (line.includes("Button located. Clicking")) {
        return `  ${c.cyan}├─[ KÍCH HOẠT ]${c.reset}  Đã xác định nút 'LẤY MÃ' -> Click lấy mã đếm ngược!`;
    }
    if (line.includes("Detected countdown duration =")) {
        const sec = line.match(/=\s*([0-9\.]+)/);
        return `  ${c.yellow}├─[ ĐẾM NGƯỢC ]${c.reset} ${c.bright}Thời gian chờ: ${sec ? sec[1] : "60"}s${c.reset}`;
    }
    if (line.includes("Remaining:")) {
        const rem = line.match(/Remaining:\s*([0-9\.]+)s/);
        return `  ${c.dim}│  ⏱️  Thời gian còn lại: ${rem ? rem[1] : "?"}s...${c.reset}`;
    }
    if (line.includes("SUCCESS! EXTRACTED SPONSOR CODE:") || line.includes("Code acquired")) {
        const m = line.match(/CODE:\s*([a-zA-Z0-9]+)/);
        const code = m ? m[1] : "";
        return `  ${c.green}${c.bright}├─[ LẤY MÃ XONG ]${c.reset} ${c.yellow}${c.bright}Mã nhiệm vụ: ${code || "Đã thu thập"}${c.reset}`;
    }
    if (line.includes("Switching back to Tab 1")) {
        return `  ${c.blue}├─[ QUAY LẠI ]${c.reset}   Chuyển về Tab Link4M để điền mã & mở khóa...`;
    }
    if (line.includes("Solving reCAPTCHA on Tab 1")) {
        return `  ${c.pink}├─[ AI CAPTCHA ]${c.reset} ${c.bright}Đang giải Google reCAPTCHA v2 bằng Whisper AI...${c.reset}`;
    }
    if (line.includes("reCAPTCHA AI solved successfully")) {
        return `  ${c.green}├─[ AI CAPTCHA ]${c.reset} ${c.green}${c.bright}✔ Đã giải xong Captcha v2 thành công!${c.reset}`;
    }
    if (line.includes("Triggering Link4M checkPassword")) {
        return `  ${c.cyan}├─[ XÁC THỰC ]${c.reset}   Đang gửi biểu mẫu kiểm tra mã...`;
    }
    if (line.includes("FINAL DESTINATION URL:")) {
        const finalUrl = line.split("FINAL DESTINATION URL:")[1].trim();
        return `  ${c.green}${c.bright}╰─[ HOÀN TẤT ]${c.reset}   Link đích: ${c.cyan}${c.bright}${finalUrl}${c.reset}`;
    }
    if (line.includes("Warning") || line.includes("Warning:")) {
        return `  ${c.yellow}│  ⚠ ${line.replace(/\[\!\]\s*/, "")}${c.reset}`;
    }

    // Default neat line
    return `  ${c.dim}│  ${line.replace(/^\[\*\]\s*/, "")}${c.reset}`;
}

function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(question, (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
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

        const PYD_FILE = path.join(ROOT_DIR, "src", "core", "bypass.pyd");
        const enginePath = fs.existsSync(HEADLESS_PATH)
            ? HEADLESS_PATH
            : (fs.existsSync(SCRIPT_PATH) ? SCRIPT_PATH : null);
        const pythonArgs = enginePath
            ? ["-u", "-X", "utf8", enginePath, targetUrl]
            : ["-u", "-X", "utf8", "-c", "import sys, os; sys.path.insert(0, os.path.abspath('src/core')); import headless_bypass as bypass; bypass.run(sys.argv[1])", targetUrl];

        const proc = spawn(getPythonPath(), pythonArgs, {
            cwd: ROOT_DIR,
            stdio: ["inherit", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                const formatted = formatLogLine(line);
                if (formatted) {
                    console.log(formatted);
                }
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

            if (code === 0 && fs.existsSync(DEST_FILE)) {
                const dest = fs.readFileSync(DEST_FILE, "utf-8").trim();
                if (dest && !dest.includes("link4m")) {
                    console.log(`  ${c.green}╭─────────────────────────────────────────────────────────────────────────────╮${c.reset}`);
                    console.log(`  ${c.green}│${c.reset}  ${c.bright}${c.white}Link đích:${c.reset} ${c.cyan}${c.bright}${dest}${c.reset}`);
                    console.log(`  ${c.green}╰─────────────────────────────────────────────────────────────────────────────╯${c.reset}\n`);
                } else {
                    console.log(`  ${c.yellow}⚠ Đã hoàn tất nhưng chưa tìm thấy link đích.${c.reset}\n`);
                }
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
        console.log(`  ${c.purple}│${c.reset}  ${c.bright}${c.white}Nhập link cần vượt (hoặc nhấn Enter để dùng link test mặc định)${c.reset}             ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}│${c.reset}  ${c.dim}Mẹo: Gõ 'q' hoặc 'exit' để đóng chương trình.${c.reset}                                 ${c.purple}│${c.reset}`);
        console.log(`  ${c.purple}╰─────────────────────────────────────────────────────────────────────────────╯${c.reset}\n`);

        const inputUrl = await ask(`  ${c.cyan}${c.bright}╭─[ 🔗 Nhập Link4M URL ]\n  ╰──➤ ${c.reset}`);

        if (inputUrl.toLowerCase() === "q" || inputUrl.toLowerCase() === "exit") {
            console.log(`\n  ${c.dim}Đã thoát chương trình.${c.reset}\n`);
            process.exit(0);
        }

        const targetUrl = inputUrl.trim() || "https://link4m.net/go/2kCcIqn";
        await runBypass(targetUrl);

        const next = await ask(`  ${c.yellow}╭─[ Nhấn Enter để vượt link tiếp theo (hoặc gõ 'q' để thoát) ]\n  ╰──➤ ${c.reset}`);
        if (next.toLowerCase() === "q" || next.toLowerCase() === "exit") {
            console.log(`\n  ${c.dim}Đã thoát chương trình.${c.reset}\n`);
            process.exit(0);
        }
    }
}

main();
