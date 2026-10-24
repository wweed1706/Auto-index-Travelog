/**
 * Mock Data, Spatio-Temporal Clustering Engine & Persistent State Service
 * Tuân thủ Hợp đồng Giao tiếp API (docs/api-contract.md)
 * Tích hợp lưu trữ bền vững AsyncStorage & Thuật toán phân cụm Haversine Spatio-Temporal cho ảnh thật.
 */

import {
  clearAllPersistedTripData,
  loadPersistedAppState,
  savePersistedAppState,
} from '@/services/storage';
import {
  Coordinates,
  PhotoItem,
  ProcessingJobResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  SemanticSearchResultItem,
  StopMutateAction,
  StopMutateRequest,
  TripDay,
  TripStop,
  TripSummary,
  TripTimeline,
  UsabilityActionCounts,
  UsabilityEditLogEntry,
  UsabilityTripReport,
} from '@/types/trip';

const SIMULATED_DELAY_MS = 180;

function delay(ms: number = SIMULATED_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tính khoảng cách thực tế trên mặt cầu Trái Đất giữa 2 tọa độ GPS (Công thức Haversine - đơn vị: mét)
 */
export function computeHaversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));

  return EARTH_RADIUS_M * c;
}

/**
 * Tính độ lệch thời gian (phút) giữa 2 chuỗi thời gian ISO-8601
 */
export function computeTimeDiffMinutes(isoStart: string, isoEnd: string): number {
  const t1 = new Date(isoStart).getTime();
  const t2 = new Date(isoEnd).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) {
    return 0;
  }
  return Math.abs(t2 - t1) / (1000 * 60);
}

/**
 * Tính tọa độ tâm (Centroid) từ các ảnh có GPS hợp lệ trong điểm dừng.
 * Ảnh thiếu GPS (latitude/longitude === null) được bỏ qua khi tính trung bình và giữ nguyên null.
 */
