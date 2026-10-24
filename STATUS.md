# Trạng thái Dự án & Lộ trình 4 Tuần (STATUS)

- **Ngày bắt đầu:** 24/10/2026
- **Hạn chót nộp báo cáo:** 21/11/2026 (4 tuần)
- **Người thực hiện trên nhánh này:** Thành viên 1 (Mobile Application & UX/UI)

## Tiến độ tổng thể 4 Tuần
- [x] **Tuần 1 (24/10 - 31/10):** Khởi tạo `apps/mobile` (Expo SDK 57), chốt kiến trúc UI, dựng khung Navigation và Mock API theo `docs/api-contract.md`.
- [x] **Tuần 2 (01/11 - 07/11):** Xây dựng luồng chọn nhiều ảnh thật (`expo-image-picker`), kiểm tra và giữ nguyên vẹn EXIF/GPS khi upload (thống kê Bento Grid & bảo toàn `latitude: null` cho ảnh khuyết GPS), màn hình theo dõi tiến trình Auto-Indexing Stepper và tự động khởi tạo chuyến đi mới.
- [x] **Tuần 3 (08/11 - 14/11):** Refactor toàn diện UI/UX theo quy trình `ui-ux-pro-max` (`--stack react-native`), sinh tài liệu chuẩn `design-system/MASTER.md`, tách hệ thống UI Components tái sử dụng (`src/components/ui/`) và hoàn thiện 5 màn hình theo phong cách Editorial Magazine + Bento Grid / Floating Glassmorphism.
- [x] **Tuần 4 (15/11 - 21/11) — Hoàn thiện 100% phần việc Thành viên 1 (`apps/mobile`):** Lưu trữ bền vững với `AsyncStorage` (`src/services/storage.ts`), thuật toán gom cụm Không gian - Thời gian thực tế (Haversine + Temporal Threshold) cho ảnh thật trên thiết bị, Modal xem chi tiết ảnh EXIF & chuyển ảnh nhanh (UC-11), Modal Báo cáo Thực nghiệm Usability (Mục 9.7) kèm xuất Markdown/JSON, và Tầng giao tiếp linh hoạt `tripRepository.ts` (`LOCAL_SMART_MOCK` / `REMOTE_FASTAPI` tự động fallback).

## Danh sách Task chi tiết của Thành viên 1 (`apps/mobile`)

### Giai đoạn 1: Khởi tạo, Design System & UI Components (`ui-ux-pro-max`)
- [x] Khởi tạo ứng dụng Expo SDK 57 với TypeScript bên trong `apps/mobile`.
- [x] Cài đặt thư viện điều hướng, biểu tượng, bản đồ và lưu trữ bền vững (`react-native-maps`, `expo-image-picker`, `@expo/vector-icons`, `axios`, `@react-native-async-storage/async-storage`).
- [x] Khởi tạo Design System bằng `ui-ux-pro-max` (`--stack react-native`): Tạo `design-system/MASTER.md` và `src/theme/index.ts` (đạt chuẩn WCAG AA contrast, vùng chạm tối thiểu `>= 44x44pt`, thang khoảng cách 4/8dp, vector icons sắc nét không dùng emoji thô, phản hồi thị giác `Pressable` không gây nhảy bố cục).
- [x] Xây dựng bộ UI Components tái sử dụng tại `apps/mobile/src/components/ui/`:
  - `HeroTripCard` (Magazine Hero Card bo góc 28px, lớp phủ tối & metric pills)
  - `NumberedMapMarker` (Huy hiệu đánh số thứ tự điểm dừng có viền trắng & trạng thái Coral active)
  - `TimelineStopCard` (Thẻ điểm dừng gắn trục thời gian dọc liên tục Connected Vertical Stepper, bấm ảnh mở Lightbox EXIF)
  - `HitlActionPillBar` (Thanh công cụ Human-in-the-Loop tinh gọn + Usability Edits Counter mở Modal Báo cáo Mục 9.7)
  - `ExifStatusBadge` (Huy hiệu phân biệt `GPS Verified` Emerald vs `GPS Unknown` Amber)
  - `SemanticPhotoCard` (Thẻ ảnh kết quả tìm kiếm CLIP dạng lưới 2 cột kèm pill `% khớp` bán trong suốt)
