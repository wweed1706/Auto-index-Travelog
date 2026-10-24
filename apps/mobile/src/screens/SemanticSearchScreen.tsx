import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchPhotosSemantic } from '@/services/mockApi';
import { SemanticSearchResultItem } from '@/types/trip';

export default function SemanticSearchScreen() {
  const [query, setQuery] = useState<string>('ảnh chụp ở bãi biển vào buổi chiều');
  const [tripIdFilter, setTripIdFilter] = useState<string | null>('trip_123');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.badge}>Trụ cột 2 • PyTorch + CLIP + pgvector</Text>
            <Text style={styles.title}>Tìm kiếm Ngôn ngữ Tự nhiên</Text>
          </View>
          <Pressable style={styles.homeBtn} onPress={() => router.push('/')}>
            <Text style={styles.homeBtnText}>Chuyến đi</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.queryInput}
            value={query}
            onChangeText={setQuery}
            placeholder="VD: ảnh chụp ở bãi biển vào buổi chiều..."
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.filtersRow}>
            <Pressable
              style={[styles.filterChip, tripIdFilter === 'trip_123' && styles.filterChipActive]}
              onPress={() => {
                const nextTrip = tripIdFilter === 'trip_123' ? null : 'trip_123';
                setTripIdFilter(nextTrip);
                executeSearch(query, nextTrip, dateFilter);
              }}>
              <Text
                style={[
                  styles.filterChipText,
                  tripIdFilter === 'trip_123' && styles.filterChipTextActive,
                ]}>
                Chuyến đi: Vũng Tàu (trip_123)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                dateFilter === '2026-10-10' && styles.filterChipActive,
              ]}
              onPress={() => {
                const nextDate = dateFilter === '2026-10-10' ? null : '2026-10-10';
                setDateFilter(nextDate);
                executeSearch(query, tripIdFilter, nextDate);
              }}>
              <Text
                style={[
                  styles.filterChipText,
                  dateFilter === '2026-10-10' && styles.filterChipTextActive,
                ]}>
                Ngày: 2026-10-10
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.searchSubmitBtn} onPress={() => executeSearch()}>
            <Text style={styles.searchSubmitText}>Tìm kiếm ảnh phù hợp</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang truy vấn vector CLIP & PostGIS...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.photo_id}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <Text style={styles.resultsCountText}>
                Tìm thấy {results.length} kết quả khớp ngữ nghĩa cho &ldquo;{query}&rdquo;
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultCard}
                onPress={() => router.push(`/trips/${item.trip_id}`)}>
                <View style={styles.resultTopRow}>
                  <View style={styles.photoBadge}>
                    <Text style={styles.photoBadgeText}>Ảnh: {item.photo_id}</Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>
                      Độ tương đồng CLIP: {(item.similarity_score * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.stopNameText}>
                  Điểm dừng: {item.stop.name} ({item.stop.stop_id})
                </Text>

                <Text style={styles.metaText}>
                  Ngày {item.day_number} • Chụp lúc: {item.taken_at}
                </Text>

                <Text style={styles.coordText}>
                  Tọa độ: {item.stop.latitude.toFixed(5)}, {item.stop.longitude.toFixed(5)} •
                  Thumbnail: {item.thumbnail_url}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  homeBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  queryInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  filterChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#1D4ED8',
  },
  searchSubmitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchSubmitText: {
    color: '#FFFFFF',
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
  resultsList: {
    gap: 12,
    paddingBottom: 100,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  stopNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
  coordText: {
    fontSize: 11,
    color: '#64748B',
  },
});
