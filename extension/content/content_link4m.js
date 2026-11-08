/**
 * Zitnits Link4M Bypass Master - Content Script for Link4M Domains
 * 1. Injects inject_link4m.js to intercept final destination URLs.
 * 2. Mounts Cyber HUD overlay displaying current stage and mission status.
 * 3. Automatically retrieves the latest sponsor code from storage or clipboard and autofills the input.
 * 4. Cleans obstructive modals and ad backdrops.
 * 5. Continuously monitors captcha status (user solves captcha manually).
 * 6. AS SOON AS user completes captcha:
 *    - Automatically triggers submission / checkPassword()
 *    - Automatically clicks `.get-link`
 *    - Captures final link and auto-redirects or copies to clipboard!
 */

(function () {
  console.log("%c[Zitnits Link4M] Engine Initializing...", "color: #00f0ff; font-weight: bold;");

  // 1. Inject MAIN script
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("inject/inject_link4m.js");
    s.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.warn("[Zitnits Link4M] MAIN injection error:", e);
  }

  let hudElements = {
    codeVal: null,
    statusText: null,
    pulseDot: null
  };

  let isSubmitted = false;
  let activeCode = "";

  // 2. Mount HUD Overlay
  function mountHUD() {
    if (document.getElementById("zitnits-hud-container")) return;

    const hud = document.createElement("div");
    hud.id = "zitnits-hud-container";
    hud.innerHTML = `
      <div class="zitnits-hud-header">
        <div class="zitnits-hud-title">
          <span>⚡</span> Zitnits Bypass Master
        </div>
        <span class="zitnits-hud-badge">ACTIVE</span>
      </div>
      <div class="zitnits-hud-body">
        <div class="zitnits-hud-row">
          <span class="zitnits-label">Mã nhiệm vụ</span>
          <span class="zitnits-value" id="zitnits-hud-code">Chưa có mã</span>
        </div>
        <div class="zitnits-status-box">
          <div class="zitnits-pulse-dot" id="zitnits-hud-dot"></div>
          <span id="zitnits-hud-status">Đang tìm ô nhập mã...</span>
        </div>
      </div>
      <div class="zitnits-hud-footer">
        Bạn chỉ cần giải Captcha — Mọi thao tác còn lại tự động 100%!
      </div>
    `;

    document.body.appendChild(hud);

    hudElements.codeVal = document.getElementById("zitnits-hud-code");
    hudElements.statusText = document.getElementById("zitnits-hud-status");
    hudElements.pulseDot = document.getElementById("zitnits-hud-dot");
  }

  function updateHUD(status, code, dotState) {
    if (hudElements.statusText && status) {
      hudElements.statusText.textContent = status;
    }
    if (hudElements.codeVal && code) {
      hudElements.codeVal.textContent = code;
    }
    if (hudElements.pulseDot && dotState) {
      hudElements.pulseDot.className = "zitnits-pulse-dot " + dotState;
    }
  }

  // 3. Auto-fill mission code
  function findPasswordInputs() {
    return Array.from(document.querySelectorAll(
      'input#password-2, input#password, input[name="password"], input[type="password"], input[placeholder*="Mã"], input[placeholder*="mã"], input[placeholder*="password"]'
    ));
  }

  function fillCode(code) {
    if (!code) return false;
    activeCode = code;
    const inputs = findPasswordInputs();
    let filled = false;
    for (const inp of inputs) {
      if (inp.value !== code) {
        inp.value = code;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
      }
    }
    if (filled) {
      console.log(`[Zitnits Link4M] Auto-filled code [${code}] into input fields.`);
      updateHUD("Đã điền mã: " + code + ". Chờ giải Captcha...", code, "solving");
    }
    return filled;
  }

  // Retrieve code from background storage or clipboard
  function syncCode() {
    chrome.runtime.sendMessage({ type: "GET_LATEST_CODE" }, (res) => {
      if (res && res.code) {
        fillCode(res.code);
      }
    });

    // Check storage directly as well
    chrome.storage.local.get(["last_sponsor_code"], (data) => {
      if (data && data.last_sponsor_code) {
        fillCode(data.last_sponsor_code);
      }
    });
  }

  // 4. Captcha completion detection
  function isCaptchaSolved() {
    // 1. Google reCAPTCHA response textarea
    const recaptchaResponses = document.querySelectorAll('[name="g-recaptcha-response"]');
    for (const el of recaptchaResponses) {
      if (el.value && el.value.trim().length > 20) {
        return true;
      }
    }

    // 2. reCAPTCHA anchor aria-checked attribute
    const recaptchaAnchor = document.querySelector("#recaptcha-anchor, .recaptcha-checkbox");
    if (recaptchaAnchor && (recaptchaAnchor.getAttribute("aria-checked") === "true" || recaptchaAnchor.classList.contains("recaptcha-checkbox-checked"))) {
      return true;
    }

    // 3. Cloudflare Turnstile token
    const cfTokens = document.querySelectorAll('[name="cf-turnstile-response"]');
    for (const el of cfTokens) {
      if (el.value && el.value.trim().length > 20) {
        return true;
      }
    }

    return false;
  }

  // 5. Automated submission upon Captcha completion
  function submitStep() {
    if (isSubmitted) return;

    // Check if captcha is completed
    if (isCaptchaSolved()) {
      isSubmitted = true;
      console.log("%c[Zitnits Link4M] Captcha Solved by User! Firing Submission...", "color: #00ffaa; font-weight: bold; font-size: 14px;");
      updateHUD("Captcha xong! Đang mở khóa link...", activeCode, "ready");

      // Fill code one last time to ensure it is registered
      if (activeCode) fillCode(activeCode);

      // Trigger checkPassword if defined on window
      try {
        if (typeof window.checkPassword === "function") {
          window.checkPassword();
        }
      } catch (e) {}

      // Click submit or next buttons
      const submitButtons = [
        document.querySelector("button#submit-form"),
        document.querySelector("button.get-link"),
        document.querySelector("button[type='submit']"),
        document.querySelector("input[type='submit']"),
        document.querySelector("a.get-link"),
        document.querySelector("#btn-main")
      ];

      for (const btn of submitButtons) {
        if (btn && btn.offsetParent !== null) { // visible
          try {
            btn.click();
            console.log("[Zitnits Link4M] Clicked submission button:", btn);
          } catch (e) {}
        }
      }

      // Check for .get-link update after submission
      pollGetLinkButton();
    }
  }

  // Poll for .get-link target href
  function pollGetLinkButton() {
    let attempts = 0;
    const pollId = setInterval(() => {
      attempts++;
      const getLinkBtn = document.querySelector(".get-link, #get-link, a[href*='destination'], a[href*='redirect']");
      if (getLinkBtn) {
        const href = getLinkBtn.getAttribute("href");
        if (href && href !== "#" && !href.startsWith("javascript:") && href.startsWith("http")) {
          clearInterval(pollId);
          console.log("[Zitnits Link4M] Final Link Found on Button:", href);
          handleFinalDestination(href);
          return;
        }
        // Click it if it is clickable
        try {
          getLinkBtn.click();
        } catch (e) {}
      }

      if (attempts > 30) {
        clearInterval(pollId);
      }
    }, 500);
  }

  // Handle final destination URL
  function handleFinalDestination(destUrl) {
    updateHUD("Đã mở khóa! Đang chuyển hướng...", activeCode, "ready");
    chrome.runtime.sendMessage({
      type: "DESTINATION_UNLOCKED",
      url: destUrl,
      sourceUrl: window.location.href
    });

    setTimeout(() => {
      window.location.href = destUrl;
    }, 800);
  }

  // Listen for destination event from inject_link4m.js
  window.addEventListener("ZITNITS_DESTINATION_URL", (evt) => {
    if (evt.detail && evt.detail.url) {
      handleFinalDestination(evt.detail.url);
    }
  });

  // Remove ad overlays
  function cleanModals() {
    const overlays = document.querySelectorAll(".modal-backdrop, div[style*='z-index: 2147483640']");
    for (const ov of overlays) {
      ov.remove();
    }
    document.body.style.overflow = "auto";
  }

  // Main cycle
  function cycle() {
    cleanModals();
    syncCode();
    submitStep();
  }

  window.addEventListener("DOMContentLoaded", () => {
    mountHUD();
    syncCode();
  });

  window.addEventListener("load", () => {
    mountHUD();
    syncCode();
  });

  // Watch for storage changes (e.g., code arrived from advertiser tab in real time)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.last_sponsor_code) {
      const newCode = changes.last_sponsor_code.newValue;
      if (newCode) {
        console.log(`[Zitnits Link4M] Received new code via storage sync: [${newCode}]`);
        fillCode(newCode);
      }
    }
  });

  // Run cycle every 350ms
  setInterval(cycle, 350);
})();
