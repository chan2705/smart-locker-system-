// File: generate_slides.js
// Chạy lệnh: npx -y -p pptxgenjs node generate_slides.js
const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "Khuất Minh Chân - Smart Locker Architect";
pptx.title = "Kiến trúc Thuật toán & Bảo mật Hệ thống Smart Locker";

// Bảng màu kỹ thuật hiện đại (Dark Navy / Cyan / Emerald / Amber / Rose)
const C = {
    DARK: "0F172A",
    NAVY: "1E293B",
    BLUE: "0284C7",
    CYAN: "06B6D4",
    GREEN: "059669",
    AMBER: "D97706",
    RED: "DC2626",
    LIGHT: "F8FAFC",
    GRAY: "64748B",
    WHITE: "FFFFFF",
    BORDER: "CBD5E1"
};

function addHeader(slide, stepText, titleText) {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.DARK } });
    slide.addText(stepText, { x: 0.4, y: 0.1, w: 9.2, h: 0.25, fontSize: 10, bold: true, color: C.CYAN, fontFace: "Arial" });
    slide.addText(titleText, { x: 0.4, y: 0.35, w: 9.2, h: 0.4, fontSize: 18, bold: true, color: C.WHITE, fontFace: "Arial" });
}

function addBox(slide, x, y, w, h, title, desc, fillHex, borderHex = C.BORDER, textHex = C.DARK) {
    slide.addShape(pptx.ShapeType.roundRect, {
        x, y, w, h, rectRadius: 0.08,
        fill: { color: fillHex },
        line: { color: borderHex, width: 1.5 }
    });
    slide.addText([
        { text: title + "\n", options: { bold: true, fontSize: 11, color: textHex } },
        { text: desc, options: { fontSize: 9.5, color: textHex } }
    ], { x: x + 0.08, y: y + 0.06, w: w - 0.16, h: h - 0.12, valign: "middle", align: "center", fontFace: "Arial" });
}

function addArrowDown(slide, x, y, h = 0.28) {
    slide.addShape(pptx.ShapeType.downArrow, { x, y, w: 0.22, h, fill: { color: C.BLUE }, line: { color: C.BLUE } });
}

function addArrowRight(slide, x, y, w = 0.35) {
    slide.addShape(pptx.ShapeType.rightArrow, { x, y, w, h: 0.22, fill: { color: C.BLUE }, line: { color: C.BLUE } });
}

// ================= SLIDE 1: TRANG BÌA =================
let s1 = pptx.addSlide();
s1.background = { color: C.DARK };
s1.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.1, w: 0.12, h: 3.4, fill: { color: C.CYAN } });
s1.addText("TÀI LIỆU KIẾN TRÚC HỆ THỐNG & LƯU ĐỒ THUẬT TOÁN", {
    x: 0.9, y: 1.1, w: 8.5, h: 0.4, fontSize: 13, bold: true, color: C.CYAN, fontFace: "Arial"
});
s1.addText("HỆ THỐNG TỦ THÔNG MINH\nGỬI ĐỒ SIÊU TỐC & CHO THUÊ ĐỒ TỰ ĐỘNG", {
    x: 0.9, y: 1.6, w: 8.6, h: 1.4, fontSize: 28, bold: true, color: C.WHITE, fontFace: "Arial"
});
s1.addText("Tích hợp ESP32-S3 (eFuse HMAC) • Zalo Mini App • eKYC CCCD • VietQR Động • MQTTS ACL", {
    x: 0.9, y: 3.1, w: 8.6, h: 0.5, fontSize: 14, color: "94A3B8", fontFace: "Arial"
});
addBox(s1, 0.9, 3.9, 2.7, 0.95, "1. ZALO MINI APP", "Quét Dynamic QR mở ngay\nKhông cần tải ứng dụng", C.NAVY, C.CYAN, C.WHITE);
addBox(s1, 3.85, 3.9, 2.7, 0.95, "2. BACKEND & EMQX", "State Machine + Redis Lock\nWebhook VietQR & eKYC", C.NAVY, C.GREEN, C.WHITE);
addBox(s1, 6.8, 3.9, 2.7, 0.95, "3. ESP32-S3 FIRMWARE", "Khóa cứng eFuse HMAC\nXung 400ms + RFID + Báo động", C.NAVY, C.AMBER, C.WHITE);