export function computeCentroid(
  photos: PhotoItem[],
  fallback: Coordinates | null = null
): Coordinates | null {
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
 * Cơ sở dữ liệu địa danh thực tế tại Việt Nam để tự động gợi ý tên Điểm dừng từ tọa độ EXIF thật
 */
const KNOWN_VIETNAM_POIS: {
  name: string;
  coords: Coordinates;
  radiusMeters: number;
  keywords: string[];
}[] = [
  {
    name: 'Bãi Sau Thùy Vân • Vũng Tàu',
    coords: { latitude: 10.34599, longitude: 107.08426 },
    radiusMeters: 900,
    keywords: ['vũng tàu', 'bãi biển', 'bãi sau', 'sóng biển', 'cát trắng'],
  },
  {
    name: 'Tượng Chúa Kitô Vua • Núi Nhỏ',
    coords: { latitude: 10.32639, longitude: 107.08389 },
    radiusMeters: 750,
    keywords: ['vũng tàu', 'tượng chúa', 'núi nhỏ', 'toàn cảnh'],
  },
  {
    name: 'Mũi Nghinh Phong • Vũng Tàu',
    coords: { latitude: 10.3245, longitude: 107.0831 },
    radiusMeters: 750,
    keywords: ['mũi đá', 'nghinh phong', 'hoàng hôn', 'biển', 'buổi chiều'],
  },
  {
    name: 'Ngọn Hải Đăng Vũng Tàu',
    coords: { latitude: 10.33582, longitude: 107.07668 },
    radiusMeters: 850,
    keywords: ['hải đăng', 'đồi', 'toàn cảnh', 'vũng tàu'],
  },
  {
    name: 'Chợ Hải Sản Xóm Lưới',
    coords: { latitude: 10.3412, longitude: 107.0725 },
    radiusMeters: 700,
    keywords: ['ẩm thực', 'hải sản', 'món ăn', 'chợ', 'địa phương'],
  },
  {
    name: 'Đồi Chè Cầu Đất • Đà Lạt',
    coords: { latitude: 11.8698, longitude: 108.5632 },
    radiusMeters: 2500,
    keywords: ['đà lạt', 'đồi chè', 'sương mù', 'rừng thông', 'bình minh'],
  },
  {
    name: 'Hồ Tuyền Lâm • Đà Lạt',
    coords: { latitude: 11.9025, longitude: 108.4318 },
    radiusMeters: 2200,
    keywords: ['đà lạt', 'hồ tuyền lâm', 'rừng thông', 'mặt hồ'],
  },
  {
    name: 'Quảng trường Lâm Viên • Đà Lạt',
    coords: { latitude: 11.9404, longitude: 108.4451 },
    radiusMeters: 1500,
    keywords: ['đà lạt', 'quảng trường', 'hồ xuân hương', 'trung tâm'],
  },
  {
    name: 'Đại học Tôn Đức Thắng • Quận 7',
    coords: { latitude: 10.7326, longitude: 106.6998 },
    radiusMeters: 1200,
    keywords: ['tdtu', 'tôn đức thắng', 'sài gòn', 'khuôn viên'],
  },
  {
    name: 'Bến Bạch Đằng & Phố đi bộ Nguyễn Huệ',
    coords: { latitude: 10.7738, longitude: 106.7041 },
    radiusMeters: 1800,
    keywords: ['sài gòn', 'trung tâm', 'bến bạch đằng', 'thành phố'],
  },
  {
    name: 'Hồ Hoàn Kiếm & Phố Cổ Hà Nội',
    coords: { latitude: 21.0285, longitude: 105.8542 },
    radiusMeters: 2500,
    keywords: ['hà nội', 'hồ gươm', 'phố cổ', 'mùa thu'],
  },
  {
    name: 'Bán đảo Sơn Trà & Biển Mỹ Khê • Đà Nẵng',
    coords: { latitude: 16.0544, longitude: 108.2478 },
    radiusMeters: 5000,
    keywords: ['đà nẵng', 'biển mỹ khê', 'sơn trà', 'cầu rồng'],
  },
  {
    name: 'Phố Cổ Hội An • Quảng Nam',
    coords: { latitude: 15.8801, longitude: 108.338 },
    radiusMeters: 3500,
    keywords: ['hội an', 'phố cổ', 'đèn lồng', 'sông hoài'],
  },
  {
    name: 'Vịnh Nha Trang • Khánh Hòa',
    coords: { latitude: 12.2388, longitude: 109.1967 },
    radiusMeters: 5000,
    keywords: ['nha trang', 'biển', 'vịnh biển', 'nắng vàng'],
  },
  {
    name: 'Đảo Ngọc Phú Quốc • Kiên Giang',
    coords: { latitude: 10.2899, longitude: 103.984 },
    radiusMeters: 15000,
    keywords: ['phú quốc', 'hoàng hôn', 'biển đảo', 'bãi biển'],
  },
];

function getTimeOfDayLabel(isoTime: string): { label: string; keywords: string[] } {
  const timePart = isoTime.includes('T') ? isoTime.split('T')[1] : '';
  const hour = Number(timePart.slice(0, 2));
  if (Number.isNaN(hour)) {
    return { label: 'Khoảnh khắc Hành trình', keywords: ['hành trình', 'kỷ niệm'] };
  }
  if (hour >= 5 && hour < 8) {
    return { label: 'Bình minh', keywords: ['bình minh', 'buổi sáng', 'nắng sớm'] };
  }
  if (hour >= 8 && hour < 11) {
    return { label: 'Buổi sáng', keywords: ['buổi sáng', 'nắng vàng', 'khám phá'] };
  }
  if (hour >= 11 && hour < 14) {
    return { label: 'Buổi trưa & Ẩm thực', keywords: ['buổi trưa', 'ẩm thực', 'món ăn', 'nghỉ trưa'] };
  }
  if (hour >= 14 && hour < 17) {
    return { label: 'Dạo bước Buổi chiều', keywords: ['buổi chiều', 'dạo phố', 'phong cảnh'] };
  }
  if (hour >= 17 && hour < 19) {
    return { label: 'Ngắm Hoàng hôn', keywords: ['hoàng hôn', 'buổi chiều', 'bầu trời'] };
  }
  return { label: 'Khám phá Đêm', keywords: ['buổi tối', 'ánh đèn', 'đêm'] };
}

function inferStopMetadata(
  centroid: Coordinates | null,
  hasRealGps: boolean,
  startTime: string,
  stopIndexInDay: number
): { name: string; keywords: string[] } {
  const timeMeta = getTimeOfDayLabel(startTime);

  if (centroid && hasRealGps) {
    let bestMatch: (typeof KNOWN_VIETNAM_POIS)[number] | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const poi of KNOWN_VIETNAM_POIS) {
      const dist = computeHaversineDistanceMeters(centroid, poi.coords);
      if (dist <= poi.radiusMeters && dist < bestDist) {
        bestMatch = poi;
        bestDist = dist;
      }
    }

    if (bestMatch) {
      return {
        name: bestMatch.name,
        keywords: [...bestMatch.keywords, ...timeMeta.keywords],
      };
    }

    return {
      name: `Điểm dừng #${stopIndexInDay} • ${timeMeta.label} (${centroid.latitude.toFixed(3)}°N, ${centroid.longitude.toFixed(3)}°E)`,
      keywords: [
        ...timeMeta.keywords,
        'ảnh thật thiết bị',
        'tọa độ thực tế',
        'biển',
        'phong cảnh',
      ],
    };
  }

  return {
    name: `Điểm dừng #${stopIndexInDay} • ${timeMeta.label} (Chờ gắn vị trí)`,
    keywords: [...timeMeta.keywords, 'ảnh thiếu gps', 'kỷ niệm'],
  };
}

