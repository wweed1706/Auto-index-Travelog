import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExifStatusBadge } from '@/components/ui/ExifStatusBadge';
import { NumberedMapMarker } from '@/components/ui/NumberedMapMarker';
import {
  IconSize,
  MONO_FONT,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';
import { PhotoItem, TripStop } from '@/types/trip';

export interface StopWithDayMeta extends TripStop {
  day_number: number;
  date: string;
  global_index: number;
}

export interface TimelineStopCardProps {
  stop: StopWithDayMeta;
  selected: boolean;
  isLast: boolean;
  showDayTag: boolean;
  canMoveBetweenStops: boolean;
  onSelectStop: (stop: StopWithDayMeta) => void;
  onRename: (stop: StopWithDayMeta) => void;
  onMerge: (stop: StopWithDayMeta) => void;
  onSplit: (stop: StopWithDayMeta) => void;
  onReorder: (stop: StopWithDayMeta) => void;
  onMovePhoto: (stop: StopWithDayMeta, photo?: PhotoItem) => void;
  onInspectPhoto?: (stop: StopWithDayMeta, photo: PhotoItem) => void;
}

function formatTimeHm(isoStr: string): string {
  if (!isoStr) return '--:--';
  const timePart = isoStr.includes('T') ? isoStr.split('T')[1] : isoStr;
  return timePart ? timePart.slice(0, 5) : '--:--';
}

export function TimelineStopCard({
  stop,
  selected,
  isLast,
  showDayTag,
  canMoveBetweenStops,
  onSelectStop,
  onRename,
  onMerge,
  onSplit,
  onReorder,
  onMovePhoto,
  onInspectPhoto,
}: TimelineStopCardProps) {
  const canSplit = stop.photos.length >= 2;

  return (
    <View style={styles.stepperRow}>
      {/* Left Column: Connected Vertical Stepper with Timestamp & Continuous Track */}
      <View style={styles.leftAxisColumn}>
        <Text style={[styles.axisTimeLabel, selected && styles.axisTimeLabelSelected]}>
          {formatTimeHm(stop.start_time)}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.nodePressable, pressed && styles.pressed]}
          onPress={() => onSelectStop(stop)}
          hitSlop={TouchTarget.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Bay tới điểm dừng số ${stop.global_index}: ${stop.name}`}>
          <NumberedMapMarker index={stop.global_index} selected={selected} size="sm" />
        </Pressable>
        {!isLast && (
          <View
            style={[
              styles.verticalConnectorLine,
              selected && styles.verticalConnectorLineActive,
            ]}
          />
        )}
      </View>

      {/* Right Column: Luminous Gallery White Story Card */}
      <Pressable
        style={({ pressed }) => [
          styles.cardSurface,
          selected && styles.cardSurfaceSelected,
          pressed && styles.cardPressed,
        ]}
        onPress={() => onSelectStop(stop)}
        accessibilityRole="button"
        accessibilityLabel={`Chi tiết điểm dừng ${stop.name}`}>
        {/* Top Eyebrow: Day Tag + Confirmation Status + Quick Rename Icon */}
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLeftGroup}>
            {showDayTag && (
              <View style={styles.dayPillTag}>
                <Text style={styles.dayPillTagText}>NGÀY {stop.day_number}</Text>
              </View>
            )}

            <View
              style={[
                styles.statusPill,
                stop.is_user_confirmed
                  ? styles.statusVerifiedSurface
                  : styles.statusAutoSurface,
              ]}>
              <Ionicons
                name={stop.is_user_confirmed ? 'checkmark-circle' : 'sparkles'}
                size={11}
                color={
                  stop.is_user_confirmed ? Palette.emeraldText : Palette.indigo600
                }
              />
              <Text
                style={[
                  styles.statusPillText,
                  stop.is_user_confirmed
                    ? styles.statusVerifiedText
                    : styles.statusAutoText,
                ]}>
                {stop.is_user_confirmed ? 'Đã xác nhận' : 'Gợi ý AI'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.renameIconBtn, pressed && styles.pressed]}
            onPress={() => onRename(stop)}
            hitSlop={TouchTarget.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`Đổi tên ${stop.name}`}>
            <Feather name="edit-2" size={13} color={Palette.textSecondary} />
          </Pressable>
        </View>

        {/* Editorial Serif Stop Title */}
        <Text style={styles.editorialStopTitle}>{stop.name}</Text>

        {/* Subtitle Metadata: Time Span • Photo Count • Subtle Coordinate */}
        <View style={styles.subtitleMetaRow}>
          <Feather name="clock" size={12} color={Palette.teal700} />
          <Text style={styles.subtitleTimeText}>
            {formatTimeHm(stop.start_time)} – {formatTimeHm(stop.end_time)}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.subtitleCountText}>
            {stop.photos.length} bức ảnh
          </Text>
          {stop.centroid && (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.coordMonoText}>
                {stop.centroid.latitude.toFixed(3)}°N, {stop.centroid.longitude.toFixed(3)}°E
              </Text>
            </>
          )}
        </View>

        {/* Lush Magazine Photo Strip — Bấm vào ảnh để mở Modal Xem chi tiết Ảnh & Chuyển ảnh (UC-11) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoStripScroll}>
          {stop.photos.map((photo) => {
            const hasGps = photo.latitude !== null && photo.longitude !== null;
            return (
              <Pressable
                key={photo.photo_id}
                style={({ pressed }) => [
                  styles.photoFrame,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  if (onInspectPhoto) {
                    onInspectPhoto(stop, photo);
                  } else {
                    onMovePhoto(stop, photo);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Xem chi tiết ảnh chụp lúc ${formatTimeHm(photo.taken_at)} tại ${stop.name}`}>
                <Image
                  source={{ uri: photo.thumbnail_url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />

                <View style={styles.photoTopLeftBadge}>
                  <ExifStatusBadge hasGps={hasGps} compact />
                </View>

                <View style={styles.photoTopRightZoomPill}>
                  <Feather name="maximize-2" size={10} color={Palette.surface} />
                </View>

                <View style={styles.photoBottomLightBar}>
                  <Text style={styles.photoTimeLightText}>
                    {formatTimeHm(photo.taken_at)}
                  </Text>

                  {canMoveBetweenStops && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.photoMoveLightBtn,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => onMovePhoto(stop, photo)}
                      hitSlop={TouchTarget.hitSlop}
                      accessibilityRole="button"
                      accessibilityLabel={`Chuyển ảnh ${photo.photo_id} sang điểm dừng khác`}>
                      <Feather name="corner-up-right" size={11} color={Palette.teal700} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Contextual Quick Actions Row (Shown cleanly when stop is selected) */}
        {selected && (
          <View style={styles.contextualActionsBar}>
            <Pressable
              style={({ pressed }) => [styles.contextChip, pressed && styles.pressed]}
              onPress={() => onMerge(stop)}
              accessibilityRole="button"
              accessibilityLabel={`Gộp ${stop.name} với điểm dừng kế tiếp`}>
              <Ionicons name="git-merge-outline" size={IconSize.xs} color={Palette.teal700} />
              <Text style={styles.contextChipTealText}>Gộp tiếp</Text>
            </Pressable>

            {canSplit && (
              <Pressable
                style={({ pressed }) => [
                  styles.contextChip,
                  styles.contextChipIndigo,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSplit(stop)}
                accessibilityRole="button"
                accessibilityLabel={`Tách ${stop.name} thành 2 điểm dừng`}>
                <Ionicons
                  name="git-branch-outline"
                  size={IconSize.xs}
                  color={Palette.indigo600}
                />
                <Text style={styles.contextChipIndigoText}>
                  Tách ({stop.photos.length} ảnh)
                </Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.contextChip, pressed && styles.pressed]}
              onPress={() => onReorder(stop)}
              accessibilityRole="button"
              accessibilityLabel={`Đổi thứ tự ${stop.name}`}>
              <Ionicons
                name="swap-vertical-outline"
                size={IconSize.xs}
                color={Palette.textSecondary}
              />
              <Text style={styles.contextChipText}>Đổi vị trí</Text>
            </Pressable>

            {canMoveBetweenStops && (
              <Pressable
                style={({ pressed }) => [styles.contextChip, pressed && styles.pressed]}
                onPress={() => onMovePhoto(stop)}
                accessibilityRole="button"
                accessibilityLabel={`Chuyển ảnh từ ${stop.name}`}>
                <Feather name="share" size={11} color={Palette.coral600} />
                <Text style={styles.contextChipCoralText}>Chuyển ảnh</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
  },
  leftAxisColumn: {
    width: 44,
    alignItems: 'center',
  },
  axisTimeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMuted,
    marginBottom: 4,
  },
  axisTimeLabelSelected: {
    color: Palette.coral600,
    fontWeight: '800',
  },
  nodePressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalConnectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: Palette.teal100,
    marginVertical: 6,
    borderRadius: Radius.pill,
  },
  verticalConnectorLineActive: {
    backgroundColor: Palette.coral600,
    width: 2.5,
  },
  cardSurface: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 10,
    ...Shadows.card,
  },
  cardSurfaceSelected: {
    borderColor: Palette.coral600,
    borderLeftWidth: 4,
    backgroundColor: '#FFFDFB',
  },
  cardPressed: {
    opacity: 0.94,
  },
  pressed: {
    opacity: 0.75,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayPillTag: {
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  dayPillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
  },
  statusVerifiedSurface: {
    backgroundColor: Palette.emeraldBg,
  },
  statusAutoSurface: {
    backgroundColor: Palette.indigo50,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusVerifiedText: {
    color: Palette.emeraldText,
  },
  statusAutoText: {
    color: Palette.indigo700,
  },
  renameIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorialStopTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  subtitleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  subtitleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.teal700,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.borderStrong,
  },
  subtitleCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  coordMonoText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: Palette.textMuted,
  },
  photoStripScroll: {
    gap: 10,
    paddingTop: 2,
  },
  photoFrame: {
    width: 152,
    borderRadius: Radius.thumbnail,
    overflow: 'hidden',
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  photoImage: {
    width: '100%',
    height: 98,
    backgroundColor: Palette.bgSecondary,
  },
  photoTopLeftBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  photoTopRightZoomPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBottomLightBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  photoTimeLightText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  photoMoveLightBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextualActionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.bgSecondary,
  },
  contextChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.bgPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  contextChipIndigo: {
    backgroundColor: Palette.indigo50,
    borderColor: Palette.indigo100,
  },
  contextChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  contextChipTealText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.teal700,
  },
  contextChipIndigoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.indigo700,
  },
  contextChipCoralText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.coral600,
  },
});