// ================= SLIDE 2: KIẾN TRÚC TỔNG THỂ 4 TẦNG =================
let s2 = pptx.addSlide();
addHeader(s2, "PHẦN 01 // SYSTEM ARCHITECTURE", "Sơ đồ Kiến trúc Tổng thể & Luồng Giao tiếp Bảo mật 4 Tầng");
addBox(s2, 0.4, 1.3, 2.0, 3.8, "TẦNG 1: CLIENT\n(zalo-mini-app)", "• Quét QR Động tại tủ\n• Zalo SDK lấy Token SĐT\n• Chụp ảnh CCCD + Face\n• Hiển thị mã VietQR\n• Không dùng localStorage", "E0F2FE", C.BLUE);
addArrowRight(s2, 2.45, 3.0, 0.35);
addBox(s2, 2.85, 1.3, 2.1, 3.8, "TẦNG 2: CORE SERVER\n(backend + SQLite/Redis)", "• Kiểm tra chữ ký QR 64-bit\n• Xác thực Zalo Graph API\n• Kiểm tra HMAC VietQR\n• Quản lý Box State Machine\n• Lưu lịch sử giao dịch", "DCFCE7", C.GREEN);
addArrowRight(s2, 5.0, 3.0, 0.35);
addBox(s2, 5.4, 1.3, 1.85, 3.8, "TẦNG 3: IOT BROKER\n(EMQX MQTTS 8883)", "• Mã hóa đường truyền TLS\n• Bảng phân quyền ACL:\n  - Server: Publish /cmd\n  - Tủ i: Chỉ nghe CAB_i/cmd\n  - Cấm tủ phát lệnh chéo", "FEF3C7", C.AMBER);
addArrowRight(s2, 7.3, 3.0, 0.35);
addBox(s2, 7.7, 1.3, 1.9, 3.8, "TẦNG 4: EDGE MCU\n(esp32s3-firmware)", "• Khối eFuse BLOCK_KEY4\n• Vẽ QR Động bằng LVGL\n• Kích khóa 400ms (RS485)\n• Đọc Limit Switch & RFID\n• Báo động cạy cửa tức thì", "FEE2E2", C.RED);

// ================= SLIDE 3: THUẬT TOÁN 1 - QR ĐỘNG & EFUSE HMAC =================
let s3 = pptx.addSlide();
addHeader(s3, "PHẦN 02 // CRYPTOGRAPHIC FLOWCHART", "Thuật toán 1: Sinh & Xác thực Mã QR Động (Chống Chụp Lại & Chống Dump Flash)");
addBox(s3, 0.4, 1.15, 4.3, 0.78, "BƯỚC 1 (Dưới ESP32-S3): Lấy Thời gian & Nonce", "Đọc Unix Timestamp (ts) từ NTP + Biến đếm (nonce) tăng sau mỗi giao dịch", "F1F5F9", C.BLUE);
addArrowDown(s3, 2.44, 1.96, 0.25);
addBox(s3, 0.4, 2.24, 4.3, 0.85, "BƯỚC 2: Băm Phần cứng trong eFuse (BLOCK_KEY4)", "Gọi esp_hmac_calculate() với Khóa dẫn xuất riêng K_cab (đã bật read_protect)\nsig = HMAC_SHA256(K_cab, cab + ':' + ts + ':' + nonce).slice(0, 16)", "FEF3C7", C.AMBER);
addArrowDown(s3, 2.44, 3.12, 0.25);
addBox(s3, 0.4, 3.4, 4.3, 0.78, "BƯỚC 3: Render QR lên màn hình TFT (LVGL)", "URL: https://zalo.me/s/{APP_ID}/?cab=CAB_01&ts=..&nonce=..&sig=16_hex", "F1F5F9", C.BLUE);
addArrowDown(s3, 2.44, 4.21, 0.25);
addBox(s3, 0.4, 4.49, 4.3, 0.75, "BƯỚC 4: Điện thoại Quét QR -> Mở Zalo Mini App", "Mini App bóc tách (cab, ts, nonce, sig) gửi kèm JWT lên Backend Server", "E0F2FE", C.CYAN);

