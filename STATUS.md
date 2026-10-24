# Trạng thái Dự án & Lộ trình 4 Tuần (STATUS)

- **Ngày bắt đầu:** 24/10/2026
- **Hạn chót nộp báo cáo:** 21/11/2026 (4 tuần)
- **Người thực hiện trên nhánh này:** Thành viên 1 (Mobile Application & UX/UI)

## Tiến độ tổng thể 4 Tuần
- [x] **Tuần 1 (24/10 - 31/10):** Khởi tạo `apps/mobile` (Expo SDK 57), chốt kiến trúc UI, dựng khung Navigation và Mock API theo `docs/api-contract.md`.
- [x] **Tuần 2 (01/11 - 07/11):** Xây dựng luồng chọn nhiều ảnh thật (`expo-image-picker`), kiểm tra và giữ nguyên vẹn EXIF/GPS khi upload (thống kê Bento Grid & bảo toàn `latitude: null` cho ảnh khuyết GPS), màn hình theo dõi tiến trình Auto-Indexing Stepper và tự động khởi tạo chuyến đi mới.
- [x] **Tuần 3 (08/11 - 14/11):** Nâng cấp toàn diện UI/UX theo Design System "Modern Wanderlust" (`docs/ui-design-system.md`), hoàn thiện màn hình Timeline + Bản đồ tương tác (`react-native-maps`, Custom Numbered Markers, Polyline, `animateToRegion`, Fit All Markers), thanh công cụ Human-in-the-Loop đầy đủ (`MERGE`, `SPLIT`, `RENAME`, `REORDER`, `MOVE_PHOTO` kèm bộ đếm Usability Edits Counter) và màn hình Tìm kiếm ngôn ngữ tự nhiên CLIP dạng lưới 2 cột (2-Column Bento Grid).
- [ ] **Tuần 4 (15/11 - 21/11):** Tích hợp hoàn chỉnh với FastAPI Backend thật, kiểm thử trên thiết bị Android thực tế, đo đạc số liệu Usability và hoàn thiện báo cáo.

## Danh sách Task chi tiết của Thành viên 1 (`apps/mobile`)

### Giai đoạn 1: Khởi tạo & Khung sườn (Tuần 1)
- [x] Khởi tạo ứng dụng Expo SDK 57 với TypeScript bên trong `apps/mobile`.
- [x] Cài đặt thư viện điều hướng, biểu tượng và bản đồ (`react-native-maps`, `expo-image-picker`, `@expo/vector-icons`, `axios`).
- [x] Tạo các định nghĩa kiểu dữ liệu TypeScript (`src/types/trip.ts`) khớp với `docs/api-contract.md`.
- [x] Xây dựng hệ thống hằng số thiết kế dùng chung (`src/constants/designSystem.ts`) theo chuẩn `docs/ui-design-system.md`.
- [x] Xây dựng bộ Mock Service (`src/services/mockApi.ts`) trả về dữ liệu mẫu đa chuyến đi, hỗ trợ tạo chuyến đi mới từ ảnh EXIF và đầy đủ thao tác chỉnh sửa điểm dừng.
- [x] Tái thiết kế toàn bộ 5 màn hình cốt lõi theo phong cách "Modern Wanderlust":
  - `AuthScreen` (Đăng nhập/Đăng ký hiện đại + Chế độ vào nhanh Demo Bảo vệ)
  - `TripListScreen` (Magazine Hero Cards + Bento Summary + Spotlight AI Search)
  - `UploadProgressScreen` (Chọn ảnh thật `expo-image-picker` + Bento EXIF Stats + Pipeline Stepper)
  - `TripTimelineMapScreen` (Bản đồ Numbered Markers + Floating Rounded Sheet + Connected Vertical Stepper + Human-in-the-Loop)
  - `SemanticSearchScreen` (Spotlight Search + Vietnamese Suggestion Chips + 2-Column Bento Grid với huy hiệu `% khớp` CLIP)

### Giai đoạn 2: Luồng Tải ảnh & Tiến trình (Tuần 2)
- [x] Cho phép chọn nhiều ảnh thật từ thư viện thiết bị (`allowsMultipleSelection: true, exif: true`) và giữ nguyên EXIF/GPS gốc (`null` cho ảnh khuyết GPS).
- [x] Hiển thị 3 thẻ Bento thống kê (Tổng ảnh, Có GPS hợp lệ, Khuyết GPS `unknown`), danh sách ảnh preview kèm badge GPS và tiến trình Auto-Indexing Pipeline Stepper.
- [x] Tự động khởi tạo chuyến đi mới sau khi hoàn tất Auto-Indexing và điều hướng trực tiếp sang màn hình Timeline + Bản đồ.

### Giai đoạn 3: Hai Trụ cột Cốt lõi (Tuần 3)
- [x] Hiển thị danh sách điểm dừng theo từng ngày trên Timeline (Floating Sheet + Connected Vertical Stepper) đồng bộ với Custom Numbered Markers trên Bản đồ.
- [x] Vẽ đường nối `Polyline` (`#0D9488`, 4px) thể hiện thứ tự thời gian giữa các điểm dừng, tự động bay (`animateToRegion`) tới `centroid` khi chọn điểm dừng và nút thu phóng toàn tuyến.
- [x] Giao diện Human-in-the-Loop (UC-10, UC-11): Hỗ trợ đầy đủ Gộp (`MERGE`), Tách (`SPLIT` điểm dừng có >=2 ảnh), Đổi tên (`RENAME`), Đổi thứ tự (`REORDER`) và Chuyển ảnh lẻ giữa các điểm dừng (`MOVE_PHOTO`), kèm huy hiệu đếm **Usability Edits Counter**.
- [x] Giao diện Tìm kiếm tự nhiên (UC-13, UC-14): Chip gợi ý câu truy vấn tiếng Việt tự nhiên, kết hợp bộ lọc Chuyến đi/Ngày chụp và hiển thị lưới 2 cột kèm huy hiệu độ tương đồng CLIP (`✨ % khớp`).
