/**
 * Tầng Giao tiếp Dữ liệu Linh hoạt (Repository Pattern) — src/services/tripRepository.ts
 * Đóng gói toàn bộ lời gọi dữ liệu với công tắc chuyển đổi giữa:
 *   1. LOCAL_SMART_MOCK (Mặc định): Xử lý trực tiếp trên thiết bị (Haversine Spatio-Temporal + AsyncStorage bền vững)
 *   2. REMOTE_FASTAPI: Kết nối tới FastAPI Backend qua apiClient.ts, tự động fallback về LOCAL_SMART_MOCK
 *      nếu Backend chưa bật hoặc mất kết nối mạng.
 */

import { API_BASE_URL, apiClient } from '@/services/apiClient';
import * as localMockApi from '@/services/mockApi';
import { loadDataSourceMode, saveDataSourceMode } from '@/services/storage';
import {
  DataSourceMode,
  PhotoItem,
  ProcessingJobResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  StopMutateRequest,
  TripSummary,
  TripTimeline,
  UsabilityTripReport,
} from '@/types/trip';

let currentMode: DataSourceMode = 'LOCAL_SMART_MOCK';
let modeInitialized = false;
let fallbackTriggered = false;

export interface RepositoryStatusInfo {
  mode: DataSourceMode;
  fallbackTriggered: boolean;
  apiBaseUrl: string;
}

async function ensureModeLoaded(): Promise<DataSourceMode> {
  if (!modeInitialized) {
    currentMode = await loadDataSourceMode();
    modeInitialized = true;
  }
  return currentMode;
}

export async function getRepositoryMode(): Promise<DataSourceMode> {
  return ensureModeLoaded();
}

export async function setRepositoryMode(mode: DataSourceMode): Promise<RepositoryStatusInfo> {
  currentMode = mode;
  modeInitialized = true;
  fallbackTriggered = false;
  await saveDataSourceMode(mode);
  return {
    mode: currentMode,
    fallbackTriggered,
    apiBaseUrl: API_BASE_URL,
  };
}

export async function toggleRepositoryMode(): Promise<RepositoryStatusInfo> {
  const mode = await ensureModeLoaded();
  const nextMode: DataSourceMode =
    mode === 'LOCAL_SMART_MOCK' ? 'REMOTE_FASTAPI' : 'LOCAL_SMART_MOCK';
  return setRepositoryMode(nextMode);
}

export function getRepositoryStatusSnapshot(): RepositoryStatusInfo {
  return {
    mode: currentMode,
    fallbackTriggered,
    apiBaseUrl: API_BASE_URL,
  };
}

/**
 * Helper thực thi lời gọi Remote FastAPI kèm cơ chế tự động Fallback về Local Smart Engine
 */
async function executeWithSmartFallback<T>(
  remoteCall: () => Promise<T>,
  localCall: () => Promise<T>
): Promise<T> {
  const mode = await ensureModeLoaded();
  if (mode === 'LOCAL_SMART_MOCK') {
    return localCall();
  }

  try {
    const response = await remoteCall();
    fallbackTriggered = false;
    return response;
  } catch {
    // Tự động fallback về Local Smart Mock khi FastAPI của Thành viên 2 chưa bật
    fallbackTriggered = true;
    return localCall();
  }
}

export const tripRepository = {
  getMode: getRepositoryMode,
  setMode: setRepositoryMode,
  toggleMode: toggleRepositoryMode,
  getStatusSnapshot: getRepositoryStatusSnapshot,

  /**
   * GET /api/v1/trips
   */
  async getTrips(): Promise<TripSummary[]> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.get<TripSummary[]>('/trips');
        return res.data;
      },
      () => localMockApi.getTrips()
    );
  },

  /**
   * GET /api/v1/trips/{trip_id}/timeline
   */
  async getTripTimeline(tripId: string): Promise<TripTimeline> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.get<TripTimeline>(`/trips/${tripId}/timeline`);
        return res.data;
      },
      () => localMockApi.getTripTimeline(tripId)
    );
  },

  /**
   * POST /api/v1/trips/{trip_id}/photos
   */
  async uploadTripPhotos(
    tripId: string,
    photoUris: string[] = []
  ): Promise<ProcessingJobResponse> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.post<ProcessingJobResponse>(`/trips/${tripId}/photos`, {
          photo_uris: photoUris,
        });
        return res.data;
      },
      () => localMockApi.uploadTripPhotos(tripId, photoUris)
    );
  },

  /**
   * GET /api/v1/jobs/{job_id}
   */
  async getJobStatus(
    jobId: string,
    simulatedProgress: number = 100,
    tripId: string = 'trip_123'
  ): Promise<ProcessingJobResponse> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.get<ProcessingJobResponse>(`/jobs/${jobId}`);
        return res.data;
      },
      () => localMockApi.getJobStatus(jobId, simulatedProgress, tripId)
    );
  },

  /**
   * Phân cụm Không gian - Thời gian trực tiếp (Haversine + Temporal) và khởi tạo chuyến đi mới
   */
  async createTripFromUploadedPhotos(params: {
    title?: string;
    photos: PhotoItem[];
  }): Promise<TripTimeline> {
    return localMockApi.createTripFromUploadedPhotos(params);
  },

  /**
   * PATCH /api/v1/trips/{trip_id}/stops/mutate
   */
  async mutateTripStops(
    tripId: string,
    payload: StopMutateRequest
  ): Promise<TripTimeline> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.patch<TripTimeline>(
          `/trips/${tripId}/stops/mutate`,
          payload
        );
        return res.data;
      },
      () => localMockApi.mutateTripStops(tripId, payload)
    );
  },

  /**
   * POST /api/v1/search
   */
  async searchPhotosSemantic(
    request: SemanticSearchRequest
  ): Promise<SemanticSearchResponse> {
    return executeWithSmartFallback(
      async () => {
        const res = await apiClient.post<SemanticSearchResponse>('/search', request);
        return res.data;
      },
      () => localMockApi.searchPhotosSemantic(request)
    );
  },

  /**
   * Lấy báo cáo thực nghiệm Usability (Mục 9.7)
   */
  async getTripUsabilityReport(tripId: string): Promise<UsabilityTripReport> {
    return localMockApi.getTripUsabilityReport(tripId);
  },

  /**
   * Khôi phục dữ liệu của 1 chuyến đi
   */
  async resetTripTimeline(tripId: string): Promise<TripTimeline> {
    return localMockApi.resetMockTimeline(tripId);
  },

  /**
   * Khôi phục toàn bộ dữ liệu mẫu ban đầu của ứng dụng
   */
  async resetAllMockDataToDefaults(): Promise<TripSummary[]> {
    return localMockApi.resetAllMockDataToDefaults();
  },
};
