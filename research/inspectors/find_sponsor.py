import requests
import re
import urllib.parse

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
r_bing = requests.get("https://www.bing.com/search?q=ku68", headers=headers)
print("Bing results for ku68:")
for u in re.findall(r'<h2><a[^>]+href="([^"]+)"', r_bing.text):
    print("  ->", u)
