import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSize, Palette, Radius } from '@/theme';

export interface ExifStatusBadgeProps {
  hasGps: boolean;
  compact?: boolean;
  labelOverride?: string;
}

export function ExifStatusBadge({
  hasGps,
  compact = false,
  labelOverride,
}: ExifStatusBadgeProps) {
  const defaultLabel = hasGps
    ? compact
      ? 'Có GPS'
      : 'Đã định vị GPS'
    : compact
      ? 'Khuyết GPS'
      : 'Chưa có tọa độ';

  return (
    <View
      style={[
        styles.badgeBase,
        compact ? styles.badgeCompact : styles.badgeRegular,
        hasGps ? styles.verifiedSurface : styles.unknownSurface,
      ]}
      accessibilityRole="text"
      accessibilityLabel={labelOverride ?? defaultLabel}>
      <View
        style={[
          styles.statusDot,
          hasGps ? styles.verifiedDot : styles.unknownDot,
        ]}
      />
      <Ionicons
        name={hasGps ? 'navigate' : 'compass-outline'}
        size={compact ? 10 : IconSize.xs}
        color={hasGps ? Palette.emeraldText : Palette.amberText}
      />
      <Text
        style={[
          compact ? styles.textCompact : styles.textRegular,
          hasGps ? styles.verifiedText : styles.unknownText,
        ]}
        numberOfLines={1}>
        {labelOverride ?? defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  badgeRegular: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  badgeCompact: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedSurface: {
    backgroundColor: 'rgba(236, 253, 245, 0.95)',
    borderColor: Palette.emeraldBorder,
  },
  unknownSurface: {
    backgroundColor: 'rgba(255, 251, 235, 0.95)',
    borderColor: Palette.amberBorder,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  verifiedDot: {
    backgroundColor: Palette.emeraldDot,
  },
  unknownDot: {
    backgroundColor: Palette.amberDot,
  },
  textRegular: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verifiedText: {
    color: Palette.emeraldText,
  },
  unknownText: {
    color: Palette.amberText,
  },
});
