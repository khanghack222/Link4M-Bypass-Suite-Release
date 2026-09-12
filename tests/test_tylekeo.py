import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://tylekeongoaihanganh.com', headers=headers, timeout=15)
print("Status:", r.status_code)
scripts = re.findall(r'src=["\']([^"\']+)["\']', r.text)
for s in scripts:
    if 'what-on' in s or 'service' in s or 'traffic' in s:
        print("  Traffic script:", s)
buttons = re.findall(r'<button[^>]*>.*?</button>', r.text, re.IGNORECASE)
for b in buttons:
    if 'LẤY' in b or 'MÃ' in b or 'LAY' in b or 'MA' in b:
        print("  Button:", b)
