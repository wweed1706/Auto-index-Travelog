import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getJobStatus, uploadTripPhotos } from '@/services/mockApi';
import { ProcessingJobResponse } from '@/types/trip';

export default function UploadProgressScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = params.tripId ?? 'trip_123';

  const [selectedCount, setSelectedCount] = useState<number>(6);
  const [job, setJob] = useState<ProcessingJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSimulateBatchPick = (count: number) => {
    setSelectedCount(count);
  };

  const handleStartUpload = async () => {
    setIsSubmitting(true);
    try {
      const fakeUris = Array.from(
        { length: selectedCount },
        (_, idx) => `file:///mock/photo_${idx + 1}.jpg`
      );
      const initialJob = await uploadTripPhotos(tripId, fakeUris);
      setJob(initialJob);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceProgress = async (nextPercent: number) => {
    if (!job) return;
    const updated = await getJobStatus(job.job_id, nextPercent);
    setJob(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Quay lại</Text>
          </Pressable>
          <Text style={styles.tripChip}>Chuyến đi: {tripId}</Text>
        </View>

        <Text style={styles.title}>Tải ảnh hàng loạt & Auto-Indexing</Text>
        <Text style={styles.subtitle}>
          Giữ nguyên vẹn metadata EXIF (thời gian chụp + tọa độ GPS gốc) để phục vụ Spatio-Temporal
          Clustering và trích xuất vector CLIP.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Chọn bộ ảnh từ thiết bị</Text>
          <Text style={styles.helperText}>
            Số lượng ảnh đang chọn: <Text style={styles.boldText}>{selectedCount} ảnh</Text> (Hỗ trợ
            100+ ảnh/lần)
          </Text>

          <View style={styles.presetRow}>
            {[6, 25, 120].map((count) => (
              <Pressable
                key={count}
                style={[
                  styles.presetBtn,
                  selectedCount === count && styles.presetBtnActive,
                ]}
                onPress={() => handleSimulateBatchPick(count)}>
                <Text
                  style={[
                    styles.presetBtnText,
                    selectedCount === count && styles.presetBtnTextActive,
                  ]}>
                  Chọn {count} ảnh mẫu
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.uploadButton, isSubmitting && styles.disabledButton]}
            onPress={handleStartUpload}
            disabled={isSubmitting}>
            <Text style={styles.uploadButtonText}>
              {isSubmitting
                ? 'Đang gửi lên Object Storage...'
                : `Tải lên ${selectedCount} ảnh & Kích hoạt Indexing`}
            </Text>
          </Pressable>
        </View>

        {job && (
          <View style={styles.card}>
            <View style={styles.jobHeader}>
              <Text style={styles.sectionTitle}>2. Tiến trình xử lý nền (Background Job)</Text>
              <View
                style={[
                  styles.statusBadge,
                  job.status === 'COMPLETED' ? styles.statusSuccess : styles.statusProcessing,
                ]}>
                <Text style={styles.statusBadgeText}>{job.status}</Text>
              </View>
            </View>

            <Text style={styles.metaText}>
              Job ID: <Text style={styles.monoText}>{job.job_id}</Text> • Trip ID:{' '}
              <Text style={styles.monoText}>{job.trip_id}</Text>
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${job.progress_percent}%` }]} />
            </View>

            <View style={styles.progressInfoRow}>
              <Text style={styles.progressMessage}>{job.message}</Text>
              <Text style={styles.progressPercent}>{job.progress_percent}%</Text>
            </View>

            <View style={styles.simControls}>
              <Pressable
                style={styles.simBtn}
                onPress={() => handleAdvanceProgress(65)}>
                <Text style={styles.simBtnText}>Mô phỏng 65%</Text>
              </Pressable>
              <Pressable
                style={styles.simBtn}
                onPress={() => handleAdvanceProgress(100)}>
                <Text style={styles.simBtnText}>Hoàn tất (100%)</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.viewTimelineBtn}
              onPress={() => router.push(`/trips/${tripId}`)}>
              <Text style={styles.viewTimelineBtnText}>
                Mở Timeline & Bản đồ Hành trình →
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  tripChip: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  helperText: {
    fontSize: 14,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  presetBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#1D4ED8',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusProcessing: {
    backgroundColor: '#FEF3C7',
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  monoText: {
    fontWeight: '700',
    color: '#334155',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  progressMessage: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  simControls: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  viewTimelineBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  viewTimelineBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
