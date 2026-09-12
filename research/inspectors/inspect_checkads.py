with open(r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\service_five888.js", "r", encoding="utf-8") as f:
    text = f.read()

import re
print("checkAdsClick definition:")
m = re.search(r'function\s+checkAdsClick\s*\([^)]*\)\s*\{[\s\S]*?\}', text)
if m:
    print(m.group(0)[:500])
else:
    print("Not found as function checkAdsClick")
    for l in text.splitlines():
        if "checkAdsClick" in l:
            print("  Line:", l[:100])
