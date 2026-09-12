import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://link4m.org/go/HbsX8nh',
    'Origin': 'https://link4m.org'
}
data = {
    'alias': 'HbsX8nh',
    'codes': ''
}
r = requests.post('https://s1.link4m.app/api/campaign/get-advertise', headers=headers, data=data)
print("Status:", r.status_code)
try:
    j = r.json()
    print("Success:", j.get('success'))
    print("Keys in response:", list(j.keys()))
    html = j.get('html', '') or j.get('form', '')
    print("HTML length:", len(html))
    with open(r'C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\campaign_resp.json', 'w', encoding='utf-8') as f:
        f.write(r.text)
except Exception as e:
    print("Error:", e)
