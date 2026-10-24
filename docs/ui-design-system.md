# Hệ thống Thiết kế Giao diện (UI/UX Design System) — ReTrip Mobile

Tài liệu này là quy chuẩn bắt buộc cho AI Agent khi xây dựng hoặc nâng cấp mọi màn hình trong `apps/mobile`. Mục tiêu là tạo ra giao diện hiện đại, tinh tế, mang cảm hứng từ **Polarsteps, Airbnb và Apple Photos**, tạo hiệu ứng thị giác ấn tượng ("WOW factor") khi demo trước hội đồng bảo vệ.

## 1. Bảng màu & Chủ đề (Color Palette - "Modern Wanderlust")
Thiết kế ưu tiên nền sáng sạch sẽ (Clean Light Mode) kết hợp các thẻ nổi có chiều sâu:
- **Background Primary:** `#F8FAFC` (Slate 50 - Nền tổng thể dịu mắt, không dùng trắng tinh `#FFFFFF` cho nền màn hình).
- **Surface / Card:** `#FFFFFF` (Trắng tinh khiết cho các thẻ Card, kết hợp viền mảnh `#E2E8F0` và đổ bóng mềm).
- **Primary Brand (Ocean Teal):** `#0D9488` (Teal 600) & `#14B8A6` (Teal 500) — Dùng cho nút chính, tuyến đường Polyline và điểm nhấn hành trình.
- **AI & Semantic Accent (Indigo Violet):** `#4F46E5` (Indigo 600) & `#EEF2FF` (Indigo 50) — Dùng riêng cho các thành phần AI CLIP Search, huy hiệu `Similarity Score` và thanh công cụ Human-in-the-Loop.
- **Coral Route Marker:** `#F43F5E` (Rose 500) — Dùng cho điểm dừng đang được chọn (Active Stop Marker) trên bản đồ.
- **Trạng thái dữ liệu EXIF:**
  - `GPS Verified`: Chữ `#047857`, Nền `#D1FAE5` (Emerald badge).
  - `GPS Unknown` (`latitude: null`): Chữ `#B45309`, Nền `#FEF3C7` (Amber badge).
- **Typography Colors:** Tiêu đề `#0F172A` (Slate 900), Nội dung phụ `#475569` (Slate 600), Nhãn mờ `#94A3B8` (Slate 400).

## 2. Quy chuẩn Hình khối, Bo góc & Đổ bóng (Geometry & Elevation)
- **Bo góc (Border Radius):**
  - Thẻ lớn / Khay Timeline (Bottom Sheet): `24px` - `28px`.
  - Thẻ chuyến đi / Thẻ điểm dừng (Stop Card): `18px`.
  - Ảnh thumbnail trong danh sách: `12px`.
  - Nút bấm, Chip lọc ngày, Huy hiệu (Pills/Badges): `999px` (Bo tròn hoàn toàn).
- **Đổ bóng (Soft Shadows):** Mọi thẻ Card và thanh nổi trên bản đồ phải có shadow mềm (`shadowColor: '#0F172A'`, `shadowOpacity: 0.07`, `shadowRadius: 12`, `elevation: 4`).
- **Biểu tượng (Icons):** Bắt buộc sử dụng `@expo/vector-icons` (`Ionicons` hoặc `Feather`) trên mọi nút hành động, tab điều hướng, thẻ thống kê và trạng thái. Không dùng nút chỉ có chữ đơn điệu.

## 3. Thiết kế Đặc trưng cho Từng Màn hình Cốt lõi

### 3.1. `TripListScreen` (Trang chủ Hành trình)
- **Header:** Lời chào cá nhân hóa, nút truy cập nhanh vào **AI Semantic Search** nổi bật với tông màu Indigo, và thẻ tóm tắt tổng quan (Tổng số chuyến đi, tổng số điểm dừng, tổng số ảnh đã lập chỉ mục).
- **Trip Cards:** Thiết kế dạng **Magazine Hero Card** — Ảnh bìa lớn bo góc, phủ lớp nền tối nhẹ ở đáy (dark overlay) hiển thị Tên chuyến đi, khoảng thời gian, cùng các huy hiệu nổi (Số ngày, Số điểm dừng, Số ảnh).

