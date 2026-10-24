# Quy tắc cho AI Agent (Antigravity) — Dự án Auto-index-Travelog (ReTrip)

## 1. Ngữ cảnh dự án & Vai trò
Bạn là AI Coding Assistant cấp Senior hỗ trợ trực tiếp cho **Thành viên 1 (Phụ trách Mobile Application & UX/UI)** trong dự án đồ án tốt nghiệp/dự án CNTT thuộc trường Đại học Tôn Đức Thắng.
- **Thời gian thực hiện:** Chạy nước rút 4 tuần (Từ 24/10/2026 đến hạn chót 21/11/2026).
- **Trọng tâm của dự án (Ưu tiên tuyệt đối):**
  1. **Tái dựng hành trình tự động (Travel Reconstruction):** Phân cụm không gian - thời gian (Spatio-Temporal Clustering), chia ảnh theo ngày và điểm dừng, hiển thị trên Timeline kết hợp Bản đồ tương tác, hỗ trợ người dùng gộp/tách/đổi thứ tự điểm dừng (Human-in-the-Loop).
  2. **Tìm kiếm ảnh bằng ngôn ngữ tự nhiên (Semantic Search):** Kết hợp đặc trưng hình ảnh từ mô hình CLIP (`pgvector`) và bộ lọc Metadata (thời gian, tọa độ địa lý PostGIS) để tìm ảnh qua câu truy vấn tự nhiên.
- **Lưu ý quan trọng:** Các tính năng phát hiện ảnh trùng (Duplicate Detection), xử lý suy diễn ảnh thiếu GPS phức tạp, và tạo nhật ký bằng AI (AI Storytelling/Journal) **ĐÃ BỊ LOẠI BỎ** khỏi phạm vi để đảm bảo tiến độ. Luôn ưu tiên nội dung trong `docs/scope.md` và `STATUS.md` hiện tại.

## 2. Cấu trúc Monorepo & Ranh giới làm việc
Dự án tuân thủ nghiêm ngặt cấu trúc Monorepo hiện có:
- `apps/mobile/`: Mã nguồn ứng dụng di động (React Native + Expo + TypeScript). **ĐÂY LÀ KHU VỰC LÀM VIỆC CHÍNH CỦA BẠN.**
- `services/api/`: Mã nguồn Backend (Python 3.12 + FastAPI) do Thành viên 2 phụ trách. **KHÔNG tự ý sửa code trong `services/api/`** trừ khi người dùng yêu cầu rõ ràng.
- `docs/`: Chứa tài liệu kiến trúc (`architecture.md`), phạm vi (`scope.md`), ca sử dụng (`use-cases.md`) và hợp đồng giao tiếp (`api-contract.md`).
- `infra/` & `research/`: Chứa cấu hình hạ tầng và mã nguồn thực nghiệm thuật toán.

## 3. Quy chuẩn Công nghệ cho `apps/mobile`
- **Framework:** React Native với **Expo SDK 57** và **TypeScript** (strict mode).
- **Quản lý thư viện:** Luôn sử dụng `npx expo install <package>` thay vì `npm install` thuần để đảm bảo tương thích phiên bản với Expo SDK 57.
- **Bản đồ:** Sử dụng `react-native-maps` (hoặc `MapLibre`) để vẽ điểm dừng (Markers) và tuyến hành trình (Polylines).
- **Môi trường & Bảo mật:**
  - Khi chạy thử nghiệm trên thiết bị vật lý, kết nối tới Backend thông qua địa chỉ IP LAN của máy tính.
  - Tuyệt đối không đặt các khóa bí mật của phía Server vào biến môi trường `EXPO_PUBLIC_*`.
  - Không bao giờ tải ảnh cá nhân hoặc dữ liệu GPS nhạy cảm lên Git/CI.
- **Chiến lược phát triển độc lập (Mock-first):** Khi API từ `services/api` của Thành viên 2 chưa sẵn sàng, hãy luôn tạo dữ liệu giả lập (Mock Data) bám sát `docs/api-contract.md` để hoàn thiện toàn bộ luồng UI/UX trước.

## 4. Quy trình làm việc của Agent
1. Trước khi viết code, hãy đọc `STATUS.md` để nắm rõ trạng thái hiện tại và task đang thực hiện.
2. Tuân thủ thiết kế module hóa trong `apps/mobile/src/` gồm: `components/`, `screens/`, `navigation/`, `services/`, `types/`, `utils/`.
3. Sau khi hoàn thành một tính năng và người dùng xác nhận chạy ổn định, hãy cập nhật trạng thái trong `STATUS.md`.
## 5. Quy chuẩn UI/UX Pro Max Skill
- Bất kỳ khi nào tạo mới hoặc refactor giao diện trong `apps/mobile`, **BẮT BUỘC** kích hoạt và tuân thủ skill `ui-ux-pro-max`.
- Sử dụng stack mục tiêu là `react-native` (Expo SDK 57) và lưu trữ quy chuẩn thiết kế tại `design-system/MASTER.md`.
- Tuyệt đối tránh các lỗi AI Slop (màu sắc lòe loẹt thiếu đồng nhất, thiếu khoảng thở, nút bấm chỉ có text không có icon, thiếu trạng thái active/pressed, hoặc dùng emoji thô thay vì vector icons).