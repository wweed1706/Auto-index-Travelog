/**
 * Mock Data & API Service theo đúng Hợp đồng Giao tiếp API (docs/api-contract.md)
 * Cho phép phát triển và kiểm thử độc lập giao diện Mobile trước khi ghép nối FastAPI Backend.
 */

import {
  Coordinates,
  PhotoItem,
  ProcessingJobResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  SemanticSearchResultItem,
  StopMutateRequest,
  TripDay,
  TripStop,
  TripSummary,
  TripTimeline,
} from '@/types/trip';

const SIMULATED_DELAY_MS = 220;

function delay(ms: number = SIMULATED_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeCentroid(photos: PhotoItem[], fallback: Coordinates | null = null): Coordinates | null {
  const validGps = photos.filter(
    (p): p is PhotoItem & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null
  );
  if (validGps.length === 0) {
    return fallback;
  }
  const sumLat = validGps.reduce((acc, p) => acc + p.latitude, 0);
  const sumLng = validGps.reduce((acc, p) => acc + p.longitude, 0);
  return {
    latitude: Number((sumLat / validGps.length).toFixed(5)),
    longitude: Number((sumLng / validGps.length).toFixed(5)),
  };
}

/**
 * Danh sách chuyến đi mẫu ban đầu (GET /api/v1/trips)
 */
export const MOCK_TRIPS: TripSummary[] = [
  {
    trip_id: 'trip_123',
    title: 'Chuyến đi Biển Vũng Tàu',
    start_date: '2026-10-10',
    end_date: '2026-10-11',
    cover_thumbnail_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    photo_count: 8,
    stop_count: 5,
    days_count: 2,
    status: 'COMPLETED',
  },
  {
    trip_id: 'trip_124',
    title: 'Khám phá Đà Lạt Mùa Thu',
    start_date: '2026-10-18',
    end_date: '2026-10-20',
    cover_thumbnail_url:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    photo_count: 6,
    stop_count: 3,
    days_count: 2,
    status: 'COMPLETED',
  },
];

/**
 * Dữ liệu mẫu chi tiết Timeline + Map của chuyến đi "trip_123" (GET /api/v1/trips/{trip_id}/timeline)
 * Bám sát cấu trúc JSON trong docs/api-contract.md
 */
export const INITIAL_MOCK_TIMELINE: TripTimeline = {
  trip_id: 'trip_123',
  title: 'Chuyến đi Biển Vũng Tàu',
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
          name: 'Bãi Sau Thùy Vân',
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
              thumbnail_url:
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-10T08:20:00+07:00',
              latitude: 10.34601,
              longitude: 107.0843,
            },
            {
              photo_id: 'p_102',
              thumbnail_url:
                'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-10T09:10:00+07:00',
              latitude: 10.34595,
              longitude: 107.08422,
            },
            {
              photo_id: 'p_102b',
              thumbnail_url:
                'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-10T10:05:00+07:00',
              latitude: 10.3461,
              longitude: 107.08418,
            },
          ],
        },
        {
          stop_id: 'stop_02',
          order_index: 2,
          name: 'Tượng Chúa Kitô Vua',
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
              thumbnail_url:
                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-10T14:00:00+07:00',
              latitude: 10.32641,
              longitude: 107.08391,
            },
            {
              photo_id: 'p_104',
              thumbnail_url:
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
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
              thumbnail_url:
                'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=85',
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
              thumbnail_url:
                'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-11T08:05:00+07:00',
              latitude: 10.33585,
              longitude: 107.0767,
            },
          ],
        },
        {
          stop_id: 'stop_05',
          order_index: 2,
          name: 'Chợ Hải sản Xóm Lưới',
          start_time: '2026-10-11T11:10:00+07:00',
          end_time: '2026-10-11T12:45:00+07:00',
          centroid: {
            latitude: 10.3412,
            longitude: 107.0725,
          },
          is_user_confirmed: false,
          photos: [
            {
              photo_id: 'p_107',
              thumbnail_url:
                'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-11T11:30:00+07:00',
              latitude: 10.3412,
              longitude: 107.0725,
            },
          ],
        },
      ],
    },
  ],
};

