import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IconSize,
  MONO_FONT,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
} from '@/theme';
import { SemanticSearchResultItem } from '@/types/trip';

export interface SemanticPhotoCardProps {
  item: SemanticSearchResultItem;
  index?: number;
  onPress: (item: SemanticSearchResultItem) => void;
}

function formatTimeHm(isoStr: string): string {
  if (!isoStr) return '--:--';
  const timePart = isoStr.includes('T') ? isoStr.split('T')[1] : isoStr;
  return timePart ? timePart.slice(0, 5) : '--:--';
}

export function SemanticPhotoCard({
  item,
  index = 0,
  onPress,
}: SemanticPhotoCardProps) {
  const matchPercent = Math.round(item.similarity_score * 100);
  const imageHeight = index % 2 === 0 ? 168 : 154;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Ảnh tại ${item.stop.name}, độ tương đồng CLIP ${matchPercent}%`}>
      {/* Framed Photo with Light Frosted Badges */}
      <View style={[styles.photoWrapper, { height: imageHeight }]}>
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.photoImage}
          resizeMode="cover"
        />

        <View style={styles.topFloatingBar}>
          <View style={styles.dayLightPill}>
            <Text style={styles.dayLightText}>NGÀY {item.day_number}</Text>
          </View>

          <View style={styles.similarityLightPill}>
            <Ionicons name="sparkles" size={11} color={Palette.indigo600} />
            <Text style={styles.similarityLightText}>{matchPercent}%</Text>
          </View>
        </View>
      </View>

      {/* Gallery White Editorial Caption Box */}
      <View style={styles.lightCaptionBox}>
        <Text style={styles.editorialStopName} numberOfLines={1}>
          {item.stop.name}
        </Text>

        <View style={styles.metaFooterRow}>
          <View style={styles.timeMetaGroup}>
            <Ionicons name="location" size={11} color={Palette.coral600} />
            <Text style={styles.timestampText}>
              {formatTimeHm(item.taken_at)} • {item.taken_at.slice(8, 10)}/
              {item.taken_at.slice(5, 7)}
            </Text>
          </View>

          <View style={styles.openCircleBtn}>
            <Feather
              name="arrow-up-right"
              size={IconSize.xs}
              color={Palette.teal700}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '48.2%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: 7,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 8,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  photoWrapper: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.bgSecondary,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  topFloatingBar: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLightPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
  },
  dayLightText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: 0.5,
  },
  similarityLightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
  },
  similarityLightText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  lightCaptionBox: {
    paddingHorizontal: 6,
    paddingBottom: 4,
    gap: 4,
  },
  editorialStopName: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  metaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  openCircleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
