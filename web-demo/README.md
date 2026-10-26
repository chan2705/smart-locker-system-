# 🚀 Hướng Dẫn Up Giao Diện Lên GitHub & Bật GitHub Pages Cho Các Thầy Duyệt

Bản web này nằm tại thư mục: `d:\smart-locker-system\web-demo\`
Được thiết kế theo tiêu chuẩn **Elite UI/UX**, mô phỏng **100% đầy đủ chức năng**:
- 📱 Khung iPhone 16 Pro hiển thị đúng chuẩn **Zalo Mini App**.
- 📦 **Luồng 1 (Shipper)**: Chọn cỡ ngăn S/M/L, nhập SĐT, kích khóa xung MOSFET 400ms, tự động sinh mã PIN và bắn Zalo ZNS.
- 🏠 **Luồng 2 (Cư dân)**: Danh sách bưu kiện chờ nhận, mã PIN dự phòng, mở tủ lấy hàng ngay.
- 🧰 **Luồng 3 (Thuê đồ & eKYC)**: Định danh CCCD AI + Face Liveness Scanner, cọc VietQR Động, đối soát thẻ RFID chống tráo đồ trước khi hoàn cọc tự động.
- ⚡ **Bảng Ma trận Phần cứng & Live MQTT**: 12 ngăn tủ tương tác theo thời gian thực và mô phỏng các tình huống cạy cửa, kẹt chốt cơ khí để các thầy kiểm tra.

---

## 📌 Cách 1: Xem trực tiếp ngay trên máy tính
- Mở thư mục `d:\smart-locker-system\web-demo\`.
- Click đúp chuột vào file **`index.html`** để mở ngay trên trình duyệt (Chrome, Edge, Cốc Cốc,...).
- Mọi chức năng, âm thanh bíp và mô phỏng hoạt động trơn tru không cần cài đặt thêm bất kỳ phần mềm nào.

---

## 🌐 Cách 2: Đưa lên GitHub & Bật GitHub Pages (Gửi link cho các thầy)

### Bước 1: Mở terminal tại thư mục `web-demo`
```powershell
cd d:\smart-locker-system\web-demo
git init
git add .
git commit -m "feat: smart locker web simulation showcase for review"
```

### Bước 2: Tạo Repository trên GitHub
1. Vào [github.com/new](https://github.com/new).
2. Đặt tên repository (ví dụ: `smart-locker-demo` hoặc `smart-locker-showcase`).
3. Chọn chế độ **Public** -> Bấm **Create repository**.

### Bước 3: Đẩy code lên GitHub
Copy lệnh mà GitHub hiển thị (thay `<username>` và `<repo>` bằng tên của bạn):
```powershell
git branch -M main
git remote add origin https://github.com/<username>/smart-locker-demo.git
git push -u origin main
```

### Bước 4: Bật GitHub Pages (Để có link web trực tiếp)
1. Trên trang repo GitHub vừa tạo, vào mục **Settings** (Bánh răng trên thanh menu).
2. Ở cột menu bên trái, click vào **Pages**.
3. Tại mục **Branch**, chọn nhánh: **`main`** và thư mục: **`/(root)`** -> Bấm **Save**.
4. Chờ khoảng 1 - 2 phút, GitHub sẽ hiển thị đường link:
   👉 **`https://<username>.github.io/smart-locker-demo/`**

Chỉ cần copy đường link này gửi qua Zalo/Email cho các thầy cô, các thầy mở trên điện thoại hay laptop đều xem và trải nghiệm được ngay lập tức!