export interface SpatioTemporalClusterOptions {
  /** Bán kính không gian tối đa (mét) tính bằng Haversine để gộp ảnh vào cùng điểm dừng */
  maxDistanceMeters?: number;
  /** Khoảng cách thời gian tối đa (phút) giữa 2 ảnh liên tiếp trong cùng điểm dừng */
  maxTimeGapMinutes?: number;
  /** Ngưỡng thời gian (phút) để gộp ảnh khuyết GPS (null) vào điểm dừng hiện tại */
  missingGpsTimeThresholdMinutes?: number;
}

/**
 * THUẬT TOÁN GOM CỤM KHÔNG GIAN - THỜI GIAN THỰC TẾ (SPATIO-TEMPORAL CLUSTERING)
 * Chia danh sách ảnh thật theo Ngày (TripDay) và gom cụm thành các Điểm dừng (TripStop)
 * dựa trên khoảng cách Haversine (mét) và độ lệch thời gian chụp (phút).
 */
export function clusterPhotosSpatioTemporal(
  tripId: string,
  photos: PhotoItem[],
  options: SpatioTemporalClusterOptions = {}
): {
  days: TripDay[];
  indexedSearchItems: (SemanticSearchResultItem & { keywords?: string[] })[];
} {
  const maxDistanceMeters = options.maxDistanceMeters ?? 350;
  const maxTimeGapMinutes = options.maxTimeGapMinutes ?? 180;
  const missingGpsTimeThresholdMinutes = options.missingGpsTimeThresholdMinutes ?? 90;

  const sortedPhotos = [...photos].sort((a, b) => a.taken_at.localeCompare(b.taken_at));

  // Bước 1: Phân tách theo ngày lịch (YYYY-MM-DD)
  const dayBuckets = new Map<string, PhotoItem[]>();
  for (const photo of sortedPhotos) {
    const dateStr = photo.taken_at.slice(0, 10) || '2026-10-24';
    const bucket = dayBuckets.get(dateStr) ?? [];
    bucket.push(photo);
    dayBuckets.set(dateStr, bucket);
  }

  // Tọa độ hiển thị mặc định cho điểm dừng khi toàn bộ ảnh trong cụm đều khuyết GPS (null)
  // Lưu ý: Từng bức ảnh PhotoItem vẫn giữ nguyên latitude: null, longitude: null.
  const fallbackCentroids: Coordinates[] = [
    { latitude: 10.34599, longitude: 107.08426 },
    { latitude: 10.33582, longitude: 107.07668 },
    { latitude: 10.32639, longitude: 107.08389 },
    { latitude: 10.3245, longitude: 107.0831 },
  ];

  const days: TripDay[] = [];
  const indexedSearchItems: (SemanticSearchResultItem & { keywords?: string[] })[] = [];

  let dayNumber = 1;
  let globalStopSeq = 0;
  let lastValidDayCentroid: Coordinates | null = null;

  dayBuckets.forEach((dayPhotos, dateStr) => {
    const rawClusters: PhotoItem[][] = [];

    for (const photo of dayPhotos) {
      if (rawClusters.length === 0) {
        rawClusters.push([photo]);
        continue;
      }

      const currentCluster = rawClusters[rawClusters.length - 1];
      const prevPhoto = currentCluster[currentCluster.length - 1];
      const timeGapMin = computeTimeDiffMinutes(prevPhoto.taken_at, photo.taken_at);

      const photoHasGps = photo.latitude !== null && photo.longitude !== null;
      const currentCentroid = computeCentroid(currentCluster, null);

      if (photoHasGps && currentCentroid) {
        const distMeters = computeHaversineDistanceMeters(currentCentroid, {
          latitude: photo.latitude!,
          longitude: photo.longitude!,
        });

        // Cùng điểm dừng nếu nằm trong bán kính Haversine <= maxDistanceMeters VÀ thời gian <= maxTimeGapMinutes
        if (distMeters <= maxDistanceMeters && timeGapMin <= maxTimeGapMinutes) {
          currentCluster.push(photo);
        } else {
          rawClusters.push([photo]);
        }
      } else if (!photoHasGps) {
        // Ảnh khuyết GPS (latitude: null): Gộp vào điểm dừng đang diễn ra nếu chụp gần nhau về thời gian
        if (timeGapMin <= missingGpsTimeThresholdMinutes) {
          currentCluster.push(photo);
        } else {
          rawClusters.push([photo]);
        }
      } else {
        // Cụm hiện tại chưa có GPS nhưng bức ảnh mới có GPS: gộp nếu chụp liền kề về mặt thời gian
        if (timeGapMin <= missingGpsTimeThresholdMinutes) {
          currentCluster.push(photo);
        } else {
          rawClusters.push([photo]);
        }
      }
    }

    const stops: TripStop[] = [];

    rawClusters.forEach((clusterPhotos, clusterIdx) => {
      globalStopSeq += 1;
      const stopOrder = clusterIdx + 1;
      const realCentroid = computeCentroid(clusterPhotos, null);
      if (realCentroid) {
        lastValidDayCentroid = realCentroid;
      }

      const effectiveCentroid =
        realCentroid ??
        (lastValidDayCentroid
          ? {
              latitude: Number((lastValidDayCentroid.latitude + 0.0018 * stopOrder).toFixed(5)),
              longitude: Number((lastValidDayCentroid.longitude + 0.0015 * stopOrder).toFixed(5)),
            }
          : fallbackCentroids[(globalStopSeq - 1) % fallbackCentroids.length]);

      const firstTakenAt = clusterPhotos[0].taken_at;
      const lastTakenAt = clusterPhotos[clusterPhotos.length - 1].taken_at;
      const stopId = `${tripId}_stop_${String(globalStopSeq).padStart(2, '0')}`;

      const { name: stopName, keywords } = inferStopMetadata(
        effectiveCentroid,
        realCentroid !== null,
        firstTakenAt,
        stopOrder
      );

      stops.push({
        stop_id: stopId,
        order_index: stopOrder,
        name: stopName,
        start_time: firstTakenAt,
        end_time: lastTakenAt,
        centroid: effectiveCentroid,
        is_user_confirmed: false,
        photos: clusterPhotos,
      });

      if (effectiveCentroid) {
        clusterPhotos.forEach((p, pIdx) => {
          indexedSearchItems.push({
            photo_id: p.photo_id,
            thumbnail_url: p.thumbnail_url,
            similarity_score: Number(Math.max(0.76, 0.95 - pIdx * 0.03).toFixed(2)),
            taken_at: p.taken_at,
            trip_id: tripId,
            day_number: dayNumber,
            stop: {
              stop_id: stopId,
              name: stopName,
              latitude: effectiveCentroid.latitude,
              longitude: effectiveCentroid.longitude,
            },
            keywords: [
              ...keywords,
              stopName.toLowerCase(),
              dateStr,
              p.latitude !== null ? 'gps verified' : 'gps unknown',
            ],
          });
        });
      }
    });

    days.push({
      day_number: dayNumber,
      date: dateStr,
      stops,
    });
    dayNumber += 1;
  });

  return { days, indexedSearchItems };
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
    photo_count: 5,
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

export const DALAT_MOCK_TIMELINE: TripTimeline = {
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

// Kho lưu trữ trạng thái trong bộ nhớ được đồng bộ 2 chiều với AsyncStorage
let tripsStore: TripSummary[] = JSON.parse(JSON.stringify(MOCK_TRIPS));
let timelinesStore: Record<string, TripTimeline> = {
  trip_123: JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE)),
  trip_124: JSON.parse(JSON.stringify(DALAT_MOCK_TIMELINE)),
};
let searchStore = JSON.parse(JSON.stringify(MOCK_SEARCH_RESULTS)) as (SemanticSearchResultItem & {
  keywords?: string[];
})[];
let editHistoryStore: Record<string, UsabilityEditLogEntry[]> = {
  trip_123: [],
  trip_124: [],
};
let initialStopCountsStore: Record<string, number> = {
  trip_123: 5,
  trip_124: 3,
};

