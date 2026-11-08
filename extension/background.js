/**
 * ⚡ LINK4M AUTO BYPASS PROMAX - SERVICE WORKER ⚡
 * Coordinates communication between Link4M Tab and Sponsor Tabs.
 */

let activeQuest = {
  link4mTabId: null,
  sponsorTabId: null,
  targetDomain: null,
  targetUrl: null,
  campaignId: null,
  code: null,
  status: 'IDLE', // IDLE, RUNNING_STEP1, RUNNING_STEP2, CODE_READY, SOLVING_CAPTCHA, COMPLETED
  updatedAt: Date.now()
};

// Broadcast updates to Link4M and popup
function broadcastStatus(msg) {
  if (activeQuest.link4mTabId) {
    chrome.tabs.sendMessage(activeQuest.link4mTabId, {
      type: 'STATUS_UPDATE',
      quest: activeQuest,
      detail: msg
    }).catch(() => {});
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;

  switch (request.type) {
    case 'LINK4M_STARTED': {
      activeQuest.link4mTabId = tabId;
      activeQuest.status = 'DETECTING';
      activeQuest.campaignId = request.campaignId || null;
      console.log('[Background] Link4M task initiated on tab:', tabId);
      sendResponse({ success: true, quest: activeQuest });
      break;
    }

    case 'OPEN_SPONSOR_TAB': {
      activeQuest.link4mTabId = tabId;
      activeQuest.targetDomain = request.domain;
      activeQuest.targetUrl = request.url || `https://${request.domain}`;
      activeQuest.status = 'OPENING_SPONSOR';

      console.log('[Background] Opening sponsor URL:', activeQuest.targetUrl);

      // Open sponsor site in a new tab (or focus if already exists)
      chrome.tabs.create({
        url: activeQuest.targetUrl,
        active: true
      }, (newTab) => {
        activeQuest.sponsorTabId = newTab.id;
        chrome.storage.local.set({ activeQuest });
        broadcastStatus(`Đã mở trang tài trợ: ${activeQuest.targetDomain}`);
        sendResponse({ success: true, sponsorTabId: newTab.id });
      });
      return true; // Async response
    }

    case 'SPONSOR_STEP1_PROGRESS': {
      activeQuest.status = 'SPONSOR_STEP1';
      broadcastStatus(`[Tài Trợ] ${request.text || 'Đang đếm ngược bước 1...'}`);
      sendResponse({ ok: true });
      break;
    }

    case 'SPONSOR_STEP1_COMPLETED': {
      activeQuest.status = 'SPONSOR_STEP2';
      broadcastStatus(`[Tài Trợ] Hoàn thành Bước 1! Đang chuyển sang Bước 2...`);
      sendResponse({ ok: true });
      break;
    }

    case 'SPONSOR_CODE_EXTRACTED': {
      const code = request.code;
      activeQuest.code = code;
      activeQuest.status = 'CODE_READY';
      console.log('[Background] Code extracted from sponsor:', code);

      // Focus Link4M tab to let user see code and solve captcha
      if (activeQuest.link4mTabId) {
        chrome.tabs.update(activeQuest.link4mTabId, { active: true }, () => {
          chrome.tabs.sendMessage(activeQuest.link4mTabId, {
            type: 'FILL_CODE_AND_SUBMIT',
            code: code
          }).catch(() => {});
        });
      }

      // Optionally close sponsor tab after delay
      if (activeQuest.sponsorTabId) {
        setTimeout(() => {
          chrome.tabs.remove(activeQuest.sponsorTabId).catch(() => {});
        }, 5000);
      }

      broadcastStatus(`🎉 Đã lấy mã: ${code}! Vui lòng kiểm tra tab Link4M.`);
      sendResponse({ success: true });
      break;
    }

    case 'LINK4M_WAIT_CAPTCHA': {
      activeQuest.status = 'WAITING_CAPTCHA';
      broadcastStatus('⚠️ Phát hiện Captcha! Vui lòng tích/giải Captcha trên màn hình...');
      sendResponse({ ok: true });
      break;
    }

    case 'LINK4M_COMPLETED': {
      activeQuest.status = 'COMPLETED';
      activeQuest.finalUrl = request.destinationUrl;
      broadcastStatus(`🚀 VƯỢT LINK THÀNH CÔNG! Đích: ${request.destinationUrl}`);
      sendResponse({ ok: true });
      break;
    }

    case 'GET_QUEST_STATE': {
      sendResponse({ quest: activeQuest });
      break;
    }

    case 'RESET_QUEST': {
      activeQuest = {
        link4mTabId: null,
        sponsorTabId: null,
        targetDomain: null,
        targetUrl: null,
        campaignId: null,
        code: null,
        status: 'IDLE',
        updatedAt: Date.now()
      };
      chrome.storage.local.set({ activeQuest });
      sendResponse({ success: true });
      break;
    }
  }
  return true;
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeQuest.sponsorTabId) {
    activeQuest.sponsorTabId = null;
  }
  if (tabId === activeQuest.link4mTabId) {
    activeQuest.link4mTabId = null;
  }
});
