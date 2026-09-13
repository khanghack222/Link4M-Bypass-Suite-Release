# ⚡ Link4M Bypass Suite — Native Release Edition

[![Release](https://img.shields.io/badge/Release-v2.4%20Native-brightgreen.svg)]()
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-lightgrey.svg)]()
[![AI](https://img.shields.io/badge/AI%20Solver-OpenAI%20Whisper-orange.svg)](https://github.com/openai/whisper)
[![Binary](https://img.shields.io/badge/Engine-C%2FC%2B%2B%20Native%20.pyd-red.svg)]()

Giải pháp tự động hóa toàn diện, hiệu năng cao phục vụ kiểm thử và vượt liên kết rút gọn **Link4M**, tích hợp trí tuệ nhân tạo nhận diện giọng nói (Whisper AI) và bộ engine bóc tách mã nhiệm vụ tài trợ native đa nền tảng.

---

## 🌟 Điểm nổi bật (Highlights)

- ⚡ **Hiệu năng Native C/C++**: Các module cốt lõi (sponsor.pyd, ecaptcha_solver, ypass.pyd, layma_runner.pyd) được biên dịch tối ưu hóa sang mã máy bằng Nuitka, tăng tốc độ xử lý và bảo vệ logic hoạt động.
- 🎯 **Dual-Network Sponsor Engine**: Tự động nhận diện và hoàn thành nhiệm vụ tài trợ trên cả 2 mạng quảng cáo phổ biến nhất hiện nay:
  - **Mạng A (what-on.com / website-analytics.net)**: Tự động xử lý tiến trình 2 bước (60 giây + 15 giây), tự động chuyển trang và bóc tách mã bảo mật.
  - **Mạng B (	raffic.com.vn / iatum)**: Xử lý đếm ngược 60 giây, tự động tương tác và bắt gói tin REST API để trích xuất mã tức thời.
- 🎙️ **Giải quyết ReCAPTCHA bằng AI (Whisper Audio Solver)**:
  - Nhận diện giọng nói chuẩn xác với mô hình OpenAI Whisper cached siêu tốc.
  - Tự động lọc bỏ các iframe ẩn rác và ưu tiên chính xác form xác thực thực tế.
- 🛡️ **Anti-Detection Stealth**:
  - Giả lập vân tay trình duyệt người dùng thật (Real Chrome Profile & Spoofed Navigator).
  - Tự động vô hiệu hóa cơ chế tạm dừng đếm ngược khi chuyển tab/thu nhỏ cửa sổ.
- 📋 **Tự động sao chép & Xuất kết quả**:
  - Tự động bắt gói tin API Link4M /links/get-link-info và lưu liên kết đích vào destination_url.txt.
  - Tự động copy trực tiếp URL đích vào Clipboard hệ thống.

---

## 🚀 Hướng dẫn Cài đặt & Sử dụng

### 1. Yêu cầu hệ thống
- Hệ điều hành: **Windows 10 / 11 (64-bit)**
- Trình duyệt: **Google Chrome** hoặc **Microsoft Edge** đã cài đặt trên máy.
- Môi trường: **Python 3.11 (64-bit)**
- Đã cài đặt **FFmpeg** (phục vụ bộ giải âm thanh AI của Whisper).

### 2. Cài đặt các gói phụ thuộc
Mở PowerShell / Command Prompt tại thư mục dự án và chạy:
`ash
pip install -r requirements.txt
playwright install chromium
`

### 3. Cách chạy chương trình

#### Cách 1: Sử dụng Menu tương tác nhanh
Chỉ cần nhấp đúp chuột vào file:
`	ext
Run_Menu.bat
`
Chọn tùy chọn chạy tự động và dán link cần mở khóa.

#### Cách 2: Chạy qua dòng lệnh (CLI)
- Chế độ có giao diện hiển thị trực quan để theo dõi:
`ash
python src/core/bypass.py "https://link4m.net/go/XXXXXX" --head
`
- Chế độ chạy ngầm tiết kiệm tài nguyên (Headless):
`ash
python src/core/bypass.py "https://link4m.net/go/XXXXXX" --headless
`

---

## 📁 Kết quả Đầu ra (Outputs)

Sau khi quá trình tự động hoàn tất:
- **destination_url.txt**: Chứa đường link đích cuối cùng.
- **extracted_code.txt**: Chứa mã xác nhận nhiệm vụ thu được từ trang tài trợ.
- **e2e_bypass.log**: Lưu chi tiết toàn bộ các bước và thời gian hoàn thành.
- **Clipboard**: Link đích được copy sẵn vào bộ nhớ tạm, bạn chỉ cần nhấn Ctrl + V để sử dụng ngay.

---

## ⚖️ Tuyên bố Miễn trừ Trách nhiệm (Disclaimer)
Dự án được xây dựng hoàn toàn với mục đích nghiên cứu học thuật, giáo dục kỹ thuật phần mềm và kiểm thử tự động hóa (QA Testing & Academic Research). Người sử dụng chịu hoàn toàn trách nhiệm đối với hành vi và mục đích sử dụng phần mềm.
