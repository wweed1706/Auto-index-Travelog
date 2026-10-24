import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SemanticPhotoCard } from '@/components/ui';
import { searchPhotosSemantic } from '@/services/mockApi';
import {
  IconSize,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';
import { SemanticSearchResultItem } from '@/types/trip';

const NATURAL_QUERY_SUGGESTIONS: string[] = [
  'hoàng hôn trên biển',
  'món ăn hải sản địa phương',
  'buổi chiều ở mũi đá',
  'bãi biển nắng vàng buổi sáng',
  'ngọn hải đăng trên đồi',
  'rừng thông sương mù Đà Lạt',
];

export default function SemanticSearchScreen() {
  const [query, setQuery] = useState<string>('hoàng hôn trên biển');
  const [tripIdFilter, setTripIdFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [results, setResults] = useState<SemanticSearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const executeSearch = useCallback(
    async (
      customQuery = query,
      customTripId = tripIdFilter,
      customDate = dateFilter
    ) => {
      setLoading(true);
      try {
        const response = await searchPhotosSemantic({
          query: customQuery,
          trip_id: customTripId,
          date_from: customDate,
          date_to: customDate,
          top_k: 20,
        });
        setResults(response.results);
      } finally {
        setLoading(false);
      }
    },
    [dateFilter, query, tripIdFilter]
  );

  useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSuggestion = (suggestedText: string) => {
    setQuery(suggestedText);
    executeSearch(suggestedText, tripIdFilter, dateFilter);
  };

  const handleOpenResultTrip = useCallback((item: SemanticSearchResultItem) => {
    router.push({ pathname: '/trips/[tripId]', params: { tripId: item.trip_id } });
  }, []);

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Top Bar */}
      <View style={styles.topNavRow}>
        <Pressable
          style={({ pressed }) => [styles.backCircleBtn, pressed && styles.pressed]}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Quay về trang chủ Nhật ký">
          <Feather name="arrow-left" size={IconSize.md} color={Palette.textPrimary} />
        </Pressable>

        <View style={styles.topCenterKicker}>
          <Ionicons name="sparkles" size={12} color={Palette.indigo600} />
          <Text style={styles.topCenterKickerText}>Tìm kiếm</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.uploadShortcutBtn, pressed && styles.pressed]}
          onPress={() => router.push('/upload')}
          accessibilityRole="button"
          accessibilityLabel="Nhập ảnh mới">
          <Feather name="plus" size={IconSize.sm} color={Palette.teal700} />
        </Pressable>
      </View>

      {/* Luminous Light Indigo AI Spotlight Hero Card (No Dark Background!) */}
      <View style={styles.lightHeroCard}>
        <View style={styles.heroTitleGroup}>
          <Text style={styles.heroSerifTitle}>
            Tìm lại khoảnh khắc bằng ngôn ngữ tự nhiên
          </Text>
        </View>

        {/* Gallery White Spotlight Input Bar */}
        <View style={styles.spotlightInputContainer}>
          <View style={styles.sparkleBadgeCircle}>
            <Ionicons name="sparkles" size={IconSize.md} color={Palette.indigo600} />
          </View>

          <TextInput
            style={styles.queryTextInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => executeSearch()}
            returnKeyType="search"
            placeholder="Mô tả cảnh vật, món ăn, thời điểm..."
            placeholderTextColor={Palette.textMuted}
            accessibilityLabel="Câu truy vấn tìm kiếm ảnh bằng ngôn ngữ tự nhiên"
          />

          {query.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.clearIconBtn, pressed && styles.pressed]}
              onPress={() => {
                setQuery('');
                executeSearch('', tripIdFilter, dateFilter);
              }}
              hitSlop={TouchTarget.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Xóa nội dung tìm kiếm">
              <Ionicons name="close-circle" size={IconSize.lg} color={Palette.textMuted} />
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.submitSearchCircle,
              pressed && styles.pressed,
            ]}
            onPress={() => executeSearch()}
            accessibilityRole="button"
            accessibilityLabel="Thực hiện tìm kiếm CLIP">
            <Feather name="arrow-right" size={IconSize.md} color={Palette.surface} />
          </Pressable>
        </View>

        {/* Horizontal One-Tap Suggestion Chips */}
        <View style={styles.suggestionsGroup}>
          <Text style={styles.suggestionsLabel}>Gợi ý truy vấn 1 chạm:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}>
            {NATURAL_QUERY_SUGGESTIONS.map((chipText) => {
              const isSelected = query.trim().toLowerCase() === chipText.toLowerCase();
              return (
                <Pressable
                  key={chipText}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    isSelected && styles.suggestionChipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectSuggestion(chipText)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Tìm kiếm gợi ý: ${chipText}`}>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={isSelected ? Palette.surface : Palette.indigo600}
                  />
                  <Text
                    style={[
                      styles.suggestionChipText,
                      isSelected && styles.suggestionChipTextActive,
                    ]}>
                    {chipText}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Metadata Filter Pills (Trip & Date — UC-13) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metadataFiltersRow}>
        <Pressable
          style={({ pressed }) => [
            styles.filterPill,
            tripIdFilter === null && styles.filterPillActive,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setTripIdFilter(null);
            executeSearch(query, null, dateFilter);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: tripIdFilter === null }}
          accessibilityLabel="Lọc tất cả chuyến đi">
          <Ionicons
            name="globe-outline"
            size={IconSize.xs}
            color={tripIdFilter === null ? Palette.surface : Palette.textSecondary}
          />
          <Text
            style={[
              styles.filterPillText,
              tripIdFilter === null && styles.filterPillTextActive,
            ]}>
            Mọi hành trình
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.filterPill,
            tripIdFilter === 'trip_123' && styles.filterPillActive,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            const nextTrip = tripIdFilter === 'trip_123' ? null : 'trip_123';
            setTripIdFilter(nextTrip);
            executeSearch(query, nextTrip, dateFilter);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: tripIdFilter === 'trip_123' }}
          accessibilityLabel="Lọc chuyến đi Vũng Tàu">
          <Ionicons
            name="sunny-outline"
            size={IconSize.xs}
            color={
              tripIdFilter === 'trip_123' ? Palette.surface : Palette.textSecondary
            }
          />
          <Text
            style={[
              styles.filterPillText,
              tripIdFilter === 'trip_123' && styles.filterPillTextActive,
            ]}>
            Vũng Tàu
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.filterPill,
            tripIdFilter === 'trip_124' && styles.filterPillActive,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            const nextTrip = tripIdFilter === 'trip_124' ? null : 'trip_124';
            setTripIdFilter(nextTrip);
            executeSearch(query, nextTrip, dateFilter);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: tripIdFilter === 'trip_124' }}
          accessibilityLabel="Lọc chuyến đi Đà Lạt">
          <Ionicons
            name="leaf-outline"
            size={IconSize.xs}
            color={
              tripIdFilter === 'trip_124' ? Palette.surface : Palette.textSecondary
            }
          />
          <Text
            style={[
              styles.filterPillText,
              tripIdFilter === 'trip_124' && styles.filterPillTextActive,
            ]}>
            Đà Lạt
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.filterPill,
            dateFilter === '2026-10-10' && styles.filterPillActive,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            const nextDate = dateFilter === '2026-10-10' ? null : '2026-10-10';
            setDateFilter(nextDate);
            executeSearch(query, tripIdFilter, nextDate);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: dateFilter === '2026-10-10' }}
          accessibilityLabel="Lọc ngày 10 tháng 10 năm 2026">
          <Feather
            name="calendar"
            size={IconSize.xs}
            color={
              dateFilter === '2026-10-10' ? Palette.surface : Palette.textSecondary
            }
          />
          <Text
            style={[
              styles.filterPillText,
              dateFilter === '2026-10-10' && styles.filterPillTextActive,
            ]}>
            10/10/2026
          </Text>
        </Pressable>
      </ScrollView>

      {/* Results Summary Bar */}
      <View style={styles.resultsSummaryBar}>
        <Text style={styles.resultsHeadingText}>
          {results.length} khoảnh khắc tương đồng
        </Text>
        <Text style={styles.resultsSubHint}>Chạm vào ảnh để mở bản đồ</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Palette.indigo600} />
          <Text style={styles.loadingStateText}>
            Đang đối sánh ngữ nghĩa hình ảnh...
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.photo_id}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          columnWrapperStyle={styles.gridColumnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="images-outline" size={38} color={Palette.textMuted} />
              <Text style={styles.emptyTitle}>Chưa tìm thấy bức ảnh phù hợp</Text>
              <Text style={styles.emptySubtitle}>
                Hãy thử chọn một gợi ý tiếng Việt ở trên hoặc bỏ bộ lọc chuyến đi.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <SemanticPhotoCard
              item={item}
              index={index}
              onPress={handleOpenResultTrip}
            />
          )}
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
    paddingBottom: 64,
    gap: Spacing.md,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBlock: {
    gap: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backCircleBtn: {
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
  topCenterKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  topCenterKickerText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.indigo700,
    letterSpacing: 0.8,
  },
  uploadShortcutBtn: {
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
  lightHeroCard: {
    backgroundColor: Palette.indigo50,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Palette.indigo100,
    ...Shadows.card,
  },
  heroTitleGroup: {
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
    letterSpacing: 1,
  },
  heroSerifTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  spotlightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    ...Shadows.subtle,
  },
  sparkleBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.indigo50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    paddingVertical: 6,
  },
  clearIconBtn: {
    padding: 4,
  },
  submitSearchCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsGroup: {
    gap: 8,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  suggestionsScroll: {
    gap: 8,
    paddingRight: 4,
  },
  suggestionChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  suggestionChipActive: {
    backgroundColor: Palette.indigo600,
    borderColor: Palette.indigo600,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.indigo700,
  },
  suggestionChipTextActive: {
    color: Palette.surface,
  },
  metadataFiltersRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  filterPillActive: {
    backgroundColor: Palette.teal700,
    borderColor: Palette.teal700,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  filterPillTextActive: {
    color: Palette.surface,
  },
  resultsSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  resultsHeadingText: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  resultsSubHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  emptyCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
