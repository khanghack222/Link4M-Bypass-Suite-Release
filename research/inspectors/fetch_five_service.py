import requests

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://five888.ltd/'}
r = requests.get('https://s1.what-on.com/widget/service-v3.js?key=XWGXmBbB', headers=headers)
print("Status:", r.status_code)
print("Length:", len(r.text))
with open(r'C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\service_five888.js', 'w', encoding='utf-8') as f:
    f.write(r.text)
