import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://jvm.us.com/html-sitemap/', headers=headers)
print("Sitemap links:")
for l in re.findall(r'href=["\'](https://jvm\.us\.com/[^"\']+)["\']', r.text):
    if any(k in l.lower() for k in ['swan', 'ku68', 'game-bai', '15']):
        print("  ->", l)
