/**
 * Định nghĩa kiểu dữ liệu TypeScript theo Hợp đồng Giao tiếp API (docs/api-contract.md)
 * Dự án ReTrip — Auto-index Travelog
 */

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Thông tin tóm tắt chuyến đi dùng cho GET /api/v1/trips
 */
export interface TripSummary {
  trip_id: string;
  title: string;
  start_date: string;
  end_date: string;
  cover_thumbnail_url?: string | null;
  photo_count?: number;
  stop_count?: number;
  status?: JobStatus;
}

/**
 * Trạng thái tiến trình Auto-Indexing từ POST /api/v1/trips/{trip_id}/photos
 * và GET /api/v1/jobs/{job_id}
 */
export interface ProcessingJobResponse {
  job_id: string;
  trip_id: string;
  status: JobStatus;
  progress_percent: number;
  message: string;
}

/**
 * Thông tin một bức ảnh trong điểm dừng (Stop)
 * Lưu ý: Ảnh thiếu EXIF GPS sẽ có latitude/longitude là null (unknown), không gán 0.
 */
export interface PhotoItem {
  photo_id: string;
  thumbnail_url: string;
  original_url: string;
  taken_at: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Một điểm dừng / sự kiện (Stop / Event) trong ngày
 */
export interface TripStop {
  stop_id: string;
  order_index: number;
  name: string;
  start_time: string;
  end_time: string;
  centroid: Coordinates | null;
  is_user_confirmed: boolean;
  photos: PhotoItem[];
}

/**
 * Hành trình trong một ngày của chuyến đi
 */
export interface TripDay {
  day_number: number;
  date: string;
  stops: TripStop[];
}

/**
 * Chi tiết dòng thời gian chuyến đi từ GET /api/v1/trips/{trip_id}/timeline
 */
export interface TripTimeline {
  trip_id: string;
  title: string;
  start_date: string;
  end_date: string;
  days: TripDay[];
}

/**
 * Hành động chỉnh sửa Human-in-the-Loop trên điểm dừng
 */
export type StopMutateAction = 'MERGE' | 'SPLIT' | 'REORDER' | 'RENAME';

/**
 * Payload gửi lên PATCH /api/v1/trips/{trip_id}/stops/mutate
 */
export interface StopMutateRequest {
  action: StopMutateAction;
  source_stop_ids: string[];
  new_name?: string;
  /** Danh sách photo_id tách sang điểm dừng mới (dùng cho action SPLIT) */
  split_photo_ids?: string[];
  /** Thứ tự stop_id mới trong ngày (dùng cho action REORDER) */
  ordered_stop_ids?: string[];
}

/**
 * Request Body cho POST /api/v1/search (Semantic Search kết hợp CLIP + Metadata)
 */
export interface SemanticSearchRequest {
  query: string;
  trip_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  top_k?: number;
}

/**
 * Thông tin điểm dừng đính kèm trong mỗi kết quả tìm kiếm
 */
export interface SearchResultStop {
  stop_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Một phần tử kết quả trả về từ tìm kiếm ngôn ngữ tự nhiên
 */
export interface SemanticSearchResultItem {
  photo_id: string;
  thumbnail_url: string;
  similarity_score: number;
  taken_at: string;
  trip_id: string;
  day_number: number;
  stop: SearchResultStop;
}

/**
 * Response từ POST /api/v1/search
 */
export interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResultItem[];
}
