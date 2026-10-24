# Kiến trúc Hệ thống — ReTrip v2.0

~~~text
MOBILE APPLICATION (apps/mobile)
React Native + Expo SDK 57 + TypeScript
      |
      | HTTPS / REST API
      v
BACKEND API (services/api)
Python 3.12 + FastAPI
      +-- Auth / Trip / Media / Event / Search Routers
      +-- Processing-job orchestration
      |      |
      |      v
      |  AUTO-INDEXING & SEARCH ENGINE
      |      +-- EXIF Metadata Extraction (Time & GPS)
      |      +-- Spatio-Temporal Clustering (scikit-learn)
      |      +-- Image Feature Extraction (PyTorch + CLIP)
      |      +-- Hybrid Semantic Search (Vector + Metadata Filter)
      |      +-- Human-in-the-Loop State Preservation
      |
      +-- PostgreSQL + PostGIS + pgvector (Metadata, Không gian & Vector)
      +-- Object Storage: Supabase Storage / Cloudflare R2 (Ảnh gốc & Thumbnail)
~~~

## Quy tắc toàn vẹn dữ liệu (Data-integrity rules)
- Lưu trữ tách biệt dữ liệu gốc trích xuất từ EXIF và dữ liệu đã được người dùng chỉnh sửa/xác nhận.
- Giữ nguyên chuỗi thời gian gốc và múi giờ (timezone) nếu có trong EXIF.
- Ảnh không có GPS được đánh dấu là `unknown` (không có tọa độ), tuyệt đối không gán khoảng cách địa lý bằng `0`.
- Bảo toàn các thao tác chỉnh sửa thủ công (gộp, tách, đổi tên điểm dừng) của người dùng khi cập nhật lại dữ liệu.
- Đường nối giữa các điểm dừng trên bản đồ thể hiện thứ tự thời gian của hành trình, không khẳng định là lộ trình giao thông thực tế.

## Lựa chọn kiến trúc
- **Mobile-first:** Phát triển trong `apps/mobile` với Expo SDK 57.
- **Backend & AI:** Phát triển trong `services/api` bằng Python và FastAPI.
- **Cơ sở dữ liệu:** Kết hợp `PostGIS` (truy vấn tọa độ không gian) và `pgvector` (truy vấn vector tương đồng cho CLIP).