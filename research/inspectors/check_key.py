import requests
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://jvm.us.com', headers=headers)
print("Contains G8ResWFE:", "G8ResWFE" in r.text)
r2 = requests.get('https://jvm.us.com/game-bai-ku68/', headers=headers)
print("Contains G8ResWFE in article:", "G8ResWFE" in r2.text)
