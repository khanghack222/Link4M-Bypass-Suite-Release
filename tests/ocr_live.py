import re
import base64
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
with open(r"C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\live_campaign.html", "r", encoding="utf-8") as f:
    html = f.read()

b64_imgs = re.findall(r'src="data:image/[^;]+;base64,([^"]+)"', html)
print(f"Found {len(b64_imgs)} base64 images")
for i, b in enumerate(b64_imgs):
    raw = base64.b64decode(b)
    res, _ = ocr(raw)
    print(f"Base64 Image {i}: {[r[1] for r in res] if res else 'empty'}")

http_imgs = re.findall(r'src="(https://img\.link4m\.net/[^"]+)"', html)
print(f"Found {len(http_imgs)} http images:")
for u in http_imgs:
    print("  URL:", u)