### 3.2. `TripTimelineMapScreen` (Trụ cột 1: Bản đồ + Dòng thời gian + Human-in-the-Loop)
- **Bản đồ tương tác (Top 42% màn hình):**
  - Sử dụng **Custom Numbered Markers** (Huy hiệu tròn đánh số `1, 2, 3...` có viền trắng và màu nổi bật) tại tọa độ `centroid` của từng điểm dừng.
  - Vẽ đường nối `Polyline` màu `#0D9488` có độ dày `4px` nối các điểm dừng theo thứ tự thời gian.
  - Có các nút điều khiển nổi (Floating Map Controls) ở góc bản đồ: Nút "Thu phóng toàn hành trình" (Fit all markers) và Huy hiệu đếm **Usability Edits Counter**.
- **Khay Dòng thời gian (Bottom 58% màn hình - Floating Sheet):**
  - Thiết kế bo tròn 2 góc trên (`borderTopLeftRadius: 28`, `borderTopRightRadius: 28`), đè nhẹ lên mép dưới của Bản đồ (`marginTop: -20`) kèm thanh nắm ngang (Grabber pill) ở giữa đỉnh khay.
  - **Thanh chọn Ngày (Day Selector Pills):** Dạng cuộn ngang (`Tất cả`, `Ngày 1 • 10/10`, `Ngày 2 • 11/10`).
  - **Bố cục Timeline Dọc (Connected Stepper):** Bên trái mỗi điểm dừng là cột mốc đánh số thứ tự nối với nhau bằng một đường kẻ dọc liên tục. Bên phải là thẻ `StopCard` hiển thị: Tên điểm dừng, khung giờ (`08:15 - 10:30`), trạng thái `Đã xác nhận / Tự động gom cụm`, dải cuộn ngang các ảnh thumbnail trong điểm dừng đó, và các nút thao tác nhanh Human-in-the-Loop (`Gộp`, `Tách`, `Đổi tên`, `Đổi thứ tự`, `Chuyển ảnh`).

### 3.3. `SemanticSearchScreen` (Trụ cột 2: Tìm kiếm CLIP bằng Ngôn ngữ tự nhiên)
- **Thanh tìm kiếm AI (Spotlight Search Bar):** Có icon lấp lánh (`sparkles`), nút xóa nhanh và các **Suggestion Chips** (Gợi ý thông minh 1 chạm như: *"hoàng hôn trên biển"*, *"món ăn địa phương"*, *"buổi chiều ở mũi đá"*).
- **Lưới kết quả (2-Column Bento Grid):**
  - Mỗi thẻ ảnh kết quả hiển thị ảnh lớn kèm **Huy hiệu độ tương đồng CLIP** ở góc trên bên phải (VD: `✨ 89% khớp` trên nền tối bán trong suốt).
  - Phần chân thẻ hiển thị tên Điểm dừng (kèm icon định vị), Ngày thứ mấy trong chuyến đi, và giờ chụp.

### 3.4. `UploadProgressScreen` (Chọn ảnh & Kiểm tra EXIF)
- **Bento Summary Grid:** Sau khi chọn ảnh từ thiết bị bằng `expo-image-picker`, hiển thị 3 ô thống kê trực quan với màu sắc rõ ràng: **Tổng số ảnh**, **Đủ tọa độ GPS (Emerald)**, và **Khuyết GPS / Unknown (Amber)**.
- **Auto-Indexing Pipeline Stepper:** Hiển thị tiến trình xử lý sinh động theo từng bước (Đọc EXIF -> Trích xuất vector CLIP -> Phân cụm Spatio-Temporal -> Hoàn tất).