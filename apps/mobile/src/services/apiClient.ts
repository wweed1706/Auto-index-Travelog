import axios from 'axios';

/**
 * Cấu hình Axios HTTP Client chuẩn bị cho việc kết nối với FastAPI Backend ở Giai đoạn 4.
 * Lưu ý: Trên thiết bị vật lý, đặt EXPO_PUBLIC_API_BASE_URL trỏ tới LAN IP của máy phát triển.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
