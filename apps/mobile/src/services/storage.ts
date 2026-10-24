/**
 * Tầng Lưu trữ Bền vững (Persistent Storage) sử dụng @react-native-async-storage/async-storage
 * Đảm bảo toàn bộ danh sách chuyến đi, dòng thời gian, ảnh đã chọn từ thiết bị,
 * các thao tác Human-in-the-Loop (MERGE, SPLIT, RENAME, REORDER, MOVE_PHOTO)
 * và lịch sử thực nghiệm Usability (Mục 9.7) được bảo toàn khi tắt/mở lại ứng dụng.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DataSourceMode,
  PhotoItem,
  SemanticSearchResultItem,
  TripSummary,
  TripTimeline,
  UsabilityEditLogEntry,
} from '@/types/trip';

export const STORAGE_KEYS = {
  TRIPS: '@retrip_v2/trips_store',
  TIMELINES: '@retrip_v2/timelines_store',
  SEARCH_INDEX: '@retrip_v2/search_store',
  EDIT_HISTORY: '@retrip_v2/usability_edit_history',
  INITIAL_STOP_COUNTS: '@retrip_v2/initial_stop_counts',
  SELECTED_DEVICE_BATCH: '@retrip_v2/selected_device_batch',
  DATA_SOURCE_MODE: '@retrip_v2/data_source_mode',
} as const;

export interface PersistedDeviceBatch {
  title: string;
  sourceLabel: string;
  photos: PhotoItem[];
  savedAt: string;
}

export interface PersistedAppState {
  trips: TripSummary[] | null;
  timelines: Record<string, TripTimeline> | null;
  searchIndex: (SemanticSearchResultItem & { keywords?: string[] })[] | null;
  editHistory: Record<string, UsabilityEditLogEntry[]> | null;
  initialStopCounts: Record<string, number> | null;
}

async function safeGetJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function safeSetJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua lỗi ghi bộ nhớ trong môi trường hạn chế
  }
}

/**
 * Đọc toàn bộ trạng thái đã lưu từ AsyncStorage khi khởi động
 */
export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const [trips, timelines, searchIndex, editHistory, initialStopCounts] = await Promise.all([
    safeGetJson<TripSummary[]>(STORAGE_KEYS.TRIPS),
    safeGetJson<Record<string, TripTimeline>>(STORAGE_KEYS.TIMELINES),
    safeGetJson<(SemanticSearchResultItem & { keywords?: string[] })[]>(STORAGE_KEYS.SEARCH_INDEX),
    safeGetJson<Record<string, UsabilityEditLogEntry[]>>(STORAGE_KEYS.EDIT_HISTORY),
    safeGetJson<Record<string, number>>(STORAGE_KEYS.INITIAL_STOP_COUNTS),
  ]);

  return {
    trips,
    timelines,
    searchIndex,
    editHistory,
    initialStopCounts,
  };
}

/**
 * Lưu đồng bộ trạng thái chuyến đi, dòng thời gian, chỉ mục tìm kiếm và lịch sử chỉnh sửa
 */
export async function savePersistedAppState(state: {
  trips: TripSummary[];
  timelines: Record<string, TripTimeline>;
  searchIndex: (SemanticSearchResultItem & { keywords?: string[] })[];
  editHistory: Record<string, UsabilityEditLogEntry[]>;
  initialStopCounts: Record<string, number>;
}): Promise<void> {
  await Promise.all([
    safeSetJson(STORAGE_KEYS.TRIPS, state.trips),
    safeSetJson(STORAGE_KEYS.TIMELINES, state.timelines),
    safeSetJson(STORAGE_KEYS.SEARCH_INDEX, state.searchIndex),
    safeSetJson(STORAGE_KEYS.EDIT_HISTORY, state.editHistory),
    safeSetJson(STORAGE_KEYS.INITIAL_STOP_COUNTS, state.initialStopCounts),
  ]);
}

/**
 * Lưu lô ảnh vừa chọn từ thiết bị (expo-image-picker) để bảo toàn khi mở lại màn hình Upload
 */
export async function saveSelectedDeviceBatch(batch: PersistedDeviceBatch): Promise<void> {
  await safeSetJson(STORAGE_KEYS.SELECTED_DEVICE_BATCH, batch);
}

/**
 * Đọc lô ảnh đã chọn từ thiết bị gần nhất
 */
export async function loadSelectedDeviceBatch(): Promise<PersistedDeviceBatch | null> {
  return safeGetJson<PersistedDeviceBatch>(STORAGE_KEYS.SELECTED_DEVICE_BATCH);
}

/**
 * Lưu chế độ nguồn dữ liệu (LOCAL_SMART_MOCK | REMOTE_FASTAPI)
 */
export async function saveDataSourceMode(mode: DataSourceMode): Promise<void> {
  await safeSetJson(STORAGE_KEYS.DATA_SOURCE_MODE, mode);
}

/**
 * Đọc chế độ nguồn dữ liệu đã lưu
 */
export async function loadDataSourceMode(): Promise<DataSourceMode> {
  const mode = await safeGetJson<DataSourceMode>(STORAGE_KEYS.DATA_SOURCE_MODE);
  if (mode === 'REMOTE_FASTAPI' || mode === 'LOCAL_SMART_MOCK') {
    return mode;
  }
  return 'LOCAL_SMART_MOCK';
}

/**
 * Xóa toàn bộ dữ liệu tùy chỉnh trong AsyncStorage để khôi phục dữ liệu mẫu ban đầu
 */
export async function clearAllPersistedTripData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRIPS,
      STORAGE_KEYS.TIMELINES,
      STORAGE_KEYS.SEARCH_INDEX,
      STORAGE_KEYS.EDIT_HISTORY,
      STORAGE_KEYS.INITIAL_STOP_COUNTS,
      STORAGE_KEYS.SELECTED_DEVICE_BATCH,
    ]);
  } catch {
    // Ignore storage removal errors
  }
}
