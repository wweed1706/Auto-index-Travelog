# ReTrip — Phạm vi Dự án (Scope v2.0 - Tinh gọn 4 Tuần)

**Dự án:** Đồ án CNTT / Khóa luận (2 sinh viên, định hướng Mobile-first).
**Thời gian thực hiện:** 24/10/2026 – 21/11/2026 (4 tuần).

## Phát biểu bài toán
Từ một bộ sưu tập ảnh của chuyến đi đã diễn ra, hệ thống tự động tái dựng lại chuỗi sự kiện/điểm dừng du lịch theo ngày dựa trên thời gian chụp và tọa độ GPS, đồng thời cho phép tìm kiếm ảnh thông minh bằng ngôn ngữ tự nhiên thông qua đặc trưng hình ảnh (CLIP) kết hợp metadata.

## P0 — Chức năng bắt buộc (2 Trụ cột cốt lõi)

### Trụ cột 1: Tự động tái dựng hành trình bằng Timeline + Bản đồ
1. Quản lý tài khoản và danh sách chuyến đi (Trips).
2. Lựa chọn hàng loạt ảnh từ thiết bị và tải lên lưu trữ an toàn (Object Storage).
3. Trích xuất và chuẩn hóa metadata EXIF (thời gian chụp, tọa độ GPS).
4. Phân cụm không gian - thời gian (Spatio-Temporal Clustering) để chia ảnh thành từng ngày và từng điểm dừng (Stops/Events).
5. Hiển thị trực quan hành trình trên Dòng thời gian (Timeline) kết hợp Bản đồ tương tác (Interactive Map), nối các điểm dừng theo thứ tự thời gian.
6. Human-in-the-Loop Indexing: Cho phép người dùng xác nhận, đổi tên, gộp (merge), tách (split) hoặc đổi thứ tự các điểm dừng; bảo toàn chỉnh sửa của người dùng.
7. Theo dõi trạng thái xử lý nền (Background-processing status).

### Trụ cột 2: Tìm kiếm ảnh bằng ngôn ngữ tự nhiên (Semantic Search)
8. Trích xuất vector đặc trưng hình ảnh bằng mô hình PyTorch + CLIP và lưu trữ vào PostgreSQL (`pgvector`).
9. Truy vấn tìm kiếm bằng câu văn tự nhiên (VD: *"ảnh chụp ở bãi biển vào buổi chiều"*), kết hợp so khớp độ tương đồng vector với bộ lọc thời gian, địa điểm (PostGIS) và chuyến đi.
10. Hiển thị kết quả ảnh phù hợp kèm theo thông tin ngày và điểm dừng liên quan.

## Ngoài phạm vi (Out of Scope - Đã lược bỏ để tối ưu tiến độ)
- Phát hiện ảnh trùng và ảnh gần giống (Duplicate/Near-duplicate detection).
- Khôi phục/suy diễn tọa độ phức tạp cho các bộ ảnh mất hoàn toàn GPS.
- Tự động viết nhật ký bằng AI (AI Storytelling / Journal generation) và trang chia sẻ công khai.
- Theo dõi GPS liên tục theo thời gian thực (Live GPS tracking) hoặc xử lý video.

## Tiêu chí nghiệm thu & Đánh giá
- **Đánh giá gom cụm (Clustering):** Đo lường bằng chỉ số ARI và NMI đối chiếu với nhãn thực tế của chuyến đi.
- **Đánh giá tìm kiếm (Semantic Search):** So sánh độ chính xác giữa tìm kiếm chỉ dùng metadata và tìm kiếm kết hợp đặc trưng hình ảnh CLIP thông qua Recall@K và mAP.
- **Đánh giá tính tiện dụng (Usability):** Số thao tác chỉnh sửa (gộp/tách điểm dừng) mà người dùng cần thực hiện để hoàn thiện hành trình.