import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Shadows } from '@/constants/designSystem';
import { searchPhotosSemantic } from '@/services/mockApi';
import { SemanticSearchResultItem } from '@/types/trip';

const NATURAL_QUERY_SUGGESTIONS: string[] = [
  'hoàng hôn trên biển',
  'món ăn hải sản địa phương',
  'buổi chiều ở mũi đá',
  'bãi biển nắng vàng buổi sáng',
  'ngọn hải đăng trên đồi',
  'rừng thông sương mù Đà Lạt',
];

function formatTimeHm(isoStr: string): string {
  if (!isoStr) return '--:--';
  const timePart = isoStr.includes('T') ? isoStr.split('T')[1] : isoStr;
  return timePart ? timePart.slice(0, 5) : '--:--';
}

export default function SemanticSearchScreen() {
  const [query, setQuery] = useState<string>('hoàng hôn trên biển');
  const [tripIdFilter, setTripIdFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [results, setResults] = useState<SemanticSearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const executeSearch = async (
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
  };

  useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSuggestion = (suggestedText: string) => {
    setQuery(suggestedText);
    executeSearch(suggestedText, tripIdFilter, dateFilter);
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.pillarBadge}>
            <Ionicons name="sparkles" size={12} color={Palette.indigo600} />
            <Text style={styles.pillarBadgeText}>TRỤ CỘT 2 • PYTORCH + CLIP + PGVECTOR</Text>
          </View>
          <Text style={styles.screenTitle}>Tìm kiếm Ngữ nghĩa AI</Text>
        </View>

        <Pressable style={styles.homePillBtn} onPress={() => router.push('/')}>
          <Ionicons name="compass-outline" size={16} color={Palette.textPrimary} />
          <Text style={styles.homePillText}>Hành trình</Text>
        </Pressable>
      </View>

      {/* Spotlight Search Card */}
      <View style={styles.spotlightCard}>
        <View style={styles.spotlightInputRow}>
          <View style={styles.sparkleIconBox}>
            <Ionicons name="sparkles" size={18} color={Palette.indigo600} />
          </View>

          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => executeSearch()}
            returnKeyType="search"
            placeholder="Mô tả bức ảnh bằng tiếng Việt tự nhiên..."
            placeholderTextColor={Palette.textMuted}
          />

          {query.length > 0 && (
            <Pressable
              style={styles.clearInputBtn}
              onPress={() => {
                setQuery('');
                executeSearch('', tripIdFilter, dateFilter);
              }}
              hitSlop={8}>
              <Ionicons name="close-circle" size={19} color={Palette.textMuted} />
            </Pressable>
          )}

          <Pressable style={styles.searchTriggerBtn} onPress={() => executeSearch()}>
            <Feather name="search" size={16} color={Palette.textInverse} />
          </Pressable>
        </View>

        {/* Suggestion Chips (Gợi ý thông minh 1 chạm) */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionMiniLabel}>Gợi ý câu truy vấn tiếng Việt tự nhiên:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}>
            {NATURAL_QUERY_SUGGESTIONS.map((chipText) => {
              const isSelected = query.trim().toLowerCase() === chipText.toLowerCase();
              return (
                <Pressable
                  key={chipText}
                  style={[
                    styles.suggestionChip,
                    isSelected && styles.suggestionChipActive,
                  ]}
                  onPress={() => handleSelectSuggestion(chipText)}>
                  <Ionicons
                    name="sparkles-outline"
                    size={12}
                    color={isSelected ? Palette.textInverse : Palette.indigo600}
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

        {/* Bộ lọc Hybrid Metadata (Chuyến đi & Ngày chụp - UC-13) */}
        <View style={styles.filtersRow}>
          <Pressable
            style={[
              styles.filterPill,
              tripIdFilter === null && styles.filterPillTealActive,
            ]}
            onPress={() => {
              setTripIdFilter(null);
              executeSearch(query, null, dateFilter);
            }}>
            <Ionicons
              name="globe-outline"
              size={13}
              color={tripIdFilter === null ? Palette.textInverse : Palette.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                tripIdFilter === null && styles.filterPillTextActive,
              ]}>
              Mọi chuyến đi
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              tripIdFilter === 'trip_123' && styles.filterPillTealActive,
            ]}
            onPress={() => {
              const nextTrip = tripIdFilter === 'trip_123' ? null : 'trip_123';
              setTripIdFilter(nextTrip);
              executeSearch(query, nextTrip, dateFilter);
            }}>
            <Ionicons
              name="sunny-outline"
              size={13}
              color={tripIdFilter === 'trip_123' ? Palette.textInverse : Palette.textSecondary}
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
            style={[
              styles.filterPill,
              tripIdFilter === 'trip_124' && styles.filterPillTealActive,
            ]}
            onPress={() => {
              const nextTrip = tripIdFilter === 'trip_124' ? null : 'trip_124';
              setTripIdFilter(nextTrip);
              executeSearch(query, nextTrip, dateFilter);
            }}>
            <Ionicons
              name="leaf-outline"
              size={13}
              color={tripIdFilter === 'trip_124' ? Palette.textInverse : Palette.textSecondary}
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
            style={[
              styles.filterPill,
              dateFilter === '2026-10-10' && styles.filterPillTealActive,
            ]}
            onPress={() => {
              const nextDate = dateFilter === '2026-10-10' ? null : '2026-10-10';
              setDateFilter(nextDate);
              executeSearch(query, tripIdFilter, nextDate);
            }}>
            <Feather
              name="calendar"
              size={12}
              color={dateFilter === '2026-10-10' ? Palette.textInverse : Palette.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                dateFilter === '2026-10-10' && styles.filterPillTextActive,
              ]}>
              10/10/2026
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Dòng tóm tắt số lượng kết quả */}
      <View style={styles.resultsSummaryRow}>
        <Text style={styles.resultsSummaryText}>
          Tìm thấy <Text style={styles.resultsCountHighlight}>{results.length} bức ảnh</Text>{' '}
          tương đồng vector CLIP
        </Text>
        <View style={styles.vectorStatusTag}>
          <Ionicons name="flash" size={11} color={Palette.emeraldText} />
          <Text style={styles.vectorStatusTagText}>Cosine Similarity</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Palette.indigo600} />
            <Text style={styles.loadingText}>
              Đang so khớp vector CLIP & lọc không gian PostGIS...
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.trip_id}_${item.photo_id}`}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const matchPercent = Math.round(item.similarity_score * 100);
            return (
              <Pressable
                style={styles.bentoResultCard}
                onPress={() =>
                  router.push({ pathname: '/trips/[tripId]', params: { tripId: item.trip_id } })
                }>
                {/* Ảnh kết quả + Huy hiệu độ tương đồng CLIP nổi góc trên bên phải */}
                <View style={styles.resultImageWrapper}>
                  <Image
                    source={{ uri: item.thumbnail_url }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />

                  <View style={styles.similarityFloatingBadge}>
                    <Text style={styles.similarityBadgeText}>
                      ✨ {matchPercent}% khớp
                    </Text>
                  </View>

                  <View style={styles.dayOverlayPill}>
                    <Text style={styles.dayOverlayPillText}>Ngày {item.day_number}</Text>
                  </View>
                </View>

                {/* Chân thẻ: Tên Điểm dừng (kèm icon định vị), Ngày chụp & Giờ chụp */}
                <View style={styles.resultCardFooter}>
                  <View style={styles.stopNameRow}>
                    <Ionicons name="location" size={14} color={Palette.coral500} />
                    <Text style={styles.stopNameText} numberOfLines={1}>
                      {item.stop.name}
                    </Text>
                  </View>

                  <View style={styles.metaBottomRow}>
                    <View style={styles.metaTimeChip}>
                      <Feather name="clock" size={11} color={Palette.textSubtle} />
                      <Text style={styles.metaTimeText}>
                        {formatTimeHm(item.taken_at)} • {item.taken_at.slice(5, 10)}
                      </Text>
                    </View>

                    <Feather name="arrow-up-right" size={14} color={Palette.teal600} />
                  </View>
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
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerBlock: {
    gap: 14,
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  topBarLeft: {
    gap: 3,
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillarBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.indigo600,
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  homePillBtn: {
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
  homePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  spotlightCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.cardLg,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    gap: 14,
    ...Shadows.card,
  },
  spotlightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.pill,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Palette.indigo100,
  },
  sparkleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.indigo50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    paddingVertical: 4,
  },
  clearInputBtn: {
    padding: 4,
  },
  searchTriggerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsSection: {
    gap: 7,
  },
  sectionMiniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  suggestionsScroll: {
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  suggestionChipActive: {
    backgroundColor: Palette.indigo600,
    borderColor: Palette.indigo600,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.indigo600,
  },
  suggestionChipTextActive: {
    color: Palette.textInverse,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Palette.bgSecondary,
  },
  filterPill: {
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
  filterPillTealActive: {
    backgroundColor: Palette.teal600,
    borderColor: Palette.teal600,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  filterPillTextActive: {
    color: Palette.textInverse,
  },
  resultsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  resultsCountHighlight: {
    fontWeight: '800',
    color: Palette.indigo600,
  },
  vectorStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.emeraldBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  vectorStatusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.emeraldText,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bentoResultCard: {
    width: '48.2%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  resultImageWrapper: {
    width: '100%',
    height: 158,
    position: 'relative',
    backgroundColor: '#CBD5E1',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  similarityFloatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Palette.darkOverlayStrong,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  similarityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EEF2FF',
  },
  dayOverlayPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  dayOverlayPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textInverse,
  },
  resultCardFooter: {
    padding: 11,
    gap: 6,
  },
  stopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopNameText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  metaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