addArrowRight(s3, 4.8, 4.75, 0.4);

addBox(s3, 5.3, 1.15, 4.3, 1.1, "BƯỚC 5 (Trên Backend): Kiểm tra 3 Chốt An ninh", "1. Kiểm tra hạn dùng: |Now - ts| <= 60 giây?\n2. Chống Replay: sig đã tồn tại trong Redis usedSignatures chưa?\n3. Chống giả mạo: crypto.timingSafeEqual(sig, expectedHmac)?", "FEE2E2", C.RED);
addArrowDown(s3, 7.34, 2.28, 0.28);
addBox(s3, 5.3, 2.6, 4.3, 1.1, "BƯỚC 6: Khóa Chữ ký & Đổi QR Tức thì", "• Nếu sai 1 trong 3 chốt -> Từ chối thẳng (HTTP 403 Forbidden)\n• Nếu hợp lệ -> Lưu sig vào Redis (TTL 120s) đánh dấu ĐÃ DÙNG\n• Phát lệnh MQTT action: 'FORCE_ROTATE_NONCE' xuống ESP32-S3", "DCFCE7", C.GREEN);
addArrowDown(s3, 7.34, 3.73, 0.28);
addBox(s3, 5.3, 4.05, 4.3, 1.18, "BƯỚC 7: ESP32-S3 Xoay Mã QR Mới Ngay Lập Tức", "ESP32-S3 tăng nonce++ và vẽ lại mã QR mới trên màn hình ngay lập tức (không chờ hết 30s) -> Chặn đứng 100% hành vi chụp ảnh màn hình quét lại!", C.DARK, C.CYAN, C.WHITE);

// ================= SLIDE 4: THUẬT TOÁN 2 - LUỒNG SHIPPER GỬI & NHẬN ĐỒ =================
let s4 = pptx.addSlide();
addHeader(s4, "PHẦN 03 // FAST PARCEL WORKFLOW", "Thuật toán 2: Luồng Shipper Gửi Hàng & Cư Dân Nhận Hàng Siêu Tốc (< 100ms)");
addBox(s4, 0.4, 1.2, 2.8, 0.9, "1. Shipper Quét QR", "Chọn cỡ ngăn (S/M/L) + Nhập SĐT Cư dân trên Zalo Mini App", "E0F2FE", C.BLUE);
addArrowRight(s4, 3.25, 1.55, 0.3);
addBox(s4, 3.6, 1.2, 2.8, 0.9, "2. Redis Distributed Lock", "Backend khóa ngăn trống (RESERVED) chống 2 người bấm trùng 1 ngăn", "F1F5F9", C.GRAY);
addArrowRight(s4, 6.45, 1.55, 0.3);
addBox(s4, 6.8, 1.2, 2.8, 0.9, "3. Bắn Lệnh MQTT UNLOCK", "Topic: locker/{cab}/cmd\n{ box_id, action: 'UNLOCK', pulse_ms: 400 }", "FEF3C7", C.AMBER);

addArrowDown(s4, 8.1, 2.15, 0.35);

addBox(s4, 6.8, 2.55, 2.8, 1.0, "4. Kích Xung Khóa 400ms", "ESP32-S3 kích MOSFET/RS485 đúng 400ms rồi ngắt bằng Hardware Timer", "FEE2E2", C.RED);
addArrowDown(s4, 8.1, 3.6, 0.35);
addBox(s4, 6.8, 4.0, 2.8, 1.1, "5. Đọc Công tắc Hành trình", "Lọc nhiễu 50ms chân limit_switch_raw để kiểm tra cửa thực sự đã bung chưa", "F1F5F9", C.BLUE);

