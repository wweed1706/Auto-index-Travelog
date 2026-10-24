import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IconSize,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';
import { TripSummary } from '@/types/trip';

export interface HeroTripCardProps {
  trip: TripSummary;
  daysCount: number;
  issueNumber?: number;
  onOpenTimeline: (tripId: string) => void;
  onAddPhotos: (tripId: string) => void;
}

function formatEditorialDateRange(start: string, end: string): string {
  const fmt = (raw: string) => {
    const parts = raw.split('-');
    if (parts.length !== 3) return raw;
    return `${parts[2]} Thg ${Number(parts[1])}`;
  };
  const year = end.split('-')[0] ?? '2026';
  return `${fmt(start)} — ${fmt(end)}, ${year}`;
}

export function HeroTripCard({
  trip,
  daysCount,
  issueNumber = 1,
  onOpenTimeline,
  onAddPhotos,
}: HeroTripCardProps) {
  const issueCode = String(issueNumber).padStart(2, '0');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.editorialCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onOpenTimeline(trip.trip_id)}
      accessibilityRole="button"
      accessibilityLabel={`Mở tạp chí hành trình ${trip.title}`}>
      {/* Framed Editorial Photography with Light Floating Badges */}
      <View style={styles.photoFrame}>
        {trip.cover_thumbnail_url ? (
          <Image
            source={{ uri: trip.cover_thumbnail_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverFallback}>
            <Ionicons name="images-outline" size={44} color={Palette.textMuted} />
          </View>
        )}

        {/* Top Light Frosted Glass Pills */}
        <View style={styles.topFloatingRow}>
          <View style={styles.issueLightPill}>
            <View style={styles.liveTealDot} />
            <Text style={styles.issueLightText}>
              CHƯƠNG {issueCode} • {daysCount} NGÀY
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.cameraLightPill,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => onAddPhotos(trip.trip_id)}
            hitSlop={TouchTarget.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`Thêm ảnh mới vào ${trip.title}`}>
            <Ionicons name="camera-outline" size={IconSize.sm} color={Palette.teal700} />
            <Text style={styles.cameraLightPillText}>+ Thêm ảnh</Text>
          </Pressable>
        </View>
      </View>

      {/* Luminous Gallery White Editorial Story Footer (No Dark Overlay!) */}
      <View style={styles.editorialBody}>
        <View style={styles.dateEyebrowRow}>
          <Feather name="calendar" size={12} color={Palette.teal700} />
          <Text style={styles.dateEyebrowText}>
            {formatEditorialDateRange(trip.start_date, trip.end_date)}
          </Text>
        </View>

        <Text style={styles.editorialHeadline} numberOfLines={2}>
          {trip.title}
        </Text>

        {/* Bottom Metadata Pills & Primary Teal CTA */}
        <View style={styles.bottomActionStrip}>
          <View style={styles.metricsRow}>
            <View style={styles.metricLightChip}>
              <Ionicons name="location" size={13} color={Palette.coral600} />
              <Text style={styles.metricChipText}>
                {trip.stop_count ?? 0} điểm dừng
              </Text>
            </View>

            <View style={styles.metricLightChip}>
              <Ionicons name="sparkles" size={12} color={Palette.indigo600} />
              <Text style={styles.metricChipText}>
                {trip.photo_count ?? 0} khoảnh khắc
              </Text>
            </View>
          </View>

          <View style={styles.openJournalTealPill}>
            <Text style={styles.openJournalTealText}>Mở Bản đồ</Text>
            <Feather
              name="arrow-up-right"
              size={IconSize.sm}
              color={Palette.surface}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  editorialCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.hero,
    padding: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  photoFrame: {
    height: 224,
    width: '100%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Palette.bgSecondary,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.bgSecondary,
  },
  topFloatingRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueLightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  liveTealDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.teal600,
  },
  issueLightText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: 0.8,
  },
  cameraLightPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  cameraLightPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.teal700,
  },
  editorialBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  dateEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  editorialHeadline: {
    fontFamily: SERIF_FONT,
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 29,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  bottomActionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.bgSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  metricLightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  metricChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  openJournalTealPill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.teal700,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  openJournalTealText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.surface,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
