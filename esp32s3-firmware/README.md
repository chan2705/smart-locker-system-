# ESP32-S3 Smart Locker Edge Controller Firmware

Firmware chuẩn công nghiệp cho vi điều khiển **ESP32-S3 Dual-Core Xtensa LX7** điều khiển hệ thống tủ thông minh 12 ngăn.

## 1. Tính Năng Kỹ Thuật Nổi Bật

- **Anti-Remote Dynamic QR (HMAC-SHA256):** Sử dụng thư viện tăng tốc phần cứng `mbedtls` tính toán chữ ký 8 ký tự mỗi 30 giây:
  `https://zalo.me/s/smartlocker/?utm_source=zalo-qr&cab=CAB_01&ts={unix_time}&sig={hmac_8_chars}`
- **An Toàn Tuyệt Đối Chống Cháy Cuộn Khóa Solenoid:**
  - Kích xung mở đúng `400ms` bằng Non-blocking State Machine.
  - Tuyệt đối không dùng `delay()` làm nghẽn luồng mạng MQTT.
  - Cơ chế khóa nhiệt Refractory Cooldown (`1000ms`) chống kích lặp làm nóng cuộn dây.
- **Lọc Nhiễu Chống Dội Phím Công Tắc Hành Trình (DSP Debounce Filter):**
  - Bộ lọc số rời rạc `50ms` chống nhiễu cơ khí khi cửa đóng/mở.
- **Kỷ Luật Bộ Nhớ Tĩnh (Strict Embedded Memory Discipline):**
  - Không sử dụng `malloc`, `free`, `new`, `delete` hay class `String`.
  - Bộ đệm tĩnh cố định kích thước, zero rò rỉ heap (`Heap Fragmentation`).
- **Kiến Trúc Đa Nhân FreeRTOS SMP:**
  - **Core 0:** Đảm nhiệm NTP time sync, tính toán HMAC-SHA256 và hiển thị màn hình LCD TFT / LVGL.
  - **Core 1:** Đảm nhiệm kết nối MQTT (EMQX), giám sát vi giây cuộn dây Solenoid và quét công tắc hành trình.

## 2. Sơ Đồ Chân (Pinout Wiring)

| Chức năng | Chân GPIO ESP32-S3 | Ghi chú |
| :--- | :--- | :--- |
| **Solenoid Khóa 1 -> 12** | GPIO 4, 5, 6, 7, 15, 16, 17, 18, 8, 9, 10, 11 | Active HIGH qua MOSFET / Relay Opto |
| **Công Tắc Cửa 1 -> 12** | GPIO 12, 13, 14, 21, 47, 48, 45, 38, 39, 40, 41, 42 | Active LOW (INPUT_PULLUP) |
| **RFID RC522 SPI** | SS: 1, RST: 2, SCK: 19, MISO: 20, MOSI: 3 | Giao tiếp đầu đọc thẻ RFID trả đồ |

## 3. Cách Biên Dịch & Nạp Code (PlatformIO)

```bash
cd D:\smart-locker-system\esp32s3-firmware
pio run --target upload
pio device monitor -b 115200
```