let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function ensureHydrated(): Promise<void> {
  if (isHydrated) return;
  if (hydrationPromise) {
    await hydrationPromise;
    return;
  }

  hydrationPromise = (async () => {
    const persisted = await loadPersistedAppState();
    if (persisted.trips && persisted.trips.length > 0) {
      tripsStore = persisted.trips;
    }
    if (persisted.timelines && Object.keys(persisted.timelines).length > 0) {
      timelinesStore = persisted.timelines;
    }
    if (persisted.searchIndex && persisted.searchIndex.length > 0) {
      searchStore = persisted.searchIndex;
    }
    if (persisted.editHistory) {
      editHistoryStore = persisted.editHistory;
    }
    if (persisted.initialStopCounts) {
      initialStopCountsStore = persisted.initialStopCounts;
    }
    isHydrated = true;
  })();

  await hydrationPromise;
}

async function persistCurrentState(): Promise<void> {
  await savePersistedAppState({
    trips: tripsStore,
    timelines: timelinesStore,
    searchIndex: searchStore,
    editHistory: editHistoryStore,
    initialStopCounts: initialStopCountsStore,
  });
}

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
  await ensureHydrated();
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
  await ensureHydrated();
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

  let message = 'Đang trích xuất metadata EXIF (DateTimeOriginal & GPS)...';
  if (clamped >= 100) {
    message = 'Hoàn tất phân cụm Haversine Spatio-Temporal & lập chỉ mục CLIP!';
  } else if (clamped >= 70) {
    message = 'Đang phân cụm không gian - thời gian (Haversine + Temporal Threshold)...';
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
 * Tạo chuyến đi mới từ danh sách ảnh thật đã chọn & trích xuất EXIF
 * Sử dụng thuật toán Spatio-Temporal Clustering thực tế (Haversine + Temporal Threshold)
 * và lưu bền vững vào AsyncStorage.
 */
export async function createTripFromUploadedPhotos(params: {
  title?: string;
  photos: PhotoItem[];
}): Promise<TripTimeline> {
  await ensureHydrated();
  await delay(180);

  const newTripId = `trip_${Date.now().toString().slice(-4)}`;
  const { days, indexedSearchItems } = clusterPhotosSpatioTemporal(newTripId, params.photos, {
    maxDistanceMeters: 350,
    maxTimeGapMinutes: 180,
    missingGpsTimeThresholdMinutes: 90,
  });

  // Đưa các ảnh vừa phân cụm vào đầu kho tìm kiếm ngữ nghĩa CLIP
  for (let i = indexedSearchItems.length - 1; i >= 0; i -= 1) {
    searchStore.unshift(indexedSearchItems[i]);
  }

  const startDate = days[0]?.date ?? '2026-10-24';
  const endDate = days[days.length - 1]?.date ?? startDate;
  const totalStops = days.reduce((acc, d) => acc + d.stops.length, 0);
  const tripTitle = params.title?.trim() || `Hành trình Mới (${params.photos.length} ảnh)`;

  const newTimeline: TripTimeline = {
    trip_id: newTripId,
    title: tripTitle,
    start_date: startDate,
    end_date: endDate,
    days,
  };

  timelinesStore[newTripId] = newTimeline;
  editHistoryStore[newTripId] = [];
  initialStopCountsStore[newTripId] = totalStops;

  const firstCoverUrl =
    days[0]?.stops[0]?.photos[0]?.thumbnail_url ??
    params.photos[0]?.thumbnail_url ??
    MOCK_TRIPS[0].cover_thumbnail_url;

  tripsStore.unshift({
    trip_id: newTripId,
    title: tripTitle,
    start_date: startDate,
    end_date: endDate,
    cover_thumbnail_url: firstCoverUrl,
    photo_count: params.photos.length,
    stop_count: totalStops,
    days_count: days.length,
    status: 'COMPLETED',
  });

  await persistCurrentState();
  return JSON.parse(JSON.stringify(newTimeline));
}

/**
 * GET /api/v1/trips/{trip_id}/timeline
 */
export async function getTripTimeline(tripId: string): Promise<TripTimeline> {
  await ensureHydrated();
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
 * Ghi nhận một thao tác chỉnh sửa Human-in-the-Loop vào lịch sử Usability (Mục 9.7)
 */
function recordUsabilityEdit(
  tripId: string,
  action: StopMutateAction,
  description: string,
  payload: StopMutateRequest
) {
  const existing = editHistoryStore[tripId] ?? [];
  const entry: UsabilityEditLogEntry = {
    id: `edit_${Date.now()}_${existing.length + 1}`,
    trip_id: tripId,
    action,
    timestamp: new Date().toISOString(),
    description,
    source_stop_ids: payload.source_stop_ids,
    target_stop_id: payload.target_stop_id,
    photo_id: payload.photo_id,
  };
  editHistoryStore[tripId] = [entry, ...existing];
}

/**
 * PATCH /api/v1/trips/{trip_id}/stops/mutate
 * Hỗ trợ đầy đủ các thao tác Human-in-the-Loop (UC-10, UC-11):
 * MERGE, SPLIT, REORDER, RENAME, MOVE_PHOTO
 * Tự động ghi lịch sử Usability và lưu bền vững vào AsyncStorage.
 */
export async function mutateTripStops(
  tripId: string,
  payload: StopMutateRequest
): Promise<TripTimeline> {
  await ensureHydrated();
  await delay(150);

  const current = timelinesStore[tripId] ?? timelinesStore.trip_123;
  const nextState: TripTimeline = JSON.parse(JSON.stringify(current));
  let actionDescription = `Thực hiện ${payload.action}`;

  for (const day of nextState.days) {
    if (payload.action === 'RENAME' && payload.source_stop_ids.length > 0 && payload.new_name) {
      const targetId = payload.source_stop_ids[0];
      const stop = day.stops.find((s) => s.stop_id === targetId);
      if (stop) {
        const oldName = stop.name;
        stop.name = payload.new_name.trim();
        stop.is_user_confirmed = true;
        actionDescription = `Đổi tên "${oldName}" → "${stop.name}" (Ngày ${day.day_number})`;
      }
    } else if (payload.action === 'MERGE' && payload.source_stop_ids.length >= 2) {
      const targetStops = day.stops.filter((s) => payload.source_stop_ids.includes(s.stop_id));
      if (targetStops.length >= 2) {
        const firstStop = targetStops[0];
        const lastStop = targetStops[targetStops.length - 1];
        const mergedPhotos = targetStops.flatMap((s) => s.photos);
        const mergedCentroid = computeCentroid(mergedPhotos, firstStop.centroid);
        const mergedName = payload.new_name?.trim() || `${firstStop.name} & ${lastStop.name}`;

        const mergedStop: TripStop = {
          ...firstStop,
          name: mergedName,
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
        actionDescription = `Gộp "${firstStop.name}" + "${lastStop.name}" (${mergedPhotos.length} ảnh, Ngày ${day.day_number})`;
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
          actionDescription = `Tách "${originalStop.name}" thành 2 điểm dừng (${keptPhotos.length} ảnh & ${movedPhotos.length} ảnh)`;
        }
      }
    } else if (payload.action === 'REORDER' && payload.ordered_stop_ids) {
      const stopMap = new Map(day.stops.map((s) => [s.stop_id, s]));
      const reordered: TripStop[] = [];
      let matchedInThisDay = false;
      payload.ordered_stop_ids.forEach((id) => {
        const found = stopMap.get(id);
        if (found) {
          matchedInThisDay = true;
          reordered.push({ ...found, is_user_confirmed: true });
          stopMap.delete(id);
        }
      });
      if (matchedInThisDay) {
        stopMap.forEach((remaining) => reordered.push(remaining));
        day.stops = reordered.map((s, idx) => ({ ...s, order_index: idx + 1 }));
        actionDescription = `Đổi thứ tự ${day.stops.length} điểm dừng trong Ngày ${day.day_number}`;
      }
    }
  }

  // Hỗ trợ MOVE_PHOTO xuyên suốt mọi ngày trong chuyến đi (kể cả khác ngày)
  if (
    payload.action === 'MOVE_PHOTO' &&
    payload.source_stop_ids.length > 0 &&
    payload.target_stop_id &&
    payload.photo_id
  ) {
    const sourceId = payload.source_stop_ids[0];
    let sourceStop: TripStop | undefined;
    let targetStop: TripStop | undefined;

    for (const day of nextState.days) {
      const foundSource = day.stops.find((s) => s.stop_id === sourceId);
      if (foundSource) sourceStop = foundSource;
      const foundTarget = day.stops.find((s) => s.stop_id === payload.target_stop_id);
      if (foundTarget) targetStop = foundTarget;
    }

    if (sourceStop && targetStop && sourceStop.stop_id !== targetStop.stop_id) {
      const photoToMove = sourceStop.photos.find((p) => p.photo_id === payload.photo_id);
      if (photoToMove) {
        const sourceName = sourceStop.name;
        const targetName = targetStop.name;

        sourceStop.photos = sourceStop.photos.filter((p) => p.photo_id !== payload.photo_id);
        sourceStop.is_user_confirmed = true;
        if (sourceStop.photos.length > 0) {
          sourceStop.start_time = sourceStop.photos[0].taken_at;
          sourceStop.end_time = sourceStop.photos[sourceStop.photos.length - 1].taken_at;
        }
        sourceStop.centroid = computeCentroid(sourceStop.photos, sourceStop.centroid);

        targetStop.photos = [...targetStop.photos, photoToMove].sort((a, b) =>
          a.taken_at.localeCompare(b.taken_at)
        );
        targetStop.start_time = targetStop.photos[0].taken_at;
        targetStop.end_time = targetStop.photos[targetStop.photos.length - 1].taken_at;
        targetStop.centroid = computeCentroid(targetStop.photos, targetStop.centroid);
        targetStop.is_user_confirmed = true;

        // Loại bỏ điểm dừng rỗng nếu toàn bộ ảnh đã được chuyển đi
        for (const day of nextState.days) {
          day.stops = day.stops
            .filter((s) => s.photos.length > 0)
            .map((s, idx) => ({ ...s, order_index: idx + 1 }));
        }

        actionDescription = `Chuyển ảnh (${photoToMove.photo_id}) từ "${sourceName}" → "${targetName}"`;
      }
    }
  }

  recordUsabilityEdit(tripId, payload.action, actionDescription, payload);
  timelinesStore[tripId] = nextState;
  syncTripSummaryStats(tripId, nextState);
  await persistCurrentState();

  return JSON.parse(JSON.stringify(nextState));
}

/**
 * Lấy Báo cáo Thực nghiệm Usability chi tiết của chuyến đi (Phục vụ Báo cáo Mục 9.7)
 */
export async function getTripUsabilityReport(tripId: string): Promise<UsabilityTripReport> {
  await ensureHydrated();
  const timeline = timelinesStore[tripId] ?? timelinesStore.trip_123;
  const history = editHistoryStore[tripId] ?? [];

  const counts: UsabilityActionCounts = {
    MERGE: 0,
    SPLIT: 0,
    RENAME: 0,
    REORDER: 0,
    MOVE_PHOTO: 0,
  };

  for (const item of history) {
    counts[item.action] = (counts[item.action] ?? 0) + 1;
  }

  const allStops = timeline.days.flatMap((d) => d.stops);
  const allPhotos = allStops.flatMap((s) => s.photos);
  const gpsValidPhotos = allPhotos.filter(
    (p) => p.latitude !== null && p.longitude !== null
  ).length;
  const gpsMissingPhotos = allPhotos.length - gpsValidPhotos;
  const confirmedStops = allStops.filter((s) => s.is_user_confirmed).length;

  return {
    trip_id: timeline.trip_id,
    trip_title: timeline.title,
    total_edits: history.length,
    initial_stop_count: initialStopCountsStore[tripId] ?? allStops.length,
    current_stop_count: allStops.length,
    confirmed_stop_count: confirmedStops,
    total_photos: allPhotos.length,
    gps_valid_photos: gpsValidPhotos,
    gps_missing_photos: gpsMissingPhotos,
    counts_by_action: counts,
    history,
    last_updated_at: history[0]?.timestamp ?? null,
  };
}

/**
 * Sinh chuỗi Markdown chuẩn Học thuật từ Báo cáo Thực nghiệm Usability (Mục 9.7)
 */
export function formatUsabilityReportMarkdown(report: UsabilityTripReport): string {
  const c = report.counts_by_action;
  const historyLines =
    report.history.length > 0
      ? report.history
          .slice(0, 15)
          .map(
            (h, idx) =>
              `${idx + 1}. **[${h.action}]** (${h.timestamp.slice(11, 19)}) — ${h.description}`
          )
          .join('\n')
      : '- Chưa có thao tác chỉnh sửa nào (Kết quả phân cụm tự động đạt yêu cầu).';

  return [
    `### Báo cáo Thực nghiệm Usability (Mục 9.7) — ${report.trip_title}`,
    `- **Mã chuyến đi:** \`${report.trip_id}\``,
    `- **Tổng số ảnh:** ${report.total_photos} ảnh (${report.gps_valid_photos} có GPS hợp lệ • ${report.gps_missing_photos} khuyết GPS \`null\`)`,
    `- **Số điểm dừng tự động ban đầu:** ${report.initial_stop_count} điểm dừng`,
    `- **Số điểm dừng sau tinh chỉnh:** ${report.current_stop_count} điểm dừng (${report.confirmed_stop_count} đã xác nhận)`,
    `- **Tổng số thao tác Human-in-the-Loop:** **${report.total_edits}** thao tác`,
    ``,
    `| Thao tác (Action) | Mã UC | Số lần thực hiện |`,
    `| :--- | :---: | :---: |`,
    `| Gộp điểm dừng (\`MERGE\`) | UC-10 | ${c.MERGE} |`,
    `| Tách điểm dừng (\`SPLIT\`) | UC-10 | ${c.SPLIT} |`,
    `| Đổi thứ tự điểm dừng (\`REORDER\`) | UC-10 | ${c.REORDER} |`,
    `| Đổi tên điểm dừng (\`RENAME\`) | UC-11 | ${c.RENAME} |`,
    `| Chuyển ảnh giữa các điểm dừng (\`MOVE_PHOTO\`) | UC-11 | ${c.MOVE_PHOTO} |`,
    ``,
    `#### Nhật ký thao tác chi tiết:`,
    historyLines,
  ].join('\n');
}

/**
 * Khôi phục dữ liệu Timeline của một chuyến đi về trạng thái ban đầu & lưu AsyncStorage
 */
export async function resetMockTimeline(tripId: string = 'trip_123'): Promise<TripTimeline> {
  await ensureHydrated();

  if (tripId === 'trip_124') {
    timelinesStore.trip_124 = JSON.parse(JSON.stringify(DALAT_MOCK_TIMELINE));
    editHistoryStore.trip_124 = [];
    initialStopCountsStore.trip_124 = 3;
    syncTripSummaryStats('trip_124', timelinesStore.trip_124);
    await persistCurrentState();
    return JSON.parse(JSON.stringify(timelinesStore.trip_124));
  }

  if (tripId === 'trip_123') {
    timelinesStore.trip_123 = JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE));
    editHistoryStore.trip_123 = [];
    initialStopCountsStore.trip_123 = 5;
    syncTripSummaryStats('trip_123', timelinesStore.trip_123);
    await persistCurrentState();
    return JSON.parse(JSON.stringify(timelinesStore.trip_123));
  }

  // Với chuyến đi mới tạo từ ảnh thật: gom cụm lại từ toàn bộ các bức ảnh hiện có của chuyến đi đó
  const existingTimeline = timelinesStore[tripId];
  if (existingTimeline) {
    const allPhotos = existingTimeline.days.flatMap((d) => d.stops.flatMap((s) => s.photos));
    const { days } = clusterPhotosSpatioTemporal(tripId, allPhotos);
    const reclustered: TripTimeline = {
      ...existingTimeline,
      days,
    };
    timelinesStore[tripId] = reclustered;
    editHistoryStore[tripId] = [];
    initialStopCountsStore[tripId] = days.reduce((acc, d) => acc + d.stops.length, 0);
    syncTripSummaryStats(tripId, reclustered);
    await persistCurrentState();
    return JSON.parse(JSON.stringify(reclustered));
  }

  return JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE));
}

