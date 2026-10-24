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
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ExifStatusBadge,
  HitlActionPillBar,
  NumberedMapMarker,
  StopWithDayMeta,
  TimelineStopCard,
} from '@/components/ui';
import { formatUsabilityReportMarkdown } from '@/services/mockApi';
import { tripRepository } from '@/services/tripRepository';
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
import {
  Coordinates,
  PhotoItem,
  TripStop,
  TripTimeline,
  UsabilityTripReport,
} from '@/types/trip';

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

function formatFullDateTime(isoStr: string): string {
  if (!isoStr) return 'Không rõ thời gian';
  return isoStr.slice(0, 19).replace('T', ' • ');
}

async function copyTextToClipboardOrShare(text: string, title: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback sang Share API trên thiết bị di động
  }

  try {
    if (Platform.OS !== 'web') {
      await Share.share({
        title,
        message: text,
      });
      return true;
    }
  } catch {
    // Ignore share cancellation
  }
  return false;
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

  // Modal 1: RENAME (UC-11)
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [renameTargetStop, setRenameTargetStop] = useState<TripStop | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');

  // Modal 2: MOVE_PHOTO (UC-11)
  const [movePhotoModalVisible, setMovePhotoModalVisible] = useState<boolean>(false);
  const [moveSourceStop, setMoveSourceStop] = useState<TripStop | null>(null);
  const [selectedPhotoToMove, setSelectedPhotoToMove] = useState<PhotoItem | null>(null);

  // Modal 3: PHOTO DETAIL LIGHTBOX & QUICK MOVE (UC-11)
  const [inspectModalVisible, setInspectModalVisible] = useState<boolean>(false);
  const [inspectedStop, setInspectedStop] = useState<StopWithDayMeta | null>(null);
  const [inspectedPhoto, setInspectedPhoto] = useState<PhotoItem | null>(null);

  // Modal 4: USABILITY EVALUATION REPORT (Mục 9.7)
  const [usabilityModalVisible, setUsabilityModalVisible] = useState<boolean>(false);
  const [usabilityReport, setUsabilityReport] = useState<UsabilityTripReport | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const refreshUsabilityStats = useCallback(async (targetTripId: string) => {
    const report = await tripRepository.getTripUsabilityReport(targetTripId);
    setUsabilityReport(report);
    setEditCount(report.total_edits);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      tripRepository.getTripTimeline(tripId),
      tripRepository.getTripUsabilityReport(tripId),
    ])
      .then(([data, report]) => {
        if (isMounted) {
          setTimeline(data);
          setUsabilityReport(report);
          setEditCount(report.total_edits);
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

  const allStopsWithMeta: StopWithDayMeta[] = useMemo(() => {
    if (!timeline) return [];
    const list: StopWithDayMeta[] = [];
    let counter = 1;
    for (const day of timeline.days) {
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
    return list;
  }, [timeline]);

  const displayedStops: StopWithDayMeta[] = useMemo(() => {
    if (selectedDayNum === 'ALL') return allStopsWithMeta;
    return allStopsWithMeta.filter((s) => s.day_number === selectedDayNum);
  }, [allStopsWithMeta, selectedDayNum]);

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

      const updated = await tripRepository.mutateTripStops(tripId, {
        action: 'MERGE',
        source_stop_ids: [first.stop_id, second.stop_id],
        new_name: `${first.name} & ${second.name}`,
      });
      setTimeline(updated);
      setSelectedStopId(first.stop_id);
      await refreshUsabilityStats(tripId);
      setLastActionBanner(`Đã gộp "${first.name}" và "${second.name}".`);
    },
    [refreshUsabilityStats, selectedDayNum, timeline, tripId]
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

      const updated = await tripRepository.mutateTripStops(tripId, {
        action: 'SPLIT',
        source_stop_ids: [candidate.stop_id],
        new_name: `${candidate.name} (Điểm tách)`,
      });
      setTimeline(updated);
      await refreshUsabilityStats(tripId);
      setLastActionBanner(
        `Đã tách "${candidate.name}" (${candidate.photos.length} ảnh) thành 2 điểm dừng.`
      );
    },
    [displayedStops, refreshUsabilityStats, tripId]
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
    const updated = await tripRepository.mutateTripStops(tripId, {
      action: 'RENAME',
      source_stop_ids: [renameTargetStop.stop_id],
      new_name: newName,
    });
    setTimeline(updated);
    await refreshUsabilityStats(tripId);
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

      const updated = await tripRepository.mutateTripStops(tripId, {
        action: 'REORDER',
        source_stop_ids: nextOrderedIds,
        ordered_stop_ids: nextOrderedIds,
      });
      setTimeline(updated);
      await refreshUsabilityStats(tripId);
      setLastActionBanner(`Đã cập nhật thứ tự điểm dừng Ngày ${targetDayNum}.`);
    },
    [refreshUsabilityStats, selectedDayNum, timeline, tripId]
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
    const updated = await tripRepository.mutateTripStops(tripId, {
      action: 'MOVE_PHOTO',
      source_stop_ids: [moveSourceStop.stop_id],
      target_stop_id: targetStop.stop_id,
      photo_id: selectedPhotoToMove.photo_id,
    });
    setTimeline(updated);
    await refreshUsabilityStats(tripId);
    setLastActionBanner(`Đã chuyển ảnh sang "${targetStop.name}".`);
    setMovePhotoModalVisible(false);
    setInspectModalVisible(false);
  };

  // Mở Modal Xem chi tiết Ảnh & Chuyển ảnh nhanh (UC-11)
  const handleInspectPhoto = useCallback((stop: StopWithDayMeta, photo: PhotoItem) => {
    setInspectedStop(stop);
    setInspectedPhoto(photo);
    setInspectModalVisible(true);
  }, []);

  const handleQuickMoveFromInspectModal = async (targetStop: TripStop) => {
    if (!inspectedStop || !inspectedPhoto) return;
    const updated = await tripRepository.mutateTripStops(tripId, {
      action: 'MOVE_PHOTO',
      source_stop_ids: [inspectedStop.stop_id],
      target_stop_id: targetStop.stop_id,
      photo_id: inspectedPhoto.photo_id,
    });
    setTimeline(updated);
    await refreshUsabilityStats(tripId);
    setLastActionBanner(
      `Đã chuyển ảnh (${inspectedPhoto.photo_id}) sang "${targetStop.name}".`
    );
    setInspectModalVisible(false);
  };

  // Mở Modal Báo cáo Thực nghiệm Usability (Mục 9.7)
  const handleOpenUsabilityReportModal = useCallback(async () => {
    const report = await tripRepository.getTripUsabilityReport(tripId);
    setUsabilityReport(report);
    setCopyFeedback(null);
    setUsabilityModalVisible(true);
  }, [tripId]);

  const handleCopyUsabilityMarkdown = async () => {
    if (!usabilityReport) return;
    const md = formatUsabilityReportMarkdown(usabilityReport);
    await copyTextToClipboardOrShare(md, `Báo cáo Usability - ${usabilityReport.trip_title}`);
    setCopyFeedback('Đã sao chép Báo cáo Markdown (Mục 9.7) vào bộ nhớ tạm!');
  };

  const handleCopyUsabilityJson = async () => {
    if (!usabilityReport) return;
    const jsonStr = JSON.stringify(usabilityReport, null, 2);
    await copyTextToClipboardOrShare(
      jsonStr,
      `Usability JSON - ${usabilityReport.trip_title}`
    );
    setCopyFeedback('Đã sao chép dữ liệu JSON Thực nghiệm Usability!');
  };

  const handleResetAll = useCallback(async () => {
    const restored = await tripRepository.resetTripTimeline(tripId);
    setTimeline(restored);
    await refreshUsabilityStats(tripId);
    setSelectedStopId(restored.days[0]?.stops[0]?.stop_id ?? null);
    setLastActionBanner('Đã khôi phục dữ liệu gom cụm gốc & đặt lại bộ đếm Usability.');
  }, [refreshUsabilityStats, tripId]);

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

  const candidateTargetStopsForPhoto = allStopsWithMeta.filter(
    (s) => s.stop_id !== moveSourceStop?.stop_id
  );

  const candidateTargetStopsForInspectedPhoto = allStopsWithMeta.filter(
    (s) => s.stop_id !== inspectedStop?.stop_id
  );

  const inspectedHasGps =
    inspectedPhoto?.latitude !== null &&
    inspectedPhoto?.latitude !== undefined &&
    inspectedPhoto?.longitude !== null &&
    inspectedPhoto?.longitude !== undefined;

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
          <Pressable
            style={({ pressed }) => [
              styles.mapRouteSummaryPill,
              pressed && styles.pressed,
            ]}
            onPress={handleOpenUsabilityReportModal}
            accessibilityRole="button"
            accessibilityLabel="Mở báo cáo thực nghiệm Usability">
            <Ionicons name="git-commit-outline" size={IconSize.sm} color={Palette.teal700} />
            <Text style={styles.mapRouteSummaryText}>
              {displayedStops.length} điểm dừng • {editCount} chỉnh sửa
            </Text>
            <Feather name="bar-chart-2" size={12} color={Palette.indigo600} />
          </Pressable>

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
          onOpenUsabilityReport={handleOpenUsabilityReportModal}
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
              canMoveBetweenStops={allStopsWithMeta.length >= 2}
              onSelectStop={handleFocusStopOnMap}
              onRename={openRenameModal}
              onMerge={handleMergeStops}
              onSplit={handleSplitStop}
              onReorder={handleReorderStops}
              onMovePhoto={openMovePhotoModal}
              onInspectPhoto={handleInspectPhoto}
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

            <ScrollView style={styles.targetStopsList} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: PHOTO DETAIL LIGHTBOX + EXIF + QUICK MOVE TO ANOTHER STOP (UC-11) */}
      <Modal
        visible={inspectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.inspectModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.inspectTitleCol}>
                <Text style={styles.inspectEyebrowText}>CHI TIẾT KHOẢNH KHẮC • EXIF</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {inspectedStop?.name ?? 'Điểm dừng'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
                onPress={() => setInspectModalVisible(false)}
                hitSlop={TouchTarget.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Đóng hộp thoại chi tiết ảnh">
                <Feather name="x" size={IconSize.lg} color={Palette.textSecondary} />
              </Pressable>
            </View>

            {inspectedPhoto && (
              <>
                <View style={styles.inspectHeroImageWrap}>
                  <Image
                    source={{
                      uri: inspectedPhoto.original_url || inspectedPhoto.thumbnail_url,
                    }}
                    style={styles.inspectHeroImage}
                    resizeMode="cover"
                  />
                  <View style={styles.inspectTopBadgeWrap}>
                    <ExifStatusBadge hasGps={inspectedHasGps} />
                  </View>
                </View>

                {/* Detailed EXIF Metadata Grid */}
                <View style={styles.inspectExifGrid}>
                  <View style={styles.inspectExifRow}>
                    <Ionicons name="time-outline" size={IconSize.sm} color={Palette.teal700} />
                    <Text style={styles.inspectExifLabel}>Thời gian chụp:</Text>
                    <Text style={styles.inspectExifMonoValue}>
                      {formatFullDateTime(inspectedPhoto.taken_at)}
                    </Text>
                  </View>

                  <View style={styles.inspectExifRow}>
                    <Ionicons
                      name="location-outline"
                      size={IconSize.sm}
                      color={inspectedHasGps ? Palette.emeraldText : Palette.amberText}
                    />
                    <Text style={styles.inspectExifLabel}>Tọa độ EXIF GPS:</Text>
                    <Text
                      style={[
                        styles.inspectExifMonoValue,
                        !inspectedHasGps && styles.inspectExifMissingText,
                      ]}>
                      {inspectedHasGps
                        ? `${inspectedPhoto.latitude?.toFixed(5)}°N, ${inspectedPhoto.longitude?.toFixed(5)}°E`
                        : 'null (GPS Unknown)'}
                    </Text>
                  </View>

                  <View style={styles.inspectExifRow}>
                    <Ionicons name="flag-outline" size={IconSize.sm} color={Palette.coral600} />
                    <Text style={styles.inspectExifLabel}>Điểm dừng hiện tại:</Text>
                    <Text style={styles.inspectExifValue} numberOfLines={1}>
                      #{inspectedStop?.global_index} • {inspectedStop?.name} (Ngày{' '}
                      {inspectedStop?.day_number})
                    </Text>
                  </View>
                </View>

                {/* Quick Move Photo to Another Stop (UC-11) */}
                <View style={styles.quickMoveSection}>
                  <Text style={styles.modalSubtitle}>
                    Chuyển nhanh bức ảnh này sang Điểm dừng khác (UC-11):
                  </Text>

                  <ScrollView
                    style={styles.quickMoveTargetsScroll}
                    showsVerticalScrollIndicator={false}>
                    {candidateTargetStopsForInspectedPhoto.length === 0 ? (
                      <Text style={styles.emptyTargetHint}>
                        Chuyến đi hiện chỉ có 1 điểm dừng. Hãy tách điểm dừng nếu muốn chuyển
                        ảnh lẻ.
                      </Text>
                    ) : (
                      candidateTargetStopsForInspectedPhoto.map((target) => (
                        <Pressable
                          key={target.stop_id}
                          style={({ pressed }) => [
                            styles.targetStopItem,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => handleQuickMoveFromInspectModal(target)}
                          accessibilityRole="button"
                          accessibilityLabel={`Chuyển ảnh sang ${target.name}`}>
                          <NumberedMapMarker index={target.global_index} size="sm" />
                          <View style={styles.targetStopInfo}>
                            <Text style={styles.targetStopName}>{target.name}</Text>
                            <Text style={styles.targetStopMeta}>
                              Ngày {target.day_number} • {target.photos.length} ảnh
                            </Text>
                          </View>
                          <View style={styles.quickMovePill}>
                            <Text style={styles.quickMovePillText}>Chuyển tới</Text>
                            <Feather
                              name="corner-up-right"
                              size={12}
                              color={Palette.surface}
                            />
                          </View>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 4: USABILITY EVALUATION REPORT (Phục vụ Báo cáo Mục 9.7) */}
      <Modal
        visible={usabilityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsabilityModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.usabilityModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.inspectTitleCol}>
                <Text style={styles.usabilityEyebrowText}>
                  ĐÁNH GIÁ THỰC NGHIỆM USABILITY • MỤC 9.7
                </Text>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Thống kê Tinh chỉnh Hành trình
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
                onPress={() => setUsabilityModalVisible(false)}
                hitSlop={TouchTarget.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Đóng báo cáo Usability">
                <Feather name="x" size={IconSize.lg} color={Palette.textSecondary} />
              </Pressable>
            </View>

            {usabilityReport && (
              <>
                {/* Top Summary Strip */}
                <View style={styles.usabilityOverviewStrip}>
                  <View style={styles.usabilityOverviewCell}>
                    <Text style={styles.usabilityBigNum}>{usabilityReport.total_edits}</Text>
                    <Text style={styles.usabilityCellLabel}>Tổng thao tác</Text>
                  </View>
                  <View style={styles.usabilityOverviewCell}>
                    <Text style={styles.usabilityBigNum}>
                      {usabilityReport.initial_stop_count} &rarr;{' '}
                      {usabilityReport.current_stop_count}
                    </Text>
                    <Text style={styles.usabilityCellLabel}>Điểm dừng (Đầu &rarr; Cuối)</Text>
                  </View>
                  <View style={styles.usabilityOverviewCell}>
                    <Text style={styles.usabilityBigNum}>
                      {usabilityReport.confirmed_stop_count}/
                      {usabilityReport.current_stop_count}
                    </Text>
                    <Text style={styles.usabilityCellLabel}>Đã xác nhận</Text>
                  </View>
                </View>

                {/* 5 Action Type Breakdown Grid */}
                <View style={styles.actionBreakdownList}>
                  <View style={styles.actionMetricRow}>
                    <View style={styles.actionMetricLeft}>
                      <Ionicons
                        name="git-merge-outline"
                        size={IconSize.sm}
                        color={Palette.teal700}
                      />
                      <Text style={styles.actionMetricName}>
                        MERGE — Gộp điểm dừng (UC-10)
                      </Text>
                    </View>
                    <Text style={styles.actionMetricValue}>
                      {usabilityReport.counts_by_action.MERGE} lần
                    </Text>
                  </View>

                  <View style={styles.actionMetricRow}>
                    <View style={styles.actionMetricLeft}>
                      <Ionicons
                        name="git-branch-outline"
                        size={IconSize.sm}
                        color={Palette.indigo600}
                      />
                      <Text style={styles.actionMetricName}>
                        SPLIT — Tách điểm dừng (UC-10)
                      </Text>
                    </View>
                    <Text style={styles.actionMetricValue}>
                      {usabilityReport.counts_by_action.SPLIT} lần
                    </Text>
                  </View>

                  <View style={styles.actionMetricRow}>
                    <View style={styles.actionMetricLeft}>
                      <Feather name="edit-3" size={IconSize.xs} color={Palette.amberText} />
                      <Text style={styles.actionMetricName}>
                        RENAME — Đổi tên sự kiện (UC-11)
                      </Text>
                    </View>
                    <Text style={styles.actionMetricValue}>
                      {usabilityReport.counts_by_action.RENAME} lần
                    </Text>
                  </View>

                  <View style={styles.actionMetricRow}>
                    <View style={styles.actionMetricLeft}>
                      <Ionicons
                        name="swap-vertical-outline"
                        size={IconSize.sm}
                        color={Palette.coral600}
                      />
                      <Text style={styles.actionMetricName}>
                        REORDER — Đổi thứ tự (UC-10)
                      </Text>
                    </View>
                    <Text style={styles.actionMetricValue}>
                      {usabilityReport.counts_by_action.REORDER} lần
                    </Text>
                  </View>

                  <View style={styles.actionMetricRow}>
                    <View style={styles.actionMetricLeft}>
                      <Ionicons
                        name="images-outline"
                        size={IconSize.sm}
                        color={Palette.indigo600}
                      />
                      <Text style={styles.actionMetricName}>
                        MOVE_PHOTO — Chuyển ảnh lẻ (UC-11)
                      </Text>
                    </View>
                    <Text style={styles.actionMetricValue}>
                      {usabilityReport.counts_by_action.MOVE_PHOTO} lần
                    </Text>
                  </View>
                </View>

                {/* Recent Edit History Log */}
                <View style={styles.historyLogBox}>
                  <Text style={styles.historyLogHeading}>
                    Nhật ký thao tác Human-in-the-Loop ({usabilityReport.history.length}):
                  </Text>
                  <ScrollView
                    style={styles.historyLogScroll}
                    showsVerticalScrollIndicator={false}>
                    {usabilityReport.history.length === 0 ? (
                      <Text style={styles.emptyTargetHint}>
                        Chưa có thao tác chỉnh sửa nào trên chuyến đi này. Hãy thử Gộp, Tách,
                        Đổi tên hoặc Chuyển ảnh để ghi nhận số liệu thực nghiệm.
                      </Text>
                    ) : (
                      usabilityReport.history.map((entry, idx) => (
                        <View key={entry.id} style={styles.historyLogItem}>
                          <Text style={styles.historyLogIndex}>#{idx + 1}</Text>
                          <View style={styles.historyLogTextCol}>
                            <Text style={styles.historyLogDesc}>{entry.description}</Text>
                            <Text style={styles.historyLogTime}>
                              {entry.action} • {entry.timestamp.slice(11, 19)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>

                {copyFeedback && (
                  <View style={styles.copySuccessBanner}>
                    <Ionicons
                      name="checkmark-circle"
                      size={IconSize.sm}
                      color={Palette.emeraldText}
                    />
                    <Text style={styles.copySuccessText}>{copyFeedback}</Text>
                  </View>
                )}

                {/* Copy Report Buttons (Markdown & JSON) */}
                <View style={styles.usabilityExportRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.exportMarkdownBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleCopyUsabilityMarkdown}
                    accessibilityRole="button"
                    accessibilityLabel="Sao chép báo cáo Usability định dạng Markdown cho mục 9.7">
                    <Feather name="copy" size={IconSize.sm} color={Palette.surface} />
                    <Text style={styles.exportMarkdownBtnText}>
                      Copy Báo cáo Markdown
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.exportJsonBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleCopyUsabilityJson}
                    accessibilityRole="button"
                    accessibilityLabel="Sao chép báo cáo Usability định dạng JSON">
                    <Feather name="code" size={IconSize.sm} color={Palette.indigo700} />
                    <Text style={styles.exportJsonBtnText}>Copy JSON</Text>
                  </Pressable>
                </View>
              </>
            )}
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
    minHeight: 38,
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
    backgroundColor: 'rgba(24, 24, 27, 0.52)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
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
  inspectModalCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    maxHeight: '88%',
    ...Shadows.floating,
  },
  usabilityModalCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    maxHeight: '88%',
    ...Shadows.floating,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inspectTitleCol: {
    flex: 1,
    gap: 2,
  },
  inspectEyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.8,
  },
  usabilityEyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
    letterSpacing: 0.8,
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
    fontWeight: '700',
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
    marginBottom: Spacing.sm,
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
  inspectHeroImageWrap: {
    width: '100%',
    height: 215,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.bgSecondary,
    position: 'relative',
  },
  inspectHeroImage: {
    width: '100%',
    height: '100%',
  },
  inspectTopBadgeWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  inspectExifGrid: {
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  inspectExifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectExifLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  inspectExifValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  inspectExifMonoValue: {
    flex: 1,
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.emeraldText,
  },
  inspectExifMissingText: {
    color: Palette.amberText,
  },
  quickMoveSection: {
    gap: 8,
  },
  quickMoveTargetsScroll: {
    maxHeight: 165,
  },
  quickMovePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.teal700,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  quickMovePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.surface,
  },
  usabilityOverviewStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  usabilityOverviewCell: {
    flex: 1,
    backgroundColor: Palette.indigo50,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.indigo100,
  },
  usabilityBigNum: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: Palette.indigo700,
  },
  usabilityCellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  actionBreakdownList: {
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  actionMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionMetricName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  actionMetricValue: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  historyLogBox: {
    gap: 6,
  },
  historyLogHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textSecondary,
  },
  historyLogScroll: {
    maxHeight: 130,
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  historyLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  historyLogIndex: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
    marginTop: 2,
  },
  historyLogTextCol: {
    flex: 1,
  },
  historyLogDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  historyLogTime: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: Palette.textMuted,
  },
  copySuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.emeraldBg,
    borderWidth: 1,
    borderColor: Palette.emeraldBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  copySuccessText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.emeraldText,
  },
  usabilityExportRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportMarkdownBtn: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.teal700,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
  },
  exportMarkdownBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.surface,
  },
  exportJsonBtn: {
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
  },
  exportJsonBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  pressed: {
    opacity: 0.78,
  },
});
