import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Shadows } from '@/constants/designSystem';
import { getTrips } from '@/services/mockApi';
import { TripSummary } from '@/types/trip';

function computeDaysBetween(startDate: string, endDate: string, fallback?: number): number {
  if (fallback && fallback > 0) return fallback;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

export default function TripListScreen() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
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
    }, [])
  );

  const summaryStats = useMemo(() => {
    const totalTrips = trips.length;
    const totalStops = trips.reduce((acc, item) => acc + (item.stop_count ?? 0), 0);
    const totalPhotos = trips.reduce((acc, item) => acc + (item.photo_count ?? 0), 0);
    return { totalTrips, totalStops, totalPhotos };
  }, [trips]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Personalized Greeting + Account Button */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingLeft}>
          <View style={styles.brandTagRow}>
            <Ionicons name="compass" size={15} color={Palette.teal600} />
            <Text style={styles.brandTagText}>RETRIP • AUTO-INDEX TRAVELOG</Text>
          </View>
          <Text style={styles.greetingTitle}>Khám phá Hành trình</Text>
          <Text style={styles.greetingSub}>
            Xin chào, chúc bạn một chuyến đi ngập tràn kỷ niệm!
          </Text>
        </View>

        <Pressable style={styles.avatarButton} onPress={() => router.push('/auth')}>
          <Ionicons name="person-circle-outline" size={24} color={Palette.teal600} />
          <Text style={styles.avatarBtnText}>Tài khoản</Text>
        </Pressable>
      </View>

      {/* AI Semantic Search Spotlight Banner (Indigo Violet) */}
      <Pressable style={styles.aiSearchSpotlight} onPress={() => router.push('/search')}>
        <View style={styles.aiIconCircle}>
          <Ionicons name="sparkles" size={20} color={Palette.textInverse} />
        </View>
        <View style={styles.aiSpotlightBody}>
          <View style={styles.aiSpotlightTitleRow}>
            <Text style={styles.aiSpotlightTitle}>Tìm kiếm AI Ngữ nghĩa (CLIP)</Text>
            <View style={styles.aiPillBadge}>
              <Text style={styles.aiPillBadgeText}>pgvector</Text>
            </View>
          </View>
          <Text style={styles.aiSpotlightSub} numberOfLines={1}>
            Thử tìm: &ldquo;hoàng hôn trên biển&rdquo;, &ldquo;món ăn hải sản&rdquo;...
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={Palette.indigo600} />
      </Pressable>

      {/* Bento Overview Summary Card */}
      <View style={styles.bentoSummaryCard}>
        <View style={styles.bentoStatItem}>
          <View style={[styles.bentoIconWrap, { backgroundColor: Palette.teal50 }]}>
            <Ionicons name="map-outline" size={18} color={Palette.teal600} />
          </View>
          <Text style={styles.bentoStatValue}>{summaryStats.totalTrips}</Text>
          <Text style={styles.bentoStatLabel}>Chuyến đi</Text>
        </View>

        <View style={styles.bentoDivider} />

        <View style={styles.bentoStatItem}>
          <View style={[styles.bentoIconWrap, { backgroundColor: Palette.coral50 }]}>
            <Ionicons name="location-outline" size={18} color={Palette.coral500} />
          </View>
          <Text style={styles.bentoStatValue}>{summaryStats.totalStops}</Text>
          <Text style={styles.bentoStatLabel}>Điểm dừng</Text>
        </View>

        <View style={styles.bentoDivider} />

        <View style={styles.bentoStatItem}>
          <View style={[styles.bentoIconWrap, { backgroundColor: Palette.indigo50 }]}>
            <Ionicons name="images-outline" size={18} color={Palette.indigo600} />
          </View>
          <Text style={styles.bentoStatValue}>{summaryStats.totalPhotos}</Text>
          <Text style={styles.bentoStatLabel}>Ảnh đã Index</Text>
        </View>
      </View>

      {/* Quick Action Bar: Upload & Create Trip */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Hành trình đã tái dựng</Text>
          <Text style={styles.sectionSubtitle}>
            Chạm vào thẻ chuyến đi để mở Bản đồ & Timeline tương tác
          </Text>
        </View>
        <Pressable
          style={styles.newUploadBtn}
          onPress={() => router.push({ pathname: '/upload', params: { tripId: 'trip_123' } })}>
          <Feather name="plus-circle" size={15} color={Palette.textInverse} />
          <Text style={styles.newUploadBtnText}>Tải ảnh EXIF</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Palette.teal600} />
          <Text style={styles.loadingText}>Đang đồng bộ danh sách chuyến đi...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.trip_id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const daysCount = computeDaysBetween(
              item.start_date,
              item.end_date,
              item.days_count
            );

            return (
              <Pressable
                style={styles.magazineCard}
                onPress={() =>
                  router.push({ pathname: '/trips/[tripId]', params: { tripId: item.trip_id } })
                }>
                {/* Ảnh bìa lớn Magazine Hero */}
                <View style={styles.heroImageContainer}>
                  {item.cover_thumbnail_url ? (
                    <Image
                      source={{ uri: item.cover_thumbnail_url }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.heroFallbackBg}>
                      <Ionicons name="image-outline" size={42} color={Palette.textMuted} />
                    </View>
                  )}

                  {/* Top Floating Badges trên ảnh bìa */}
                  <View style={styles.heroTopRow}>
                    <View style={styles.verifiedGpsPill}>
                      <Ionicons name="checkmark-circle" size={13} color={Palette.emeraldText} />
                      <Text style={styles.verifiedGpsPillText}>Auto-Indexed</Text>
                    </View>

                    <View style={styles.tripIdPill}>
                      <Text style={styles.tripIdPillText}>#{item.trip_id}</Text>
                    </View>
                  </View>

                  {/* Lớp nền tối nhẹ ở đáy (Dark Overlay) */}
                  <View style={styles.heroBottomOverlay}>
                    <Text style={styles.heroTripTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={styles.heroDateRow}>
                      <Feather name="calendar" size={13} color="#E2E8F0" />
                      <Text style={styles.heroDateText}>
                        {item.start_date} → {item.end_date}
                      </Text>
                    </View>

                    {/* Các huy hiệu nổi: Số ngày, Số điểm dừng, Số ảnh */}
                    <View style={styles.heroMetricsRow}>
                      <View style={styles.heroMetricBadge}>
                        <Ionicons name="sunny-outline" size={13} color="#5EEAD4" />
                        <Text style={styles.heroMetricBadgeText}>{daysCount} ngày</Text>
                      </View>
                      <View style={styles.heroMetricBadge}>
                        <Ionicons name="location-outline" size={13} color="#FDA4AF" />
                        <Text style={styles.heroMetricBadgeText}>
                          {item.stop_count ?? 0} điểm dừng
                        </Text>
                      </View>
                      <View style={styles.heroMetricBadge}>
                        <Ionicons name="camera-outline" size={13} color="#C7D2FE" />
                        <Text style={styles.heroMetricBadgeText}>
                          {item.photo_count ?? 0} bức ảnh
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Chân thẻ Magazine Card: Các nút hành động nhanh */}
                <View style={styles.cardFooter}>
                  <Pressable
                    style={styles.openTimelineBtn}
                    onPress={() =>
                      router.push({ pathname: '/trips/[tripId]', params: { tripId: item.trip_id } })
                    }>
                    <Ionicons name="map" size={16} color={Palette.textInverse} />
                    <Text style={styles.openTimelineBtnText}>Bản đồ & Dòng thời gian</Text>
                    <Feather name="arrow-up-right" size={16} color={Palette.textInverse} />
                  </Pressable>

                  <Pressable
                    style={styles.addPhotosIconBtn}
                    onPress={() =>
                      router.push({ pathname: '/upload', params: { tripId: item.trip_id } })
                    }>
                    <Ionicons name="cloud-upload-outline" size={18} color={Palette.teal600} />
                    <Text style={styles.addPhotosIconBtnText}>Thêm ảnh</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
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
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 18,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  greetingLeft: {
    flex: 1,
    gap: 3,
  },
  brandTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.teal600,
    letterSpacing: 0.6,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.subtle,
  },
  avatarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  aiSearchSpotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.indigo50,
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    ...Shadows.card,
  },
  aiIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Palette.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSpotlightBody: {
    flex: 1,
    gap: 3,
  },
  aiSpotlightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSpotlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.indigo700,
  },
  aiPillBadge: {
    backgroundColor: Palette.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.indigo100,
  },
  aiPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
  },
  aiSpotlightSub: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  bentoSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  bentoStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bentoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bentoStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  bentoStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  bentoDivider: {
    width: 1,
    height: 42,
    backgroundColor: Palette.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  newUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.teal600,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  newUploadBtnText: {
    color: Palette.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  magazineCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.cardLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  heroImageContainer: {
    height: 225,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallbackBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  heroTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedGpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.emeraldBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  verifiedGpsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.emeraldText,
  },
  tripIdPill: {
    backgroundColor: Palette.darkOverlayStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  tripIdPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Palette.darkOverlayStrong,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  heroTripTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textInverse,
    letterSpacing: -0.3,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  heroMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heroMetricBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textInverse,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Palette.surface,
  },
  openTimelineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.teal600,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  openTimelineBtnText: {
    color: Palette.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  addPhotosIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Radius.pill,
  },
  addPhotosIconBtnText: {
    color: Palette.teal700,
    fontSize: 13,
    fontWeight: '700',
  },
});
