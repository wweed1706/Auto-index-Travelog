import { ViewStyle } from 'react-native';

/**
 * Hệ thống Thiết kế Giao diện (UI/UX Design System) — ReTrip Mobile
 * Chủ đề: "Modern Wanderlust" (Lấy cảm hứng từ Polarsteps, Airbnb & Apple Photos)
 * Quy chuẩn theo tài liệu: docs/ui-design-system.md
 */

export const Palette = {
  // Background & Surface
  bgPrimary: '#F8FAFC', // Slate 50 - Nền tổng thể dịu mắt
  bgSecondary: '#F1F5F9', // Slate 100 - Nền phụ / ô input
  surface: '#FFFFFF', // Trắng tinh khiết cho các thẻ Card
  border: '#E2E8F0', // Slate 200 - Viền mảnh
  borderStrong: '#CBD5E1', // Slate 300

  // Primary Brand (Ocean Teal) — Nút chính, tuyến đường Polyline & điểm nhấn hành trình
  teal600: '#0D9488',
  teal500: '#14B8A6',
  teal700: '#0F766E',
  teal100: '#CCFBF1',
  teal50: '#F0FDFA',

  // AI & Semantic Accent (Indigo Violet) — AI CLIP Search, Similarity Score & Human-in-the-Loop
  indigo600: '#4F46E5',
  indigo500: '#6366F1',
  indigo700: '#4338CA',
  indigo100: '#E0E7FF',
  indigo50: '#EEF2FF',

  // Coral Route Marker — Active Stop Marker trên bản đồ
  coral500: '#F43F5E',
  coral600: '#E11D48',
  coral100: '#FFE4E6',
  coral50: '#FFF1F2',

  // Trạng thái dữ liệu EXIF & Xác nhận
  emeraldText: '#047857', // GPS Verified Text
  emeraldBg: '#D1FAE5', // GPS Verified Background
  emeraldBorder: '#A7F3D0',

  amberText: '#B45309', // GPS Unknown (latitude: null) Text
  amberBg: '#FEF3C7', // GPS Unknown Background
  amberBorder: '#FDE68A',

  // Typography Colors
  textPrimary: '#0F172A', // Slate 900 - Tiêu đề
  textSecondary: '#475569', // Slate 600 - Nội dung phụ
  textSubtle: '#64748B', // Slate 500
  textMuted: '#94A3B8', // Slate 400 - Nhãn mờ
  textInverse: '#FFFFFF',

  // Overlays
  darkOverlay: 'rgba(15, 23, 42, 0.62)',
  darkOverlayStrong: 'rgba(15, 23, 42, 0.78)',
  glassOverlay: 'rgba(255, 255, 255, 0.92)',
} as const;

export const Radius = {
  sheet: 28, // Khay Timeline (Bottom Sheet)
  cardLg: 24, // Thẻ lớn / Hero Card
  card: 18, // Thẻ chuyến đi / Thẻ điểm dừng (Stop Card)
  input: 14, // Ô nhập liệu
  thumbnail: 12, // Ảnh thumbnail trong danh sách
  sm: 10,
  pill: 999, // Nút bấm, Chip lọc ngày, Huy hiệu (Pills/Badges)
} as const;

export const Shadows: Record<'card' | 'floating' | 'sheet' | 'subtle', ViewStyle> = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const Typography = {
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Palette.textPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Palette.textPrimary,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSecondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: Palette.textMuted,
  },
} as const;
