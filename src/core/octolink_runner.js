/**
 * Auto Traffic Core Engine (Puppeteer-core v4.0 - Hoàn Hảo)
 * Tự động vượt Octolink -> Linkhuongdan -> Web Camp -> Lấy Token 100%
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

function getDynamicChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'chrome.exe';
}

function getDynamicPythonPath() {
  const candidates = [
    'C:\\Users\\XUAN\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs\\Python\\Python311\\python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs\\Python\\Python312\\python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs\\Python\\Python310\\python.exe'),
    'C:\\Python311\\python.exe',
    'C:\\Python312\\python.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return 'python';
}

const CHROME_PATH = getDynamicChromePath();
const PYTHON_PATH = getDynamicPythonPath();
const OCR_HELPER = path.join(__dirname, 'ocr_helper.py');

// Danh sách domain đã xác nhận 100%
const BRAND_MAP = {
  // LUCK8
  '216-2': 'tamjaibet.cc',
  'luck8': 'tamjaibet.cc',

  // H19 (bài 401 / 17937-2, 200-2, 155-2)
  '17937-2': 'memberqq.me',
  '200-2': 'memberqq.me',
  '155-2': 'memberqq.me',
  'h19': 'memberqq.me',

  // Hitclub
  '222-3': 'memberqq.me',
  '134-2': 'hitclube.cc',
  'hitclub': 'memberqq.me',

  // EX88
  '197-2': 'ex8898.com',
  'ex88': 'ex8898.com',

  // 218-3
  '218-3': 'tamjaibet.cc',

  // AO88
  '184-2': 'd55slot.vip',
  'ao88': 'd55slot.vip',

  // Kèo Nhà Cái
  '159-2': 'recsport.tv',
  '400-2': 'keonhacai.com',
  'keo nha cai': 'keonhacai.com'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm phân giải domain bằng OCR nếu chưa có trong bảng
function extractDomainFromImage(imgUrl) {
  try {
    const out = execFileSync(PYTHON_PATH, [OCR_HELPER, imgUrl], { encoding: 'utf-8', timeout: 35000 });
    const list = JSON.parse(out.trim());
    if (list && list.length > 0) {
      return list[0];
    }
  } catch (e) {
    console.error('OCR Error:', e.message);
  }
  return null;
}

// Kiểm tra xem URL có phải là URL quảng cáo rác / nhà cái không
function isAdOrSpamUrl(u, targetDomain) {
  if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
  const lower = u.toLowerCase();
  if (lower.includes('about:blank')) return false;
  if (lower.includes('octolink.vip')) return false;
  if (lower.includes('linkhuongdan.online')) return false;
  if (targetDomain && lower.includes(targetDomain.toLowerCase())) return false;

  // Danh sách từ khóa nhà cái, quảng cáo, cờ bạc, affiliate cá cược
  const adPatterns = [
    '88989888.com', '88.com', 'casino', 'nha-cai', 'nhacai',
    'affid=', 'aff_id=', 'partner', 'gamebai', 'nohu', 'banca',
    'daga', 'kubet', 'shbet', 'hi88', 'jun88', 'new88', '789bet',
    'okvip', 'f8bet', 'mb66', '789win', 'sin88', 'fb88', 'w88',
    'fun88', 'm88', 'bk8', '12bet', 'v9bet', 'k8', 'dafa', 'dafabet',
    'recsport', 'vi88', 'taiapp'
  ];
  return adPatterns.some(p => lower.includes(p));
}

// Kiểm tra xem URL có phải là link đích hợp lệ (link callback thực sự, không phải octolink, không phải camp, không phải rác)
function isValidFinalDestination(u, targetDomain) {
  if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
  const lower = u.toLowerCase();
  if (lower.includes('about:blank')) return false;
  if (lower.includes('octolink.vip')) return false;
  if (lower.includes('linkhuongdan.online')) return false;
  if (lower.includes('google.com')) return false;
  if (lower.includes('example.com') || lower.includes('example.org') || lower.includes('example.net')) return false;
  if (targetDomain && lower.includes(targetDomain.toLowerCase())) return false;

  const adPatterns = [
    '88989888.com', '88.com', 'casino', 'nha-cai', 'nhacai',
    'affid=', 'aff_id=', 'partner', 'gamebai', 'nohu', 'banca',
    'daga', 'kubet', 'shbet', 'hi88', 'jun88', 'new88', '789bet',
    'okvip', 'f8bet', 'mb66', '789win', 'sin88', 'fb88', 'w88',
    'fun88', 'm88', 'bk8', '12bet', 'v9bet', 'k8', 'dafa', 'dafabet',
    'recsport', 'vi88', 'taiapp'
  ];
  if (adPatterns.some(p => lower.includes(p))) return false;
  return true;
}

async function runBypass(octolinkUrl, options = {}, onLog = console.log) {
  const isHeadless = options.headless ?? false;
  onLog(`🚀 Bắt đầu tiến trình vượt link: ${octolinkUrl}`);
  onLog(`⚙️ Chế độ trình duyệt: ${isHeadless ? 'Ẩn (Headless)' : 'Hiện cửa sổ (Window)'}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: isHeadless,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,850'
    ]
  });

  try {
    const page = (await browser.pages())[0] || await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const attachHooks = async (p) => {
      await p.evaluateOnNewDocument(() => {
        try {
          document.cookie = 'from_google=1; path=/;';
          sessionStorage.setItem('from_google', '1');
        } catch (e) {}
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        // Fake Google Referrer cho web camp, nhưng giữ Referer Web Camp khi vào octolink.vip/finish
        try {
          Object.defineProperty(document, 'referrer', {
            get: () => {
              if (window.location.hostname.includes('octolink.vip')) {
                return window.__lastCampUrl || 'https://www.google.com/';
              }
              return 'https://www.google.com/';
            },
            configurable: true
          });
        } catch (e) {}

        // Always Active & Anti-Blur / Tab Switch
        try {
          Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
          Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
          Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true });
          window.hasFocus = () => true;

          const blockedEvents = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'mouseleave'];
          blockedEvents.forEach(eventType => {
            window.addEventListener(eventType, (e) => { e.stopImmediatePropagation(); }, true);
            document.addEventListener(eventType, (e) => { e.stopImmediatePropagation(); }, true);
          });
        } catch (e) {}

        // Hook Canvas arc để bám theo vòng tròn Captcha di chuyển theo thời gian thực
        window.__targetCircle = null;
        window.__captchaSolved = false;

        try {
          if (typeof CanvasRenderingContext2D !== 'undefined') {
            const origArc = CanvasRenderingContext2D.prototype.arc;
            CanvasRenderingContext2D.prototype.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
              if (radius >= 12 && radius <= 45 && Math.abs(endAngle - startAngle) > 5) {
                const canvas = this.canvas;
                if (canvas) {
                  const rect = canvas.getBoundingClientRect();
                  const w = canvas.width || 504;
                  const h = canvas.height || 430;
                  const screenX = rect.left + (x * rect.width / w);
                  const screenY = rect.top + (y * rect.height / h);
                  window.__targetCircle = {
                    canvasX: x,
                    canvasY: y,
                    screenX: screenX,
                    screenY: screenY,
                    radius: radius,
                    time: Date.now()
                  };
                  try {
                    const evt = new MouseEvent('mousemove', {
                      bubbles: true,
                      cancelable: true,
                      clientX: screenX,
                      clientY: screenY
                    });
                    canvas.dispatchEvent(evt);
                  } catch (e) {}
                }
              }
              return origArc.apply(this, arguments);
            };
          }
        } catch (e) {}

        window.addEventListener('submit', (e) => {
          window.__captchaSolved = true;
        }, true);
      }).catch(() => {});
    };

    await attachHooks(page);

    let expectedWaitTime = 60;
    let finishUrlFromApi = null;
    let finalDestinationUrl = null;
    let targetDomain = null;

    const setupResponseListener = (p) => {
      p.on('response', async (res) => {
        const u = res.url();
        if (u.includes('octolink.vip/check/')) {
          let body = '';
          try {
            body = (await res.text()).slice(0, 500);
            const data = JSON.parse(body);
            if (data.wait && data.wait > 0) {
              expectedWaitTime = data.wait;
            }
            if (data.status === 'finish' && data.url) {
              finishUrlFromApi = data.url;
              onLog(`\n🎉 [API Finish] Tìm thấy URL hoàn tất: ${finishUrlFromApi}`);
            }
          } catch (e) {}
          onLog(`[API ${res.status()}] ${u.replace('https://octolink.vip', '')} ${body.slice(0, 280)}`);
        }

        // Bắt mọi JSON từ octolink chứa link đích cuối cùng (kể cả /links/go2)
        if (u.includes('octolink.vip') && (u.includes('/links/go') || u.includes('/links/') || u.includes('/finish/'))) {
          try {
            const body = await res.text();
            const data = JSON.parse(body);
            if (data.url && isValidFinalDestination(data.url, targetDomain)) {
              finalDestinationUrl = data.url;
              onLog(`\n🌟 [API Intercept] Bắt trúng link đích cuối cùng từ API: ${finalDestinationUrl}`);
            }
          } catch (e) {}
        }
      });
    };

    setupResponseListener(page);
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        try {
          const p = await target.page();
          if (p) {
            await attachHooks(p);
            setupResponseListener(p);
            await sleep(400);
            const u = p.url();
            if (isAdOrSpamUrl(u, targetDomain)) {
              onLog(`🛡️ [Chặn Tab Rác] Đóng tab quảng cáo/nhà cái: ${u}`);
              await p.close().catch(() => {});
            }
          }
        } catch (e) {}
      }
    });

    // ==========================================
    // BƯỚC 1: TRUY CẬP OCTOLINK.VIP
    // ==========================================
    onLog(`\n[Bước 1/3] Đang tải trang rút gọn: ${octolinkUrl}`);
    await page.goto(octolinkUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    onLog(`[Octolink] Đang chờ Gate (DeviceShield / CreepJS) xác thực thiết bị...`);
    let redirectedToGuide = false;
    const startOctoTime = Date.now();

    while (Date.now() - startOctoTime < 25000) {
      const currentUrl = page.url();
      if (currentUrl.includes('linkhuongdan.online')) {
        redirectedToGuide = true;
        break;
      }

      // Kiểm tra hết mã
      const gateDenied = await page.evaluate(() => {
        const el = document.getElementById('gate-code');
        return el ? el.innerText.trim() : null;
      }).catch(() => null);

      if (gateDenied) {
        if (gateDenied === 'NO_CAMPAIGN_LEFT' || gateDenied === 'NO_CAMPAIGN') {
          onLog(`⚠️ [Octolink] Chiến dịch này hiện đã HẾT MÃ (NO_CAMPAIGN_LEFT).`);
          await browser.close();
          return { success: false, reason: 'HET_MA' };
        }
      }

      // Tự click tiếp tục nếu có
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button, a.btn, input[type="submit"]');
        for (const b of btns) {
          const t = (b.innerText || b.value || '').toLowerCase();
          if (t.includes('continue') || t.includes('tiếp tục') || t.includes('get link')) {
            b.click();
            break;
          }
        }
      }).catch(() => {});

      await sleep(1000);
    }

    if (!redirectedToGuide && !page.url().includes('linkhuongdan.online')) {
      onLog(`❌ [Octolink] Không thể tự động chuyển trang sau 25s.`);
      await browser.close();
      return { success: false, reason: 'OCTOLINK_TIMEOUT' };
    }

    // ==========================================
    // BƯỚC 2: QUÉT TRANG LINKHUONGDAN.ONLINE
    // ==========================================
    const guideUrl = page.url();
    onLog(`\n[Bước 2/3] Đã vào trang hướng dẫn: ${guideUrl}`);

    // Lấy slug bài viết
    const slugMatch = guideUrl.match(/linkhuongdan\.online\/([^/?#]+)/);
    const slug = slugMatch ? slugMatch[1] : '';

    // Quét từ khóa
    let keyword = await page.evaluate(() => {
      const ctc = document.querySelector('[data-ctc-copy]');
      if (ctc && ctc.getAttribute('data-ctc-copy')) return ctc.getAttribute('data-ctc-copy').trim();
      const sc = document.querySelector('.ctc-shortcode');
      if (sc && sc.innerText) return sc.innerText.trim();
      return null;
    });

    onLog(`🎯 [Linkhuongdan] Mã bài viết: [${slug}] | Từ khóa: "${keyword}"`);

    // Tìm URL ảnh hướng dẫn trên trang (chọn ảnh chụp màn hình lớn nhất chứa mũi tên chỉ domain)
    const guidePhotoUrl = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src]'));
      const candidates = [];
      for (const img of imgs) {
        const src = img.src;
        if (!src || src.includes('google.png') || src.includes('step') || src.includes('gravatar') || src.includes('avatar')) continue;
        if (src.includes('/uploads/') || src.includes('photo_') || src.includes('.jpg') || src.includes('.png')) {
          const r = img.getBoundingClientRect();
          candidates.push({ src, area: (r.width || 1) * (r.height || 1), isPhoto: src.includes('photo_') });
        }
      }
      candidates.sort((a, b) => {
        if (a.isPhoto !== b.isPhoto) return b.isPhoto - a.isPhoto;
        return b.area - a.area;
      });
      return candidates[0] ? candidates[0].src : null;
    });

    // Xác định Web Camp đích
    let dbCamps = {};
    const dbPath = path.join(__dirname, '..', 'camps_database.json');
    if (fs.existsSync(dbPath)) {
      try { dbCamps = JSON.parse(fs.readFileSync(dbPath, 'utf-8')); } catch (e) {}
    }

    targetDomain = BRAND_MAP[slug] || dbCamps[slug];

    // Nếu chưa có domain từ slug, chạy OCR từ ảnh hướng dẫn (chính xác 100% của chiến dịch hiện tại)
    if (!targetDomain && guidePhotoUrl) {
      onLog(`🔎 [Linkhuongdan] Đang đọc domain từ ảnh hướng dẫn qua OCR siêu tốc...`);
      targetDomain = extractDomainFromImage(guidePhotoUrl);
      if (targetDomain) {
        onLog(`🎯 [OCR Tự Động] Đã giải mã đúng domain từ ảnh: ${targetDomain}`);
      }
    }

    // Nếu vẫn chưa có, kiểm tra keyword
    if (!targetDomain && keyword) {
      const kw = keyword.toLowerCase().trim();
      targetDomain = BRAND_MAP[kw] || dbCamps[kw];
    }

    // Nếu vẫn chưa có, quét domain trong nội dung trang linkhuongdan
    if (!targetDomain) {
      targetDomain = await page.evaluate(() => {
        const textEls = document.querySelectorAll('strong, b, mark, span, p, a, code');
        for (const el of textEls) {
          const text = (el.innerText || '').trim();
          const match = text.match(/([a-zA-Z0-9-]+\.(?:me|my|cc|vip|co|games|net|org|com|tv|in|top|site|club))/i);
          if (match) {
            const d = match[1].toLowerCase();
            if (!d.includes('linkhuongdan') && !d.includes('google') && !d.includes('octolink') && !d.includes('cloudflare') && !d.includes('schema')) {
              return d;
            }
          }
        }
        return null;
      });
      if (targetDomain) {
        onLog(`🎯 [DOM Scan] Tìm thấy domain trực tiếp trong bài hướng dẫn: ${targetDomain}`);
      }
    }

    if (!targetDomain) {
      targetDomain = 'tamjaibet.cc'; // Fallback an toàn
    }

    const targetUrl = `https://${targetDomain}/`;
    onLog(`🌐 Web Camp đích xác định: ${targetUrl}`);

    // ==========================================
    // BƯỚC 3: XỬ LÝ TRÊN WEB CAMP (MULTI-STEP HỖ TRỢ ĐẾN 4-5 BƯỚC)
    // ==========================================
    onLog(`\n[Bước 3/3] Đang truy cập Web Camp: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000, referer: 'https://www.google.com/' }).catch(() => {});
    await sleep(3000);

    // Kiểm tra xem trang có nạp script Octolink không
    onLog(`🔍 Đang kiểm tra tích hợp Octolink trên ${targetDomain}...`);
    let hasOcto = false;
    for (let c = 0; c < 6; c++) {
      hasOcto = await page.evaluate(() => {
        return !!document.querySelector('[data-q], [data-qq], #qq-countdown') ||
          Array.from(document.querySelectorAll('*')).some(el => !!el.shadowRoot) ||
          Array.from(document.querySelectorAll('script')).some(s => s.src && (s.src.includes('octolink') || s.src.includes('shortearn')));
      }).catch(() => false);
      if (hasOcto) {
        onLog(`✅ Đã phát hiện component Octolink trên trang camp!`);
        if (slug && !dbCamps[slug]) {
          dbCamps[slug] = targetDomain;
          try { fs.writeFileSync(dbPath, JSON.stringify(dbCamps, null, 2), 'utf-8'); } catch (e) {}
        }
        break;
      }
      await page.evaluate(() => window.scrollBy(0, 400));
      await sleep(800);
    }

    if (!hasOcto) {
      onLog(`⚠️ Trang camp ${targetDomain} không phát hiện mã nhiệm vụ Octolink!`);
      if (slug && dbCamps[slug] === targetDomain) {
        delete dbCamps[slug];
        try { fs.writeFileSync(dbPath, JSON.stringify(dbCamps, null, 2), 'utf-8'); } catch (e) {}
        onLog(`🗑️ Đã xóa cache domain không hợp lệ [${slug} -> ${targetDomain}]`);
      }
    }

    // Hàm bấm nút chuyên dụng: không bao giờ bấm nhầm nút nhà cái, hỗ trợ Shadow DOM 100%
    async function clickLeafButton(stepNum) {
      onLog(`🔎 Đang tìm và bấm nút [LẤY MÃ STEP ${stepNum}]...`);

      // Cuộn toàn bộ trang xuống đáy để kích hoạt lazy-load và load script Octolink
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y < h; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 40));
        }
      });
      await sleep(1000);

      for (let attempt = 1; attempt <= 20; attempt++) {
        const hit = await page.evaluate((sNum) => {
          const IGNORE_TAGS = ['STYLE', 'SCRIPT', 'NOSCRIPT', 'HEAD', 'LINK', 'META', 'SVG', 'TEMPLATE'];
          const isVisible = (el) => {
            if (!el || IGNORE_TAGS.includes(el.tagName)) return false;
            const s = window.getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0' || s.pointerEvents === 'none') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const isCountingOrWaiting = (txt) => {
            if (!txt) return false;
            const upper = txt.toUpperCase();
            return upper.includes('ĐỢI') || upper.includes('CHỜ') || upper.includes('WAIT') || /\b[0-9]{1,3}\s*S\b/i.test(upper);
          };

          const ignoredNorms = [
            'ĐĂNGNHẬP', 'DANGNHAP', 'LOGIN', 'SIGNIN',
            'ĐĂNGKÝ', 'DANGKY', 'REGISTER', 'SIGNUP',
            'NẠPTIỀN', 'NAPTIEN', 'RÚTTIỀN', 'RUTTIEN',
            'TẢIAPP', 'TAIAPP', 'CASINO', 'THỂTHAO',
            'BẮNCÁ', 'ĐÁGÀ', 'XỔSỐ', 'LIVECASINO',
            'TRÒCHƠI', 'NỔHŨ', 'GAMEBÀI', 'CSKH'
          ];

          // 1. ƯU TIÊN SỐ 1: Tìm bên trong Shadow DOM của Octolink (div[data-q].shadowRoot)
          const shadowHosts = Array.from(document.querySelectorAll('*')).filter(el => !!el.shadowRoot);
          for (const host of shadowHosts) {
            const root = host.shadowRoot;
            const octoBtns = root.querySelectorAll('.octo-capsule-container, .octo-inner-button, [class*="octo-button"], div[role="button"]');
            for (const btn of octoBtns) {
              const text = (btn.innerText || '').trim();
              if (isCountingOrWaiting(text)) continue;
              const norm = text.toUpperCase().replace(/\s+/g, '');
              let wrongStep = false;
              for (let other = 1; other <= 5; other++) {
                if (other !== sNum && (norm.includes(`STEP${other}`) || norm.includes(`BƯỚC${other}`) || norm.includes(`BUOC${other}`))) {
                  wrongStep = true;
                  break;
                }
              }
              if (wrongStep) continue;
              btn.scrollIntoView({ behavior: 'instant', block: 'center' });
              const r = btn.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) {
                return { tag: 'SHADOW_OCTO', text: text || `LẤY MÃ STEP ${sNum}`, x: r.x + r.width / 2, y: r.y + r.height / 2 };
              }
            }
          }

          // 2. Ưu tiên số 2: Container [data-q], [data-qq], [class^="q-"], #qq-countdown
          const qContainers = document.querySelectorAll('[data-q], [data-qq], [class^="q-"], #qq-countdown');
          for (const c of qContainers) {
            if (c.shadowRoot) {
              const btn = c.shadowRoot.querySelector('.octo-capsule-container, .octo-inner-button, [class*="octo-button"], div[role="button"]');
              if (btn) {
                const text = (btn.innerText || '').trim();
                if (isCountingOrWaiting(text)) continue;
                const norm = text.toUpperCase().replace(/\s+/g, '');
                let wrongStep = false;
                for (let other = 1; other <= 5; other++) {
                  if (other !== sNum && (norm.includes(`STEP${other}`) || norm.includes(`BƯỚC${other}`) || norm.includes(`BUOC${other}`))) {
                    wrongStep = true;
                    break;
                  }
                }
                if (!wrongStep) {
                  btn.scrollIntoView({ behavior: 'instant', block: 'center' });
                  const r = btn.getBoundingClientRect();
                  if (r.width > 0 && r.height > 0) {
                    return { tag: 'SHADOW_OCTO', text: text || `LẤY MÃ STEP ${sNum}`, x: r.x + r.width / 2, y: r.y + r.height / 2 };
                  }
                }
              }
            }
            const btn = c.querySelector('button, a, div[role="button"], span');
            const target = btn || c;
            if (isVisible(target)) {
              const text = (target.innerText || '').trim();
              if (isCountingOrWaiting(text)) continue;
              const norm = text.toUpperCase().replace(/\s+/g, '');
              let wrongStep = false;
              for (let other = 1; other <= 5; other++) {
                if (other !== sNum && (norm.includes(`STEP${other}`) || norm.includes(`BƯỚC${other}`) || norm.includes(`BUOC${other}`))) {
                  wrongStep = true;
                  break;
                }
              }
              if (!wrongStep) {
                target.scrollIntoView({ behavior: 'instant', block: 'center' });
                const r = target.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                  return { tag: target.tagName, text: text || 'OCTO_CONTAINER', x: r.x + r.width / 2, y: r.y + r.height / 2 };
                }
              }
            }
          }

          // 3. Fallback: Quét regular DOM (LOẠI BỎ HOÀN TOÀN MẠNG ĐỐI THỦ website-analytics.net / #1lZHIw)
          const isTarget = (norm, sn) => {
            for (let other = 1; other <= 5; other++) {
              if (other !== sn && (norm.includes(`STEP${other}`) || norm.includes(`BƯỚC${other}`) || norm.includes(`BUOC${other}`))) {
                return false;
              }
            }
            if (norm.includes(`STEP${sn}`) || norm.includes(`BƯỚC${sn}`) || norm.includes(`BUOC${sn}`)) return true;
            if (sn === 1) {
              return norm.includes('LẤYMÃ') || norm.includes('LAYMA') || norm.includes('GETCODE') || norm.includes('NHẬNMÃ') || norm.includes('NHANMA') || norm.includes('LẤYCODE') || norm.includes('LAYCODE') || norm.includes('GETLINK') || norm.includes('LẤYLINK') || norm.includes('BẤMVÀOĐÂY');
            }
            return false;
          };

          const hits = [];
          for (const el of document.querySelectorAll('button, a, input[type="button"], div[role="button"], span, p, b, strong')) {
            if (!isVisible(el)) continue;

            // Bỏ qua nếu thuộc widget mạng đối thủ website-analytics.net
            if (el.closest('[id="1lZHIw"]') || el.closest('[id*="1lZHIw"]') || (el.innerHTML && el.innerHTML.includes('website-analytics.net'))) continue;

            const t = (el.innerText || el.value || '').trim();
            if (!t || t.length > 50) continue;
            if (isCountingOrWaiting(t)) continue;

            const norm = t.toUpperCase().replace(/\s+/g, '');
            if (ignoredNorms.some(ign => norm.includes(ign))) continue;
            if (!isTarget(norm, sNum)) continue;

            const r = el.getBoundingClientRect();
            hits.push({
              tag: el.tagName,
              text: t,
              children: el.children.length,
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              area: r.width * r.height,
              el: el
            });
          }

          hits.sort((a, b) => {
            if (a.children !== b.children) return a.children - b.children;
            return a.area - b.area;
          });

          const target = hits[0] || null;
          if (target && target.el) {
            target.el.scrollIntoView({ behavior: 'instant', block: 'center' });
            const r = target.el.getBoundingClientRect();
            return { tag: target.tag, text: target.text, x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
          return null;
        }, stepNum);

        if (hit) {
          // Bấm chuột cấp phần cứng qua CDP (isTrusted = true 100%)
          try {
            await page.mouse.move(hit.x, hit.y);
            await sleep(100);
            await page.mouse.click(hit.x, hit.y, { delay: 50 });
          } catch (e) {}
          onLog(`✅ [Lần thử ${attempt}] ĐÃ BẤM TRÚNG NÚT BƯỚC ${stepNum}: <${hit.tag}> "${hit.text}" tại (${Math.round(hit.x)}, ${Math.round(hit.y)})`);

          const upperText = (hit.text || '').toUpperCase();
          if (upperText.includes('TIẾP TỤC') || upperText.includes('BẤM VÀO ĐÂY') || upperText.includes('GET LINK') || upperText.includes('LẤY LINK') || finishUrlFromApi) {
            onLog(`🚀 Đã bấm nút chuyển hướng đích, đang chờ điều hướng...`);
            await sleep(2500);
          }
          return true;
        }
        await page.evaluate(() => window.scrollBy(0, 300));
        await sleep(1000);
      }
      return false;
    }

    // Helper: Tìm liên kết nội bộ để sang bước kế tiếp
    async function getInternalLink() {
      return await page.evaluate(() => {
        const currentHost = window.location.hostname;
        const currentPath = window.location.pathname;
        const allLinks = Array.from(document.querySelectorAll('a[href]'));

        const validLinks = allLinks.filter(a => {
          try {
            const u = new URL(a.href, window.location.origin);
            return (
              u.hostname === currentHost &&
              u.pathname !== currentPath &&
              u.pathname.length > 2 &&
              !u.href.includes('#') &&
              !u.href.includes('javascript:') &&
              !u.pathname.match(/\.(jpg|jpeg|png|gif|pdf|zip|mp4)$/i) &&
              !u.pathname.includes('logout') &&
              !u.pathname.includes('cart')
            );
          } catch (e) {
            return false;
          }
        });

        if (validLinks.length === 0) return null;

        const priorityKeywords = ['ban-ca', 'casino', 'game-bai', 'no-hu', 'the-thao', 'xo-so', 'tin-tuc', 'gioi-thieu', 'gioithieu', 'about', 'news', 'blog', 'pages'];
        for (const kw of priorityKeywords) {
          const match = validLinks.find(a => a.href.toLowerCase().includes(kw));
          if (match) return match.href;
        }
        return validLinks[Math.floor(Math.random() * validLinks.length)].href;
      });
    }

    let isFinished = false;
    const MAX_STEPS = 5;

    for (let currentStep = 1; currentStep <= MAX_STEPS; currentStep++) {
      onLog(`\n--- 📍 BẮT ĐẦU BƯỚC ${currentStep} ---`);
      await clickLeafButton(currentStep);

      onLog(`⏳ Đang theo dõi tiến trình Bước ${currentStep}...`);
      let lastSecond = -1;
      let stuckSecondCount = 0;
      let failCount = 0;
      let stepDone = false;

      for (let i = 0; i < 90; i++) {
        // 0. Kiểm tra nếu trang đã chuyển hướng sang Octolink finish hoặc API đã trả finish URL
        try {
          const curU = page.url();
          if (curU.includes('octolink.vip/finish') || finishUrlFromApi) {
            onLog(`\n🎉 Phát hiện trang đã hoàn tất các bước để sang Finish: ${curU}`);
            isFinished = true;
            stepDone = true;
            break;
          }
          // Nếu trang bị nhảy sang nhà cái / web rác ngoài camp trong lúc đang làm bước:
          if (isAdOrSpamUrl(curU, targetDomain)) {
            onLog(`🛡️ [Phát hiện chuyển hướng rác] Đang bị đẩy sang ${curU}, tự động quay lại camp...`);
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
            await sleep(2000);
            continue;
          }
        } catch (e) {}

        let status = null;
        try {
          status = await page.evaluate((cStep, expWait, hasFinishUrl) => {
          const IGNORE_TAGS = ['STYLE', 'SCRIPT', 'NOSCRIPT', 'HEAD', 'LINK', 'META', 'SVG', 'TEMPLATE'];
          const isVisible = (el) => {
            if (!el || IGNORE_TAGS.includes(el.tagName)) return false;
            const s = window.getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const parseSec = (txt) => {
            if (!txt) return null;
            const m = txt.match(/([0-9]{1,3})\s*(?:giây|s\b)/i) || txt.match(/(?:chờ|wait|còn|đợi)\s*([0-9]{1,3})/i);
            if (m) {
              const v = parseInt(m[1], 10);
              if (v >= 1 && v <= 180) return v;
            }
            return null;
          };

          const finalKeywords = [
            'bấm để lấy link', 'bấm để lấy mã', 'click để lấy link',
            'lấy link ngay', 'lấy mã ngay', 'nhận link', 'nhận mã',
            'get link', 'bấm vào đây để tiếp tục', 'click vào đây để tiếp tục'
          ];
          const nextStepKeywords = [
            'click bài viết để tiếp tục',
            'click bài viết',
            'tiếp tục step',
            'kéo xuống cuối trang để tiếp tục',
            'vui lòng click vào 1 bài viết',
            'nhấp vào link bất kỳ để tiếp tục',
            'nhấp vào link bất kỳ',
            'yêu cầu bấm vào link bất kỳ',
            'bấm vào link bất kỳ',
            'click vào link bất kỳ',
            'hoàn thành bước',
            'xong bước',
            'ấn bất kì mục nào để sang bước'
          ];

          let finalBtn = null;
          let isNextStepReady = false;
          let second = null;

          const shadowHosts = Array.from(document.querySelectorAll('*')).filter(el => !!el.shadowRoot);

          // 1. Kiểm tra banner chuyển bước trong Shadow DOM
          for (const host of shadowHosts) {
            const root = host.shadowRoot;
            const banner = root.querySelector('#octo-guide-banner, .octo-guide-banner');
            if (banner) {
              const bText = (banner.innerText || '').toLowerCase();
              for (const kw of nextStepKeywords) {
                if (bText.includes(kw)) {
                  isNextStepReady = true;
                  break;
                }
              }
            }
          }

          // 2. Dò tìm giây đếm ngược trong Shadow DOM
          for (const host of shadowHosts) {
            const root = host.shadowRoot;
            const octoEls = root.querySelectorAll('.octo-capsule-container, .octo-inner-button, .octo-button-text, [class*="octo"]');
            for (const el of octoEls) {
              const text = (el.innerText || '').trim();
              const textLower = text.toLowerCase();
              const isCounting = textLower.includes('đợi') || textLower.includes('chờ') || textLower.includes('wait') || /\b[0-9]{1,3}\s*s\b/i.test(textLower);
              if (isCounting) {
                const sec = parseSec(text);
                if (sec !== null && (second === null || sec < second)) {
                  second = sec;
                }
              }
            }
          }

          // 3. CHỈ TÌM finalBtn KHI ĐÃ ĐẾN BƯỚC CUỐI (cStep >= 5) HOẶC ĐÃ CÓ URL TỪ API
          const canLookForFinal = (cStep >= 5 && second === null) || !!hasFinishUrl;
          if (canLookForFinal) {
            for (const host of shadowHosts) {
              const root = host.shadowRoot;
              const octoEls = root.querySelectorAll('.octo-capsule-container, .octo-inner-button, .octo-button-text, [class*="octo"]');
              for (const el of octoEls) {
                const text = (el.innerText || '').trim();
                const textLower = text.toLowerCase();
                const isCounting = textLower.includes('đợi') || textLower.includes('chờ') || textLower.includes('wait') || /\b[0-9]{1,3}\s*s\b/i.test(textLower);
                if (!isCounting) {
                  for (const kw of finalKeywords) {
                    if (textLower.includes(kw)) {
                      el.scrollIntoView({ behavior: 'instant', block: 'center' });
                      const r = el.getBoundingClientRect();
                      if (r.width > 0 && r.height > 0) {
                        finalBtn = { x: r.x + r.width / 2, y: r.y + r.height / 2, text: text };
                        break;
                      }
                    }
                  }
                }
                if (finalBtn) break;
              }
              if (finalBtn) break;
            }

            if (!finalBtn) {
              const octoBtns = document.querySelectorAll('.octo-inner-button, [class*="octo-button"], button, a, div[role="button"]');
              for (const el of octoBtns) {
                if (isVisible(el)) {
                  if (el.closest('[id="1lZHIw"]') || (el.innerHTML && el.innerHTML.includes('website-analytics.net'))) continue;
                  const text = (el.innerText || el.value || '').trim().toLowerCase();
                  const isCounting = text.includes('đợi') || text.includes('chờ') || text.includes('wait') || /\b[0-9]{1,3}\s*s\b/i.test(text);
                  if (!isCounting && text.length <= 40) {
                    for (const kw of finalKeywords) {
                      if (text.includes(kw)) {
                        const r = el.getBoundingClientRect();
                        finalBtn = { x: r.x + r.width / 2, y: r.y + r.height / 2, text: el.innerText.trim() };
                        break;
                      }
                    }
                  }
                }
                if (finalBtn) break;
              }
            }
          }

          // 4. Kiểm tra thông báo chuyển sang Bước kế tiếp trong regular DOM
          if (!isNextStepReady) {
            const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
            for (const kw of nextStepKeywords) {
              if (bodyText.includes(kw)) {
                isNextStepReady = true;
                break;
              }
            }
          }

          // 5. Dò tìm giây đếm ngược trong regular DOM nếu Shadow DOM chưa có
          if (second === null) {
            const octoTextEls = document.querySelectorAll('.octo-button-text, .octo-inner-button, #qq-countdown, [data-qq]');
            for (const el of octoTextEls) {
              if (isVisible(el)) {
                const sec = parseSec(el.innerText);
                if (sec !== null) {
                  second = sec;
                  break;
                }
              }
            }
          }

          return { second, isNextStepReady, finalBtn };
        }, currentStep, expectedWaitTime, !!finishUrlFromApi);
        } catch (e) {
          if (e.message.includes('Execution context was destroyed') || e.message.includes('navigation') || e.message.includes('Target closed')) {
            onLog(`\n🔄 Trang đang điều hướng sang bước tiếp theo hoặc trang đích...`);
            await sleep(2500);
            try {
              const curU = page.url();
              if (curU.includes('octolink.vip/finish') || finishUrlFromApi) {
                isFinished = true;
                stepDone = true;
                break;
              }
            } catch (e2) {}
            continue;
          }
        }

        if (!status) {
          await sleep(1000);
          continue;
        }

        // A. Nếu có nút hoàn tất (Final Button)
        if (status.finalBtn) {
          onLog(`\n🎉 ĐÃ XUẤT HIỆN NÚT CHÍNH XÁC: "${status.finalBtn.text}"! Đang nhấp...`);
          try {
            await page.mouse.click(status.finalBtn.x, status.finalBtn.y, { delay: 50 });
          } catch (e) {}
          await sleep(2500);
          isFinished = true;
          stepDone = true;
          break;
        }

        // B. Nếu đã xong bước và yêu cầu chuyển sang bước tiếp theo
        if (status.isNextStepReady || (lastSecond !== -1 && lastSecond <= 2 && status.second === null)) {
          onLog(`\n🎉 HOÀN THÀNH BƯỚC ${currentStep}! Chuẩn bị chuyển sang Bước ${currentStep + 1}...`);
          stepDone = true;
          break;
        }

        // C. Cập nhật giây đếm ngược
        if (status.second !== null) {
          if (lastSecond === -1 || status.second < lastSecond) {
            lastSecond = status.second;
            stuckSecondCount = 0;
            failCount = 0;
            process.stdout.write(`\r   ⏱️ Đếm ngược Bước ${currentStep}: ${status.second}s ...   `);
          } else if (status.second === lastSecond) {
            stuckSecondCount++;
            if (stuckSecondCount >= 8) {
              onLog(`\n⚠️ Bộ đếm chưa chạy (đang dừng ở ${lastSecond}s), đang tự động cuộn và bấm lại Bước ${currentStep}...`);
              await clickLeafButton(currentStep);
              stuckSecondCount = 0;
              lastSecond = -1;
            }
          }
        } else {
          failCount++;
          if (failCount >= 15 && lastSecond === -1) {
            onLog(`\n⚠️ Chưa thấy bộ đếm thời gian Bước ${currentStep}, đang thử cuộn và bấm lại...`);
            await clickLeafButton(currentStep);
            failCount = 0;
          }
        }

        await sleep(1000);
      }

      if (isFinished) {
        break;
      }

      if (stepDone) {
        onLog(`🔗 Đang tìm bài viết nội bộ để tiếp tục Bước ${currentStep + 1}...`);
        const nextUrl = await getInternalLink();
        if (nextUrl) {
          onLog(`➡️ Chuyển sang bài viết: ${nextUrl}`);
          await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
        } else {
          onLog(`🔄 Không tìm thấy link nội bộ, tải lại trang hiện tại...`);
          await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        await sleep(3000);
      }
    }

    // 6. Nhận kết quả cuối cùng hoặc xử lý trang finish
    onLog(`\n🏁 Đang chờ trang chuyển hướng nhận kết quả...`);
    const startFinishTime = Date.now();
    let finalUrl = page.url();

    // Kiểm tra xem đã có tab nào tự động mở trang finish chưa để tránh gọi 2 lần làm cháy token (Black-holed)
    let activePage = page;
    const initialPages = await browser.pages();
    const existingFinishPage = initialPages.find(p => p.url().includes('octolink.vip/finish'));

    if (existingFinishPage) {
      activePage = existingFinishPage;
      onLog(`🌐 Phát hiện tab Finish đã được web camp mở sẵn: ${activePage.url()}`);
    } else if (finishUrlFromApi && !page.url().includes('octolink.vip/finish')) {
      onLog(`🌐 Đang mở duy nhất 1 lần trang Finish từ API với Referer Camp: ${finishUrlFromApi}`);
      await page.goto(finishUrlFromApi, { waitUntil: 'domcontentloaded', timeout: 30000, referer: lastCampUrl }).catch(() => {});
      await sleep(1500);
    }

    while (Date.now() - startFinishTime < 120000) {
      const allPages = await browser.pages();
      for (const p of allPages) {
        const u = p.url();
        if (u.includes('octolink.vip') || isValidFinalDestination(u, targetDomain)) {
          activePage = p;
          break;
        }
      }
      finalUrl = activePage.url();

      // Kiểm tra nếu đã nhận được finalDestinationUrl qua network interceptor
      if (finalDestinationUrl && isValidFinalDestination(finalDestinationUrl, targetDomain)) {
        finalUrl = finalDestinationUrl;
        onLog(`🌟 [THÀNH CÔNG] Đã nhận link đích từ Network Interceptor: ${finalUrl}`);
        break;
      }

      // Kiểm tra nếu trang đã chuyển sang link đích ngoài octolink
      if (isValidFinalDestination(finalUrl, targetDomain)) {
        onLog(`🌟 [THÀNH CÔNG] Đã nhận diện link đích cuối cùng: ${finalUrl}`);
        break;
      }

      // Tuyệt đối không reload lại trang /finish/<token> vì đây là single-use token; reload sẽ bị Black-holed 100%!
      const hasBlackHole = await activePage.evaluate(() => {
        return document.body && (document.body.innerText.includes('black-holed') || document.body.innerText.includes('không tìm thấy trên máy chủ'));
      }).catch(() => false);

      if (hasBlackHole) {
        onLog(`⚠️ Phát hiện thông báo Black-holed trên tab hiện tại, đang kiểm tra các tab khác...`);
        const otherPages = await browser.pages();
        for (const op of otherPages) {
          if (op !== activePage && (op.url().includes('octolink.vip') || isValidFinalDestination(op.url(), targetDomain))) {
            activePage = op;
            break;
          }
        }
      }

      if (finalUrl.includes('octolink.vip/finish') || finalUrl.includes('octolink.vip')) {
        // Tắt cookie pop nếu có
        await activePage.evaluate(() => {
          const b = document.getElementById('got-cookie');
          if (b) b.click();
        }).catch(() => {});

        // A. XỬ LÝ HOLD CAPTCHA (DI CHUỘT BÁM THEO VÒNG TRÒN CHUYỂN ĐỘNG TRONG 1.5 GIÂY)
        await activePage.evaluate(() => {
          if (!window.__holdHookInjected && typeof CanvasRenderingContext2D !== 'undefined') {
            window.__holdHookInjected = true;
            window.__targetCircle = window.__targetCircle || null;
            const origArc = CanvasRenderingContext2D.prototype.arc;
            CanvasRenderingContext2D.prototype.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
              if (radius >= 12 && radius <= 45 && Math.abs(endAngle - startAngle) > 5) {
                const canvas = this.canvas;
                if (canvas) {
                  const rect = canvas.getBoundingClientRect();
                  const w = canvas.width || 504;
                  const h = canvas.height || 430;
                  const screenX = rect.left + (x * rect.width / w);
                  const screenY = rect.top + (y * rect.height / h);
                  window.__targetCircle = {
                    canvasX: x,
                    canvasY: y,
                    screenX: screenX,
                    screenY: screenY,
                    radius: radius,
                    time: Date.now()
                  };
                  try {
                    const evt = new MouseEvent('mousemove', {
                      bubbles: true,
                      cancelable: true,
                      clientX: screenX,
                      clientY: screenY
                    });
                    canvas.dispatchEvent(evt);
                  } catch (e) {}
                }
              }
              return origArc.apply(this, arguments);
            };
          }
        }).catch(() => {});

        // Cuộn Captcha vào giữa màn hình và kích hoạt chuyển động ban đầu
        const containerInfo = await activePage.evaluate(() => {
          const container = document.getElementById('hold_captcha_container');
          const canvas = document.querySelector('canvas') || (container && container.shadowRoot && container.shadowRoot.querySelector('canvas'));
          if (canvas) {
            canvas.scrollIntoView({ behavior: 'instant', block: 'center' });
            const rect = canvas.getBoundingClientRect();
            const w = canvas.width || 504;
            const h = canvas.height || 430;
            const initX = rect.left + (252 * rect.width / w);
            const initY = rect.top + (205 * rect.height / h);
            try {
              canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: initX, clientY: initY }));
            } catch (e) {}
            return { x: initX, y: initY };
          }
          return null;
        }).catch(() => null);

        if (containerInfo) {
          await activePage.mouse.move(containerInfo.x, containerInfo.y).catch(() => {});
        }

        // Kiểm tra xem có Hold Captcha không
        const hasCaptchaElement = await activePage.evaluate(() => {
          const container = document.getElementById('hold_captcha_container');
          const canvas = document.querySelector('canvas') || (container && container.shadowRoot && container.shadowRoot.querySelector('canvas'));
          return !!canvas ||
                 !!document.getElementById('hold_captcha_response') ||
                 !!window.__targetCircle;
        }).catch(() => false);

        if (hasCaptchaElement) {
          onLog(`🎯 [Hold Captcha] Phát hiện Captcha vòng tròn chuyển động! Bắt đầu bám sát tâm vòng tròn...`);
          const captchaStart = Date.now();
          let circleDetected = false;
          let captchaSolved = false;
          let lastLogTime = 0;

          while (Date.now() - captchaStart < 35000) {
            // Lấy tọa độ tâm vòng tròn theo thời gian thực
            const targetPos = await activePage.evaluate(() => {
              const c = window.__targetCircle;
              if (c && (Date.now() - c.time < 800)) {
                return { x: c.screenX, y: c.screenY, source: 'arc' };
              }
              const container = document.getElementById('hold_captcha_container');
              const canvas = document.querySelector('canvas') || (container && container.shadowRoot && container.shadowRoot.querySelector('canvas'));
              if (canvas) {
                const r = canvas.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, source: 'center' };
              }
              return null;
            }).catch(() => null);

            if (targetPos) {
              if (!circleDetected && targetPos.source === 'arc') {
                circleDetected = true;
                onLog(`🎯 [Hold Captcha] Đã khóa mục tiêu tâm vòng tròn, đang bám sát...`);
              }
              await activePage.mouse.move(targetPos.x, targetPos.y);
            }

            // Kiểm tra nếu captcha đã được giải
            const captchaResult = await activePage.evaluate(() => {
              const resp = document.getElementById('hold_captcha_response');
              const hasVal = resp && resp.value && resp.value.length > 5;
              return {
                done: hasVal || !!window.__captchaSolved,
                val: hasVal ? resp.value : null
              };
            }).catch(() => ({ done: false }));

            if (captchaResult.done) {
              captchaSolved = true;
              onLog(`🎉 [Hold Captcha] VƯỢT CAPTCHA THÀNH CÔNG! Token: ${captchaResult.val ? captchaResult.val.slice(0, 15) + '...' : 'OK'}`);
              await sleep(600);
              break;
            }

            if (Date.now() - lastLogTime > 4000) {
              lastLogTime = Date.now();
              const elapsed = Math.round((Date.now() - captchaStart) / 1000);
              onLog(`⏳ [Hold Captcha] Đang bám theo vòng tròn (${elapsed}s, nguồn: ${targetPos ? targetPos.source : 'none'})...`);
            }

            await sleep(25);
          }

          if (captchaSolved) {
            // B. GỬI KẾT QUẢ CAPTCHA VÀ CHỜ CHUYỂN SANG VIEW LẤY LINK
            onLog(`🚀 Captcha đã giải xong! Đang kiểm tra form và chuẩn bị nhận link đích...`);
            await activePage.evaluate(() => {
              const dv = document.getElementById('dv');
              if (dv && !dv.value) {
                dv.value = 'fp_auto_' + Math.random().toString(36).slice(2);
              }
            }).catch(() => {});

            // Chờ tối đa 12s xem trang có tự chuyển sang view Get-Link sau khi giải xong Captcha không
            let getLinkReady = false;
            for (let chk = 0; chk < 12; chk++) {
              getLinkReady = await activePage.evaluate(() => {
                return !!document.getElementById('timer') || !!document.getElementById('go-link') || !!document.querySelector('a.get-link');
              }).catch(() => false);
              if (getLinkReady) {
                onLog(`✅ Đã xuất hiện giao diện Get-Link sau khi giải Captcha!`);
                break;
              }
              await sleep(1000);
            }

            // Nếu trang chưa chuyển và token Captcha vẫn còn trong form, mới kích hoạt submit an toàn
            if (!getLinkReady) {
              const submitted = await activePage.evaluate(() => {
                const form = document.getElementById('link-view');
                const resp = document.getElementById('hold_captcha_response');
                const btn = document.getElementById('invisibleCaptchaShortlink') || (form ? form.querySelector('button, input[type="submit"]') : null);
                if (resp && resp.value && resp.value.length > 5) {
                  if (btn && typeof btn.click === 'function') {
                    btn.click();
                    return 'btn_click';
                  } else if (window.$ && form) {
                    window.$(form).submit();
                    return 'jquery_submit';
                  } else if (form) {
                    HTMLFormElement.prototype.submit.call(form);
                    return 'native_submit';
                  }
                }
                return false;
              }).catch(() => false);

              if (submitted) {
                onLog(`🚀 Đã kích hoạt gửi kết quả Captcha (${submitted}), chờ tải view Get-Link...`);
                await sleep(3000);
              }
            }

            // Kiểm tra trạng thái view Get-Link
            const viewCheck = await activePage.evaluate(() => {
              const hasTimer = !!document.getElementById('timer');
              const hasGoLink = !!document.getElementById('go-link');
              const errEl = document.querySelector('.alert-danger, .badge');
              return {
                hasTimer,
                hasGoLink,
                error: errEl ? errEl.innerText.trim() : null
              };
            }).catch(() => ({}));

            if (viewCheck.error) {
              onLog(`⚠️ Cảnh báo trên trang finish: ${viewCheck.error}`);
            }
            if (viewCheck.hasTimer || viewCheck.hasGoLink) {
              onLog(`✅ Đã sang giao diện lấy link đích (Get-Link View)!`);
            } else {
              onLog(`ℹ️ Đang tiếp tục theo dõi giao diện nhận link...`);
            }
            await sleep(1500);
          }
        }

        // C & D. XỬ LÝ TRANG GET LINK (CHỜ ĐẾM NGƯỢC TỰ NHIÊN, BẮT LINK ĐÍCH CHUẨN)
        onLog(`🎯 Đang xử lý trang nhận link đích...`);

        // Chờ đồng hồ đếm ngược (#timer) kết thúc tự nhiên để server không trả link giả (example.com)
        const timerWaitStart = Date.now();
        let timerObserved = false;
        while (Date.now() - timerWaitStart < 25000) {
          // Đảm bảo tab luôn ở trạng thái focus để đồng hồ đếm ngược chạy
          await activePage.evaluate(() => {
            window.blurred = false;
            window.onblur = null;
          }).catch(() => {});

          const sec = await activePage.evaluate(() => {
            const t = document.getElementById('timer');
            if (!t) return null;
            const val = parseInt(t.innerText.trim(), 10);
            return isNaN(val) ? 0 : val;
          }).catch(() => null);

          if (sec !== null) {
            timerObserved = true;
            if (sec <= 0) {
              onLog(`⏱️ Đồng hồ đếm ngược đã về 0!`);
              break;
            }
            onLog(`⏱️ Đang chờ đồng hồ Get-Link đếm ngược: ${sec}s...`);
          } else {
            // Chưa thấy timer, kiểm tra nếu nút Get Link đã sẵn sàng
            const readyBtn = await activePage.evaluate(() => {
              const a = document.querySelector('a.get-link:not(.disabled)');
              return !!a;
            }).catch(() => false);
            if (readyBtn) {
              onLog(`⚡ Nút Get Link đã sẵn sàng mở khóa!`);
              break;
            }
          }
          await sleep(1000);
        }
        await sleep(2000); // Đệm an toàn 2s để server xác nhận hết timer

        // Kích hoạt submit form nếu chưa tự động gửi
        await activePage.evaluate(() => {
          window.blurred = false;
          const goForm = document.getElementById('go-link');
          if (goForm) {
            goForm.classList.add('go-link');
            if (window.$) {
              window.$('#go-link.go-link').submit();
              // Dự phòng gọi trực tiếp AJAX /links/go2 nếu sau 1.5s chưa có kết quả
              setTimeout(() => {
                if (!window.__finalDestinationUrl) {
                  window.$.ajax({
                    type: 'POST',
                    url: window.$('#go-link').attr('action') || '/links/go2',
                    data: window.$('#go-link').serialize(),
                    dataType: 'json',
                    success: function(res) {
                      if (res && res.url && !res.url.includes('example.com')) {
                        window.__finalDestinationUrl = res.url;
                        window.location.href = res.url;
                      }
                    }
                  });
                }
              }, 1500);
            }
          }
        }).catch(() => {});

        const getLinkStart = Date.now();
        while (Date.now() - getLinkStart < 35000) {
          if (finalDestinationUrl && isValidFinalDestination(finalDestinationUrl, targetDomain)) {
            finalUrl = finalDestinationUrl;
            onLog(`🌟 [THÀNH CÔNG] Đã nhận link đích từ API Interceptor: ${finalUrl}`);
            break;
          }

          // Kiểm tra xem nút a.get-link đã được mở khóa (hết class disabled) với link thật chưa
          const clickedFinish = await activePage.evaluate(() => {
            if (window.__finalDestinationUrl && window.__finalDestinationUrl.startsWith('http') && !window.__finalDestinationUrl.includes('example.com')) {
              return { href: window.__finalDestinationUrl, text: 'API_INTERCEPT', x: 0, y: 0 };
            }

            const candidateSelectors = [
              'a.get-link:not(.disabled)', '#btn-main:not(.disabled)', '#getlink:not(.disabled)', '#btn-getlink:not(.disabled)',
              'a.btn-success:not(.disabled)', 'a.btn-primary:not(.disabled)', 'a.get-link'
            ];
            for (const sel of candidateSelectors) {
              for (const el of document.querySelectorAll(sel)) {
                const href = el.getAttribute('href') || el.href || '';
                const lower = href.toLowerCase();
                if (href && !lower.includes('octolink.vip') && !lower.includes('example.com') && !lower.includes('example.org') && !lower.includes('example.net') && href.startsWith('http') && !lower.includes('javascript:') && !lower.includes('#')) {
                  const r = el.getBoundingClientRect();
                  return { href, text: el.innerText || 'LINK_READY', x: r.x + r.width / 2, y: r.y + r.height / 2 };
                }
              }
            }
            return null;
          }).catch(() => null);

          if (clickedFinish && clickedFinish.href && isValidFinalDestination(clickedFinish.href, targetDomain)) {
            onLog(`🎯 [Octolink Finish] BẮT TRÚNG LINK ĐÍCH: "${clickedFinish.text}" => ${clickedFinish.href}`);
            finalUrl = clickedFinish.href;
            if (clickedFinish.x > 0 && clickedFinish.y > 0) {
              try { await activePage.mouse.click(clickedFinish.x, clickedFinish.y, { delay: 50 }); } catch (e) {}
            }
            break;
          }

          // Quét tất cả các tab
          const pages = await browser.pages();
          for (const p of pages) {
            const u = p.url();
            if (isValidFinalDestination(u, targetDomain)) {
              finalUrl = u;
              break;
            }
          }
          if (isValidFinalDestination(finalUrl, targetDomain)) break;

          await sleep(1000);
        }
        if (isValidFinalDestination(finalUrl, targetDomain)) {
          break;
        }
      } else if (isValidFinalDestination(finalUrl, targetDomain)) {
        onLog(`🌟 [THÀNH CÔNG] Đã nhận diện link đích cuối cùng ngoài Octolink: ${finalUrl}`);
        break;
      }
      await sleep(1000);
    }

    // Chờ thêm nếu URL vẫn còn dính octolink.vip hoặc chưa có link đích thực sự
    if (finalUrl.includes('octolink.vip') || !isValidFinalDestination(finalUrl, targetDomain)) {
      onLog(`⏳ Đang kiểm tra lần cuối các tab để lấy link đích ngoài Octolink...`);
      for (let w = 0; w < 12; w++) {
        if (finalDestinationUrl && isValidFinalDestination(finalDestinationUrl, targetDomain)) {
          finalUrl = finalDestinationUrl;
          break;
        }
        const pages = await browser.pages();
        for (const p of pages) {
          const u = p.url();
          if (isValidFinalDestination(u, targetDomain)) {
            finalUrl = u;
            break;
          }
        }
        if (isValidFinalDestination(finalUrl, targetDomain)) {
          break;
        }
        await sleep(1000);
      }
    }

    const isSuccess = isValidFinalDestination(finalUrl, targetDomain);
    onLog(`\n🌟 [${isSuccess ? 'THÀNH CÔNG RỰC RỠ' : 'CẢNH BÁO'}] Link đích cuối cùng: ${finalUrl}`);

    const resLine = `[${new Date().toLocaleString('vi-VN')}] INPUT: ${octolinkUrl} => RESULT: ${finalUrl}\n`;
    fs.appendFileSync(path.join(__dirname, '..', 'results.txt'), resLine, 'utf-8');

    await sleep(2000);
    await browser.close();
    return { success: isSuccess, finalUrl: finalUrl };

  } catch (err) {
    onLog(`\n❌ Lỗi trong quá trình chạy: ${err.message}`);
    try { await browser.close(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

module.exports = { runBypass };
