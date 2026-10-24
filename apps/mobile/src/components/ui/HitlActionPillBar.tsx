import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSize, Palette, Radius, Shadows, Spacing, TouchTarget } from '@/theme';

export interface HitlActionPillBarProps {
  editCount: number;
  lastActionBanner: string | null;
  onMerge: () => void;
  onSplit: () => void;
  onRename: () => void;
  onReorder: () => void;
  onMovePhoto: () => void;
  onReset: () => void;
}

export function HitlActionPillBar({
  editCount,
  lastActionBanner,
  onMerge,
  onSplit,
  onRename,
  onReorder,
  onMovePhoto,
  onReset,
}: HitlActionPillBarProps) {
  return (
    <View style={styles.dockContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dockScrollRow}>
        {/* Edits Counter Pill (Light Indigo Surface) */}
        <View style={styles.editsBadgePill}>
          <View style={styles.sparkleDot} />
          <Text style={styles.editsBadgeText}>{editCount} tinh chỉnh</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.dockActionPill, pressed && styles.pillPressed]}
          onPress={onMerge}
          accessibilityRole="button"
          accessibilityLabel="Gộp 2 điểm dừng liên tiếp">
          <Ionicons name="git-merge-outline" size={IconSize.sm} color={Palette.teal700} />
          <Text style={styles.dockActionText}>Gộp điểm</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dockActionPill, pressed && styles.pillPressed]}
          onPress={onSplit}
          accessibilityRole="button"
          accessibilityLabel="Tách điểm dừng có từ 2 ảnh">
          <Ionicons name="git-branch-outline" size={IconSize.sm} color={Palette.indigo600} />
          <Text style={styles.dockActionText}>Tách điểm</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dockActionPill, pressed && styles.pillPressed]}
          onPress={onRename}
          accessibilityRole="button"
          accessibilityLabel="Đổi tên điểm dừng đang chọn">
          <Feather name="edit-3" size={IconSize.xs} color={Palette.amberText} />
          <Text style={styles.dockActionText}>Đổi tên</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dockActionPill, pressed && styles.pillPressed]}
          onPress={onReorder}
          accessibilityRole="button"
          accessibilityLabel="Đổi thứ tự điểm dừng trong ngày">
          <Ionicons name="swap-vertical-outline" size={IconSize.sm} color={Palette.coral600} />
          <Text style={styles.dockActionText}>Đổi thứ tự</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dockActionPill, pressed && styles.pillPressed]}
          onPress={onMovePhoto}
          accessibilityRole="button"
          accessibilityLabel="Chuyển ảnh lẻ sang điểm dừng khác">
          <Ionicons name="images-outline" size={IconSize.sm} color={Palette.indigo600} />
          <Text style={styles.dockActionText}>Chuyển ảnh</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.resetDockPill, pressed && styles.pillPressed]}
          onPress={onReset}
          hitSlop={TouchTarget.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Khôi phục dữ liệu gom cụm gốc">
          <Feather name="rotate-ccw" size={12} color={Palette.textSecondary} />
          <Text style={styles.resetDockText}>Khôi phục</Text>
        </Pressable>
      </ScrollView>

      {lastActionBanner && (
        <View style={styles.feedbackToast}>
          <Ionicons name="checkmark-circle" size={IconSize.sm} color={Palette.emeraldText} />
          <Text style={styles.feedbackToastText} numberOfLines={1}>
            {lastActionBanner}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 6,
    ...Shadows.subtle,
  },
  dockScrollRow: {
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 2,
  },
  editsBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  sparkleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.indigo600,
  },
  editsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  dockActionPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dockActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  resetDockPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  resetDockText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  pillPressed: {
    opacity: 0.75,
  },
  feedbackToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.emeraldBg,
    borderWidth: 1,
    borderColor: Palette.emeraldBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  feedbackToastText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.emeraldText,
  },
});
