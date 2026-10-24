import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Shadows } from '@/theme';

export interface NumberedMapMarkerProps {
  index: number;
  selected?: boolean;
  size?: 'sm' | 'md';
}

export function NumberedMapMarker({
  index,
  selected = false,
  size = 'md',
}: NumberedMapMarkerProps) {
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.haloWrapper,
        selected && (isSmall ? styles.haloActiveSm : styles.haloActiveMd),
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Điểm dừng số ${index}${selected ? ', đang chọn' : ''}`}>
      <View
        style={[
          styles.outerRing,
          isSmall ? styles.outerSm : styles.outerMd,
          selected ? styles.activeSurface : styles.defaultSurface,
        ]}>
        <Text style={[styles.numberText, isSmall ? styles.textSm : styles.textMd]}>
          {index}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  haloWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloActiveMd: {
    padding: 5,
    borderRadius: 26,
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
  },
  haloActiveSm: {
    padding: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(225, 29, 72, 0.16)',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Palette.surface,
    ...Shadows.floating,
  },
  outerMd: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  outerSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultSurface: {
    backgroundColor: Palette.teal600,
  },
  activeSurface: {
    backgroundColor: Palette.coral600,
  },
  numberText: {
    color: Palette.surface,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  textMd: {
    fontSize: 13,
  },
  textSm: {
    fontSize: 12,
  },
});
