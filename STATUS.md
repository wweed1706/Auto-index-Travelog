# Trạng thái Dự án & Lộ trình 4 Tuần (STATUS)

- **Ngày bắt đầu:** 24/10/2026
- **Hạn chót nộp báo cáo:** 21/11/2026 (4 tuần)
- **Người thực hiện trên nhánh này:** Thành viên 1 (Mobile Application & UX/UI)

## Tiến độ tổng thể 4 Tuần
- [ ] **Tuần 1 (24/10 - 31/10):** Khởi tạo `apps/mobile` (Expo SDK 57), chốt kiến trúc UI, dựng khung Navigation và Mock API theo `docs/api-contract.md`.
- [ ] **Tuần 2 (01/11 - 07/11):** Xây dựng luồng chọn nhiều ảnh (Photo Picker), giữ nguyên vẹn EXIF khi upload, và màn hình theo dõi tiến trình xử lý.
- [ ] **Tuần 3 (08/11 - 14/11):** Xây dựng màn hình Timeline + Bản đồ tương tác (Interactive Map), chức năng Human-in-the-Loop (gộp, tách, đổi thứ tự điểm dừng) và màn hình Tìm kiếm ngôn ngữ tự nhiên (Semantic Search).
- [ ] **Tuần 4 (15/11 - 21/11):** Tích hợp hoàn chỉnh với FastAPI Backend thật, kiểm thử trên thiết bị Android thực tế, đo đạc số liệu Usability và hoàn thiện báo cáo.

## Danh sách Task chi tiết của Thành viên 1 (`apps/mobile`)

### Giai đoạn 1: Khởi tạo & Khung sườn (Tuần 1)
- [ ] Khởi tạo ứng dụng Expo SDK 57 với TypeScript bên trong `apps/mobile`.
- [ ] Cài đặt thư viện điều hướng và bản đồ (`react-native-maps`, `expo-image-picker`, `axios`).
- [ ] Tạo các định nghĩa kiểu dữ liệu TypeScript (`src/types/trip.ts`) khớp với `docs/api-contract.md`.
- [ ] Xây dựng bộ Mock Service (`src/services/mockApi.ts`) trả về dữ liệu mẫu của 1 chuyến đi và kết quả tìm kiếm.
- [ ] Dựng khung điều hướng cho các màn hình cốt lõi:
  - `AuthScreen` (Đăng nhập/Đăng ký cơ bản)
  - `TripListScreen` (Danh sách chuyến đi)
  - `UploadProgressScreen` (Chọn ảnh hàng loạt & Tiến trình xử lý)
  - `TripTimelineMapScreen` (Màn hình chính: Bản đồ + Dòng thời gian theo ngày/điểm dừng)
  - `SemanticSearchScreen` (Tìm kiếm ảnh bằng ngôn ngữ tự nhiên + Bộ lọc)

### Giai đoạn 2: Luồng Tải ảnh & Tiến trình (Tuần 2)
- [ ] Cho phép chọn 100+ ảnh từ thư viện thiết bị và giữ nguyên EXIF/GPS gốc.
- [ ] Hiển thị thanh trạng thái xử lý của Auto-Indexing Engine từ Backend.

### Giai đoạn 3: Hai Trụ cột Cốt lõi (Tuần 3)
- [ ] Hiển thị danh sách điểm dừng theo từng ngày trên Timeline đồng bộ với các điểm Marker trên Bản đồ.
- [ ] Vẽ đường nối thứ tự thời gian giữa các điểm dừng trên bản đồ.
- [ ] Giao diện Human-in-the-Loop: Gộp (Merge) 2 sự kiện/điểm dừng, Tách (Split) sự kiện, hoặc đổi thứ tự/di chuyển ảnh giữa các điểm dừng.
- [ ] Giao diện Tìm kiếm tự nhiên: Nhập câu truy vấn (VD: "ảnh chụp ở bãi biển vào buổi chiều"), kết hợp bộ lọc ngày/chuyến đi và hiển thị kết quả ảnh kèm điểm dừng liên quan.