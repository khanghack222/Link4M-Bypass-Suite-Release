import sys
sys.stdout.reconfigure(encoding="utf-8")
import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
r = requests.get('https://jvm.us.com', headers=headers, timeout=15)
links = re.findall(r'href=["\'](https://jvm\.us\.com/[^"\']+)["\']', r.text)
print("Links on jvm.us.com:")
for l in set(links):
    print("  ->", l)
