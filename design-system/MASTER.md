# Design System Master Specification — ReTrip (Auto-index-Travelog)

> **Generated & Enforced by:** `ui-ux-pro-max` (`--stack react-native`)
> **Target Stack:** React Native + Expo SDK 57 + TypeScript (Strict Mode)
> **Domain:** Editorial Travel Journal, Spatio-Temporal Map Timeline & AI Visual Search (PyTorch + CLIP)

---

## 1. Aesthetic Direction & Visual Philosophy

ReTrip combines two signature design paradigms tailored for a consumer-grade travel photography journal:

1. **Editorial Travel Magazine (Polarsteps / Airbnb / Condé Nast Traveler):**
   - **Warm Alabaster Paper Canvas (`#FAF7F2`)** paired with **Warm Sand Stone (`#F2ECE1`)** and **Obsidian Midnight (`#0F172A`)** hero surfaces instead of cold admin-dashboard slate.
   - **Editorial Serif Display Typography (`Georgia` / `serif`)** for magazine titles, chapter headings, and stop titles, contrasted with crisp humanist sans-serif for controls and monospace for EXIF coordinates/timestamps.
   - **Full-Bleed Poster Photography:** Hero cards (`350px` tall, `borderRadius: 28px`) let travel photography breathe from edge to edge with progressive multi-layered dark scrims and tactile floating glass controls.
2. **Asymmetric Bento Grid & Obsidian Glassmorphism (Apple Photos / Linear Mobile):**
   - **Pillar 1 (Map + Timeline + HITL):** Interactive `MapView` with custom halo-ring numbered pins (`NumberedMapMarker`), a `32px` top-rounded Warm Ivory Floating Sheet, a sleek dark Obsidian/Indigo `HitlActionPillBar` dock, and a **Connected Vertical Stepper** (`TimelineStopCard`).
   - **Pillar 2 (Semantic Search — CLIP):** Dark Obsidian Spotlight Hero header with 1-tap natural Vietnamese query chips and a **2-Column Full-Bleed Portrait Masonry/Bento Grid** (`SemanticPhotoCard`) with floating glassmorphic similarity badges (`✨ 92% trùng khớp`).

---

## 2. Color Tokens (`apps/mobile/src/theme/index.ts`)

| Token | Hex / Value | Role & Contrast Notes |
| :--- | :--- | :--- |
| `Palette.bgPrimary` | `#FAF7F2` | Warm Editorial Alabaster / Paper app background |
| `Palette.bgSecondary` | `#F2ECE1` | Warm Sand Stone for subtle Bento cells & inactive chips |
| `Palette.surface` | `#FFFFFF` | Elevated gallery card surface |
| `Palette.surfaceDark` | `#0F172A` | Obsidian Midnight for AI Spotlight, HITL Dock & Hero Cards |
| `Palette.teal700` | `#0F766E` | Primary Brand Accent (Deep Coastal Teal, WCAG AA `5.4:1`) |
| `Palette.coral600` | `#E11D48` | Active Map Marker, Selected Stop Accent & Route Highlight |
| `Palette.indigo600` | `#4F46E5` | AI CLIP Semantic Search Accent & Sparkle Badges |
| `Palette.emeraldText` / `emeraldBg` | `#047857` / `#ECFDF5` | EXIF GPS Verified badge (`latitude !== null`) |
| `Palette.amberText` / `amberBg` | `#B45309` / `#FFFBEB` | EXIF GPS Missing (`null` / `unknown` — never `0,0`) |
| `Palette.textPrimary` | `#18181B` | Deep Charcoal Ink (`16.8:1` on `#FAF7F2`) |
| `Palette.textSecondary` | `#3F3F46` | Warm Zinc Body (`9.8:1` on `#FAF7F2`) |

---

## 3. Typography & Spacing Scale

- **Editorial Serif (`SERIF_FONT`):** `editorialHero` (`30px`), `heroTitle` (`26px`), `editorialTitle` (`22px`), `sectionTitle` (`19px`).
- **UI Sans & Monospace (`MONO_FONT`):** `cardTitle` (`16px`), `body` (`14px`), `caption` (`12px`), `monoMeta` (`11px`).
- **4dp/8dp Rhythm:** `xxs: 4`, `xs: 6`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `xxxl: 32`.
- **Border Radius:** `hero: 28`, `sheet: 32`, `card: 22`, `thumbnail: 16`, `pill: 9999`.

---

## 4. Reusable Component Architecture (`apps/mobile/src/components/ui/`)

1. **`HeroTripCard.tsx`**: Full-bleed `350px` Magazine Poster card with issue/chapter badge (`CHAPTER 01 • 3 NGÀY`), top-right camera upload button, progressive layered bottom scrim, Editorial Serif title, glassmorphic stop/photo pills, and high-contrast ivory CTA pill (`Mở Nhật ký →`).
2. **`NumberedMapMarker.tsx`**: Custom map pin with outer halo ring, numbered circular badge (`1, 2, 3...`), and bottom pointer dot; switches from Deep Teal (`#0F766E`) to Sunset Coral (`#E11D48`) when selected.
3. **`TimelineStopCard.tsx`**: Connected Vertical Stepper with timestamped left axis, gallery-white editorial story card, lush `160x118` horizontal photo strip with `ExifStatusBadge`, and contextual Human-in-the-Loop quick actions.
4. **`HitlActionPillBar.tsx`**: Sleek Obsidian/Indigo floating dock bar for `MERGE`, `SPLIT`, `RENAME`, `REORDER`, and `MOVE_PHOTO` with a glowing Usability Edits badge.
5. **`ExifStatusBadge.tsx`**: Semantic pill distinguishing GPS Verified vs GPS Missing (`null`).
6. **`SemanticPhotoCard.tsx`**: Full-bleed portrait (`228px` height) Bento/Masonry photo card with floating translucent CLIP match badge (`✨ 89% khớp`), day badge, and layered bottom scrim caption.
