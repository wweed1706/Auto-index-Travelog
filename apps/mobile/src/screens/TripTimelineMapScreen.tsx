import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getTripTimeline,
  mutateTripStops,
  resetMockTimeline,
} from '@/services/mockApi';
import { TripDay, TripStop, TripTimeline } from '@/types/trip';

export default function TripTimelineMapScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = params.tripId ?? 'trip_123';

  const [timeline, setTimeline] = useState<TripTimeline | null>(null);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getTripTimeline(tripId)
      .then((data) => {
        if (isMounted) {
          setTimeline(data);
          const firstStop = data.days[0]?.stops[0]?.stop_id ?? null;
          setSelectedStopId(firstStop);
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

  const activeDay: TripDay | undefined = timeline?.days.find(
    (d) => d.day_number === selectedDayNum
  );

  const handleMergeFirstTwoStops = async () => {
    if (!activeDay || activeDay.stops.length < 2) return;
    const [first, second] = activeDay.stops;
    const updated = await mutateTripStops(tripId, {
      action: 'MERGE',
      source_stop_ids: [first.stop_id, second.stop_id],
      new_name: 'Bãi Sau Vũng Tàu',
    });
    setTimeline(updated);
  };

  const handleReverseStopsOrder = async () => {
    if (!activeDay || activeDay.stops.length < 2) return;
    const reversedIds = [...activeDay.stops].reverse().map((s) => s.stop_id);
    const updated = await mutateTripStops(tripId, {
      action: 'REORDER',
      source_stop_ids: reversedIds,
      ordered_stop_ids: reversedIds,
    });
    setTimeline(updated);
  };

  const handleReset = () => {
    const restored = resetMockTimeline();
    setTimeline(restored);
  };

  if (loading || !timeline) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải Timeline & Bản đồ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Chuyến đi</Text>
          </Pressable>
          <Pressable style={styles.searchBtn} onPress={() => router.push('/search')}>
            <Text style={styles.searchBtnText}>Tìm kiếm CLIP</Text>
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.tripTitle}>{timeline.title}</Text>
          <Text style={styles.tripMeta}>
            {timeline.start_date} → {timeline.end_date} • ID: {timeline.trip_id}
          </Text>
        </View>

        {/* Bộ chọn Ngày (Day Selector) */}
        <View style={styles.dayTabsRow}>
          {timeline.days.map((day) => {
            const active = day.day_number === selectedDayNum;
            return (
              <Pressable
                key={day.day_number}
                style={[styles.dayTab, active && styles.dayTabActive]}
                onPress={() => {
                  setSelectedDayNum(day.day_number);
                  setSelectedStopId(day.stops[0]?.stop_id ?? null);
                }}>
                <Text style={[styles.dayTabTitle, active && styles.dayTabTitleActive]}>
                  Ngày {day.day_number}
                </Text>
                <Text style={[styles.dayTabSub, active && styles.dayTabTitleActive]}>
                  {day.date} ({day.stops.length} điểm)
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Khu vực Bản đồ tương tác & Chuỗi Marker theo thứ tự thời gian */}
        <View style={styles.mapPreviewCard}>
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapCardTitle}>
              Bản đồ Hành trình • Ngày {selectedDayNum}
            </Text>
            <Text style={styles.mapLegend}>Đường nối theo thứ tự thời gian</Text>
          </View>

          <View style={styles.mapCanvas}>
            {activeDay?.stops.map((stop, index) => {
              const isSelected = stop.stop_id === selectedStopId;
              return (
                <View key={stop.stop_id} style={styles.markerChainItem}>
                  <Pressable
                    style={[styles.markerPin, isSelected && styles.markerPinSelected]}
                    onPress={() => setSelectedStopId(stop.stop_id)}>
                    <Text
                      style={[
                        styles.markerIndex,
                        isSelected && styles.markerIndexSelected,
                      ]}>
                      #{stop.order_index}
                    </Text>
                    <View style={styles.markerInfo}>
                      <Text
                        style={[
                          styles.markerName,
                          isSelected && styles.markerNameSelected,
                        ]}
                        numberOfLines={1}>
                        {stop.name}
                      </Text>
                      <Text style={styles.markerCoords}>
                        {stop.centroid
                          ? `${stop.centroid.latitude.toFixed(5)}, ${stop.centroid.longitude.toFixed(5)}`
                          : 'GPS: unknown'}
                      </Text>
                    </View>
                  </Pressable>
                  {index < (activeDay.stops.length - 1) && (
                    <View style={styles.routeConnectorLine} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Thanh công cụ Human-in-the-Loop Indexing */}
        <View style={styles.hitlCard}>
          <Text style={styles.hitlTitle}>
            Human-in-the-Loop Indexing (PATCH /stops/mutate)
          </Text>
          <View style={styles.hitlButtonsRow}>
            <Pressable style={styles.hitlActionBtn} onPress={handleMergeFirstTwoStops}>
              <Text style={styles.hitlActionText}>Gộp 2 điểm đầu (MERGE)</Text>
            </Pressable>
            <Pressable style={styles.hitlActionBtn} onPress={handleReverseStopsOrder}>
              <Text style={styles.hitlActionText}>Đảo thứ tự (REORDER)</Text>
            </Pressable>
            <Pressable style={styles.hitlResetBtn} onPress={handleReset}>
              <Text style={styles.hitlResetText}>Khôi phục</Text>
            </Pressable>
          </View>
        </View>

        {/* Danh sách chi tiết Điểm dừng (Timeline Stops) */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionHeading}>
            Dòng thời gian Ngày {selectedDayNum} ({activeDay?.date})
          </Text>

          {activeDay?.stops.map((stop: TripStop) => (
            <Pressable
              key={stop.stop_id}
              style={[
                styles.stopCard,
                stop.stop_id === selectedStopId && styles.stopCardHighlighted,
              ]}
              onPress={() => setSelectedStopId(stop.stop_id)}>
              <View style={styles.stopHeader}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>#{stop.order_index}</Text>
                </View>
                <View style={styles.stopTitleContainer}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopTimeRange}>
                    {stop.start_time.slice(11, 16)} → {stop.end_time.slice(11, 16)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.confirmBadge,
                    stop.is_user_confirmed
                      ? styles.confirmedBg
                      : styles.unconfirmedBg,
                  ]}>
                  <Text style={styles.confirmBadgeText}>
                    {stop.is_user_confirmed ? 'Đã xác nhận' : 'Tự động gợi ý'}
                  </Text>
                </View>
              </View>

              <Text style={styles.centroidLine}>
                Tâm cụm (Centroid):{' '}
                {stop.centroid
                  ? `${stop.centroid.latitude}, ${stop.centroid.longitude}`
                  : 'unknown'}
              </Text>

              <View style={styles.photosList}>
                {stop.photos.map((photo) => (
                  <View key={photo.photo_id} style={styles.photoChip}>
                    <Text style={styles.photoChipId}>{photo.photo_id}</Text>
                    <Text style={styles.photoChipTime}>
                      {photo.taken_at.slice(11, 16)}
                    </Text>
                    <Text
                      style={[
                        styles.photoChipGps,
                        photo.latitude === null && styles.gpsUnknownText,
                      ]}>
                      {photo.latitude !== null && photo.longitude !== null
                        ? `GPS: ${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`
                        : 'GPS: unknown (null)'}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  searchBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  titleBlock: {
    gap: 3,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  dayTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayTabTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayTabSub: {
    fontSize: 12,
    color: '#64748B',
  },
  dayTabTitleActive: {
    color: '#FFFFFF',
  },
  mapPreviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapCardTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  mapLegend: {
    color: '#93C5FD',
    fontSize: 11,
  },
  mapCanvas: {
    gap: 4,
  },
  markerChainItem: {
    gap: 4,
  },
  markerPin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  markerPinSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#1E3A8A',
  },
  markerIndex: {
    color: '#93C5FD',
    fontWeight: '800',
    fontSize: 14,
  },
  markerIndexSelected: {
    color: '#FFFFFF',
  },
  markerInfo: {
    flex: 1,
  },
  markerName: {
    color: '#F1F5F9',
    fontWeight: '600',
    fontSize: 13,
  },
  markerNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  markerCoords: {
    color: '#94A3B8',
    fontSize: 11,
  },
  routeConnectorLine: {
    width: 2,
    height: 10,
    backgroundColor: '#60A5FA',
    marginLeft: 22,
  },
  hitlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  hitlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  hitlButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hitlActionBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  hitlActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  hitlResetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  hitlResetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timelineSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  stopCardHighlighted: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderBadge: {
    backgroundColor: '#2563EB',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  stopTitleContainer: {
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stopTimeRange: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  confirmedBg: {
    backgroundColor: '#DCFCE7',
  },
  unconfirmedBg: {
    backgroundColor: '#FEF3C7',
  },
  confirmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  centroidLine: {
    fontSize: 12,
    color: '#475569',
  },
  photosList: {
    gap: 6,
    marginTop: 2,
  },
  photoChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoChipId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoChipTime: {
    fontSize: 12,
    color: '#64748B',
  },
  photoChipGps: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  gpsUnknownText: {
    color: '#B45309',
  },
});
