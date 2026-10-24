import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HitlActionPillBar,
  NumberedMapMarker,
  StopWithDayMeta,
  TimelineStopCard,
} from '@/components/ui';
import {
  getTripTimeline,
  mutateTripStops,
  resetMockTimeline,
} from '@/services/mockApi';
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
import { Coordinates, PhotoItem, TripStop, TripTimeline } from '@/types/trip';

const DEFAULT_REGION: Region = {
  latitude: 10.33582,
  longitude: 107.0812,
  latitudeDelta: 0.032,
  longitudeDelta: 0.032,
};

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

function formatTimeHm(isoStr: string): string {
  if (!isoStr) return '--:--';
  const timePart = isoStr.includes('T') ? isoStr.split('T')[1] : isoStr;
  return timePart ? timePart.slice(0, 5) : '--:--';
}

const RENAME_SUGGESTIONS: string[] = [
  'Bãi Sau Vũng Tàu • Bình Minh',
  'Đỉnh Tượng Chúa Kitô Vua',
  'Mũi Nghinh Phong Ngắm Hoàng Hôn',
  'Ngọn Hải Đăng Cổ Vũng Tàu',
];

export default function TripTimelineMapScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = params.tripId ?? 'trip_123';

  const mapRef = useRef<MapView | null>(null);

  const [timeline, setTimeline] = useState<TripTimeline | null>(null);
  const [selectedDayNum, setSelectedDayNum] = useState<number | 'ALL'>(1);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editCount, setEditCount] = useState<number>(0);
  const [lastActionBanner, setLastActionBanner] = useState<string | null>(null);

  // Modal State: RENAME (UC-11)
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [renameTargetStop, setRenameTargetStop] = useState<TripStop | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');

  // Modal State: MOVE_PHOTO (UC-11)
  const [movePhotoModalVisible, setMovePhotoModalVisible] = useState<boolean>(false);
  const [moveSourceStop, setMoveSourceStop] = useState<TripStop | null>(null);
  const [selectedPhotoToMove, setSelectedPhotoToMove] = useState<PhotoItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getTripTimeline(tripId)
      .then((data) => {
        if (isMounted) {
          setTimeline(data);
          const firstDay = data.days[0];
          const firstStop = firstDay?.stops[0];
          setSelectedDayNum(firstDay?.day_number ?? 1);
          setSelectedStopId(firstStop?.stop_id ?? null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  const displayedStops: StopWithDayMeta[] = useMemo(() => {
    if (!timeline) return [];
    const list: StopWithDayMeta[] = [];
    let counter = 1;
    for (const day of timeline.days) {
      if (selectedDayNum === 'ALL' || day.day_number === selectedDayNum) {
        for (const stop of day.stops) {
          list.push({
            ...stop,
            day_number: day.day_number,
            date: day.date,
            global_index: counter,
          });
          counter += 1;
        }
      }
    }
    return list;
  }, [timeline, selectedDayNum]);

  const routeCoordinates: Coordinates[] = useMemo(() => {
    return displayedStops
      .map((s) => s.centroid)
      .filter((c): c is Coordinates => c !== null);
  }, [displayedStops]);

  const initialMapRegion: Region = useMemo(() => {
    if (routeCoordinates.length === 0) return DEFAULT_REGION;
    const first = routeCoordinates[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.028,
      longitudeDelta: 0.028,
    };
  }, [routeCoordinates]);

  const selectedStop: StopWithDayMeta | undefined = useMemo(() => {
    return displayedStops.find((s) => s.stop_id === selectedStopId) ?? displayedStops[0];
  }, [displayedStops, selectedStopId]);

  const handleFocusStopOnMap = useCallback((stop: TripStop) => {
    setSelectedStopId(stop.stop_id);
    if (stop.centroid && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: stop.centroid.latitude,
          longitude: stop.centroid.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        650
      );
    }
  }, []);

  const handleFitAllMarkers = useCallback(() => {
    if (!mapRef.current || routeCoordinates.length === 0) return;
    if (routeCoordinates.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: routeCoordinates[0].latitude,
          longitude: routeCoordinates[0].longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        600
      );
      return;
    }
    mapRef.current.fitToCoordinates(routeCoordinates, {
      edgePadding: { top: 80, right: 56, bottom: 80, left: 56 },
      animated: true,
    });
  }, [routeCoordinates]);

  // --- HUMAN-IN-THE-LOOP HANDLERS (UC-10 & UC-11) ---

  const handleMergeStops = useCallback(
    async (primaryStop?: StopWithDayMeta) => {
      if (!timeline) return;
      const targetDayNum =
        primaryStop?.day_number ?? (selectedDayNum === 'ALL' ? 1 : selectedDayNum);
      const dayObj = timeline.days.find((d) => d.day_number === targetDayNum);
      if (!dayObj || dayObj.stops.length < 2) {
        setLastActionBanner('Cần ít nhất 2 điểm dừng trong ngày để gộp.');
        return;
      }

      const idx = primaryStop
        ? dayObj.stops.findIndex((s) => s.stop_id === primaryStop.stop_id)
        : 0;
      const firstIdx = idx >= 0 && idx < dayObj.stops.length - 1 ? idx : 0;
      const first = dayObj.stops[firstIdx];
      const second = dayObj.stops[firstIdx + 1];

      const updated = await mutateTripStops(tripId, {
        action: 'MERGE',
        source_stop_ids: [first.stop_id, second.stop_id],
        new_name: `${first.name} & ${second.name}`,
      });
      setTimeline(updated);
      setSelectedStopId(first.stop_id);
      setEditCount((c) => c + 1);
      setLastActionBanner(`Đã gộp "${first.name}" và "${second.name}".`);
    },
    [selectedDayNum, timeline, tripId]
  );

  const handleSplitStop = useCallback(
    async (targetStop?: TripStop) => {
      const candidate =
        targetStop && targetStop.photos.length >= 2
          ? targetStop
          : displayedStops.find((s) => s.photos.length >= 2);

      if (!candidate || candidate.photos.length < 2) {
        setLastActionBanner('Chọn điểm dừng có từ 2 bức ảnh trở lên để tách.');
        return;
      }

      const updated = await mutateTripStops(tripId, {
        action: 'SPLIT',
        source_stop_ids: [candidate.stop_id],
        new_name: `${candidate.name} (Điểm tách)`,
      });
      setTimeline(updated);
      setEditCount((c) => c + 1);
      setLastActionBanner(
        `Đã tách "${candidate.name}" (${candidate.photos.length} ảnh) thành 2 điểm dừng.`
      );
    },
    [displayedStops, tripId]
  );

  const openRenameModal = useCallback(
    (stop?: TripStop) => {
      const target = stop ?? selectedStop;
      if (!target) return;
      setRenameTargetStop(target);
      setRenameInputValue(target.name);
      setRenameModalVisible(true);
    },
    [selectedStop]
  );

  const handleConfirmRename = async () => {
    if (!renameTargetStop || !renameInputValue.trim()) return;
    const newName = renameInputValue.trim();
    const updated = await mutateTripStops(tripId, {
      action: 'RENAME',
      source_stop_ids: [renameTargetStop.stop_id],
      new_name: newName,
    });
    setTimeline(updated);
    setEditCount((c) => c + 1);
    setLastActionBanner(`Đã đổi tên thành "${newName}".`);
    setRenameModalVisible(false);
  };

  const handleReorderStops = useCallback(
    async (stopToMove?: StopWithDayMeta) => {
      if (!timeline) return;
      const targetDayNum =
        stopToMove?.day_number ?? (selectedDayNum === 'ALL' ? 1 : selectedDayNum);
      const dayObj = timeline.days.find((d) => d.day_number === targetDayNum);
      if (!dayObj || dayObj.stops.length < 2) {
        setLastActionBanner('Cần ít nhất 2 điểm dừng trong ngày để đổi thứ tự.');
        return;
      }

      const currentIds = dayObj.stops.map((s) => s.stop_id);
      let nextOrderedIds: string[];

      if (stopToMove) {
        const idx = currentIds.indexOf(stopToMove.stop_id);
        const swapIdx = idx < currentIds.length - 1 ? idx + 1 : idx - 1;
        nextOrderedIds = [...currentIds];
        const temp = nextOrderedIds[idx];
        nextOrderedIds[idx] = nextOrderedIds[swapIdx];
        nextOrderedIds[swapIdx] = temp;
      } else {
        nextOrderedIds = [...currentIds].reverse();
      }

      const updated = await mutateTripStops(tripId, {
        action: 'REORDER',
        source_stop_ids: nextOrderedIds,
        ordered_stop_ids: nextOrderedIds,
      });
      setTimeline(updated);
      setEditCount((c) => c + 1);
      setLastActionBanner(`Đã cập nhật thứ tự điểm dừng Ngày ${targetDayNum}.`);
    },
    [selectedDayNum, timeline, tripId]
  );

  const openMovePhotoModal = useCallback(
    (stop?: TripStop, preselectedPhoto?: PhotoItem) => {
      const source = stop ?? selectedStop;
      if (!source || source.photos.length === 0) return;
      setMoveSourceStop(source);
      setSelectedPhotoToMove(preselectedPhoto ?? source.photos[0]);
      setMovePhotoModalVisible(true);
    },
    [selectedStop]
  );

  const handleConfirmMovePhoto = async (targetStop: TripStop) => {
    if (!moveSourceStop || !selectedPhotoToMove) return;
    const updated = await mutateTripStops(tripId, {
      action: 'MOVE_PHOTO',
      source_stop_ids: [moveSourceStop.stop_id],
      target_stop_id: targetStop.stop_id,
      photo_id: selectedPhotoToMove.photo_id,
    });
    setTimeline(updated);
    setEditCount((c) => c + 1);
    setLastActionBanner(`Đã chuyển ảnh sang "${targetStop.name}".`);
    setMovePhotoModalVisible(false);
  };

  const handleResetAll = useCallback(() => {
    const restored = resetMockTimeline(tripId);
    setTimeline(restored);
    setEditCount(0);
    setSelectedStopId(restored.days[0]?.stops[0]?.stop_id ?? null);
    setLastActionBanner('Đã khôi phục dữ liệu gom cụm gốc.');
  }, [tripId]);

  if (loading || !timeline) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Palette.teal700} />
          <Text style={styles.loadingStateText}>
            Đang mở bản đồ & dòng thời gian hành trình...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const candidateTargetStopsForPhoto = displayedStops.filter(
    (s) => s.stop_id !== moveSourceStop?.stop_id
  );

  return (
    <View style={styles.rootContainer}>
      {/* TOP HALF (41%): INTERACTIVE MAP + CUSTOM NUMBERED MARKERS + POLYLINE */}
      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            style={styles.mapView}
            initialRegion={initialMapRegion}
            showsCompass={false}
            toolbarEnabled={false}>
            {routeCoordinates.length >= 2 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={Palette.teal600}
                strokeWidth={4}
              />
            )}

            {displayedStops.map((stop) => {
              if (!stop.centroid) return null;
              const isSelected = stop.stop_id === selectedStop?.stop_id;
              return (
                <Marker
                  key={stop.stop_id}
                  coordinate={stop.centroid}
                  title={`${stop.global_index}. ${stop.name}`}
                  description={`${formatTimeHm(stop.start_time)} - ${formatTimeHm(stop.end_time)}`}
                  onPress={() => handleFocusStopOnMap(stop)}>
                  <NumberedMapMarker index={stop.global_index} selected={isSelected} />
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.webMapCanvas}>
            <View style={styles.webMapTitleRow}>
              <Ionicons name="compass-outline" size={IconSize.md} color={Palette.teal700} />
              <Text style={styles.webMapTitleText}>
                Bản đồ Tuyến Hành trình • {timeline.title}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.webNodesRow}>
              {displayedStops.map((stop, idx) => {
                const isSelected = stop.stop_id === selectedStop?.stop_id;
                return (
                  <View key={stop.stop_id} style={styles.webNodeChainItem}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.webNodeCard,
                        isSelected && styles.webNodeCardActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleFocusStopOnMap(stop)}
                      accessibilityRole="button"
                      accessibilityLabel={`Điểm dừng số ${stop.global_index}: ${stop.name}`}>
                      <NumberedMapMarker
                        index={stop.global_index}
                        selected={isSelected}
                        size="sm"
                      />
                      <View style={styles.webNodeMetaCol}>
                        <Text style={styles.webNodeName} numberOfLines={1}>
                          {stop.name}
                        </Text>
                        <Text style={styles.webNodeCoord}>
                          {formatTimeHm(stop.start_time)} • {stop.photos.length} ảnh
                        </Text>
                      </View>
                    </Pressable>
                    {idx < displayedStops.length - 1 && (
                      <View style={styles.webPolylineSegment} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Floating Frosted Light Top Navigation Bar */}
        <SafeAreaView edges={['top']} style={styles.floatingTopBar}>
          <Pressable
            style={({ pressed }) => [
              styles.floatingBackCircle,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách chuyến đi">
            <Feather name="arrow-left" size={IconSize.md} color={Palette.textPrimary} />
          </Pressable>

          <View style={styles.floatingActiveStopPill}>
            <View style={styles.activeCoralDot} />
            <Text style={styles.floatingActiveStopText} numberOfLines={1}>
              {selectedStop
                ? `${selectedStop.global_index}. ${selectedStop.name}`
                : timeline.title}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.floatingSearchCircle,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel="Mở tìm kiếm ảnh AI CLIP">
            <Ionicons name="sparkles" size={IconSize.sm} color={Palette.indigo600} />
          </Pressable>
        </SafeAreaView>

        {/* Floating Light Bottom Map Controls */}
        <View style={styles.floatingMapBottomRow}>
          <View style={styles.mapRouteSummaryPill}>
            <Ionicons name="git-commit-outline" size={IconSize.sm} color={Palette.teal700} />
            <Text style={styles.mapRouteSummaryText}>
              {displayedStops.length} điểm dừng • {editCount} chỉnh sửa
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.fitAllRouteBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleFitAllMarkers}
            accessibilityRole="button"
            accessibilityLabel="Thu phóng toàn tuyến đường trên bản đồ">
            <Ionicons name="scan-outline" size={IconSize.sm} color={Palette.teal700} />
            <Text style={styles.fitAllRouteBtnText}>Toàn tuyến</Text>
          </Pressable>
        </View>
      </View>

      {/* BOTTOM HALF (59%): WARM EDITORIAL IVORY SHEET (32px) + DAY PILLS + STEPPER */}
      <View style={styles.floatingSheetContainer}>
        {/* Grabber Handle */}
        <View style={styles.grabberRow}>
          <View style={styles.grabberHandle} />
        </View>

        {/* Editorial Sheet Header + Quick Upload Button */}
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetTitleCol}>
            <Text style={styles.sheetEditorialTitle} numberOfLines={1}>
              {timeline.title}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.sheetUploadBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push({ pathname: '/upload', params: { tripId } })}
            accessibilityRole="button"
            accessibilityLabel="Thêm ảnh mới vào chuyến đi">
            <Feather name="plus" size={13} color={Palette.surface} />
            <Text style={styles.sheetUploadBtnText}>Thêm ảnh</Text>
          </Pressable>
        </View>

        {/* Horizontal Day Selector Pill Tabs (Light Theme) */}
        <View style={styles.dayTabsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabsScroll}>
            <Pressable
              style={({ pressed }) => [
                styles.dayTabPill,
                selectedDayNum === 'ALL' && styles.dayTabPillActive,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setSelectedDayNum('ALL');
                const first = timeline.days[0]?.stops[0];
                if (first) handleFocusStopOnMap(first);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedDayNum === 'ALL' }}
              accessibilityLabel="Xem tất cả các ngày">
              <Text
                style={[
                  styles.dayTabPillText,
                  selectedDayNum === 'ALL' && styles.dayTabPillTextActive,
                ]}>
                Tất cả ({timeline.days.reduce((acc, d) => acc + d.stops.length, 0)})
              </Text>
            </Pressable>

            {timeline.days.map((day) => {
              const isActive = selectedDayNum === day.day_number;
              return (
                <Pressable
                  key={day.day_number}
                  style={({ pressed }) => [
                    styles.dayTabPill,
                    isActive && styles.dayTabPillActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setSelectedDayNum(day.day_number);
                    const first = day.stops[0];
                    if (first) handleFocusStopOnMap(first);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Ngày ${day.day_number}, ${day.date}`}>
                  <Text
                    style={[
                      styles.dayTabPillText,
                      isActive && styles.dayTabPillTextActive,
                    ]}>
                    Ngày {day.day_number} • {formatShortDate(day.date)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Light Gallery Human-in-the-Loop Action Dock */}
        <HitlActionPillBar
          editCount={editCount}
          lastActionBanner={lastActionBanner}
          onMerge={() => handleMergeStops(selectedStop)}
          onSplit={() => handleSplitStop(selectedStop)}
          onRename={() => openRenameModal(selectedStop)}
          onReorder={() => handleReorderStops(selectedStop)}
          onMovePhoto={() => openMovePhotoModal(selectedStop)}
          onReset={handleResetAll}
        />

        {/* Connected Vertical Stepper Virtualized List */}
        <FlatList
          data={displayedStops}
          keyExtractor={(item) => item.stop_id}
          contentContainerStyle={styles.stepperListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TimelineStopCard
              stop={item}
              selected={item.stop_id === selectedStop?.stop_id}
              isLast={index === displayedStops.length - 1}
              showDayTag={selectedDayNum === 'ALL'}
              canMoveBetweenStops={displayedStops.length >= 2}
              onSelectStop={handleFocusStopOnMap}
              onRename={openRenameModal}
              onMerge={handleMergeStops}
              onSplit={handleSplitStop}
              onReorder={handleReorderStops}
              onMovePhoto={openMovePhotoModal}
            />
          )}
        />
      </View>

      {/* MODAL 1: RENAME STOP (UC-11) */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Đặt tên Điểm dừng</Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
                onPress={() => setRenameModalVisible(false)}
                hitSlop={TouchTarget.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Đóng hộp thoại đổi tên">
                <Feather name="x" size={IconSize.lg} color={Palette.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Cập nhật tên địa danh cho chương nhật ký của bạn:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={renameInputValue}
              onChangeText={setRenameInputValue}
              placeholder="Nhập tên điểm dừng mới..."
              placeholderTextColor={Palette.textMuted}
              autoFocus
            />

            <View style={styles.suggestionsWrap}>
              {RENAME_SUGGESTIONS.map((label) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.suggestionPill,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setRenameInputValue(label)}
                  accessibilityRole="button"
                  accessibilityLabel={`Gợi ý tên: ${label}`}>
                  <Text style={styles.suggestionPillText}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.pressed]}
                onPress={() => setRenameModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Hủy đổi tên">
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  pressed && styles.pressed,
                ]}
                onPress={handleConfirmRename}
                accessibilityRole="button"
                accessibilityLabel="Lưu tên mới">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={IconSize.md}
                  color={Palette.surface}
                />
                <Text style={styles.modalConfirmText}>Lưu thay đổi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: MOVE PHOTO TO ANOTHER STOP (UC-11) */}
      <Modal
        visible={movePhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMovePhotoModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Chuyển ảnh sang Điểm dừng khác</Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
                onPress={() => setMovePhotoModalVisible(false)}
                hitSlop={TouchTarget.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Đóng hộp thoại chuyển ảnh">
                <Feather name="x" size={IconSize.lg} color={Palette.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              1. Chọn bức ảnh từ &ldquo;{moveSourceStop?.name}&rdquo;:
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalPhotoSelectorRow}>
              {moveSourceStop?.photos.map((photo) => {
                const isSelected = selectedPhotoToMove?.photo_id === photo.photo_id;
                return (
                  <Pressable
                    key={photo.photo_id}
                    style={({ pressed }) => [
                      styles.modalPhotoChoice,
                      isSelected && styles.modalPhotoChoiceActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedPhotoToMove(photo)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Chọn ảnh chụp lúc ${formatTimeHm(photo.taken_at)}`}>
                    <Image
                      source={{ uri: photo.thumbnail_url }}
                      style={styles.modalPhotoThumb}
                    />
                    <Text style={styles.modalPhotoChoiceText}>
                      {formatTimeHm(photo.taken_at)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.modalSubtitle}>2. Chọn điểm dừng đích để chuyển tới:</Text>

            <View style={styles.targetStopsList}>
              {candidateTargetStopsForPhoto.length === 0 ? (
                <Text style={styles.emptyTargetHint}>
                  Không có điểm dừng khác để chuyển ảnh. Hãy tách điểm dừng trước.
                </Text>
              ) : (
                candidateTargetStopsForPhoto.map((target) => (
                  <Pressable
                    key={target.stop_id}
                    style={({ pressed }) => [
                      styles.targetStopItem,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleConfirmMovePhoto(target)}
                    accessibilityRole="button"
                    accessibilityLabel={`Chuyển tới ${target.name}`}>
                    <NumberedMapMarker index={target.global_index} size="sm" />
                    <View style={styles.targetStopInfo}>
                      <Text style={styles.targetStopName}>{target.name}</Text>
                      <Text style={styles.targetStopMeta}>
                        Ngày {target.day_number} • {target.photos.length} ảnh hiện có
                      </Text>
                    </View>
                    <Feather
                      name="arrow-right"
                      size={IconSize.md}
                      color={Palette.teal700}
                    />
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  mapContainer: {
    height: '41%',
    width: '100%',
    position: 'relative',
    backgroundColor: Palette.teal50,
  },
  mapView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webMapCanvas: {
    flex: 1,
    backgroundColor: Palette.teal50,
    paddingTop: 68,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  webMapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  webMapTitleText: {
    color: Palette.teal800,
    fontSize: 13,
    fontWeight: '700',
  },
  webNodesRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  webNodeChainItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webNodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.subtle,
  },
  webNodeCardActive: {
    borderColor: Palette.coral600,
    backgroundColor: Palette.coral50,
  },
  webNodeMetaCol: {
    maxWidth: 135,
  },
  webNodeName: {
    color: Palette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  webNodeCoord: {
    fontFamily: MONO_FONT,
    color: Palette.textSecondary,
    fontSize: 10,
  },
  webPolylineSegment: {
    width: 22,
    height: 3,
    backgroundColor: Palette.teal600,
    marginHorizontal: 4,
  },
  floatingTopBar: {
    position: 'absolute',
    top: 8,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  floatingBackCircle: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  floatingActiveStopPill: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  activeCoralDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.coral600,
  },
  floatingActiveStopText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textPrimary,
    flexShrink: 1,
  },
  floatingSearchCircle: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.indigo100,
    ...Shadows.floating,
  },
  floatingMapBottomRow: {
    position: 'absolute',
    bottom: 26,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapRouteSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  mapRouteSummaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  fitAllRouteBtn: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  fitAllRouteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  floatingSheetContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Palette.bgPrimary,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 8,
    ...Shadows.sheet,
  },
  grabberRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  grabberHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.borderStrong,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetEditorialTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  sheetUploadBtn: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.teal700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  sheetUploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.surface,
  },
  dayTabsSection: {
    paddingBottom: Spacing.sm,
  },
  dayTabsScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  dayTabPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  dayTabPillActive: {
    backgroundColor: Palette.teal700,
    borderColor: Palette.teal700,
  },
  dayTabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  dayTabPillTextActive: {
    color: Palette.surface,
  },
  stepperListContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
    paddingBottom: 44,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  modalInput: {
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionPill: {
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  suggestionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.teal700,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.bgSecondary,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  modalConfirmBtn: {
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    backgroundColor: Palette.teal700,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.surface,
  },
  modalPhotoSelectorRow: {
    gap: 10,
    paddingVertical: 4,
  },
  modalPhotoChoice: {
    width: 92,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Palette.bgPrimary,
  },
  modalPhotoChoiceActive: {
    borderColor: Palette.coral600,
  },
  modalPhotoThumb: {
    width: '100%',
    height: 64,
  },
  modalPhotoChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  targetStopsList: {
    gap: Spacing.sm,
    maxHeight: 220,
  },
  emptyTargetHint: {
    fontSize: 12,
    color: Palette.textMuted,
    fontStyle: 'italic',
  },
  targetStopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.bgPrimary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  targetStopInfo: {
    flex: 1,
  },
  targetStopName: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  targetStopMeta: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  pressed: {
    opacity: 0.78,
  },
});