- [x] Refactor toàn bộ 5 màn hình cốt lõi trong `apps/mobile/src/screens/`:
  - `TripListScreen` (Editorial Magazine + Bento Overview Strip + AI Search Spotlight + Công tắc `tripRepository` & nút Khôi phục dữ liệu mẫu)
  - `TripTimelineMapScreen` (Bản đồ Numbered Markers + Floating Rounded Sheet 32px + Connected Vertical Stepper + Human-in-the-Loop + Modal Chi tiết Ảnh EXIF & Modal Báo cáo Thực nghiệm Usability)
  - `SemanticSearchScreen` (AI Spotlight Search + Suggestion Chips + Bộ lọc chuyến đi động + 2-Column Bento Grid)
  - `UploadProgressScreen` (Chọn ảnh thật `expo-image-picker` + Lưu trữ AsyncStorage + 3 thẻ Bento EXIF + Dự kiến gom cụm Haversine + Stepper)
  - `AuthScreen` (Tối giản, hiện đại, đồng bộ bảng màu & typography `MASTER.md`)

### Giai đoạn 2: Luồng Tải ảnh Thật, Phân cụm Spatio-Temporal & Lưu trữ Bền vững (Tuần 2)
- [x] Cho phép chọn nhiều ảnh thật từ thư viện thiết bị (`allowsMultipleSelection: true, exif: true`), trích xuất `DateTimeOriginal` / `DateTime` và tọa độ GPS thật, giữ nguyên `null` cho ảnh khuyết GPS.
- [x] Thuật toán phân cụm Không gian - Thời gian thực tế (`clusterPhotosSpatioTemporal` trong `mockApi.ts` dùng khoảng cách Haversine `<= 350m` và ngưỡng thời gian `<= 180 phút`) tự động chia ảnh thật thành `TripDay` và `TripStop` có `centroid` thật.
- [x] Lưu trữ bền vững toàn bộ chuyến đi, ảnh đã chọn, thao tác Human-in-the-Loop và lịch sử chỉnh sửa vào `AsyncStorage` (`src/services/storage.ts`), kèm nút **Khôi phục dữ liệu mẫu** để reset nhanh khi demo.

### Giai đoạn 3: Hai Trụ cột Cốt lõi & Hoàn thiện UC-10, UC-11, UC-13, UC-14 (Tuần 3)
- [x] Hiển thị danh sách điểm dừng theo từng ngày trên Timeline (Floating Sheet + Connected Vertical Stepper) đồng bộ với `NumberedMapMarker` trên Bản đồ.
- [x] Vẽ đường nối `Polyline` (`#0D9488`, 4px) thể hiện thứ tự thời gian giữa các điểm dừng, tự động bay (`animateToRegion`) tới `centroid` khi chọn điểm dừng và nút thu phóng toàn tuyến.
- [x] Giao diện Human-in-the-Loop (UC-10, UC-11): Hỗ trợ đầy đủ Gộp (`MERGE`), Tách (`SPLIT` điểm dừng có >=2 ảnh), Đổi tên (`RENAME`), Đổi thứ tự (`REORDER`) và Chuyển ảnh lẻ giữa các điểm dừng (`MOVE_PHOTO`).
- [x] Modal Xem chi tiết Ảnh & Chuyển ảnh nhanh (UC-11): Bấm vào ảnh thumbnail trong `TimelineStopCard` mở Modal xem ảnh lớn kèm EXIF (`DateTimeOriginal`, tọa độ GPS hoặc `GPS Unknown`, điểm dừng hiện tại) và chuyển nhanh sang điểm dừng khác 1 chạm.
- [x] Giao diện Tìm kiếm tự nhiên (UC-13, UC-14): Chip gợi ý câu truy vấn tiếng Việt tự nhiên, kết hợp bộ lọc Chuyến đi/Ngày chụp và hiển thị lưới 2 cột kèm huy hiệu độ tương đồng CLIP.

### Giai đoạn 4: Tầng Giao tiếp Linh hoạt & Đánh giá Thực nghiệm Usability (Tuần 4)
- [x] Xây dựng `src/services/tripRepository.ts` hỗ trợ chuyển đổi linh hoạt giữa `LOCAL_SMART_MOCK` (mặc định) và `REMOTE_FASTAPI` (`apiClient.ts`) kèm cơ chế tự động fallback về Local khi Backend chưa bật.
- [x] Xây dựng Modal Báo cáo Thực nghiệm Usability (phục vụ Báo cáo Mục 9.7) khi bấm vào huy hiệu Usability Edits Counter: Thống kê chi tiết số lần `MERGE`, `SPLIT`, `RENAME`, `REORDER`, `MOVE_PHOTO`, lịch sử thao tác và nút Copy Báo cáo Markdown / JSON.
- [x] Kiểm tra `tsc --noEmit` đạt 0 lỗi TypeScript.
