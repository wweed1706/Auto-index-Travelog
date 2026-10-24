import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroTripCard } from '@/components/ui';
import { tripRepository } from '@/services/tripRepository';
import {
  IconSize,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';
import { DataSourceMode, TripSummary } from '@/types/trip';

const QUICK_AI_PROMPTS = [
  'hoàng hôn trên biển',
  'món ăn hải sản địa phương',
  'ngọn hải đăng trên đồi',
  'rừng thông sương mù Đà Lạt',
];

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
  const [dataSourceMode, setDataSourceMode] =
    useState<DataSourceMode>('LOCAL_SMART_MOCK');
  const [fallbackActive, setFallbackActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadScreenData = useCallback(async () => {
    const mode = await tripRepository.getMode();
    setDataSourceMode(mode);
    const data = await tripRepository.getTrips();
    setTrips(data);
    const snap = tripRepository.getStatusSnapshot();
    setFallbackActive(snap.fallbackTriggered);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadScreenData()
        .catch(() => {
          // Handled inside repository fallback
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }, [loadScreenData])
  );

  const summaryStats = useMemo(() => {
    const totalTrips = trips.length;
    const totalStops = trips.reduce((acc, item) => acc + (item.stop_count ?? 0), 0);
    const totalPhotos = trips.reduce((acc, item) => acc + (item.photo_count ?? 0), 0);
    return { totalTrips, totalStops, totalPhotos };
  }, [trips]);

  const handleOpenTimeline = useCallback((tripId: string) => {
    router.push({ pathname: '/trips/[tripId]', params: { tripId } });
  }, []);

  const handleAddPhotos = useCallback((tripId: string) => {
    router.push({ pathname: '/upload', params: { tripId } });
  }, []);

  const handleToggleDataSourceMode = useCallback(async () => {
    const nextSnap = await tripRepository.toggleMode();
    setDataSourceMode(nextSnap.mode);
    const data = await tripRepository.getTrips();
    setTrips(data);
    const afterCallSnap = tripRepository.getStatusSnapshot();
    setFallbackActive(afterCallSnap.fallbackTriggered);
    setStatusMessage(
      nextSnap.mode === 'LOCAL_SMART_MOCK'
        ? 'Đang dùng chế độ LOCAL_SMART_MOCK (Xử lý EXIF & lưu AsyncStorage trực tiếp trên thiết bị).'
        : afterCallSnap.fallbackTriggered
          ? 'REMOTE_FASTAPI chưa phản hồi — Đã tự động fallback an toàn về dữ liệu Local.'
          : 'Đang kết nối chế độ REMOTE_FASTAPI.'
    );
  }, []);

  const handleResetDemoData = useCallback(async () => {
    const restoredTrips = await tripRepository.resetAllMockDataToDefaults();
    setTrips(restoredTrips);
    setStatusMessage(
      'Đã khôi phục dữ liệu mẫu gốc (Vũng Tàu & Đà Lạt) và làm mới bộ nhớ AsyncStorage!'
    );
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Editorial Magazine Masthead */}
      <View style={styles.mastheadRow}>
        <View style={styles.brandBlock}>
          <View style={styles.issueEyebrowRow}>
            <View style={styles.brandAccentDot} />
            <Text style={styles.issueEyebrowText}>RETRIP ARCHIVE • ẤN PHẨM 2026</Text>
          </View>
          <Text style={styles.brandLogoTitle}>ReTrip.</Text>
        </View>

        <View style={styles.mastheadActions}>
          <Pressable
            style={({ pressed }) => [styles.studioImportPill, pressed && styles.pressed]}
            onPress={() => handleAddPhotos('trip_123')}
            accessibilityRole="button"
            accessibilityLabel="Tạo hành trình mới từ thư viện ảnh EXIF">
            <Feather name="plus" size={IconSize.sm} color={Palette.surface} />
            <Text style={styles.studioImportPillText}>Nhập ảnh</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.avatarCircleBtn, pressed && styles.pressed]}
            onPress={() => router.push('/auth')}
            accessibilityRole="button"
            accessibilityLabel="Mở trang Hồ sơ & Tài khoản">
            <Ionicons name="person-outline" size={IconSize.md} color={Palette.teal700} />
          </Pressable>
        </View>
      </View>

      {/* Editorial Quote / Tagline */}
      <View style={styles.editorialIntroBlock}>
        <Text style={styles.editorialDisplayQuote}>
          Mỗi bức ảnh là một tọa độ ký ức sống động.
        </Text>
        <Text style={styles.editorialLeadBody}>
          Tự động gom cụm điểm dừng theo không gian - thời gian và tìm lại khoảnh khắc bằng
          ngôn ngữ tự nhiên.
        </Text>
      </View>

      {/* Flexible Data Source Switcher + Reset Demo Data Bar */}
      <View style={styles.repoControlBar}>
        <Pressable
          style={({ pressed }) => [
            styles.modeSwitchPill,
            dataSourceMode === 'REMOTE_FASTAPI' && styles.modeSwitchPillRemote,
            pressed && styles.pressed,
          ]}
          onPress={handleToggleDataSourceMode}
          accessibilityRole="button"
          accessibilityLabel={`Chuyển đổi nguồn dữ liệu, hiện tại: ${dataSourceMode}`}>
          <View
            style={[
              styles.modeDot,
              dataSourceMode === 'REMOTE_FASTAPI' ? styles.modeDotIndigo : styles.modeDotEmerald,
            ]}
          />
          <Text style={styles.modeSwitchText} numberOfLines={1}>
            {dataSourceMode === 'LOCAL_SMART_MOCK'
              ? 'Local Smart Mock • AsyncStorage'
              : fallbackActive
                ? 'FastAPI (Auto-Fallback Local)'
                : 'Remote FastAPI Mode'}
          </Text>
          <Feather name="repeat" size={11} color={Palette.teal700} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.resetDemoPill,
            pressed && styles.pressed,
          ]}
          onPress={handleResetDemoData}
          accessibilityRole="button"
          accessibilityLabel="Khôi phục dữ liệu mẫu ban đầu">
          <Feather name="rotate-ccw" size={11} color={Palette.coral600} />
          <Text style={styles.resetDemoPillText}>Khôi phục dữ liệu mẫu</Text>
        </Pressable>
      </View>

      {statusMessage && (
        <View style={styles.statusToastRow}>
          <Ionicons name="checkmark-circle" size={IconSize.sm} color={Palette.emeraldText} />
          <Text style={styles.statusToastText}>{statusMessage}</Text>
        </View>
      )}

      {/* Luminous Lavender-Indigo AI Visual Search Spotlight Card (Light Theme) */}
      <View style={styles.lightSpotlightCard}>
        <Pressable
          style={({ pressed }) => [
            styles.spotlightSearchTrigger,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel="Mở Tìm kiếm ảnh bằng ngôn ngữ tự nhiên AI CLIP">
          <View style={styles.spotlightIconBadge}>
            <Ionicons name="sparkles" size={IconSize.md} color={Palette.indigo600} />
          </View>
          <View style={styles.spotlightPromptCol}>
            <Text style={styles.spotlightPromptLabel}>Tìm kiếm</Text>
            <Text style={styles.spotlightPromptPlaceholder} numberOfLines={1}>
              &ldquo;hoàng hôn trên biển&rdquo;, &ldquo;hải sản địa phương&rdquo;...
            </Text>
          </View>
          <View style={styles.spotlightGoCircle}>
            <Feather name="search" size={IconSize.sm} color={Palette.surface} />
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsRow}>
          {QUICK_AI_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              style={({ pressed }) => [
                styles.quickPromptChip,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel={`Tìm nhanh: ${prompt}`}>
              <Ionicons name="sparkles-outline" size={11} color={Palette.indigo600} />
              <Text style={styles.quickPromptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Asymmetric Editorial Bento Grid (100% Unified Light Theme) */}
      <View style={styles.bentoGridContainer}>
        {/* Left Tall Feature Bento Card (Soft Coastal Mint-Teal Light Card) */}
        <Pressable
          style={({ pressed }) => [
            styles.bentoLeftPrimaryCard,
            pressed && styles.pressed,
          ]}
          onPress={() => handleAddPhotos('trip_123')}
          accessibilityRole="button"
          accessibilityLabel="Tái dựng hành trình mới từ ảnh có EXIF">
          <View style={styles.bentoLeftTopRow}>
            <View style={styles.bentoTealIconWrap}>
              <Ionicons name="compass" size={IconSize.lg} color={Palette.teal700} />
            </View>
          </View>

          <View style={styles.bentoLeftBottomBlock}>
            <Text style={styles.bentoBigSerifNumber}>
              {String(summaryStats.totalTrips).padStart(2, '0')}
            </Text>
            <Text style={styles.bentoLeftTitle}>Chuyến đi đã tái dựng</Text>
            <View style={styles.bentoLeftSubLink}>
              <Text style={styles.bentoLeftSubLinkText}>Tạo chuyến mới</Text>
              <Feather name="arrow-right" size={12} color={Palette.teal700} />
            </View>
          </View>
        </Pressable>

        {/* Right Stacked Bento Column */}
        <View style={styles.bentoRightStack}>
          <View style={styles.bentoSmallCard}>
            <View style={styles.bentoSmallTopRow}>
              <View style={[styles.bentoSmallIconCircle, styles.coralCircle]}>
                <Ionicons name="location" size={IconSize.sm} color={Palette.coral600} />
              </View>
            </View>
            <Text style={styles.bentoSmallNumber}>{summaryStats.totalStops}</Text>
            <Text style={styles.bentoSmallLabel}>Điểm dừng trên bản đồ</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.bentoSmallCard, pressed && styles.pressed]}
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel="Xem kho ảnh đã lưu">
            <View style={styles.bentoSmallTopRow}>
              <View style={[styles.bentoSmallIconCircle, styles.indigoCircle]}>
                <Ionicons name="sparkles" size={IconSize.sm} color={Palette.indigo600} />
              </View>
            </View>
            <Text style={styles.bentoSmallNumber}>{summaryStats.totalPhotos}</Text>
            <Text style={styles.bentoSmallLabel}>Khoảnh khắc đã lưu</Text>
          </Pressable>
        </View>
      </View>

      {/* Magazine Issues Section Header */}
      <View style={styles.magazineSectionHeader}>
        <View>
          <Text style={styles.magazineSectionKicker}>ẤN PHẨM HÀNH TRÌNH</Text>
          <Text style={styles.magazineSectionTitle}>Nhật ký Chuyến đi</Text>
        </View>
        <Text style={styles.magazineSectionCount}>{trips.length} chương</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Palette.teal700} />
          <Text style={styles.loadingStateText}>
            Đang mở ấn phẩm hành trình của bạn...
          </Text>
        </View>
      ) : (
        <View style={styles.flexContainer}>
          <FlatList
            data={trips}
            keyExtractor={(item) => item.trip_id}
            ListHeaderComponent={renderHeader()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <HeroTripCard
                trip={item}
                issueNumber={index + 1}
                daysCount={computeDaysBetween(
                  item.start_date,
                  item.end_date,
                  item.days_count
                )}
                onOpenTimeline={handleOpenTimeline}
                onAddPhotos={handleAddPhotos}
              />
            )}
          />

          {/* Floating Frosted White Bottom Navigation Dock (Light Theme) */}
          <View style={styles.floatingDockWrapper}>
            <View style={styles.floatingLightDock}>
              <Pressable
                style={[styles.dockTabItem, styles.dockTabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: true }}
                accessibilityLabel="Trang chủ Nhật ký">
                <Ionicons name="book" size={IconSize.sm} color={Palette.surface} />
                <Text style={styles.dockTabActiveText}>Nhật ký</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.dockTabItem, pressed && styles.pressed]}
                onPress={() => router.push('/search')}
                accessibilityRole="tab"
                accessibilityLabel="Mở Tìm kiếm">
                <Ionicons name="sparkles-outline" size={IconSize.md} color={Palette.indigo600} />
                <Text style={styles.dockTabInactiveText}>Tìm kiếm</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.dockTabItem, pressed && styles.pressed]}
                onPress={() => handleAddPhotos('trip_123')}
                accessibilityRole="tab"
                accessibilityLabel="Tải ảnh EXIF mới">
                <Feather name="plus-circle" size={IconSize.md} color={Palette.teal700} />
                <Text style={styles.dockTabInactiveText}>Tạo mới</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.dockTabItem, pressed && styles.pressed]}
                onPress={() => router.push('/auth')}
                accessibilityRole="tab"
                accessibilityLabel="Mở Tài khoản">
                <Ionicons name="person-outline" size={IconSize.md} color={Palette.textSecondary} />
                <Text style={styles.dockTabInactiveText}>Hồ sơ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  flexContainer: {
    flex: 1,
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
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
    gap: Spacing.xxl,
  },
  headerContainer: {
    gap: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  mastheadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBlock: {
    gap: 2,
  },
  issueEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandAccentDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.coral600,
  },
  issueEyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 1.1,
  },
  brandLogoTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 34,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.8,
  },
  mastheadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  studioImportPill: {
    minHeight: TouchTarget.compactMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.teal700,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  studioImportPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.surface,
  },
  avatarCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  editorialIntroBlock: {
    gap: 6,
  },
  editorialDisplayQuote: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  editorialLeadBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Palette.textSecondary,
  },
  repoControlBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  modeSwitchPill: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  modeSwitchPillRemote: {
    borderColor: Palette.indigo100,
    backgroundColor: Palette.indigo50,
  },
  modeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  modeDotEmerald: {
    backgroundColor: Palette.emeraldDot,
  },
  modeDotIndigo: {
    backgroundColor: Palette.indigo600,
  },
  modeSwitchText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  resetDemoPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.coral50,
    borderWidth: 1,
    borderColor: Palette.coral100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  resetDemoPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.coral600,
  },
  statusToastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.emeraldBg,
    borderWidth: 1,
    borderColor: Palette.emeraldBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  statusToastText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.emeraldText,
  },
  lightSpotlightCard: {
    backgroundColor: Palette.indigo50,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    ...Shadows.card,
  },
  spotlightSearchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  spotlightIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.indigo50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightPromptCol: {
    flex: 1,
    gap: 2,
  },
  spotlightPromptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
    letterSpacing: 0.8,
  },
  spotlightPromptPlaceholder: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  spotlightGoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptsRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  quickPromptChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.indigo700,
  },
  bentoGridContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bentoLeftPrimaryCard: {
    flex: 1.08,
    backgroundColor: Palette.teal50,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    minHeight: 196,
    borderWidth: 1.5,
    borderColor: Palette.teal100,
    ...Shadows.card,
  },
  bentoLeftTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoTealIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.teal100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLeftBottomBlock: {
    gap: 4,
    marginTop: Spacing.lg,
  },
  bentoBigSerifNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 42,
    fontWeight: '700',
    color: Palette.teal800,
    lineHeight: 46,
  },
  bentoLeftTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  bentoLeftSubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bentoLeftSubLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.teal700,
  },
  bentoRightStack: {
    flex: 1,
    gap: Spacing.md,
  },
  bentoSmallCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  bentoSmallTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoSmallIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralCircle: {
    backgroundColor: Palette.coral50,
  },
  indigoCircle: {
    backgroundColor: Palette.indigo50,
  },
  bentoSmallNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 2,
  },
  bentoSmallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  magazineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  magazineSectionKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 1,
  },
  magazineSectionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 23,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 2,
  },
  magazineSectionCount: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSubtle,
  },
  floatingDockWrapper: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
  },
  floatingLightDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: Radius.pill,
    padding: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.floating,
  },
  dockTabItem: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
  },
  dockTabActive: {
    backgroundColor: Palette.teal700,
  },
  dockTabActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.surface,
  },
  dockTabInactiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  pressed: {
    opacity: 0.78,
  },
});
