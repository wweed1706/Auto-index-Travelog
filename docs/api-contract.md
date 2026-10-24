# Hợp đồng Giao tiếp API (API Contract) — Mobile & Backend

Tài liệu này quy định cấu trúc JSON chuẩn giữa `apps/mobile` (Thành viên 1) và `services/api` (Thành viên 2). Khi API thật chưa hoàn tất, Mobile App sử dụng cấu trúc này để tạo Mock Service.

## 1. Quản lý Chuyến đi & Tải ảnh

### `GET /api/v1/trips`
Lấy danh sách các chuyến đi của người dùng.

### `POST /api/v1/trips/{trip_id}/photos`
Tải ảnh lên chuyến đi và kích hoạt tiến trình Auto-Indexing.
- **Response (`202 Accepted`):**
~~~json
{
  "job_id": "job_98765",
  "trip_id": "trip_123",
  "status": "PROCESSING",
  "progress_percent": 35,
  "message": "Đang trích xuất đặc trưng CLIP và phân cụm điểm dừng..."
}
~~~

### `GET /api/v1/jobs/{job_id}`
Kiểm tra trạng thái xử lý ảnh (`PENDING` | `PROCESSING` | `COMPLETED` | `FAILED`).

---

## 2. Trụ cột 1: Tái dựng hành trình (Timeline + Map)

### `GET /api/v1/trips/{trip_id}/timeline`
Trả về hành trình đã được chia theo từng ngày và từng điểm dừng (Stops/Events).
- **Response (`200 OK`):**
~~~json
{
  "trip_id": "trip_123",
  "title": "Chuyến đi Vũng Tàu",
  "start_date": "2026-10-10",
  "end_date": "2026-10-11",
  "days": [
    {
      "day_number": 1,
      "date": "2026-10-10",
      "stops": [
        {
          "stop_id": "stop_01",
          "order_index": 1,
          "name": "Điểm dừng #1 (Bãi Sau)",
          "start_time": "2026-10-10T08:15:00+07:00",
          "end_time": "2026-10-10T10:30:00+07:00",
          "centroid": {
            "latitude": 10.34599,
            "longitude": 107.08426
          },
          "is_user_confirmed": false,
          "photos": [
            {
              "photo_id": "p_101",
              "thumbnail_url": "https://storage.retrip.local/thumb/p_101.jpg",
              "original_url": "https://storage.retrip.local/orig/p_101.jpg",
              "taken_at": "2026-10-10T08:20:00+07:00",
              "latitude": 10.34601,
              "longitude": 107.08430
            }
          ]
        }
      ]
    }
  ]
}
~~~

### `PATCH /api/v1/trips/{trip_id}/stops/mutate`
API phục vụ Human-in-the-Loop: Gộp (`MERGE`), Tách (`SPLIT`), Đổi thứ tự (`REORDER`) hoặc Đổi tên (`RENAME`) điểm dừng.
- **Request Body:**
~~~json
{
  "action": "MERGE",
  "source_stop_ids": ["stop_01", "stop_02"],
  "new_name": "Bãi Sau Vũng Tàu"
}
~~~

---

## 3. Trụ cột 2: Tìm kiếm bằng ngôn ngữ tự nhiên (Semantic Search)

### `POST /api/v1/search`
Tìm kiếm ảnh kết hợp câu văn tự nhiên (CLIP Vector Search) và bộ lọc Metadata.
- **Request Body:**
~~~json
{
  "query": "ảnh chụp ở bãi biển vào buổi chiều",
  "trip_id": "trip_123",
  "date_from": null,
  "date_to": null,
  "top_k": 20
}
~~~
- **Response (`200 OK`):**
~~~json
{
  "query": "ảnh chụp ở bãi biển vào buổi chiều",
  "results": [
    {
      "photo_id": "p_105",
      "thumbnail_url": "https://storage.retrip.local/thumb/p_105.jpg",
      "similarity_score": 0.89,
      "taken_at": "2026-10-10T16:45:00+07:00",
      "trip_id": "trip_123",
      "day_number": 1,
      "stop": {
        "stop_id": "stop_03",
        "name": "Mũi Nghinh Phong",
        "latitude": 10.32450,
        "longitude": 107.08310
      }
    }
  ]
}
~~~