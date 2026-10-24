/**
 * Mock Data & API Service theo đúng Hợp đồng Giao tiếp API (docs/api-contract.md)
 * Cho phép phát triển và kiểm thử độc lập giao diện Mobile trước khi ghép nối FastAPI Backend.
 */

import {
  ProcessingJobResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  SemanticSearchResultItem,
  StopMutateRequest,
  TripStop,
  TripSummary,
  TripTimeline,
} from '@/types/trip';

const SIMULATED_DELAY_MS = 250;

function delay(ms: number = SIMULATED_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Danh sách chuyến đi mẫu (GET /api/v1/trips)
 */
export const MOCK_TRIPS: TripSummary[] = [
  {
    trip_id: 'trip_123',
    title: 'Chuyến đi Vũng Tàu',
    start_date: '2026-10-10',
    end_date: '2026-10-11',
    cover_thumbnail_url: 'https://storage.retrip.local/thumb/p_101.jpg',
    photo_count: 6,
    stop_count: 4,
    status: 'COMPLETED',
  },
  {
    trip_id: 'trip_124',
    title: 'Khám phá Đà Lạt Mùa Thu',
    start_date: '2026-10-18',
    end_date: '2026-10-20',
    cover_thumbnail_url: 'https://storage.retrip.local/thumb/p_201.jpg',
    photo_count: 42,
    stop_count: 5,
    status: 'COMPLETED',
  },
];

/**
 * Dữ liệu mẫu chi tiết Timeline + Map của chuyến đi "trip_123" (GET /api/v1/trips/{trip_id}/timeline)
 * Bám sát cấu trúc JSON trong docs/api-contract.md
 */
export const INITIAL_MOCK_TIMELINE: TripTimeline = {
  trip_id: 'trip_123',
  title: 'Chuyến đi Vũng Tàu',
  start_date: '2026-10-10',
  end_date: '2026-10-11',
  days: [
    {
      day_number: 1,
      date: '2026-10-10',
      stops: [
        {
          stop_id: 'stop_01',
          order_index: 1,
          name: 'Điểm dừng #1 (Bãi Sau)',
          start_time: '2026-10-10T08:15:00+07:00',
          end_time: '2026-10-10T10:30:00+07:00',
          centroid: {
            latitude: 10.34599,
            longitude: 107.08426,
          },
          is_user_confirmed: false,
          photos: [
            {
              photo_id: 'p_101',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_101.jpg',
              original_url: 'https://storage.retrip.local/orig/p_101.jpg',
              taken_at: '2026-10-10T08:20:00+07:00',
              latitude: 10.34601,
              longitude: 107.0843,
            },
            {
              photo_id: 'p_102',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_102.jpg',
              original_url: 'https://storage.retrip.local/orig/p_102.jpg',
              taken_at: '2026-10-10T09:10:00+07:00',
              latitude: 10.34595,
              longitude: 107.08422,
            },
          ],
        },
        {
          stop_id: 'stop_02',
          order_index: 2,
          name: 'Điểm dừng #2 (Tượng Chúa Kitô Vua)',
          start_time: '2026-10-10T13:30:00+07:00',
          end_time: '2026-10-10T15:15:00+07:00',
          centroid: {
            latitude: 10.32639,
            longitude: 107.08389,
          },
          is_user_confirmed: true,
          photos: [
            {
              photo_id: 'p_103',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_103.jpg',
              original_url: 'https://storage.retrip.local/orig/p_103.jpg',
              taken_at: '2026-10-10T14:00:00+07:00',
              latitude: 10.32641,
              longitude: 107.08391,
            },
            {
              photo_id: 'p_104',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_104.jpg',
              original_url: 'https://storage.retrip.local/orig/p_104.jpg',
              taken_at: '2026-10-10T14:35:00+07:00',
              // Minh họa quy tắc toàn vẹn dữ liệu: ảnh khuyết GPS giữ nguyên null, không gán 0
              latitude: null,
              longitude: null,
            },
          ],
        },
        {
          stop_id: 'stop_03',
          order_index: 3,
          name: 'Mũi Nghinh Phong',
          start_time: '2026-10-10T16:15:00+07:00',
          end_time: '2026-10-10T17:45:00+07:00',
          centroid: {
            latitude: 10.3245,
            longitude: 107.0831,
          },
          is_user_confirmed: false,
          photos: [
            {
              photo_id: 'p_105',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_105.jpg',
              original_url: 'https://storage.retrip.local/orig/p_105.jpg',
              taken_at: '2026-10-10T16:45:00+07:00',
              latitude: 10.3245,
              longitude: 107.0831,
            },
          ],
        },
      ],
    },
    {
      day_number: 2,
      date: '2026-10-11',
      stops: [
        {
          stop_id: 'stop_04',
          order_index: 1,
          name: 'Hải đăng Vũng Tàu',
          start_time: '2026-10-11T07:30:00+07:00',
          end_time: '2026-10-11T09:15:00+07:00',
          centroid: {
            latitude: 10.33582,
            longitude: 107.07668,
          },
          is_user_confirmed: true,
          photos: [
            {
              photo_id: 'p_106',
              thumbnail_url: 'https://storage.retrip.local/thumb/p_106.jpg',
              original_url: 'https://storage.retrip.local/orig/p_106.jpg',
              taken_at: '2026-10-11T08:05:00+07:00',
              latitude: 10.33585,
              longitude: 107.0767,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Kết quả tìm kiếm mẫu (POST /api/v1/search)
 * Khớp với ví dụ trong docs/api-contract.md
 */
export const MOCK_SEARCH_RESULTS: SemanticSearchResultItem[] = [
  {
    photo_id: 'p_105',
    thumbnail_url: 'https://storage.retrip.local/thumb/p_105.jpg',
    similarity_score: 0.89,
    taken_at: '2026-10-10T16:45:00+07:00',
    trip_id: 'trip_123',
    day_number: 1,
    stop: {
      stop_id: 'stop_03',
      name: 'Mũi Nghinh Phong',
      latitude: 10.3245,
      longitude: 107.0831,
    },
  },
  {
    photo_id: 'p_101',
    thumbnail_url: 'https://storage.retrip.local/thumb/p_101.jpg',
    similarity_score: 0.84,
    taken_at: '2026-10-10T08:20:00+07:00',
    trip_id: 'trip_123',
    day_number: 1,
    stop: {
      stop_id: 'stop_01',
      name: 'Điểm dừng #1 (Bãi Sau)',
      latitude: 10.34599,
      longitude: 107.08426,
    },
  },
  {
    photo_id: 'p_106',
    thumbnail_url: 'https://storage.retrip.local/thumb/p_106.jpg',
    similarity_score: 0.76,
    taken_at: '2026-10-11T08:05:00+07:00',
    trip_id: 'trip_123',
    day_number: 2,
    stop: {
      stop_id: 'stop_04',
      name: 'Hải đăng Vũng Tàu',
      latitude: 10.33582,
      longitude: 107.07668,
    },
  },
];

// Bản sao trạng thái trong bộ nhớ để hỗ trợ thao tác Human-in-the-Loop trên UI
let currentTimelineState: TripTimeline = JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE));

/**
 * GET /api/v1/trips
 */
export async function getTrips(): Promise<TripSummary[]> {
  await delay();
  return [...MOCK_TRIPS];
}

/**
 * POST /api/v1/trips/{trip_id}/photos
 */
export async function uploadTripPhotos(
  tripId: string,
  _photoUris: string[] = []
): Promise<ProcessingJobResponse> {
  await delay();
  return {
    job_id: 'job_98765',
    trip_id: tripId,
    status: 'PROCESSING',
    progress_percent: 35,
    message: 'Đang trích xuất đặc trưng CLIP và phân cụm điểm dừng...',
  };
}

/**
 * GET /api/v1/jobs/{job_id}
 */
export async function getJobStatus(
  jobId: string,
  simulatedProgress: number = 100
): Promise<ProcessingJobResponse> {
  await delay(150);
  const clamped = Math.max(0, Math.min(100, simulatedProgress));
  const isCompleted = clamped >= 100;

  return {
    job_id: jobId,
    trip_id: 'trip_123',
    status: isCompleted ? 'COMPLETED' : 'PROCESSING',
    progress_percent: clamped,
    message: isCompleted
      ? 'Hoàn tất phân cụm hành trình và lập chỉ mục CLIP!'
      : 'Đang trích xuất đặc trưng CLIP và phân cụm điểm dừng...',
  };
}

/**
 * GET /api/v1/trips/{trip_id}/timeline
 */
export async function getTripTimeline(tripId: string): Promise<TripTimeline> {
  await delay();
  if (tripId !== currentTimelineState.trip_id) {
    return {
      ...currentTimelineState,
      trip_id: tripId,
    };
  }
  return JSON.parse(JSON.stringify(currentTimelineState));
}

/**
 * PATCH /api/v1/trips/{trip_id}/stops/mutate
 * Hỗ trợ các thao tác Human-in-the-Loop: MERGE, SPLIT, REORDER, RENAME
 */
export async function mutateTripStops(
  _tripId: string,
  payload: StopMutateRequest
): Promise<TripTimeline> {
  await delay();

  const nextState: TripTimeline = JSON.parse(JSON.stringify(currentTimelineState));

  for (const day of nextState.days) {
    if (payload.action === 'RENAME' && payload.source_stop_ids.length > 0 && payload.new_name) {
      const targetId = payload.source_stop_ids[0];
      const stop = day.stops.find((s) => s.stop_id === targetId);
      if (stop) {
        stop.name = payload.new_name;
        stop.is_user_confirmed = true;
      }
    } else if (payload.action === 'MERGE' && payload.source_stop_ids.length >= 2) {
      const targetStops = day.stops.filter((s) => payload.source_stop_ids.includes(s.stop_id));
      if (targetStops.length >= 2) {
        const firstStop = targetStops[0];
        const lastStop = targetStops[targetStops.length - 1];
        const mergedPhotos = targetStops.flatMap((s) => s.photos);

        const mergedStop: TripStop = {
          ...firstStop,
          name: payload.new_name ?? `${firstStop.name} (Đã gộp)`,
          end_time: lastStop.end_time,
          is_user_confirmed: true,
          photos: mergedPhotos,
        };

        const remainingStops = day.stops.filter(
          (s) => !payload.source_stop_ids.slice(1).includes(s.stop_id)
        );
        day.stops = remainingStops.map((s, idx) =>
          s.stop_id === firstStop.stop_id
            ? { ...mergedStop, order_index: idx + 1 }
            : { ...s, order_index: idx + 1 }
        );
      }
    } else if (payload.action === 'REORDER' && payload.ordered_stop_ids) {
      const stopMap = new Map(day.stops.map((s) => [s.stop_id, s]));
      const reordered: TripStop[] = [];
      payload.ordered_stop_ids.forEach((id) => {
        const found = stopMap.get(id);
        if (found) {
          reordered.push({ ...found, is_user_confirmed: true });
          stopMap.delete(id);
        }
      });
      stopMap.forEach((remaining) => reordered.push(remaining));
      day.stops = reordered.map((s, idx) => ({ ...s, order_index: idx + 1 }));
    }
  }

  currentTimelineState = nextState;
  return JSON.parse(JSON.stringify(currentTimelineState));
}

/**
 * Khôi phục dữ liệu Timeline mẫu về trạng thái ban đầu
 */
export function resetMockTimeline(): TripTimeline {
  currentTimelineState = JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE));
  return JSON.parse(JSON.stringify(currentTimelineState));
}

/**
 * POST /api/v1/search
 * Tìm kiếm ảnh bằng ngôn ngữ tự nhiên kết hợp bộ lọc
 */
export async function searchPhotosSemantic(
  request: SemanticSearchRequest
): Promise<SemanticSearchResponse> {
  await delay();

  const normalizedQuery = request.query.trim().toLowerCase();
  let filtered = [...MOCK_SEARCH_RESULTS];

  if (request.trip_id) {
    filtered = filtered.filter((item) => item.trip_id === request.trip_id);
  }

  if (request.date_from) {
    filtered = filtered.filter((item) => item.taken_at.slice(0, 10) >= request.date_from!);
  }

  if (request.date_to) {
    filtered = filtered.filter((item) => item.taken_at.slice(0, 10) <= request.date_to!);
  }

  if (normalizedQuery && !normalizedQuery.includes('biển') && !normalizedQuery.includes('chiều')) {
    filtered = filtered.filter(
      (item) =>
        item.stop.name.toLowerCase().includes(normalizedQuery) ||
        item.photo_id.toLowerCase().includes(normalizedQuery)
    );
    if (filtered.length === 0) {
      filtered = [...MOCK_SEARCH_RESULTS];
    }
  }

  const topK = request.top_k ?? 20;
  return {
    query: request.query,
    results: filtered.slice(0, topK),
  };
}