const DALAT_MOCK_TIMELINE: TripTimeline = {
  trip_id: 'trip_124',
  title: 'Khám phá Đà Lạt Mùa Thu',
  start_date: '2026-10-18',
  end_date: '2026-10-20',
  days: [
    {
      day_number: 1,
      date: '2026-10-18',
      stops: [
        {
          stop_id: 'dl_stop_01',
          order_index: 1,
          name: 'Đồi Chè Cầu Đất',
          start_time: '2026-10-18T06:30:00+07:00',
          end_time: '2026-10-18T08:45:00+07:00',
          centroid: {
            latitude: 11.8698,
            longitude: 108.5632,
          },
          is_user_confirmed: true,
          photos: [
            {
              photo_id: 'p_201',
              thumbnail_url:
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-18T06:50:00+07:00',
              latitude: 11.8698,
              longitude: 108.5632,
            },
            {
              photo_id: 'p_202',
              thumbnail_url:
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-18T07:40:00+07:00',
              latitude: 11.8701,
              longitude: 108.5635,
            },
          ],
        },
        {
          stop_id: 'dl_stop_02',
          order_index: 2,
          name: 'Hồ Tuyền Lâm',
          start_time: '2026-10-18T15:00:00+07:00',
          end_time: '2026-10-18T17:30:00+07:00',
          centroid: {
            latitude: 11.9025,
            longitude: 108.4318,
          },
          is_user_confirmed: false,
          photos: [
            {
              photo_id: 'p_203',
              thumbnail_url:
                'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-18T16:15:00+07:00',
              latitude: 11.9025,
              longitude: 108.4318,
            },
            {
              photo_id: 'p_204',
              thumbnail_url:
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-18T16:50:00+07:00',
              latitude: null,
              longitude: null,
            },
          ],
        },
      ],
    },
    {
      day_number: 2,
      date: '2026-10-19',
      stops: [
        {
          stop_id: 'dl_stop_03',
          order_index: 1,
          name: 'Quảng trường Lâm Viên',
          start_time: '2026-10-19T09:00:00+07:00',
          end_time: '2026-10-19T11:00:00+07:00',
          centroid: {
            latitude: 11.9404,
            longitude: 108.4451,
          },
          is_user_confirmed: true,
          photos: [
            {
              photo_id: 'p_205',
              thumbnail_url:
                'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
              original_url:
                'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85',
              taken_at: '2026-10-19T09:30:00+07:00',
              latitude: 11.9404,
              longitude: 108.4451,
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
export const MOCK_SEARCH_RESULTS: (SemanticSearchResultItem & { keywords?: string[] })[] = [
  {
    photo_id: 'p_105',
    thumbnail_url:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.94,
    taken_at: '2026-10-10T16:45:00+07:00',
    trip_id: 'trip_123',
    day_number: 1,
    stop: {
      stop_id: 'stop_03',
      name: 'Mũi Nghinh Phong',
      latitude: 10.3245,
      longitude: 107.0831,
    },
    keywords: ['hoàng hôn', 'biển', 'buổi chiều', 'mũi đá', 'nghinh phong', 'bầu trời'],
  },
  {
    photo_id: 'p_101',
    thumbnail_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.89,
    taken_at: '2026-10-10T08:20:00+07:00',
    trip_id: 'trip_123',
    day_number: 1,
    stop: {
      stop_id: 'stop_01',
      name: 'Bãi Sau Thùy Vân',
      latitude: 10.34599,
      longitude: 107.08426,
    },
    keywords: ['bãi biển', 'sóng biển', 'buổi sáng', 'cát trắng', 'bãi sau', 'biển'],
  },
  {
    photo_id: 'p_107',
    thumbnail_url:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.91,
    taken_at: '2026-10-11T11:30:00+07:00',
    trip_id: 'trip_123',
    day_number: 2,
    stop: {
      stop_id: 'stop_05',
      name: 'Chợ Hải sản Xóm Lưới',
      latitude: 10.3412,
      longitude: 107.0725,
    },
    keywords: ['món ăn', 'ẩm thực', 'hải sản', 'địa phương', 'ăn trưa', 'chợ'],
  },
  {
    photo_id: 'p_106',
    thumbnail_url:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.85,
    taken_at: '2026-10-11T08:05:00+07:00',
    trip_id: 'trip_123',
    day_number: 2,
    stop: {
      stop_id: 'stop_04',
      name: 'Hải đăng Vũng Tàu',
      latitude: 10.33582,
      longitude: 107.07668,
    },
    keywords: ['hải đăng', 'đồi', 'toàn cảnh', 'buổi sáng', 'vũng tàu'],
  },
  {
    photo_id: 'p_102',
    thumbnail_url:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.82,
    taken_at: '2026-10-10T09:10:00+07:00',
    trip_id: 'trip_123',
    day_number: 1,
    stop: {
      stop_id: 'stop_01',
      name: 'Bãi Sau Thùy Vân',
      latitude: 10.34599,
      longitude: 107.08426,
    },
    keywords: ['bãi biển', 'nắng vàng', 'biển xanh', 'nghỉ dưỡng'],
  },
  {
    photo_id: 'p_201',
    thumbnail_url:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80',
    similarity_score: 0.88,
    taken_at: '2026-10-18T06:50:00+07:00',
    trip_id: 'trip_124',
    day_number: 1,
    stop: {
      stop_id: 'dl_stop_01',
      name: 'Đồi Chè Cầu Đất',
      latitude: 11.8698,
      longitude: 108.5632,
    },
    keywords: ['rừng thông', 'sương mù', 'đồi chè', 'núi đồi', 'đà lạt', 'bình minh'],
  },
];

// Kho lưu trữ trạng thái trong bộ nhớ để hỗ trợ thêm chuyến đi mới và Human-in-the-Loop
let tripsStore: TripSummary[] = JSON.parse(JSON.stringify(MOCK_TRIPS));
let timelinesStore: Record<string, TripTimeline> = {
  trip_123: JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE)),
  trip_124: JSON.parse(JSON.stringify(DALAT_MOCK_TIMELINE)),
};
let searchStore = JSON.parse(JSON.stringify(MOCK_SEARCH_RESULTS)) as (SemanticSearchResultItem & {
  keywords?: string[];
})[];

function syncTripSummaryStats(tripId: string, timeline: TripTimeline) {
  const allStops = timeline.days.flatMap((d) => d.stops);
  const allPhotos = allStops.flatMap((s) => s.photos);
  const idx = tripsStore.findIndex((t) => t.trip_id === tripId);
  if (idx >= 0) {
    tripsStore[idx] = {
      ...tripsStore[idx],
      title: timeline.title,
      start_date: timeline.start_date,
      end_date: timeline.end_date,
      stop_count: allStops.length,
      photo_count: allPhotos.length,
      days_count: timeline.days.length,
      cover_thumbnail_url: allPhotos[0]?.thumbnail_url ?? tripsStore[idx].cover_thumbnail_url,
    };
  }
}

/**
 * GET /api/v1/trips
 */
export async function getTrips(): Promise<TripSummary[]> {
  await delay();
  return JSON.parse(JSON.stringify(tripsStore));
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
    job_id: `job_${Date.now().toString().slice(-5)}`,
    trip_id: tripId,
    status: 'PROCESSING',
    progress_percent: 25,
    message: 'Đang trích xuất metadata EXIF & chuẩn hóa tọa độ GPS...',
  };
}

/**
 * GET /api/v1/jobs/{job_id}
 */
export async function getJobStatus(
  jobId: string,
  simulatedProgress: number = 100,
  tripId: string = 'trip_123'
): Promise<ProcessingJobResponse> {
  await delay(140);
  const clamped = Math.max(0, Math.min(100, simulatedProgress));
  const isCompleted = clamped >= 100;

  let message = 'Đang trích xuất metadata EXIF (Time & GPS)...';
  if (clamped >= 100) {
    message = 'Hoàn tất phân cụm Spatio-Temporal & lập chỉ mục CLIP!';
  } else if (clamped >= 70) {
    message = 'Đang phân cụm không gian - thời gian (DBSCAN / Spatio-Temporal)...';
  } else if (clamped >= 40) {
    message = 'Đang trích xuất vector đặc trưng hình ảnh bằng PyTorch + CLIP...';
  }

  return {
    job_id: jobId,
    trip_id: tripId,
    status: isCompleted ? 'COMPLETED' : 'PROCESSING',
    progress_percent: clamped,
    message,
  };
}

/**
 * Tạo chuyến đi mới từ danh sách ảnh thực tế đã chọn & kiểm tra EXIF
 * Phục vụ luồng Giai đoạn 2: Chọn ảnh -> Kiểm tra EXIF -> Auto-Indexing -> Mở Timeline + Map
 */
export async function createTripFromUploadedPhotos(params: {
  title?: string;
  photos: PhotoItem[];
}): Promise<TripTimeline> {
  await delay(200);
  const newTripId = `trip_${Date.now().toString().slice(-4)}`;
  const sortedPhotos = [...params.photos].sort((a, b) => a.taken_at.localeCompare(b.taken_at));

  // Gom nhóm theo ngày chụp (YYYY-MM-DD)
  const dayBuckets = new Map<string, PhotoItem[]>();
  for (const photo of sortedPhotos) {
    const dateStr = photo.taken_at.slice(0, 10) || '2026-10-24';
    const existing = dayBuckets.get(dateStr) ?? [];
    existing.push(photo);
    dayBuckets.set(dateStr, existing);
  }

  const samplePlaceNames = [
    'Bãi biển Trung tâm',
    'Đồi Hải Đăng & Toàn cảnh',
    'Phố Ẩm thực Địa phương',
    'Mũi Đá Hoàng Hôn',
    'Quảng trường Ven biển',
  ];

  // Tọa độ mặc định ven biển dùng cho điểm dừng khi toàn bộ ảnh thiết bị không có GPS,
  // nhưng vẫn giữ nguyên photo.latitude = null theo đúng quy tắc toàn vẹn dữ liệu.
  const fallbackCentroids: Coordinates[] = [
    { latitude: 10.34599, longitude: 107.08426 },
    { latitude: 10.33582, longitude: 107.07668 },
    { latitude: 10.32639, longitude: 107.08389 },
    { latitude: 10.3245, longitude: 107.0831 },
  ];

  const days: TripDay[] = [];
  let dayIdx = 1;
  let globalStopCounter = 0;

  dayBuckets.forEach((dayPhotos, dateStr) => {
    const stops: TripStop[] = [];
    const chunkSize = dayPhotos.length >= 4 ? 2 : 1;

    for (let i = 0; i < dayPhotos.length; i += chunkSize) {
      const clusterPhotos = dayPhotos.slice(i, i + chunkSize);
      const stopOrder = stops.length + 1;
      const stopName =
        samplePlaceNames[globalStopCounter % samplePlaceNames.length] ??
        `Điểm dừng #${stopOrder}`;
      const computed = computeCentroid(
        clusterPhotos,
        fallbackCentroids[globalStopCounter % fallbackCentroids.length]
      );

      stops.push({
        stop_id: `${newTripId}_stop_${globalStopCounter + 1}`,
        order_index: stopOrder,
        name: stopName,
        start_time: clusterPhotos[0].taken_at,
        end_time: clusterPhotos[clusterPhotos.length - 1].taken_at,
        centroid: computed,
        is_user_confirmed: false,
        photos: clusterPhotos,
      });

      // Đồng bộ ảnh vào kho tìm kiếm CLIP
      if (computed) {
        clusterPhotos.forEach((p, pIdx) => {
          searchStore.unshift({
            photo_id: p.photo_id,
            thumbnail_url: p.thumbnail_url,
            similarity_score: Number((0.92 - pIdx * 0.04).toFixed(2)),
            taken_at: p.taken_at,
            trip_id: newTripId,
            day_number: dayIdx,
            stop: {
              stop_id: `${newTripId}_stop_${globalStopCounter + 1}`,
              name: stopName,
              latitude: computed.latitude,
              longitude: computed.longitude,
            },
            keywords: ['chuyến đi mới', stopName.toLowerCase(), 'biển', 'hoàng hôn'],
          });
        });
      }

      globalStopCounter += 1;
    }

    days.push({
      day_number: dayIdx,
      date: dateStr,
      stops,
    });
    dayIdx += 1;
  });

  const startDate = days[0]?.date ?? '2026-10-24';
  const endDate = days[days.length - 1]?.date ?? startDate;
  const tripTitle = params.title?.trim() || `Hành trình Mới (${sortedPhotos.length} ảnh)`;

  const newTimeline: TripTimeline = {
    trip_id: newTripId,
    title: tripTitle,
    start_date: startDate,
    end_date: endDate,
    days,
  };

  timelinesStore[newTripId] = newTimeline;
  tripsStore.unshift({
    trip_id: newTripId,
    title: tripTitle,
    start_date: startDate,
    end_date: endDate,
    cover_thumbnail_url: sortedPhotos[0]?.thumbnail_url ?? MOCK_TRIPS[0].cover_thumbnail_url,
    photo_count: sortedPhotos.length,
    stop_count: days.reduce((acc, d) => acc + d.stops.length, 0),
    days_count: days.length,
    status: 'COMPLETED',
  });

  return JSON.parse(JSON.stringify(newTimeline));
}

/**
 * GET /api/v1/trips/{trip_id}/timeline
 */
export async function getTripTimeline(tripId: string): Promise<TripTimeline> {
  await delay();
  const found = timelinesStore[tripId];
  if (found) {
    return JSON.parse(JSON.stringify(found));
  }
  return JSON.parse(
    JSON.stringify({
      ...timelinesStore.trip_123,
      trip_id: tripId,
    })
  );
}

/**
 * PATCH /api/v1/trips/{trip_id}/stops/mutate
 * Hỗ trợ đầy đủ các thao tác Human-in-the-Loop (UC-10, UC-11):
 * MERGE, SPLIT, REORDER, RENAME, MOVE_PHOTO
 */
export async function mutateTripStops(
  tripId: string,
  payload: StopMutateRequest
): Promise<TripTimeline> {
  await delay(180);

  const current = timelinesStore[tripId] ?? timelinesStore.trip_123;
  const nextState: TripTimeline = JSON.parse(JSON.stringify(current));

  for (const day of nextState.days) {
    if (payload.action === 'RENAME' && payload.source_stop_ids.length > 0 && payload.new_name) {
      const targetId = payload.source_stop_ids[0];
      const stop = day.stops.find((s) => s.stop_id === targetId);
      if (stop) {
        stop.name = payload.new_name.trim();
        stop.is_user_confirmed = true;
      }
    } else if (payload.action === 'MERGE' && payload.source_stop_ids.length >= 2) {
      const targetStops = day.stops.filter((s) => payload.source_stop_ids.includes(s.stop_id));
      if (targetStops.length >= 2) {
        const firstStop = targetStops[0];
        const lastStop = targetStops[targetStops.length - 1];
        const mergedPhotos = targetStops.flatMap((s) => s.photos);
        const mergedCentroid = computeCentroid(mergedPhotos, firstStop.centroid);

        const mergedStop: TripStop = {
          ...firstStop,
          name: payload.new_name?.trim() || `${firstStop.name} & ${lastStop.name}`,
          end_time: lastStop.end_time,
          centroid: mergedCentroid,
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
    } else if (payload.action === 'SPLIT' && payload.source_stop_ids.length > 0) {
      const targetId = payload.source_stop_ids[0];
      const stopIdx = day.stops.findIndex((s) => s.stop_id === targetId);
      if (stopIdx !== -1 && day.stops[stopIdx].photos.length >= 2) {
        const originalStop = day.stops[stopIdx];
        const splitIds =
          payload.split_photo_ids && payload.split_photo_ids.length > 0
            ? payload.split_photo_ids
            : originalStop.photos
                .slice(Math.ceil(originalStop.photos.length / 2))
                .map((p) => p.photo_id);

        const keptPhotos = originalStop.photos.filter((p) => !splitIds.includes(p.photo_id));
        const movedPhotos = originalStop.photos.filter((p) => splitIds.includes(p.photo_id));

        if (keptPhotos.length > 0 && movedPhotos.length > 0) {
          const updatedFirst: TripStop = {
            ...originalStop,
            end_time: keptPhotos[keptPhotos.length - 1].taken_at,
            centroid: computeCentroid(keptPhotos, originalStop.centroid),
            is_user_confirmed: true,
            photos: keptPhotos,
          };

          const newSecondStop: TripStop = {
            stop_id: `${originalStop.stop_id}_split_${Date.now().toString().slice(-3)}`,
            order_index: originalStop.order_index + 1,
            name: payload.new_name?.trim() || `${originalStop.name} (Điểm tách mới)`,
            start_time: movedPhotos[0].taken_at,
            end_time: movedPhotos[movedPhotos.length - 1].taken_at,
            centroid: computeCentroid(
              movedPhotos,
              originalStop.centroid
                ? {
                    latitude: Number((originalStop.centroid.latitude + 0.0022).toFixed(5)),
                    longitude: Number((originalStop.centroid.longitude + 0.0018).toFixed(5)),
                  }
                : null
            ),
            is_user_confirmed: true,
            photos: movedPhotos,
          };

          const updatedStops = [...day.stops];
          updatedStops.splice(stopIdx, 1, updatedFirst, newSecondStop);
          day.stops = updatedStops.map((s, idx) => ({ ...s, order_index: idx + 1 }));
        }
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
    } else if (
      payload.action === 'MOVE_PHOTO' &&
      payload.source_stop_ids.length > 0 &&
      payload.target_stop_id &&
      payload.photo_id
    ) {
      const sourceId = payload.source_stop_ids[0];
      const sourceStop = day.stops.find((s) => s.stop_id === sourceId);
      const targetStop = day.stops.find((s) => s.stop_id === payload.target_stop_id);

      if (sourceStop && targetStop && sourceStop.stop_id !== targetStop.stop_id) {
        const photoToMove = sourceStop.photos.find((p) => p.photo_id === payload.photo_id);
        if (photoToMove) {
          sourceStop.photos = sourceStop.photos.filter((p) => p.photo_id !== payload.photo_id);
          sourceStop.is_user_confirmed = true;
          sourceStop.centroid = computeCentroid(sourceStop.photos, sourceStop.centroid);

          targetStop.photos = [...targetStop.photos, photoToMove].sort((a, b) =>
            a.taken_at.localeCompare(b.taken_at)
          );
          targetStop.start_time = targetStop.photos[0].taken_at;
          targetStop.end_time = targetStop.photos[targetStop.photos.length - 1].taken_at;
          targetStop.centroid = computeCentroid(targetStop.photos, targetStop.centroid);
          targetStop.is_user_confirmed = true;

          // Loại bỏ điểm dừng rỗng nếu toàn bộ ảnh đã được chuyển đi
          day.stops = day.stops
            .filter((s) => s.photos.length > 0)
            .map((s, idx) => ({ ...s, order_index: idx + 1 }));
        }
      }
    }
  }

  timelinesStore[tripId] = nextState;
  syncTripSummaryStats(tripId, nextState);
  return JSON.parse(JSON.stringify(nextState));
}

/**
 * Khôi phục dữ liệu Timeline mẫu về trạng thái ban đầu
 */
export function resetMockTimeline(tripId: string = 'trip_123'): TripTimeline {
  if (tripId === 'trip_124') {
    timelinesStore.trip_124 = JSON.parse(JSON.stringify(DALAT_MOCK_TIMELINE));
    syncTripSummaryStats('trip_124', timelinesStore.trip_124);
    return JSON.parse(JSON.stringify(timelinesStore.trip_124));
  }
  timelinesStore.trip_123 = JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE));
  syncTripSummaryStats('trip_123', timelinesStore.trip_123);
  return JSON.parse(JSON.stringify(timelinesStore.trip_123));
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
  let filtered = [...searchStore];

  if (request.trip_id) {
    filtered = filtered.filter((item) => item.trip_id === request.trip_id);
  }

  if (request.date_from) {
    filtered = filtered.filter((item) => item.taken_at.slice(0, 10) >= request.date_from!);
  }

  if (request.date_to) {
    filtered = filtered.filter((item) => item.taken_at.slice(0, 10) <= request.date_to!);
  }

  if (normalizedQuery) {
    const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 1);
    const scored = filtered.map((item) => {
      const searchableText = [
        item.stop.name.toLowerCase(),
        item.photo_id.toLowerCase(),
        ...(item.keywords ?? []),
      ].join(' ');

      const matchCount = queryTokens.filter((token) => searchableText.includes(token)).length;
      return {
        item,
        matchCount,
      };
    });

    const matchedOnly = scored.filter((s) => s.matchCount > 0);
    if (matchedOnly.length > 0) {
      matchedOnly.sort(
        (a, b) => b.matchCount - a.matchCount || b.item.similarity_score - a.item.similarity_score
      );
      filtered = matchedOnly.map((s) => s.item);
    } else {
      filtered.sort((a, b) => b.similarity_score - a.similarity_score);
    }
  }

  const topK = request.top_k ?? 20;
  return {
    query: request.query,
    results: filtered.slice(0, topK).map(({ keywords: _kw, ...rest }) => rest),
  };
}