/**
 * Khôi phục toàn bộ ứng dụng về dữ liệu mẫu gốc (Xóa các chuyến đi tự thêm & reset AsyncStorage)
 * Phục vụ nút "Khôi phục dữ liệu mẫu" khi cần demo nhanh.
 */
export async function resetAllMockDataToDefaults(): Promise<TripSummary[]> {
  tripsStore = JSON.parse(JSON.stringify(MOCK_TRIPS));
  timelinesStore = {
    trip_123: JSON.parse(JSON.stringify(INITIAL_MOCK_TIMELINE)),
    trip_124: JSON.parse(JSON.stringify(DALAT_MOCK_TIMELINE)),
  };
  searchStore = JSON.parse(JSON.stringify(MOCK_SEARCH_RESULTS));
  editHistoryStore = {
    trip_123: [],
    trip_124: [],
  };
  initialStopCountsStore = {
    trip_123: 5,
    trip_124: 3,
  };
  isHydrated = true;

  await clearAllPersistedTripData();
  await persistCurrentState();

  return JSON.parse(JSON.stringify(tripsStore));
}

/**
 * POST /api/v1/search
 * Tìm kiếm ảnh bằng ngôn ngữ tự nhiên kết hợp bộ lọc
 */
export async function searchPhotosSemantic(
  request: SemanticSearchRequest
): Promise<SemanticSearchResponse> {
  await ensureHydrated();
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
