import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  createTripFromUploadedPhotos,
  getJobStatus,
  uploadTripPhotos,
} from '@/services/mockApi';
import { PhotoItem, ProcessingJobResponse } from '@/types/trip';

const SAMPLE_EXIF_PHOTOS: PhotoItem[] = [
  {
    photo_id: 'exif_01',
    thumbnail_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-24T08:15:00+07:00',
    latitude: 10.34599,
    longitude: 107.08426,
  },
  {
    photo_id: 'exif_02',
    thumbnail_url:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-24T09:05:00+07:00',
    latitude: 10.34612,
    longitude: 107.08435,
  },
  {
    photo_id: 'exif_03',
    thumbnail_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-24T12:20:00+07:00',
    // Minh họa ảnh chụp thiếu tọa độ GPS: giữ nguyên null (unknown), không gán 0
    latitude: null,
    longitude: null,
  },
  {
    photo_id: 'exif_04',
    thumbnail_url:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-24T15:10:00+07:00',
    latitude: 10.33582,
    longitude: 107.07668,
  },
  {
    photo_id: 'exif_05',
    thumbnail_url:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-24T17:25:00+07:00',
    latitude: 10.3245,
    longitude: 107.0831,
  },
  {
    photo_id: 'exif_06',
    thumbnail_url:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    original_url:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85',
    taken_at: '2026-10-25T11:40:00+07:00',
    latitude: null,
    longitude: null,
  },
];

function parseExifCoordinate(rawCoord: unknown, ref?: unknown): number | null {
  if (rawCoord === null || rawCoord === undefined) return null;
  let numericValue: number | null = null;

  if (typeof rawCoord === 'number' && !Number.isNaN(rawCoord) && rawCoord !== 0) {
    numericValue = rawCoord;
  } else if (Array.isArray(rawCoord) && rawCoord.length >= 2) {
    const deg = Number(rawCoord[0]) || 0;
    const min = Number(rawCoord[1]) || 0;
    const sec = Number(rawCoord[2]) || 0;
    const dms = deg + min / 60 + sec / 3600;
    if (dms !== 0 && !Number.isNaN(dms)) {
      numericValue = dms;
    }
  }

  if (numericValue === null) return null;
  if ((ref === 'S' || ref === 'W') && numericValue > 0) {
    numericValue = -numericValue;
  }
  return Number(numericValue.toFixed(5));
}

function parseExifDateTime(exif: Record<string, unknown> | null | undefined, index: number): string {
  const rawDate =
    (exif?.DateTimeOriginal as string | undefined) ||
    (exif?.DateTimeDigitized as string | undefined) ||
    (exif?.DateTime as string | undefined);

  if (rawDate && typeof rawDate === 'string') {
    // Chuẩn hóa "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS+07:00"
    const normalized = rawDate
      .trim()
      .replace(/^(\d{4}):(\d{2}):(\d{2})\s+/, '$1-$2-$3T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
      return normalized.endsWith('Z') || normalized.includes('+')
        ? normalized
        : `${normalized}+07:00`;
    }
  }

  // Fallback giữ trình tự thời gian hợp lệ
  const hour = String(8 + (index % 10)).padStart(2, '0');
  const min = String((index * 12) % 60).padStart(2, '0');
  return `2026-10-24T${hour}:${min}:00+07:00`;
}

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Trích xuất & Chuẩn hóa EXIF',
    desc: 'Đọc DateTimeOriginal & tọa độ GPS, đánh dấu unknown (null) cho ảnh khuyết GPS',
    threshold: 25,
    icon: 'compass-outline' as const,
  },
  {
    step: 2,
    title: 'Trích xuất Vector CLIP (PyTorch)',
    desc: 'Mã hóa đặc trưng thị giác vào không gian nhúng đa phương thức (pgvector)',
    threshold: 55,
    icon: 'sparkles-outline' as const,
  },
  {
    step: 3,
    title: 'Phân cụm Spatio-Temporal (DBSCAN)',
    desc: 'Gom nhóm sự kiện/điểm dừng theo khoảng cách PostGIS & ngưỡng thời gian',
    threshold: 85,
    icon: 'git-network-outline' as const,
  },
  {
    step: 4,
    title: 'Tái dựng Hành trình & Mở Bản đồ',
    desc: 'Khởi tạo chuyến đi mới kèm Polyline thứ tự thời gian & trạng thái HITL',
    threshold: 100,
    icon: 'map-outline' as const,
  },
];

