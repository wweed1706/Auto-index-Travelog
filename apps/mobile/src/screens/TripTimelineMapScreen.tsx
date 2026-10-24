import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { Palette, Radius, Shadows } from '@/constants/designSystem';
import {
  getTripTimeline,
  mutateTripStops,
  resetMockTimeline,
} from '@/services/mockApi';
import { Coordinates, PhotoItem, TripStop, TripTimeline } from '@/types/trip';

interface StopWithDay extends TripStop {
  day_number: number;
  date: string;
  global_index: number;
}

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

  // State cho Modal Đổi tên điểm dừng (RENAME - UC-11)
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [renameTargetStop, setRenameTargetStop] = useState<TripStop | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');

  // State cho Modal Chuyển ảnh lẻ giữa các điểm dừng (MOVE_PHOTO - UC-11)
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

  // Danh sách điểm dừng đang hiển thị theo bộ lọc Ngày ('ALL' hoặc Ngày cụ thể)
  const displayedStops: StopWithDay[] = useMemo(() => {
    if (!timeline) return [];
    const list: StopWithDay[] = [];
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

  // Tọa độ các điểm dừng hợp lệ để vẽ Polyline và Marker
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

  const selectedStop: StopWithDay | undefined = useMemo(() => {
    return (
      displayedStops.find((s) => s.stop_id === selectedStopId) ?? displayedStops[0]
    );
  }, [displayedStops, selectedStopId]);

  // Bay bản đồ tới centroid khi chọn điểm dừng dưới Timeline
  const handleFocusStopOnMap = (stop: TripStop) => {
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
  };

  // Thu phóng bản đồ bao trọn toàn bộ các điểm dừng trong tuyến đường
  const handleFitAllMarkers = () => {
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
      edgePadding: { top: 76, right: 56, bottom: 76, left: 56 },
      animated: true,
    });
  };

  // --- CÁC THAO TÁC HUMAN-IN-THE-LOOP (UC-10 & UC-11) ---

  // 1. MERGE: Gộp 2 điểm dừng liên tiếp trong cùng ngày
  const handleMergeStops = async (primaryStop?: StopWithDay) => {
    if (!timeline) return;
    const targetDayNum =
      primaryStop?.day_number ?? (selectedDayNum === 'ALL' ? 1 : selectedDayNum);
    const dayObj = timeline.days.find((d) => d.day_number === targetDayNum);
    if (!dayObj || dayObj.stops.length < 2) {
      setLastActionBanner('Cần ít nhất 2 điểm dừng trong ngày để thực hiện Gộp (MERGE).');
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
    setLastActionBanner(`Đã gộp "${first.name}" và "${second.name}" thành 1 điểm dừng.`);
  };

  // 2. SPLIT: Tách điểm dừng có >= 2 bức ảnh thành 2 điểm dừng độc lập
  const handleSplitStop = async (targetStop?: TripStop) => {
    const candidate =
      targetStop && targetStop.photos.length >= 2
        ? targetStop
        : displayedStops.find((s) => s.photos.length >= 2);

    if (!candidate || candidate.photos.length < 2) {
      setLastActionBanner('Chỉ có thể Tách (SPLIT) điểm dừng có từ 2 bức ảnh trở lên.');
      return;
    }

    const updated = await mutateTripStops(tripId, {
      action: 'SPLIT',
      source_stop_ids: [candidate.stop_id],
      new_name: `${candidate.name} (Nhánh tách)`,
    });
    setTimeline(updated);
    setEditCount((c) => c + 1);
    setLastActionBanner(
      `Đã tách "${candidate.name}" (${candidate.photos.length} ảnh) thành 2 điểm dừng.`
    );
  };

  // 3. RENAME: Mở hộp thoại đổi tên sự kiện/điểm dừng
  const openRenameModal = (stop?: TripStop) => {
    const target = stop ?? selectedStop;
    if (!target) return;
    setRenameTargetStop(target);
    setRenameInputValue(target.name);
    setRenameModalVisible(true);
  };

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
    setLastActionBanner(`Đã đổi tên điểm dừng thành "${newName}".`);
    setRenameModalVisible(false);
  };

  // 4. REORDER: Đổi thứ tự điểm dừng trong ngày
  const handleReorderStops = async (stopToMove?: StopWithDay) => {
    if (!timeline) return;
    const targetDayNum =
      stopToMove?.day_number ?? (selectedDayNum === 'ALL' ? 1 : selectedDayNum);
    const dayObj = timeline.days.find((d) => d.day_number === targetDayNum);
    if (!dayObj || dayObj.stops.length < 2) {
      setLastActionBanner('Cần ít nhất 2 điểm dừng trong ngày để Đổi thứ tự (REORDER).');
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
    setLastActionBanner(`Đã cập nhật lại thứ tự điểm dừng trong Ngày ${targetDayNum}.`);
  };

  // 5. MOVE_PHOTO: Chuyển ảnh lẻ giữa các điểm dừng (UC-11)
  const openMovePhotoModal = (stop?: TripStop, preselectedPhoto?: PhotoItem) => {
    const source = stop ?? selectedStop;
    if (!source || source.photos.length === 0) return;
    setMoveSourceStop(source);
    setSelectedPhotoToMove(preselectedPhoto ?? source.photos[0]);
    setMovePhotoModalVisible(true);
  };

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
    setLastActionBanner(
      `Đã chuyển ảnh #${selectedPhotoToMove.photo_id} sang "${targetStop.name}".`
    );
    setMovePhotoModalVisible(false);
  };

  const handleResetAll = () => {
    const restored = resetMockTimeline(tripId);
    setTimeline(restored);
    setEditCount(0);
    setSelectedStopId(restored.days[0]?.stops[0]?.stop_id ?? null);
    setLastActionBanner('Đã khôi phục dữ liệu gom cụm gốc từ Auto-Indexing Engine.');
  };

  if (loading || !timeline) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Palette.teal600} />
          <Text style={styles.loadingText}>
            Đang dựng Bản đồ Hành trình & Dòng thời gian...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Các điểm dừng đích có thể nhận ảnh khi thực hiện MOVE_PHOTO
  const candidateTargetStopsForPhoto = displayedStops.filter(
    (s) => s.stop_id !== moveSourceStop?.stop_id
  );

  return (
    <View style={styles.rootContainer}>
      {/* PHẦN TRÊN (TOP 42% MÀN HÌNH): BẢN ĐỒ TƯƠNG TÁC + CUSTOM NUMBERED MARKERS */}
      <View style={styles.mapSection}>
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
                  <View
                    style={[
                      styles.customMarkerBubble,
                      isSelected
                        ? styles.customMarkerBubbleActive
                        : styles.customMarkerBubbleDefault,
                    ]}>
                    <Text style={styles.customMarkerNumber}>{stop.global_index}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          /* Fallback trực quan trên trình duyệt Web khi chạy expo start --web */
          <View style={styles.webMapFallback}>
            <View style={styles.webMapHeader}>
              <Ionicons name="map" size={18} color={Palette.teal500} />
              <Text style={styles.webMapTitle}>
                Bản đồ Tuyến Hành trình • {timeline.title}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.webMarkersRow}>
              {displayedStops.map((stop, idx) => {
                const isSelected = stop.stop_id === selectedStop?.stop_id;
                return (
                  <View key={stop.stop_id} style={styles.webMarkerChain}>
                    <Pressable
                      style={[
                        styles.webMarkerCard,
                        isSelected && styles.webMarkerCardActive,
                      ]}
                      onPress={() => handleFocusStopOnMap(stop)}>
                      <View
                        style={[
                          styles.customMarkerBubble,
                          isSelected
                            ? styles.customMarkerBubbleActive
                            : styles.customMarkerBubbleDefault,
                        ]}>
                        <Text style={styles.customMarkerNumber}>{stop.global_index}</Text>
                      </View>
                      <View style={styles.webMarkerTextCol}>
                        <Text style={styles.webMarkerName} numberOfLines={1}>
                          {stop.name}
                        </Text>
                        <Text style={styles.webMarkerCoord}>
                          {stop.centroid
                            ? `${stop.centroid.latitude.toFixed(4)}, ${stop.centroid.longitude.toFixed(4)}`
                            : 'GPS: unknown'}
                        </Text>
                      </View>
                    </Pressable>
                    {idx < displayedStops.length - 1 && (
                      <View style={styles.webPolylineConnector} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Thanh điều hướng nổi phía trên Bản đồ */}
        <SafeAreaView edges={['top']} style={styles.floatingTopBar}>
          <Pressable style={styles.floatingCircleBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color={Palette.textPrimary} />
          </Pressable>

          <View style={styles.floatingTitlePill}>
            <Ionicons name="navigate-circle" size={16} color={Palette.teal600} />
            <Text style={styles.floatingTitleText} numberOfLines={1}>
              {timeline.title}
            </Text>
          </View>

          <Pressable
            style={styles.floatingAiSearchBtn}
            onPress={() => router.push('/search')}>
            <Ionicons name="sparkles" size={14} color={Palette.textInverse} />
            <Text style={styles.floatingAiSearchText}>CLIP</Text>
          </Pressable>
        </SafeAreaView>

        {/* Các nút điều khiển nổi góc dưới Bản đồ (Fit All Markers + Usability Edits Counter) */}
        <View style={styles.floatingBottomMapControls}>
          <View style={styles.editsCounterBadge}>
            <Ionicons name="construct" size={13} color={Palette.indigo600} />
            <Text style={styles.editsCounterText}>
              Usability Edits: <Text style={styles.editsCounterNum}>{editCount}</Text>
            </Text>
          </View>

          <Pressable style={styles.fitRouteButton} onPress={handleFitAllMarkers}>
            <Ionicons name="scan-outline" size={15} color={Palette.teal600} />
            <Text style={styles.fitRouteButtonText}>Thu phóng toàn tuyến</Text>
          </Pressable>
        </View>
      </View>

      {/* PHẦN DƯỚI (BOTTOM 58% MÀN HÌNH): FLOATING ROUNDED SHEET (borderTopLeftRadius: 28) */}
      <View style={styles.floatingSheet}>
        {/* Thanh nắm ngang (Grabber Pill) */}
        <View style={styles.grabberWrapper}>
          <View style={styles.grabberPill} />
        </View>

        {/* Tiêu đề Chuyến đi + Nút Tải thêm ảnh */}
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={styles.sheetTripTitle} numberOfLines={1}>
              {timeline.title}
            </Text>
            <Text style={styles.sheetTripSub}>
              {timeline.start_date} → {timeline.end_date} • {displayedStops.length} điểm dừng
            </Text>
          </View>

          <Pressable
            style={styles.sheetUploadPill}
            onPress={() => router.push({ pathname: '/upload', params: { tripId } })}>
            <Feather name="plus" size={14} color={Palette.teal600} />
            <Text style={styles.sheetUploadPillText}>Thêm ảnh</Text>
          </Pressable>
        </View>

        {/* Thanh chọn Ngày dạng Pill Tabs cuộn ngang */}
        <View style={styles.daySelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayPillsScroll}>
            <Pressable
              style={[
                styles.dayPill,
                selectedDayNum === 'ALL' && styles.dayPillActive,
              ]}
              onPress={() => {
                setSelectedDayNum('ALL');
                const first = timeline.days[0]?.stops[0];
                if (first) handleFocusStopOnMap(first);
              }}>
              <Ionicons
                name="layers-outline"
                size={14}
                color={selectedDayNum === 'ALL' ? Palette.textInverse : Palette.textSecondary}
              />
              <Text
                style={[
                  styles.dayPillText,
                  selectedDayNum === 'ALL' && styles.dayPillTextActive,
                ]}>
                Tất cả ({timeline.days.reduce((a, d) => a + d.stops.length, 0)})
              </Text>
            </Pressable>

            {timeline.days.map((day) => {
              const isActive = selectedDayNum === day.day_number;
              return (
                <Pressable
                  key={day.day_number}
                  style={[styles.dayPill, isActive && styles.dayPillActive]}
                  onPress={() => {
                    setSelectedDayNum(day.day_number);
                    const first = day.stops[0];
                    if (first) handleFocusStopOnMap(first);
                  }}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={isActive ? Palette.textInverse : Palette.textSecondary}
                  />
                  <Text
                    style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                    Ngày {day.day_number} • {formatShortDate(day.date)} ({day.stops.length})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Thanh công cụ Human-in-the-Loop trực quan (UC-10 & UC-11) */}
        <View style={styles.hitlToolbarCard}>
          <View style={styles.hitlToolbarHeader}>
            <View style={styles.hitlTitleRow}>
              <Ionicons name="options" size={15} color={Palette.indigo600} />
              <Text style={styles.hitlToolbarTitle}>
                Human-in-the-Loop Indexing (UC-10, UC-11)
              </Text>
            </View>
            <Pressable style={styles.resetPillBtn} onPress={handleResetAll}>
              <Feather name="rotate-ccw" size={12} color={Palette.textSecondary} />
              <Text style={styles.resetPillText}>Khôi phục</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hitlActionsScroll}>
            <Pressable
              style={styles.hitlActionPill}
              onPress={() => handleMergeStops(selectedStop)}>
              <Ionicons name="git-merge-outline" size={14} color={Palette.indigo600} />
              <Text style={styles.hitlActionPillText}>Gộp (MERGE)</Text>
            </Pressable>

            <Pressable
              style={styles.hitlActionPill}
              onPress={() => handleSplitStop(selectedStop)}>
              <Ionicons name="git-branch-outline" size={14} color={Palette.indigo600} />
              <Text style={styles.hitlActionPillText}>Tách cụm (SPLIT)</Text>
            </Pressable>

            <Pressable
              style={styles.hitlActionPill}
              onPress={() => openRenameModal(selectedStop)}>
              <Feather name="edit-3" size={13} color={Palette.indigo600} />
              <Text style={styles.hitlActionPillText}>Đổi tên (RENAME)</Text>
            </Pressable>

            <Pressable
              style={styles.hitlActionPill}
              onPress={() => handleReorderStops(selectedStop)}>
              <Ionicons name="swap-vertical-outline" size={14} color={Palette.indigo600} />
              <Text style={styles.hitlActionPillText}>Đổi thứ tự (REORDER)</Text>
            </Pressable>

            <Pressable
              style={styles.hitlActionPill}
              onPress={() => openMovePhotoModal(selectedStop)}>
              <Ionicons name="images-outline" size={14} color={Palette.indigo600} />
              <Text style={styles.hitlActionPillText}>Chuyển ảnh lẻ</Text>
            </Pressable>
          </ScrollView>

          {lastActionBanner && (
            <View style={styles.feedbackBanner}>
              <Ionicons name="checkmark-circle" size={14} color={Palette.emeraldText} />
              <Text style={styles.feedbackBannerText} numberOfLines={2}>
                {lastActionBanner}
              </Text>
            </View>
          )}
        </View>

        {/* Danh sách Điểm dừng dạng Connected Vertical Stepper */}
        <ScrollView
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineScrollContent}
          showsVerticalScrollIndicator={false}>
          {displayedStops.map((stop, index) => {
            const isSelected = stop.stop_id === selectedStop?.stop_id;
            const isLast = index === displayedStops.length - 1;
            const canSplit = stop.photos.length >= 2;

            return (
              <View key={stop.stop_id} style={styles.stepperRow}>
                {/* Cột trái: Numbered Node + Đường kẻ dọc nối các điểm dừng */}
                <View style={styles.stepperLeftColumn}>
                  <Pressable
                    style={[
                      styles.stepperNodeCircle,
                      isSelected
                        ? styles.stepperNodeCircleActive
                        : styles.stepperNodeCircleDefault,
                    ]}
                    onPress={() => handleFocusStopOnMap(stop)}>
                    <Text style={styles.stepperNodeText}>{stop.global_index}</Text>
                  </Pressable>
                  {!isLast && <View style={styles.stepperVerticalLine} />}
                </View>

                {/* Cột phải: Thẻ StopCard */}
                <Pressable
                  style={[
                    styles.stopCard,
                    isSelected && styles.stopCardActive,
                  ]}
                  onPress={() => handleFocusStopOnMap(stop)}>
                  {/* Hàng tiêu đề StopCard */}
                  <View style={styles.stopCardTopRow}>
                    <View style={styles.stopTitleBlock}>
                      <View style={styles.stopTimePillRow}>
                        <View style={styles.timeRangeBadge}>
                          <Feather name="clock" size={11} color={Palette.teal700} />
                          <Text style={styles.timeRangeText}>
                            {formatTimeHm(stop.start_time)} - {formatTimeHm(stop.end_time)}
                          </Text>
                        </View>

                        {selectedDayNum === 'ALL' && (
                          <View style={styles.dayTagMini}>
                            <Text style={styles.dayTagMiniText}>Ngày {stop.day_number}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.stopNameText}>{stop.name}</Text>
                    </View>

                    {/* Huy hiệu trạng thái Xác nhận / Tự động gom cụm */}
                    <View
                      style={[
                        styles.confirmStatusBadge,
                        stop.is_user_confirmed
                          ? styles.confirmedBadgeBg
                          : styles.autoClusteredBadgeBg,
                      ]}>
                      <Ionicons
                        name={
                          stop.is_user_confirmed
                            ? 'checkmark-done-circle'
                            : 'sparkles-outline'
                        }
                        size={13}
                        color={
                          stop.is_user_confirmed
                            ? Palette.emeraldText
                            : Palette.indigo600
                        }
                      />
                      <Text
                        style={[
                          styles.confirmStatusText,
                          {
                            color: stop.is_user_confirmed
                              ? Palette.emeraldText
                              : Palette.indigo600,
                          },
                        ]}>
                        {stop.is_user_confirmed ? 'Đã xác nhận' : 'Tự động gom cụm'}
                      </Text>
                    </View>
                  </View>

                  {/* Dòng tọa độ Centroid */}
                  <View style={styles.centroidRow}>
                    <Ionicons name="location-outline" size={14} color={Palette.coral500} />
                    <Text style={styles.centroidText}>
                      Centroid:{' '}
                      {stop.centroid
                        ? `${stop.centroid.latitude.toFixed(5)}, ${stop.centroid.longitude.toFixed(5)}`
                        : 'GPS unknown'}
                    </Text>
                    <Text style={styles.photoCountDot}>• {stop.photos.length} ảnh</Text>
                  </View>

                  {/* Dải cuộn ngang các ảnh Thumbnail trong điểm dừng */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photosHorizontalList}>
                    {stop.photos.map((photo) => {
                      const hasGps =
                        photo.latitude !== null && photo.longitude !== null;
                      return (
                        <View key={photo.photo_id} style={styles.photoThumbCard}>
                          <Image
                            source={{ uri: photo.thumbnail_url }}
                            style={styles.photoThumbImage}
                            resizeMode="cover"
                          />

                          {/* Huy hiệu trạng thái EXIF GPS trên góc ảnh */}
                          <View
                            style={[
                              styles.exifGpsBadge,
                              hasGps ? styles.exifGpsVerified : styles.exifGpsUnknown,
                            ]}>
                            <Ionicons
                              name={hasGps ? 'navigate' : 'warning'}
                              size={10}
                              color={hasGps ? Palette.emeraldText : Palette.amberText}
                            />
                            <Text
                              style={[
                                styles.exifGpsBadgeText,
                                {
                                  color: hasGps
                                    ? Palette.emeraldText
                                    : Palette.amberText,
                                },
                              ]}>
                              {hasGps ? 'GPS OK' : 'GPS null'}
                            </Text>
                          </View>

                          {/* Chân ảnh: Giờ chụp + Nút chuyển ảnh nhanh */}
                          <View style={styles.photoThumbFooter}>
                            <Text style={styles.photoThumbTime}>
                              {formatTimeHm(photo.taken_at)}
                            </Text>
                            {displayedStops.length >= 2 && (
                              <Pressable
                                style={styles.photoMoveMiniBtn}
                                onPress={() => openMovePhotoModal(stop, photo)}>
                                <Feather
                                  name="corner-up-right"
                                  size={11}
                                  color={Palette.indigo600}
                                />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  {/* Hàng nút thao tác nhanh Human-in-the-Loop ngay trên từng StopCard */}
                  <View style={styles.cardQuickHitlRow}>
                    <Pressable
                      style={styles.cardQuickBtn}
                      onPress={() => openRenameModal(stop)}>
                      <Feather name="edit-2" size={12} color={Palette.textSecondary} />
                      <Text style={styles.cardQuickBtnText}>Đổi tên</Text>
                    </Pressable>

                    <Pressable
                      style={styles.cardQuickBtn}
                      onPress={() => handleMergeStops(stop)}>
                      <Ionicons
                        name="git-merge-outline"
                        size={13}
                        color={Palette.teal600}
                      />
                      <Text style={[styles.cardQuickBtnText, { color: Palette.teal700 }]}>
                        Gộp
                      </Text>
                    </Pressable>

                    {canSplit && (
                      <Pressable
                        style={[styles.cardQuickBtn, styles.cardQuickBtnIndigo]}
                        onPress={() => handleSplitStop(stop)}>
                        <Ionicons
                          name="git-branch-outline"
                          size={13}
                          color={Palette.indigo600}
                        />
                        <Text
                          style={[
                            styles.cardQuickBtnText,
                            { color: Palette.indigo600 },
                          ]}>
                          Tách ({stop.photos.length} ảnh)
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.cardQuickBtn}
                      onPress={() => handleReorderStops(stop)}>
                      <Ionicons
                        name="swap-vertical-outline"
                        size={13}
                        color={Palette.textSecondary}
                      />
                      <Text style={styles.cardQuickBtnText}>Đổi chỗ</Text>
                    </Pressable>

                    {displayedStops.length >= 2 && (
                      <Pressable
                        style={styles.cardQuickBtn}
                        onPress={() => openMovePhotoModal(stop)}>
                        <Feather name="share" size={12} color={Palette.indigo600} />
                        <Text
                          style={[
                            styles.cardQuickBtnText,
                            { color: Palette.indigo600 },
                          ]}>
                          Chuyển ảnh
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* MODAL 1: ĐỔI TÊN ĐIỂM DỪNG (RENAME - UC-11) */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi tên Điểm dừng (RENAME)</Text>
              <Pressable onPress={() => setRenameModalVisible(false)}>
                <Feather name="x" size={20} color={Palette.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Cập nhật tên địa danh chính xác và đánh dấu đã xác nhận thủ công:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={renameInputValue}
              onChangeText={setRenameInputValue}
              placeholder="Nhập tên điểm dừng mới..."
              placeholderTextColor={Palette.textMuted}
              autoFocus
            />

            <View style={styles.quickNameSuggestions}>
              {[
                'Bãi Sau Vũng Tàu • Check-in Sáng',
                'Đỉnh Tượng Chúa Kitô Vua',
                'Mũi Nghinh Phong Ngắm Hoàng Hôn',
                'Ngọn Hải Đăng Cổ Vũng Tàu',
              ].map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={styles.suggestionPill}
                  onPress={() => setRenameInputValue(suggestion)}>
                  <Text style={styles.suggestionPillText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalFooterActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleConfirmRename}>
                <Ionicons name="checkmark-circle" size={16} color={Palette.textInverse} />
                <Text style={styles.modalConfirmText}>Lưu & Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: CHUYỂN ẢNH LẺ GIỮA CÁC ĐIỂM DỪNG (MOVE_PHOTO - UC-11) */}
      <Modal
        visible={movePhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMovePhotoModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chuyển ảnh giữa Điểm dừng (UC-11)</Text>
              <Pressable onPress={() => setMovePhotoModalVisible(false)}>
                <Feather name="x" size={20} color={Palette.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              1. Chọn bức ảnh cần di chuyển từ &ldquo;{moveSourceStop?.name}&rdquo;:
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalPhotosRow}>
              {moveSourceStop?.photos.map((photo) => {
                const active = selectedPhotoToMove?.photo_id === photo.photo_id;
                return (
                  <Pressable
                    key={photo.photo_id}
                    style={[
                      styles.modalPhotoPickItem,
                      active && styles.modalPhotoPickItemActive,
                    ]}
                    onPress={() => setSelectedPhotoToMove(photo)}>
                    <Image
                      source={{ uri: photo.thumbnail_url }}
                      style={styles.modalPhotoImg}
                    />
                    <Text style={styles.modalPhotoIdText}>#{photo.photo_id}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.modalSub}>2. Chọn điểm dừng đích để chuyển ảnh tới:</Text>

            <View style={styles.targetStopsList}>
              {candidateTargetStopsForPhoto.map((target) => (
                <Pressable
                  key={target.stop_id}
                  style={styles.targetStopOption}
                  onPress={() => handleConfirmMovePhoto(target)}>
                  <View style={styles.targetStopBadge}>
                    <Text style={styles.targetStopBadgeText}>#{target.global_index}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.targetStopName}>{target.name}</Text>
                    <Text style={styles.targetStopMeta}>
                      Ngày {target.day_number} • {target.photos.length} ảnh hiện có
                    </Text>
                  </View>
                  <Feather name="arrow-right-circle" size={18} color={Palette.indigo600} />
                </Pressable>
              ))}
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
  rootContainer: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  flex1: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  mapSection: {
    height: '42%',
    width: '100%',
    position: 'relative',
    backgroundColor: '#CBD5E1',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  customMarkerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Palette.surface,
    ...Shadows.floating,
  },
  customMarkerBubbleDefault: {
    backgroundColor: Palette.teal600,
  },
  customMarkerBubbleActive: {
    backgroundColor: Palette.coral500,
    transform: [{ scale: 1.14 }],
  },
  customMarkerNumber: {
    color: Palette.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  floatingTopBar: {
    position: 'absolute',
    top: 8,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  floatingCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  floatingTitlePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.glassOverlay,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  floatingTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  floatingAiSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.indigo600,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    ...Shadows.floating,
  },
  floatingAiSearchText: {
    color: Palette.textInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  floatingBottomMapControls: {
    position: 'absolute',
    bottom: 28,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editsCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.glassOverlay,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    ...Shadows.floating,
  },
  editsCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  editsCounterNum: {
    color: Palette.indigo600,
    fontWeight: '800',
  },
  fitRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.glassOverlay,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.teal100,
    ...Shadows.floating,
  },
  fitRouteButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    gap: 12,
  },
  webMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webMapTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  webMarkersRow: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  webMarkerChain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webMarkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#334155',
  },
  webMarkerCardActive: {
    borderColor: Palette.coral500,
    backgroundColor: '#31102F',
  },
  webMarkerTextCol: {
    maxWidth: 140,
  },
  webMarkerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  webMarkerCoord: {
    color: '#94A3B8',
    fontSize: 11,
  },
  webPolylineConnector: {
    width: 24,
    height: 4,
    backgroundColor: Palette.teal500,
  },
  floatingSheet: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Palette.bgPrimary,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 8,
    ...Shadows.sheet,
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  grabberPill: {
    width: 42,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.borderStrong,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  sheetHeaderLeft: {
    flex: 1,
  },
  sheetTripTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  sheetTripSub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  sheetUploadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  sheetUploadPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.teal700,
  },
  daySelectorWrapper: {
    paddingBottom: 8,
  },
  dayPillsScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  dayPillActive: {
    backgroundColor: Palette.teal600,
    borderColor: Palette.teal600,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  dayPillTextActive: {
    color: Palette.textInverse,
  },
  hitlToolbarCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: Palette.indigo50,
    borderRadius: Radius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    gap: 8,
  },
  hitlToolbarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hitlTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hitlToolbarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  resetPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  resetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  hitlActionsScroll: {
    gap: 8,
  },
  hitlActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.indigo100,
  },
  hitlActionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.indigo600,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.emeraldBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.emeraldText,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 90,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  stepperLeftColumn: {
    width: 32,
    alignItems: 'center',
  },
  stepperNodeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.surface,
    ...Shadows.subtle,
  },
  stepperNodeCircleDefault: {
    backgroundColor: Palette.teal600,
  },
  stepperNodeCircleActive: {
    backgroundColor: Palette.coral500,
  },
  stepperNodeText: {
    color: Palette.textInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  stepperVerticalLine: {
    flex: 1,
    width: 2.5,
    backgroundColor: Palette.teal100,
    marginVertical: 4,
  },
  stopCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 10,
    ...Shadows.card,
  },
  stopCardActive: {
    borderColor: Palette.coral500,
    borderWidth: 1.8,
  },
  stopCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stopTitleBlock: {
    flex: 1,
    gap: 4,
  },
  stopTimePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeRangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.teal50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  timeRangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.teal700,
  },
  dayTagMini: {
    backgroundColor: Palette.bgSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  dayTagMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  stopNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  confirmStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  confirmedBadgeBg: {
    backgroundColor: Palette.emeraldBg,
  },
  autoClusteredBadgeBg: {
    backgroundColor: Palette.indigo50,
  },
  confirmStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  centroidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  centroidText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  photoCountDot: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.teal600,
  },
  photosHorizontalList: {
    gap: 10,
    paddingVertical: 2,
  },
  photoThumbCard: {
    width: 116,
    borderRadius: Radius.thumbnail,
    overflow: 'hidden',
    backgroundColor: Palette.bgSecondary,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  photoThumbImage: {
    width: 116,
    height: 82,
    backgroundColor: '#CBD5E1',
  },
  exifGpsBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  exifGpsVerified: {
    backgroundColor: Palette.emeraldBg,
  },
  exifGpsUnknown: {
    backgroundColor: Palette.amberBg,
  },
  exifGpsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  photoThumbFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Palette.surface,
  },
  photoThumbTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  photoMoveMiniBtn: {
    padding: 3,
    borderRadius: Radius.pill,
    backgroundColor: Palette.indigo50,
  },
  cardQuickHitlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Palette.bgSecondary,
  },
  cardQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.bgPrimary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cardQuickBtnIndigo: {
    backgroundColor: Palette.indigo50,
    borderColor: Palette.indigo100,
  },
  cardQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Palette.darkOverlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.cardLg,
    padding: 20,
    gap: 14,
    ...Shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Palette.textPrimary,
    backgroundColor: Palette.bgPrimary,
  },
  quickNameSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  suggestionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.teal700,
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Palette.bgSecondary,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Palette.teal600,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textInverse,
  },
  modalPhotosRow: {
    gap: 10,
  },
  modalPhotoPickItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: Radius.thumbnail,
    borderWidth: 2,
    borderColor: Palette.border,
    gap: 4,
  },
  modalPhotoPickItemActive: {
    borderColor: Palette.indigo600,
    backgroundColor: Palette.indigo50,
  },
  modalPhotoImg: {
    width: 78,
    height: 58,
    borderRadius: 8,
  },
  modalPhotoIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  targetStopsList: {
    gap: 8,
  },
  targetStopOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.input,
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  targetStopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.teal600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetStopBadgeText: {
    color: Palette.textInverse,
    fontSize: 11,
    fontWeight: '800',
  },
  targetStopName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  targetStopMeta: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
});
