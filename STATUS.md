# Trạng thái Dự án & Lộ trình 4 Tuần (STATUS)

- **Ngày bắt đầu:** 24/10/2026
- **Hạn chót nộp báo cáo:** 21/11/2026 (4 tuần)
- **Người thực hiện trên nhánh này:** Thành viên 1 (Mobile Application & UX/UI)

## Tiến độ tổng thể 4 Tuần
- [x] **Tuần 1 (24/10 - 31/10):** Khởi tạo `apps/mobile` (Expo SDK 57), chốt kiến trúc UI, dựng khung Navigation và Mock API theo `docs/api-contract.md`.
- [x] **Tuần 2 (01/11 - 07/11):** Xây dựng luồng chọn nhiều ảnh thật (`expo-image-picker`), kiểm tra và giữ nguyên vẹn EXIF/GPS khi upload (thống kê Bento Grid & bảo toàn `latitude: null` cho ảnh khuyết GPS), màn hình theo dõi tiến trình Auto-Indexing Stepper và tự động khởi tạo chuyến đi mới.
- [x] **Tuần 3 (08/11 - 14/11):** Refactor toàn diện UI/UX theo quy trình `ui-ux-pro-max` (`--stack react-native`), sinh tài liệu chuẩn `design-system/MASTER.md`, tách hệ thống UI Components tái sử dụng (`src/components/ui/`) và hoàn thiện 5 màn hình theo phong cách Editorial Magazine + Bento Grid / Floating Glassmorphism.
- [ ] **Tuần 4 (15/11 - 21/11):** Tích hợp hoàn chỉnh với FastAPI Backend thật, kiểm thử trên thiết bị Android thực tế, đo đạc số liệu Usability và hoàn thiện báo cáo.

## Danh sách Task chi tiết của Thành viên 1 (`apps/mobile`)

### Giai đoạn 1: Khởi tạo, Design System & UI Components (`ui-ux-pro-max`)
- [x] Khởi tạo ứng dụng Expo SDK 57 với TypeScript bên trong `apps/mobile`.
- [x] Cài đặt thư viện điều hướng, biểu tượng và bản đồ (`react-native-maps`, `expo-image-picker`, `@expo/vector-icons`, `axios`).
- [x] Khởi tạo Design System bằng `ui-ux-pro-max` (`--stack react-native`): Tạo `design-system/MASTER.md` và `src/theme/index.ts` (đạt chuẩn WCAG AA contrast, vùng chạm tối thiểu `>= 44x44pt`, thang khoảng cách 4/8dp, vector icons sắc nét không dùng emoji thô, phản hồi thị giác `Pressable` không gây nhảy bố cục).
- [x] Xây dựng bộ UI Components tái sử dụng tại `apps/mobile/src/components/ui/`:
  - `HeroTripCard` (Magazine Hero Card bo góc 24px, lớp phủ tối & metric pills)
  - `NumberedMapMarker` (Huy hiệu đánh số thứ tự điểm dừng có viền trắng & trạng thái Coral active)
  - `TimelineStopCard` (Thẻ điểm dừng gắn trục thời gian dọc liên tục Connected Vertical Stepper)
  - `HitlActionPillBar` (Thanh công cụ Human-in-the-Loop tinh gọn + Usability Edits Counter)
  - `ExifStatusBadge` (Huy hiệu phân biệt `GPS Verified` Emerald vs `GPS Unknown` Amber)
  - `SemanticPhotoCard` (Thẻ ảnh kết quả tìm kiếm CLIP dạng lưới 2 cột kèm pill `% khớp` bán trong suốt)
- [x] Refactor toàn bộ 5 màn hình cốt lõi trong `apps/mobile/src/screens/`:
  - `TripListScreen` (Editorial Magazine + Bento Overview Strip + AI Search Spotlight)
  - `TripTimelineMapScreen` (Bản đồ Numbered Markers + Floating Rounded Sheet 28px + Connected Vertical Stepper + Human-in-the-Loop)
  - `SemanticSearchScreen` (AI Spotlight Search + Suggestion Chips + 2-Column Bento Grid)
  - `UploadProgressScreen` (Chọn ảnh thật `expo-image-picker` + 3 thẻ Bento EXIF + Stepper)
  - `AuthScreen` (Tối giản, hiện đại, đồng bộ bảng màu & typography `MASTER.md`)

### Giai đoạn 2: Luồng Tải ảnh & Tiến trình (Tuần 2)
- [x] Cho phép chọn nhiều ảnh thật từ thư viện thiết bị (`allowsMultipleSelection: true, exif: true`) và giữ nguyên EXIF/GPS gốc (`null` cho ảnh khuyết GPS).
- [x] Hiển thị 3 thẻ Bento thống kê (Tổng ảnh, Có GPS hợp lệ, Khuyết GPS `unknown`), danh sách ảnh preview kèm `ExifStatusBadge` và tiến trình Auto-Indexing Pipeline Stepper.
- [x] Tự động khởi tạo chuyến đi mới sau khi hoàn tất Auto-Indexing và điều hướng trực tiếp sang màn hình Timeline + Bản đồ.

### Giai đoạn 3: Hai Trụ cột Cốt lõi (Tuần 3)
- [x] Hiển thị danh sách điểm dừng theo từng ngày trên Timeline (Floating Sheet + Connected Vertical Stepper) đồng bộ với `NumberedMapMarker` trên Bản đồ.
- [x] Vẽ đường nối `Polyline` (`#0D9488`, 4px) thể hiện thứ tự thời gian giữa các điểm dừng, tự động bay (`animateToRegion`) tới `centroid` khi chọn điểm dừng và nút thu phóng toàn tuyến.
- [x] Giao diện Human-in-the-Loop (UC-10, UC-11): Hỗ trợ đầy đủ Gộp (`MERGE`), Tách (`SPLIT` điểm dừng có >=2 ảnh), Đổi tên (`RENAME`), Đổi thứ tự (`REORDER`) và Chuyển ảnh lẻ giữa các điểm dừng (`MOVE_PHOTO`), kèm huy hiệu đếm **Usability Edits Counter**.
- [x] Giao diện Tìm kiếm tự nhiên (UC-13, UC-14): Chip gợi ý câu truy vấn tiếng Việt tự nhiên, kết hợp bộ lọc Chuyến đi/Ngày chụp và hiển thị lưới 2 cột kèm huy hiệu độ tương đồng CLIP.
