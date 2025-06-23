# Hệ thống Session Timeout - Hướng dẫn sử dụng

## Tổng quan
Hệ thống session timeout đã được triển khai để tự động đăng xuất người dùng sau **1 giờ không hoạt động**, giúp bảo vệ tài khoản người dùng khỏi các rủi ro bảo mật.

## Tính năng chính

### 1. Tự động hết hạn phiên làm việc
- **Thời gian hết hạn**: 1 giờ (60 phút) không hoạt động
- **Cảnh báo trước**: 5 phút trước khi hết hạn
- **Tự động đăng xuất**: Khi hết thời gian

### 2. Phát hiện hoạt động người dùng
Hệ thống theo dõi các hoạt động sau:
- Click chuột
- Di chuyển chuột
- Nhấn phím
- Cuộn trang
- Chạm màn hình (mobile)

### 3. Cảnh báo và thông báo
- **Modal cảnh báo**: Xuất hiện 5 phút trước khi hết hạn
- **Timer hiển thị**: Đếm ngược thời gian còn lại (hiển thị khi còn < 10 phút)
- **Toast thông báo**: Khi đăng xuất tự động

### 4. Đồng bộ giữa các tab
- Nếu đăng xuất ở một tab, tất cả tab khác cũng tự động đăng xuất
- Đồng bộ thời gian hoạt động giữa các tab

## Giao diện người dùng

### Session Timer
- **Vị trí**: Góc trên bên phải màn hình
- **Màu sắc**:
  - 🟢 Xanh lá: Bình thường (> 5 phút)
  - 🟡 Vàng: Cảnh báo (2-5 phút)
  - 🔴 Đỏ: Nguy hiểm (< 2 phút)
- **Animation**: Pulse khi cảnh báo, shake khi nguy hiểm

### Modal cảnh báo
Khi còn 5 phút:
- **Tiêu đề**: "Cảnh báo hết hạn phiên"
- **Nội dung**: Thông báo thời gian còn lại
- **Buttons**:
  - "Tiếp tục": Gia hạn phiên làm việc
  - "Đăng xuất": Đăng xuất ngay lập tức

## Cách hoạt động

### Khi đăng nhập
1. Session timer được khởi tạo
2. Thời gian đăng nhập được lưu vào localStorage
3. Bắt đầu theo dõi hoạt động người dùng

### Trong quá trình sử dụng
1. Mọi hoạt động của người dùng sẽ reset timer
2. Hiển thị countdown khi còn < 10 phút
3. Hiển thị modal cảnh báo khi còn 5 phút

### Khi hết hạn
1. Hiển thị thông báo lý do đăng xuất
2. Xóa toàn bộ dữ liệu đăng nhập
3. Chuyển hướng về trang chủ

## Tùy chỉnh thời gian

Để thay đổi thời gian hết hạn, chỉnh sửa file `src/utils/sessionManager.js`:

```javascript
constructor() {
    this.timeoutDuration = 60 * 60 * 1000; // 1 giờ (có thể thay đổi)
    this.warningDuration = 5 * 60 * 1000;  // Cảnh báo 5 phút trước
    // ...
}
```

## API

### Phương thức chính
- `sessionManager.onUserLogin()`: Kích hoạt khi đăng nhập
- `sessionManager.onUserLogout()`: Kích hoạt khi đăng xuất
- `sessionManager.extendSession()`: Gia hạn phiên làm việc
- `sessionManager.getRemainingTime()`: Lấy thời gian còn lại

### Sử dụng trong component
```javascript
import sessionManager from '../../utils/sessionManager';

// Khi đăng nhập thành công
sessionManager.onUserLogin();

// Khi đăng xuất
sessionManager.onUserLogout();

// Gia hạn thủ công
sessionManager.extendSession();
```

## Bảo mật

### Lưu trữ dữ liệu
- `userInfo`: Thông tin người dùng
- `token`: JWT token
- `lastActivityTime`: Thời gian hoạt động cuối
- `lastLoginTime`: Thời gian đăng nhập

### Xóa dữ liệu khi hết hạn
- Tất cả dữ liệu localStorage liên quan đến authentication được xóa
- Event listeners được remove
- Timers được clear

## Responsive Design
- **Desktop**: Timer hiển thị đầy đủ
- **Mobile**: Timer hiển thị thu gọn
- **Tablet**: Tự động điều chỉnh kích thước

## Troubleshooting

### Session không tự động hết hạn
1. Kiểm tra console có lỗi JavaScript không
2. Đảm bảo sessionManager được import đúng cách
3. Kiểm tra localStorage có dữ liệu không

### Timer không hiển thị
1. Đảm bảo người dùng đã đăng nhập
2. Kiểm tra SessionTimer component được render
3. Xem console có lỗi CSS không

### Modal cảnh báo không xuất hiện
1. Kiểm tra thời gian warning duration
2. Đảm bảo không có overlay khác che phủ
3. Kiểm tra z-index của modal

## Lưu ý
- Hệ thống hoạt động ngay cả khi người dùng không tương tác với trang
- Timer sẽ tạm dừng khi tab không active (để tiết kiệm tài nguyên)
- Tự động đồng bộ giữa nhiều tab/window 