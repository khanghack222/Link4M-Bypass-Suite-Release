import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r'C:\Users\XUAN\.gemini\antigravity\scratch\link4m_js\service_five888.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'get_code_string' in l:
        print(f"{i+1}: {l.strip()[:120]}")