// Nhánh Rẽ Trái từ Bước 5
addBox(s4, 3.6, 2.55, 2.8, 1.0, "NHÁNH LỖI: Cửa Bị Kẹt", "door_state == 'CLOSED' -> Báo ACK: ERROR. Server tự động mở ngăn trống bên cạnh!", "FEE2E2", C.RED);
addBox(s4, 3.6, 4.0, 2.8, 1.1, "6. Shipper Bỏ Hàng & Đóng Cửa", "Cảm biến hồng ngoại báo item_detected: true + event: 'DOOR_CLOSED'", "DCFCE7", C.GREEN);
addBox(s4, 0.4, 4.0, 2.8, 1.1, "7. Bắn Zalo ZNS Cho Cư Dân", "Gửi thông báo Zalo kèm nút 'Mở tủ' & Mã PIN 6 số dự phòng cho Cư dân", C.DARK, C.CYAN, C.WHITE);

// ================= SLIDE 5: THUẬT TOÁN 3 - LUỒNG THUÊ ĐỒ & TRẢ ĐỒ =================
let s5 = pptx.addSlide();
addHeader(s5, "PHẦN 04 // SMART RENTAL & eKYC FLOWCHART", "Thuật toán 3: Luồng Thuê Đồ & Trả Đồ Tự Động (eKYC CCCD + Cọc VietQR + RFID)");
addBox(s5, 0.4, 1.2, 4.3, 0.9, "BƯỚC 1: Kiểm tra Định danh eKYC (Chỉ làm 1 lần đầu)", "Chụp CCCD 2 mặt + Liveness Face -> Gọi API FPT/VNPT eKYC.\nĐộ khớp khuôn mặt > 90% -> Lưu trạng thái KYC_VERIFIED.", "E0F2FE", C.BLUE);
addArrowDown(s5, 2.44, 2.15, 0.25);
addBox(s5, 0.4, 2.45, 4.3, 0.95, "BƯỚC 2: Đặt Cọc qua Mã VietQR Động", "Sinh VietQR đúng số tiền cọc của món đồ (Máy khoan / Vợt Pickleball).\nWebhook PayOS/SePay trả về -> Kiểm tra chữ ký HMAC & Tên chủ TK khớp CCCD.", "FEF3C7", C.AMBER);
addArrowDown(s5, 2.44, 3.45, 0.25);
addBox(s5, 0.4, 3.75, 4.3, 1.35, "BƯỚC 3: Mở Tủ Lấy Đồ & Bắt đầu Tính Giờ", "• Backend bắn lệnh MQTT UNLOCK -> ESP32-S3 mở chốt khóa 400ms.\n• Khi khách lấy đồ ra (item_detected: false) và đóng cửa lại:\n  Hệ thống chuyển sang trạng thái RENTING và tính thời gian thuê.", "DCFCE7", C.GREEN);

addArrowRight(s5, 4.8, 4.3, 0.4);

addBox(s5, 5.3, 1.2, 4.3, 1.15, "BƯỚC 4 (Khi Trả Đồ): Mở Ngăn & Quét Thẻ RFID", "• Khách bấm 'Trả đồ' trên Mini App -> Cửa mở -> Đặt món đồ vào ngăn & Đóng cửa.\n• ESP32-S3 kích hoạt ăng-ten đọc thẻ RFID chống bóc gắn trên thân món đồ.", "F1F5F9", C.BLUE);
addArrowDown(s5, 7.34, 2.4, 0.28);
addBox(s5, 5.3, 2.72, 4.3, 1.15, "BƯỚC 5: Gửi Gói Tin Đối Soát Vật Phẩm (LockerEvent)", "ESP32-S3 gửi MQTT: { box_id, event: 'DOOR_CLOSED', door_state: 'CLOSED', item_detected: true, rfid_uid: 'E2801160...' }", "FEF3C7", C.AMBER);
addArrowDown(s5, 7.34, 3.92, 0.28);
addBox(s5, 5.3, 4.24, 4.3, 0.88, "BƯỚC 6: Tự Động Tất Toán & Hoàn Tiền Cọc", "• Khớp đúng mã rfid_uid -> Trừ phí thuê và hoàn cọc tự động.\n• Nếu thiếu rfid_uid -> Giữ tiền cọc & cảnh báo khách đặt lại đúng đồ!", C.DARK, C.GREEN, C.WHITE);

