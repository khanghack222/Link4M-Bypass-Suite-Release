/**
 * Zitnits Link4M 1-Click Bookmarklet Loader
 * Người dùng kéo link này vào thanh Bookmark trình duyệt (Bookmarks Bar)
 * Hoặc mở Console (F12) paste vào chạy trực tiếp!
 */

javascript:(function(){
  if (window.__zitnits_bookmarklet_loaded) {
    alert("Zitnits Link4M Loader đã đang chạy!");
    return;
  }
  window.__zitnits_bookmarklet_loaded = true;
  var s = document.createElement('script');
  s.src = 'https://raw.githubusercontent.com/khanghack222/Link4M-Bypass-Suite-Release/main/web_navigator.user.js?t=' + Date.now();
  s.onload = function() { console.log("[Zitnits] Bookmarklet Loaded Successfully!"); };
  document.body.appendChild(s);
})();
