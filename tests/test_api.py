import requests
import re
import time
import json

s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://cor.jpn.com/'
})

print("[*] Fetching service-v3.js...")
r = s.get('https://s1.what-on.com/widget/service-v3.js?key=l1DWo')
traffic_key = 'l1DWo'

m_id = re.search(r'traffic_id\s*=\s*["\']([^"\']+)["\']', r.text)
raw_id = m_id.group(1) if m_id else ''
if '\\x' in raw_id:
    traffic_id = bytes.fromhex(raw_id.replace('\\x', '')).decode()
else:
    traffic_id = raw_id

m_sess = re.search(r'var\s+[a-zA-Z0-9_]+\s*=\s*[\'"]([a-f0-9]{24})[\'"]', r.text)
sess = m_sess.group(1) if m_sess else None

print(f"[+] traffic_id: {traffic_id}")
print(f"[+] session: {sess}")

post_data = {
    'traffic_session': sess,
    'key': traffic_key,
    'client_id': 'c7b5a123-1111-4444-8888-123456789abc',
    'pathname': '/',
    'href': 'https://cor.jpn.com/',
    'hostname': 'cor.jpn.com',
    'screen': '1920 x 1080',
    'browser': 'Chrome',
    'browserVersion': '120.0.0.0',
    'browserMajorVersion': '120',
    'mobile': 'false',
    'os': 'Windows',
    'osVersion': '10',
    'cookies': 'true',
    'flashVersion': 'no check',
    'lang': 'vi-VN'
}

print("[*] Sending POST to client.js...")
r_client = s.post('https://s1.what-on.com/widget/client.js', data=post_data)
print(f"[+] client.js status: {r_client.status_code}")

params = {
    'code': traffic_id,
    'traffic_session': sess,
    'key': traffic_key,
    'screen': '1920 x 1080',
    'browser': 'Chrome',
    'browserVersion': '120.0.0.0',
    'browserMajorVersion': '120',
    'mobile': 'false',
    'os': 'Windows',
    'osVersion': '10',
    'cookies': 'true',
    'flashVersion': 'no check',
    'lang': 'vi-VN'
}

print("[*] Waiting 62s for step 1 timer...")
for i in range(1, 63):
    time.sleep(1)
    if i % 10 == 0 or i == 62:
        print(f"    Elapsed: {i}s")

r_code1 = s.get('https://s1.what-on.com/widget/get_quest_code.html', params=params)
print(f"[+] Step 1 response: {r_code1.status_code} -> {r_code1.text}")

try:
    res1 = r_code1.json()
    if res1.get('success'):
        quest_id = res1.get('id')
        print(f"[+] Got quest_id: {quest_id}")
        
        if quest_id:
            print("[*] Waiting 16s for step 2 timer...")
            for i in range(1, 17):
                time.sleep(1)
                if i % 5 == 0 or i == 16:
                    print(f"    Step 2 elapsed: {i}s")
            
            params2 = dict(params)
            params2['id'] = quest_id
            r_code2 = s.get('https://s1.what-on.com/widget/get_quest_code.html', params=params2)
            print(f"[+] Step 2 response: {r_code2.status_code} -> {r_code2.text}")
            res2 = r_code2.json()
            if res2.get('success'):
                print(f"\n🎉 FINAL CODE EXTRACTED: {res2.get('html')}")
        else:
            print(f"\n🎉 FINAL CODE EXTRACTED IN STEP 1: {res1.get('html')}")
except Exception as e:
    print(f"[!] Error: {e}")
