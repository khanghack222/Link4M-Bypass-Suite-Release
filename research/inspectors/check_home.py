import sys
sys.stdout.reconfigure(encoding="utf-8")
import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://jvm.us.com', headers=headers)
title = re.search(r'<title>(.*?)</title>', r.text, re.IGNORECASE)
print("Title of homepage:", title.group(1) if title else "None")
meta_desc = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', r.text, re.IGNORECASE)
print("Meta desc:", meta_desc.group(1) if meta_desc else "None")
