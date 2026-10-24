import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTrips } from '@/services/mockApi';
import { TripSummary } from '@/types/trip';

export default function TripListScreen() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getTrips()
      .then((data) => {
        if (isMounted) {
          setTrips(data);
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
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerBadge}>ReTrip • Hành trình của bạn</Text>
          <Text style={styles.headerTitle}>Danh sách Chuyến đi</Text>
        </View>
        <Pressable style={styles.authButton} onPress={() => router.push('/auth')}>
          <Text style={styles.authButtonText}>Tài khoản</Text>
        </Pressable>
      </View>

      <View style={styles.quickActionsBar}>
        <Pressable
          style={[styles.quickActionButton, styles.primaryAction]}
          onPress={() => router.push({ pathname: '/upload', params: { tripId: 'trip_123' } })}>
          <Text style={styles.primaryActionText}>+ Tải ảnh & Auto-Index</Text>
        </Pressable>

        <Pressable
          style={[styles.quickActionButton, styles.secondaryAction]}
          onPress={() => router.push('/search')}>
          <Text style={styles.secondaryActionText}>Tìm kiếm CLIP</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải danh sách chuyến đi...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.trip_id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.tripCard}>
              <View style={styles.tripCardHeader}>
                <Text style={styles.tripTitle}>{item.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status ?? 'COMPLETED'}</Text>
                </View>
              </View>

              <Text style={styles.tripDates}>
                Thời gian: {item.start_date} → {item.end_date}
              </Text>

              <View style={styles.metricsRow}>
                <Text style={styles.metricItem}>{item.stop_count ?? 0} điểm dừng</Text>
                <Text style={styles.metricDot}>•</Text>
                <Text style={styles.metricItem}>{item.photo_count ?? 0} bức ảnh</Text>
                <Text style={styles.metricDot}>•</Text>
                <Text style={styles.metricItem}>ID: {item.trip_id}</Text>
              </View>

              <View style={styles.cardFooterActions}>
                <Pressable
                  style={styles.timelineBtn}
                  onPress={() => router.push(`/trips/${item.trip_id}`)}>
                  <Text style={styles.timelineBtnText}>Xem Timeline & Bản đồ</Text>
                </Pressable>

                <Pressable
                  style={styles.uploadSmallBtn}
                  onPress={() =>
                    router.push({ pathname: '/upload', params: { tripId: item.trip_id } })
                  }>
                  <Text style={styles.uploadSmallBtnText}>Thêm ảnh</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTextBlock: {
    gap: 2,
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  authButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  authButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  quickActionsBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#2563EB',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryAction: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryActionText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 14,
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
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  tripDates: {
    fontSize: 14,
    color: '#475569',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  metricDot: {
    color: '#94A3B8',
  },
  cardFooterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  timelineBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  timelineBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  uploadSmallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  uploadSmallBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
});