export default function UploadProgressScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const baseTripId = params.tripId ?? 'trip_123';

  const [tripTitle, setTripTitle] = useState<string>('Khám phá Biển Đảo • Auto-Index');
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoItem[]>(SAMPLE_EXIF_PHOTOS);
  const [pickerSourceLabel, setPickerSourceLabel] = useState<string>(
    'Bộ ảnh mẫu chuẩn EXIF (Có & Khuyết GPS)'
  );
  const [job, setJob] = useState<ProcessingJobResponse | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  // Thống kê Bento 3 ô: Tổng ảnh, Có GPS hợp lệ, Khuyết GPS (unknown / null)
  const exifStats = useMemo(() => {
    const total = selectedPhotos.length;
    const validGps = selectedPhotos.filter(
      (p) => p.latitude !== null && p.longitude !== null
    ).length;
    const unknownGps = total - validGps;
    return { total, validGps, unknownGps };
  }, [selectedPhotos]);

  // Mở thư viện ảnh thật của thiết bị với expo-image-picker (allowsMultipleSelection: true, exif: true)
  const handlePickRealPhotosFromDevice = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Cần quyền truy cập Thư viện ảnh',
          'Vui lòng cấp quyền truy cập ảnh để ReTrip đọc metadata EXIF & tọa độ GPS gốc.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        exif: true,
        orderedSelection: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const mappedPhotos: PhotoItem[] = result.assets.map((asset, idx) => {
        const exifData = (asset.exif ?? null) as Record<string, unknown> | null;
        const lat = parseExifCoordinate(exifData?.GPSLatitude, exifData?.GPSLatitudeRef);
        const lng = parseExifCoordinate(exifData?.GPSLongitude, exifData?.GPSLongitudeRef);
        const takenAt = parseExifDateTime(exifData, idx);

        return {
          photo_id: `dev_${idx + 1}`,
          thumbnail_url: asset.uri,
          original_url: asset.uri,
          taken_at: takenAt,
          latitude: lat !== null && lng !== null ? lat : null,
          longitude: lat !== null && lng !== null ? lng : null,
        };
      });

      setSelectedPhotos(mappedPhotos);
      setPickerSourceLabel(`Thư viện Thiết bị (${mappedPhotos.length} ảnh thực tế)`);
      setJob(null);
      setCreatedTripId(null);
    } catch {
      Alert.alert(
        'Không thể mở Thư viện ảnh',
        'Đã xảy ra lỗi khi đọc ảnh từ thiết bị. Bạn có thể sử dụng bộ ảnh mẫu EXIF bên dưới.'
      );
    }
  };

  const handleLoadSampleExifBatch = () => {
    setSelectedPhotos(SAMPLE_EXIF_PHOTOS);
    setPickerSourceLabel('Bộ ảnh mẫu chuẩn EXIF (Có & Khuyết GPS)');
    setJob(null);
    setCreatedTripId(null);
  };

  // Kích hoạt tiến trình Auto-Indexing -> Tạo chuyến đi mới -> Mở màn hình Timeline + Map
  const handleStartAutoIndexing = async () => {
    if (selectedPhotos.length === 0 || isRunningPipeline) return;
    setIsRunningPipeline(true);
    setCreatedTripId(null);

    try {
      const uris = selectedPhotos.map((p) => p.original_url);
      const initialJob = await uploadTripPhotos(baseTripId, uris);
      setJob(initialJob);

      // Chạy tuần tự qua các bước của Auto-Indexing Engine
      const step55 = await getJobStatus(initialJob.job_id, 55, baseTripId);
      setJob(step55);

      const step85 = await getJobStatus(initialJob.job_id, 85, baseTripId);
      setJob(step85);

      // Tạo chuyến đi mới từ danh sách ảnh đã chọn
      const newTripTimeline = await createTripFromUploadedPhotos({
        title: tripTitle,
        photos: selectedPhotos,
      });

      const step100 = await getJobStatus(
        initialJob.job_id,
        100,
        newTripTimeline.trip_id
      );
      setJob(step100);
      setCreatedTripId(newTripTimeline.trip_id);

      // Tự động điều hướng sang màn hình Timeline + Bản đồ của chuyến đi vừa tạo
      router.push({
        pathname: '/trips/[tripId]',
        params: { tripId: newTripTimeline.trip_id },
      });
    } finally {
      setIsRunningPipeline(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeaderRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={16} color={Palette.textPrimary} />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </Pressable>

          <View style={styles.phaseBadge}>
            <Ionicons name="shield-checkmark" size={13} color={Palette.teal600} />
            <Text style={styles.phaseBadgeText}>EXIF Integrity • Giai đoạn 2</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Chọn Ảnh & Kiểm tra EXIF</Text>
          <Text style={styles.screenSubtitle}>
            Tích hợp <Text style={styles.codeHighlight}>expo-image-picker</Text> đọc trực tiếp
            metadata thời gian & tọa độ GPS gốc. Ảnh thiếu GPS được gắn nhãn{' '}
            <Text style={styles.amberHighlight}>unknown (null)</Text>, tuyệt đối không gán 0.
          </Text>
        </View>

        {/* Bước 1: Chọn ảnh từ thiết bị & Đặt tên Chuyến đi */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepCircleTeal}>
              <Text style={styles.stepCircleText}>1</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>Chọn bộ sưu tập ảnh chuyến đi</Text>
              <Text style={styles.cardSubtitle}>Nguồn hiện tại: {pickerSourceLabel}</Text>
            </View>
          </View>

          {/* Ô nhập Tên chuyến đi mới */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên chuyến đi sẽ khởi tạo:</Text>
            <View style={styles.titleInputBox}>
              <Ionicons name="flag-outline" size={17} color={Palette.teal600} />
              <TextInput
                style={styles.titleInput}
                value={tripTitle}
                onChangeText={setTripTitle}
                placeholder="Nhập tên chuyến đi mới..."
                placeholderTextColor={Palette.textMuted}
              />
            </View>
          </View>

          {/* Nút mở Thư viện ảnh thật (expo-image-picker) + Nút nạp ảnh mẫu */}
          <View style={styles.pickerButtonsRow}>
            <Pressable
              style={styles.realPickerButton}
              onPress={handlePickRealPhotosFromDevice}>
              <Ionicons name="images" size={18} color={Palette.textInverse} />
              <Text style={styles.realPickerButtonText}>
                Chọn ảnh từ Thiết bị (EXIF)
              </Text>
            </Pressable>

            <Pressable
              style={styles.sampleBatchButton}
              onPress={handleLoadSampleExifBatch}>
              <Ionicons name="sparkles-outline" size={16} color={Palette.indigo600} />
              <Text style={styles.sampleBatchButtonText}>Bộ mẫu</Text>
            </Pressable>
          </View>
        </View>

        {/* Bước 2: Bento Summary Grid (3 thẻ thống kê EXIF GPS) */}
        <View style={styles.bentoGridContainer}>
          {/* Thẻ 1: Tổng số ảnh */}
          <View style={[styles.bentoStatCard, styles.bentoTotalCard]}>
            <View style={[styles.bentoIconCircle, { backgroundColor: Palette.indigo50 }]}>
              <Ionicons name="layers" size={18} color={Palette.indigo600} />
            </View>
            <Text style={styles.bentoNumber}>{exifStats.total}</Text>
            <Text style={styles.bentoLabel}>Tổng số ảnh</Text>
            <Text style={styles.bentoSubLabel}>Đã nạp vào bộ đệm</Text>
          </View>

          {/* Thẻ 2: Có GPS hợp lệ (Emerald) */}
          <View style={[styles.bentoStatCard, styles.bentoEmeraldCard]}>
            <View style={[styles.bentoIconCircle, { backgroundColor: Palette.emeraldBg }]}>
              <Ionicons name="location" size={18} color={Palette.emeraldText} />
            </View>
            <Text style={[styles.bentoNumber, { color: Palette.emeraldText }]}>
              {exifStats.validGps}
            </Text>
            <Text style={[styles.bentoLabel, { color: Palette.emeraldText }]}>
              Có GPS hợp lệ
            </Text>
            <Text style={styles.bentoSubLabel}>GPS Verified</Text>
          </View>

          {/* Thẻ 3: Khuyết GPS unknown (Amber) */}
          <View style={[styles.bentoStatCard, styles.bentoAmberCard]}>
            <View style={[styles.bentoIconCircle, { backgroundColor: Palette.amberBg }]}>
              <Ionicons name="warning" size={18} color={Palette.amberText} />
            </View>
            <Text style={[styles.bentoNumber, { color: Palette.amberText }]}>
              {exifStats.unknownGps}
            </Text>
            <Text style={[styles.bentoLabel, { color: Palette.amberText }]}>
              Khuyết GPS
            </Text>
            <Text style={styles.bentoSubLabel}>unknown (null)</Text>
          </View>
        </View>

        {/* Bước 3: Danh sách ảnh Preview kèm Badge GPS */}
        <View style={styles.sectionCard}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.cardTitle}>
              Kiểm tra EXIF từng ảnh ({selectedPhotos.length} ảnh)
            </Text>
            <View style={styles.integrityRuleTag}>
              <Text style={styles.integrityRuleText}>Null-Safe GPS</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewPhotosScroll}>
            {selectedPhotos.map((photo, index) => {
              const hasValidGps =
                photo.latitude !== null && photo.longitude !== null;
              return (
                <View key={photo.photo_id} style={styles.previewPhotoCard}>
                  <View style={styles.previewImageWrap}>
                    <Image
                      source={{ uri: photo.thumbnail_url }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoIndexPill}>
                      <Text style={styles.photoIndexText}>#{index + 1}</Text>
                    </View>

                    {/* Badge trạng thái EXIF GPS trên góc ảnh */}
                    <View
                      style={[
                        styles.previewGpsBadge,
                        hasValidGps
                          ? styles.previewGpsVerified
                          : styles.previewGpsUnknown,
                      ]}>
                      <Ionicons
                        name={hasValidGps ? 'checkmark-circle' : 'alert-circle'}
                        size={11}
                        color={hasValidGps ? Palette.emeraldText : Palette.amberText}
                      />
                      <Text
                        style={[
                          styles.previewGpsBadgeText,
                          {
                            color: hasValidGps
                              ? Palette.emeraldText
                              : Palette.amberText,
                          },
                        ]}>
                        {hasValidGps ? 'GPS Verified' : 'GPS Unknown'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewMetaBody}>
                    <View style={styles.previewMetaLine}>
                      <Feather name="clock" size={11} color={Palette.textSecondary} />
                      <Text style={styles.previewMetaTime} numberOfLines={1}>
                        {photo.taken_at.slice(0, 16).replace('T', ' ')}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.previewCoordText,
                        !hasValidGps && { color: Palette.amberText },
                      ]}
                      numberOfLines={1}>
                      {hasValidGps
                        ? `${photo.latitude?.toFixed(4)}, ${photo.longitude?.toFixed(4)}`
                        : 'lat/lng: null (unknown)'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Nút kích hoạt Auto-Indexing Pipeline */}
          <Pressable
            style={[
              styles.launchPipelineBtn,
              isRunningPipeline && styles.disabledBtn,
            ]}
            onPress={handleStartAutoIndexing}
            disabled={isRunningPipeline}>
            {isRunningPipeline ? (
              <ActivityIndicator size="small" color={Palette.textInverse} />
            ) : (
              <Ionicons name="rocket" size={18} color={Palette.textInverse} />
            )}
            <Text style={styles.launchPipelineBtnText}>
              {isRunningPipeline
                ? 'Đang chạy Auto-Indexing & Dựng Hành trình...'
                : `Chạy Auto-Indexing (${selectedPhotos.length} ảnh) & Mở Bản đồ`}
            </Text>
          </Pressable>
        </View>

        {/* Bước 4: Auto-Indexing Pipeline Stepper */}
        <View style={styles.sectionCard}>
          <View style={styles.pipelineHeaderRow}>
            <View style={styles.stepCircleIndigo}>
              <Ionicons name="hardware-chip" size={15} color={Palette.textInverse} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>Auto-Indexing Pipeline Stepper</Text>
              <Text style={styles.cardSubtitle}>
                {job
                  ? `${job.message} (${job.progress_percent}%)`
                  : 'Sẵn sàng xử lý: Đọc EXIF → CLIP Vector → Spatio-Temporal → Bản đồ'}
              </Text>
            </View>
          </View>

          {/* Thanh phần trăm tổng thể */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${job ? job.progress_percent : 0}%` },
              ]}
            />
          </View>

          {/* 4 bước trong Pipeline */}
          <View style={styles.pipelineStepsList}>
            {PIPELINE_STEPS.map((item) => {
              const currentPct = job?.progress_percent ?? 0;
              const isDone = currentPct >= item.threshold;
              const isCurrent =
                currentPct > 0 &&
                currentPct < item.threshold &&
                currentPct >= item.threshold - 35;

              return (
                <View key={item.step} style={styles.pipelineStepRow}>
                  <View
                    style={[
                      styles.pipelineIconCircle,
                      isDone
                        ? styles.pipelineIconDone
                        : isCurrent
                          ? styles.pipelineIconActive
                          : styles.pipelineIconPending,
                    ]}>
                    <Ionicons
                      name={isDone ? 'checkmark' : item.icon}
                      size={15}
                      color={
                        isDone || isCurrent
                          ? Palette.textInverse
                          : Palette.textMuted
                      }
                    />
                  </View>

                  <View style={styles.pipelineStepTextCol}>
                    <Text
                      style={[
                        styles.pipelineStepTitle,
                        isDone && { color: Palette.teal700 },
                      ]}>
                      Bước {item.step}: {item.title}
                    </Text>
                    <Text style={styles.pipelineStepDesc}>{item.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {createdTripId && (
            <Pressable
              style={styles.openCreatedTripBtn}
              onPress={() =>
                router.push({
                  pathname: '/trips/[tripId]',
                  params: { tripId: createdTripId },
                })
              }>
              <Ionicons name="map" size={17} color={Palette.textInverse} />
              <Text style={styles.openCreatedTripBtnText}>
                Mở Hành trình Mới (#{createdTripId}) trên Timeline & Bản đồ
              </Text>
              <Feather name="arrow-right" size={16} color={Palette.textInverse} />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 90,
    gap: 16,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
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
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.teal700,
  },
  titleSection: {
    gap: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Palette.textSecondary,
  },
  codeHighlight: {
    fontWeight: '700',
    color: Palette.indigo600,
  },
  amberHighlight: {
    fontWeight: '800',
    color: Palette.amberText,
  },
  sectionCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 14,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircleTeal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.teal600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleIndigo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    color: Palette.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  titleInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
    paddingVertical: 0,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  realPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.teal600,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  realPickerButtonText: {
    color: Palette.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  sampleBatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: Radius.pill,
  },
  sampleBatchButtonText: {
    color: Palette.indigo600,
    fontSize: 12,
    fontWeight: '800',
  },
  bentoGridContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoStatCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: 12,
    borderWidth: 1,
    gap: 4,
    ...Shadows.card,
  },
  bentoTotalCard: {
    borderColor: Palette.indigo100,
  },
  bentoEmeraldCard: {
    borderColor: Palette.emeraldBorder,
    backgroundColor: '#F6FEF9',
  },
  bentoAmberCard: {
    borderColor: Palette.amberBorder,
    backgroundColor: '#FFFDF5',
  },
  bentoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bentoNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  bentoSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integrityRuleTag: {
    backgroundColor: Palette.emeraldBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  integrityRuleText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.emeraldText,
  },
  previewPhotosScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  previewPhotoCard: {
    width: 148,
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.thumbnail,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  previewImageWrap: {
    width: '100%',
    height: 104,
    position: 'relative',
    backgroundColor: '#CBD5E1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoIndexPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Palette.darkOverlayStrong,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  photoIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textInverse,
  },
  previewGpsBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  previewGpsVerified: {
    backgroundColor: Palette.emeraldBg,
  },
  previewGpsUnknown: {
    backgroundColor: Palette.amberBg,
  },
  previewGpsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  previewMetaBody: {
    padding: 9,
    gap: 3,
  },
  previewMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewMetaTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  previewCoordText: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.emeraldText,
  },
  launchPipelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.indigo600,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    marginTop: 2,
    ...Shadows.subtle,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  launchPipelineBtnText: {
    color: Palette.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
  pipelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarTrack: {
    height: 9,
    backgroundColor: Palette.bgSecondary,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.teal600,
    borderRadius: Radius.pill,
  },
  pipelineStepsList: {
    gap: 12,
  },
  pipelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pipelineIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pipelineIconDone: {
    backgroundColor: Palette.teal600,
  },
  pipelineIconActive: {
    backgroundColor: Palette.indigo600,
  },
  pipelineIconPending: {
    backgroundColor: Palette.bgSecondary,
  },
  pipelineStepTextCol: {
    flex: 1,
    gap: 2,
  },
  pipelineStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  pipelineStepDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Palette.textSecondary,
  },
  openCreatedTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.teal600,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  openCreatedTripBtnText: {
    color: Palette.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
});