// ================= SLIDE 6: THUẬT TOÁN 4 - STATE MACHINE DƯỚI ESP32-S3 =================
let s6 = pptx.addSlide();
addHeader(s6, "PHẦN 05 // EMBEDDED FIRMWARE PROTECTION", "Thuật toán 4: Điều khiển Khóa An toàn & Phát hiện Cạy cửa trên ESP32-S3");
addBox(s6, 0.4, 1.2, 3.0, 3.9, "1. BẢO VỆ CHỐNG CHÁY KHÓA\n(Hardware Pulse Timer)", "• Khóa Solenoid 12V/2A sẽ cháy nếu ngậm điện quá 10 giây.\n• Tuyệt đối không dùng vTaskDelay() chặn luồng.\n• Dùng esp_timer_start_once() tự động ngắt GPIO/RS485 về LOW sau đúng 400ms.\n• Hàng đợi tuần tự: Không kích 2 khóa cùng lúc tránh sụt áp.", "FEE2E2", C.RED);
addBox(s6, 3.55, 1.2, 3.0, 3.9, "2. LỌC NHIỄU CÔNG TẮC\n(50ms Software Debounce)", "• Khi đóng sập cửa sắt, tiếp điểm cơ khí bị nảy (bounce) liên tục.\n• Lấy mẫu mỗi 5ms: Chỉ khi 10 mẫu liên tiếp (50ms) giữ nguyên mức logic mới xác nhận trạng thái.\n• Mắc công tắc kiểu Thường Đóng (Closed-Loop) nằm kín trong bụng ổ khóa.", "E0F2FE", C.BLUE);
addBox(s6, 6.7, 1.2, 2.9, 3.9, "3. BẮT LỖI CẠY CỬA TỨC THÌ\n(Tamper Detection Loop)", "• Giám sát liên tục 24/7:\n  Nếu (door_state == OPENED) MÀ KHÔNG CÓ lệnh UNLOCK hợp lệ:\n• Kích còi hú Buzzer tại tủ.\n• Bắn gói MQTT khẩn cấp:\n  SecurityAlarmEvent {\n    event: 'FORCED_ENTRY_DETECTED',\n    cabinet_id, box_id\n  } về Server & Telegram!", "FEF3C7", C.AMBER);

