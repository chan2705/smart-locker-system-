# HỆ THỐNG TỦ THÔNG MINH GỬI ĐỒ & CHO THUÊ ĐỒ (eKYC + VIETQR)
### Phiên Bản Bảo Mật Thương Mại (Commercial-Grade Hardened Security)

Dự án Monorepo tại `D:\smart-locker-system` đã được nâng cấp toàn diện các chuẩn bảo mật ngân hàng và vi điều khiển công nghiệp:

---

## 1. CÁC NÂNG CẤP BẢO MẬT THƯƠNG MẠI ĐÃ ĐƯỢC THIẾT LẬP

### 1. Thuật Toán QR Động Chống Tấn Công Phát Lại (Anti-Replay Attack)
- **Cơ chế Per-Device Derived Key:**
  Backend không lưu static key cho từng tủ. Khi cần kiểm tra hoặc sinh mã, Backend tính toán động:
  $$K_{\text{device}} = \text{HMAC-SHA256}(K_{\text{master}}^{256\text{-bit}}, \text{CAB\_ID})$$
  với `MASTER_SECRET_KEY` là chuỗi 64 ký tự Hex ngẫu nhiên (256-bit entropy).
- **Chuỗi băm tích hợp Nonce Counter:**
  Chuỗi dữ liệu băm gồm cả biến đếm chống phát lại:
  `payload = cab + ":" + ts + ":" + nonceCounter`
- **Nâng độ dài chữ ký lên 16 ký tự Hex (64-bit cryptographic signature):**
  So sánh chữ ký trên Backend bằng hàm `crypto.timingSafeEqual()` triệt tiêu 100% tấn công đo thời gian (Timing Attack).
- **Bộ nhớ đệm vô hiệu hóa chữ ký (Consumed Signature Invalidation with 120s TTL):**
  Ngay khi 1 mã QR được dùng để mở tủ thành công, Backend lưu `sig` đó vào danh sách đen trong 120 giây. Bất kỳ kẻ gian nào quay chụp màn hình và cố gắng quét lại trong cửa sổ 60s sẽ bị **từ chối ngay lập tức với lỗi Replay Attack Detected**.
- **Kênh ép đổi Nonce qua MQTT (Out-of-band Invalidation):**
  Ngay khi mở tủ thành công, Backend gửi lệnh MQTT `locker/{cab}/cmd` (`FORCE_ROTATE_NONCE`) ép ESP32-S3 tăng `nonceCounter++` và render lại mã QR mới trên màn hình LCD tức thì.

### 2. Bảo Vệ Khóa Phần Cứng & Chống Cậy Cửa Vật Lý (ESP32-S3 Hardening)
- **Tạo HMAC phần cứng eFuse 2 chế độ (`#define USE_HARDWARE_EFUSE_HMAC`):**
  - **Chạy thực tế (Production):** Gọi API phần cứng `esp_hmac_calculate(HMAC_KEY4, ...)` đọc khóa từ khối `EFUSE_BLOCK_KEY4` (đã bật `read_protect` ngăn chặn dump flash firmware qua cổng USB/UART).
  - **Môi trường test:** Tính toán tự động bằng `mbedtls_md_hmac` với khóa dẫn xuất của tủ.
- **Phát hiện cậy cửa vật lý (Tamper Detection Watchdog):**
  - Giám sát công tắc hành trình cửa (Limit Switch) thời gian thực.
  - Nếu cửa chuyển sang `OPENED` khi trạng thái ngăn tủ đang khóa mà **không có lệnh UNLOCK hợp lệ từ Server** (ví dụ: kẻ gian dùng xà beng nạy cửa):
    1. Lập tức kích chân còi hú báo động `BUZZER_ALARM_PIN` (GPIO 22) trong 15 giây.
    2. Bắn ngay gói tin MQTT khẩn cấp có cờ Retained lên topic `locker/{cab}/alarm`:
       `{ "event": "FORCED_ENTRY_DETECTED", "cabinet_id": "CAB_01", "box_id": x, "timestamp": ... }`
    3. Backend cập nhật trạng thái ngăn thành `TAMPERED_ALERT` và phát báo động lên Dashboard quản lý.

### 3. Chống Giả Mạo Định Danh Zalo & Fake Webhook Thanh Toán
- **Middleware Xác Thực JWT:**
  - Endpoint `/api/auth/zalo-login` xác thực danh tính người dùng và cấp `JWT Access Token` có chữ ký bảo mật (hạn dùng 24h).
  - Tất cả các API mở tủ (`/api/shipper/dropoff`, `/api/resident/pickup`, `/api/rental/create-order`) bắt buộc phải truyền Header `Authorization: Bearer <token>`. Backend bóc tách `phone` và `userId` trực tiếp từ JWT, **tuyệt đối không nhận số điện thoại truyền thô trong request body**.
- **Xác thực Chữ ký Webhook Thanh toán (`x-payos-signature`):**
  - Tại `/api/payment/deposit-webhook`, kiểm tra chữ ký HMAC-SHA256 của chuỗi thanh toán với `WEBHOOK_SECRET_KEY` bằng `crypto.timingSafeEqual()`.
  - **Idempotency Check:** Lưu trữ và kiểm tra mã giao dịch `payment_tx_id` vào bảng `processed_payments`. Ngăn chặn hoàn toàn việc nhận trùng webhook gây cộng cọc hoặc mở tủ 2 lần.

---

## 2. HƯỚNG DẪN CHẠY & KIỂM THỬ AN NINH

### Khởi động Backend & Dashboard Giả Lập
```powershell
cd D:\smart-locker-system\backend
npm run dev
```
Truy cập `http://localhost:3000` để xem Dashboard Hardware Simulator tích hợp tính năng test Replay Attack & Nút **"🚨 Thử cậy cửa"**.

### Khởi động Zalo Mini App Frontend
```powershell
cd D:\smart-locker-system\zalo-mini-app
npm run dev
```
Truy cập `http://localhost:5173` (hoặc bấm *"Mở Zalo Mini App (Deeplink 16-Hex)"* từ Dashboard `http://localhost:3000`).

---

## 3. KẾT QUẢ TEST TỰ ĐỘNG ĐÃ XÁC MINH

- [x] **Dynamic QR 16-Hex:** Sinh mã chữ ký 16 ký tự `d49f4f3fbb195ab3`, `nonce: 0` thành công.
- [x] **Xác thực JWT:** Cấp Token thành công cho Shipper/Cư dân, khóa chặt mọi route nếu thiếu Bearer Token.
- [x] **Chặn Replay Attack:** Khi dùng lại chữ ký cũ lần 2, Server trả về mã lỗi `400 Bad Request: Phát hiện tấn công phát lại (Replay Attack Detected)`.
- [x] **Báo động Cậy Cửa (Tamper Alarm):** Ngăn tủ bị nạy chuyển ngay sang `TAMPERED_ALERT`, gửi sự kiện khẩn cấp qua MQTT `locker/CAB_01/alarm` và kích còi hú.
