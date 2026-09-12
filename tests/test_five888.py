import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
try:
    r = requests.get('https://five888.ltd', headers=headers, timeout=15)
    print("Status:", r.status_code)
    print("Length:", len(r.text))
    for s in re.findall(r'src=["\']([^"\']+)["\']', r.text):
        if any(w in s for w in ['what-on', 'service', 'traffic', 'widget', 'analytics', 'key=']):
            print("  Script:", s)
    for b in re.findall(r'<button[^>]*>.*?</button>', r.text, re.IGNORECASE):
        print("  Button:", b)
    for d in re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', r.text):
        if any(w in d.lower() for w in ['code', 'layma', 'traffic', 'what']):
            print("  ID:", d)
except Exception as e:
    print("Error:", e)