// ================= SLIDE 7: MA TRẬN BẢO MẬT 5 LỚP =================
let s7 = pptx.addSlide();
addHeader(s7, "PHẦN 06 // DEFENSE-IN-DEPTH MATRIX", "Bảng Ma trận Bảo mật 5 Lớp (Từ Silicon Phần cứng đến Cloud Backend)");
const tableRows = [
    [
        { text: "Lớp Bảo Vệ", options: { bold: true, fill: C.DARK, color: C.WHITE } },
        { text: "Kịch Bản Tấn Công Thực Tế (Threat)", options: { bold: true, fill: C.DARK, color: C.WHITE } },
        { text: "Cơ Chế Khóa Chặt Trong Dự Án (Countermeasure)", options: { bold: true, fill: C.DARK, color: C.WHITE } }
    ],
    ["1. Silicon ESP32-S3", "Cắm cáp USB chạy esptool.py hút trộm file .bin trong Flash để lấy khóa bí mật", "Đốt khóa dẫn xuất riêng từng tủ vào EFUSE_BLOCK_KEY4 + Bật cờ read_protect & Flash Encryption"],
    ["2. Vật lý & Điện tử", "Chích súng điện 15kV vào vỏ sắt/dây công tắc; dùng nam châm lừa cảm biến cửa", "Nhốt mạch trong Hộp sắt Faraday, cách ly GND mạch khỏi vỏ tủ, đệm Opto PC817 + TVS Diode"],
    ["3. Mạng MQTT Broker", "Chiếm 1 mạch ESP32 bắn lệnh UNLOCK mở bung toàn bộ các tủ khác", "Bật MQTTS (TLS 8883) + Bảng phân quyền ACL: Cấm tuyệt đối mọi mạch ESP32发 lệnh vào topic /cmd"],
    ["4. Mã QR Động", "Chụp ảnh mã QR mang về nhà mở tủ từ xa hoặc quét lại trong 60 giây", "Chữ ký HMAC-SHA256 64-bit + Nonce dùng 1 lần trên Redis + Lệnh FORCE_ROTATE_NONCE đổi QR ngay"],
    ["5. API & Thanh toán", "Sửa gói tin giả mạo SĐT người khác; bắn Postman giả mạo Webhook nạp cọc", "Xác thực Zalo Token trực tiếp qua Zalo Graph API + Kiểm tra chữ ký HMAC Webhook VietQR"]
];
s7.addTable(tableRows, {
    x: 0.4, y: 1.15, w: 9.2, colW: [1.8, 3.4, 4.0],
    fontSize: 10, fontFace: "Arial", valign: "middle",
    border: { pt: 1, color: C.BORDER },
    rowH: 0.62
});

// ================= SLIDE 8: CƠ CHẾ FAIL-SAFE & OFFLINE =================
let s8 = pptx.addSlide();
addHeader(s8, "PHẦN 07 // FAIL-SAFE & RESILIENCE", "Cơ chế Tự Phục Hồi Khi Lỗi Cơ Khí & Vận Hành Offline Khi Mất Mạng");
addBox(s8, 0.4, 1.3, 4.4, 3.7, "KỊCH BẢN 1: KẸT CHỐT KHÓA CƠ KHÍ\n(Auto-Reassign & Auto-Refund)", "• Hiện tượng: Đã kích xung 400ms nhưng kiện hàng bên trong chèn chặt làm cánh cửa không bung ra được (door_state vẫn báo CLOSED).\n• Xử lý tự động:\n  1. ESP32-S3 thử kích lại lần 2 (Retry 1 lần với xung 500ms).\n  2. Nếu vẫn kẹt: Trả về LockerAck { status: 'TIMEOUT' }.\n  3. Backend tự động khóa ngăn đó sang ERROR_JAMMED, đồng thời MỞ NGAY NGĂN TRỐNG BÊN CẠNH cho Shipper (hoặc hoàn cọc 100% cho khách thuê).", "E0F2FE", C.BLUE);
addBox(s8, 5.2, 1.3, 4.4, 3.7, "KỊCH BẢN 2: ĐỨT CÁP WI-FI TOÀN TÒA NHÀ\n(4G Failover & Offline Backup PIN)", "• Lớp dự phòng 1 (Mạng): Tự động chuyển sang kết nối 4G LTE (Module SIM A7680C) khi mất ping Wi-Fi quá 10 giây.\n• Lớp dự phòng 2 (Hoàn toàn Offline): Trong gói lệnh gửi hàng luôn kèm backup_pin lưu vào bộ nhớ NVS của ESP32-S3 (hoặc dùng thuật toán TOTP tính từ khóa eFuse).\n• Cư dân chỉ cần bấm mã PIN 6 số trên bàn phím ma trận 4x4 của tủ để mở khóa lấy hàng ngay cả khi mất mạng hoàn toàn!", "DCFCE7", C.GREEN);

pptx.writeFile({ fileName: "Smart_Locker_Algorithm_Security.pptx" })
    .then((fileName) => console.log("✅ Đã xuất thành công file PowerPoint: " + fileName));