/**
 * ReTrip Design System Tokens — Generated & Enforced via `ui-ux-pro-max` (--stack react-native)
 * Aesthetic Direction: Editorial Travel Magazine (Polarsteps / Airbnb / Condé Nast)
 *                      + Bento Grid & Dark Obsidian Glassmorphism (AI Visual Search & Map Controls)
 * Reference Master Spec: design-system/MASTER.md
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const Palette = {
  // Warm Editorial Canvas & Surfaces (No more cold generic admin slate!)
  bgPrimary: '#FAF7F2', // Warm Editorial Alabaster / Paper
  bgSecondary: '#F2ECE1', // Warm Sand Stone (Bento cells & inactive chips)
  surface: '#FFFFFF', // Pure Gallery Card White
  surfaceElevated: '#FFFDF9', // Warm Ivory Elevated Sheet
  surfaceMuted: '#F7F4EE',
  surfaceDark: '#0F172A', // Obsidian Midnight (Editorial Hero & AI Spotlight)
  surfaceDarkElevated: '#1E293B',

  // Glassmorphism & Progressive Scrim Overlays (React Native Cross-Platform Safe)
  glassLight: 'rgba(255, 253, 249, 0.90)',
  glassBorder: 'rgba(255, 255, 255, 0.72)',
  glassWhiteSubtle: 'rgba(255, 255, 255, 0.16)',
  glassWhiteBorder: 'rgba(255, 255, 255, 0.24)',
  darkOverlay: 'rgba(15, 23, 42, 0.58)',
  darkOverlayStrong: 'rgba(10, 15, 29, 0.82)',
  darkOverlaySoft: 'rgba(15, 23, 42, 0.28)',

  // Primary Brand: Deep Coastal Teal (Spacious, Natural, Trustworthy)
  teal900: '#134E4A',
  teal800: '#115E59',
  teal700: '#0F766E', // Primary Action & Route Accent
  teal600: '#0D9488', // Map Polyline & Active States
  teal500: '#14B8A6',
  teal100: '#CCFBF1',
  teal50: '#F0FDFA',

  // Secondary Brand: Sunset Terracotta / Coral (Active Map Pin & Editorial Highlight)
  coral700: '#BE123C',
  coral600: '#E11D48', // Selected Stop Pin & Editorial Accent
  coral500: '#F43F5E',
  coral100: '#FFE4E6',
  coral50: '#FFF1F2',

  // AI Semantic Search (Pillar 2 - CLIP + pgvector Spotlight)
  indigo950: '#1E1B4B',
  indigo900: '#312E81',
  indigo700: '#4338CA',
  indigo600: '#4F46E5',
  indigo500: '#6366F1',
  indigo100: '#E0E7FF',
  indigo50: '#EEF2FF',

  // Semantic Status (EXIF GPS Valid vs GPS Unknown null)
  emeraldBg: '#ECFDF5',
  emeraldBorder: '#A7F3D0',
  emeraldText: '#047857',
  emeraldDot: '#10B981',

  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',
  amberText: '#B45309',
  amberDot: '#F59E0B',

  dangerBg: '#FEF2F2',
  dangerText: '#B91C1C',

  // Editorial Ink Typography Hierarchy (WCAG AAA/AA Verified)
  textPrimary: '#18181B', // Deep Charcoal Ink
  textSecondary: '#3F3F46', // Warm Zinc Body
  textSubtle: '#52525B',
  textMuted: '#71717A', // Muted Warm Grey
  textInverse: '#FAF7F2', // Warm Ivory on Dark Surfaces

  // Hairline Borders & Dividers
  border: '#E6E0D4', // Warm Editorial Hairline
  borderStrong: '#D6CEC0',
} as const;

export const Spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 9999,
  card: 22,
  hero: 28,
  sheet: 32,
  thumbnail: 16,
} as const;

/**
 * Minimum Touch Target & Icon sizing rules from `ui-ux-pro-max` (React Native)
 */
export const TouchTarget = {
  minSize: 44,
  compactMinSize: 40,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export const IconSize = {
  xs: 13,
  sm: 15,
  md: 18,
  lg: 22,
  xl: 26,
} as const;

export const Shadows: Record<'card' | 'floating' | 'sheet' | 'subtle', ViewStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
  }) as ViewStyle,

  floating: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
  }) as ViewStyle,

  sheet: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.14,
      shadowRadius: 26,
    },
    android: {
      elevation: 14,
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.14,
      shadowRadius: 26,
    },
  }) as ViewStyle,

  subtle: Platform.select({
    ios: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
  }) as ViewStyle,
};

export const Typography: Record<
  | 'editorialHero'
  | 'editorialTitle'
  | 'heroTitle'
  | 'screenTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'bodyMedium'
  | 'caption'
  | 'microBadge'
  | 'monoMeta',
  TextStyle
> = {
  editorialHero: {
    fontFamily: SERIF_FONT,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.4,
    color: Palette.textPrimary,
  },
  editorialTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.2,
    color: Palette.textPrimary,
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 33,
    letterSpacing: -0.3,
    color: Palette.textPrimary,
  },
  screenTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.2,
    color: Palette.textPrimary,
  },
  sectionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
    color: Palette.textPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Palette.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: Palette.textSecondary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: Palette.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: Palette.textSubtle,
  },
  microBadge: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  monoMeta: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    color: Palette.textMuted,
  },
};
