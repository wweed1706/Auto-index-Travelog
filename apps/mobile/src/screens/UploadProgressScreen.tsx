import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

import { ExifStatusBadge } from '@/components/ui';
import { clusterPhotosSpatioTemporal } from '@/services/mockApi';
import {
  loadSelectedDeviceBatch,
  saveSelectedDeviceBatch,
} from '@/services/storage';
import { tripRepository } from '@/services/tripRepository';
import {
  IconSize,
  MONO_FONT,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';
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
    taken_at: '2026-10-24T09:40:00+07:00',
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
    latitude: 10.3412,
    longitude: 107.0725,
  },
];

function parseExifCoordinate(rawCoord: unknown, ref?: unknown): number | null {
  if (rawCoord === null || rawCoord === undefined) return null;
  let numericValue: number | null = null;

  if (typeof rawCoord === 'number' && !Number.isNaN(rawCoord) && rawCoord !== 0) {
    numericValue = rawCoord;
  } else if (typeof rawCoord === 'string') {
    const parsed = Number.parseFloat(rawCoord);
    if (!Number.isNaN(parsed) && parsed !== 0) {
      numericValue = parsed;
    }
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
  const refStr = typeof ref === 'string' ? ref.toUpperCase() : '';
  if ((refStr === 'S' || refStr === 'W') && numericValue > 0) {
    numericValue = -numericValue;
  }
  return Number(numericValue.toFixed(5));
}

function extractGpsFromExifObject(
  exif: Record<string, unknown> | null | undefined
): { lat: number | null; lng: number | null } {
  if (!exif) return { lat: null, lng: null };

  const nestedGps = (exif['{GPS}'] as Record<string, unknown> | undefined) ?? undefined;
  const rawLat =
    exif.GPSLatitude ??
    nestedGps?.Latitude ??
    nestedGps?.GPSLatitude ??
    exif.latitude ??
    exif.lat;
  const rawLatRef =
    exif.GPSLatitudeRef ?? nestedGps?.LatitudeRef ?? nestedGps?.GPSLatitudeRef;

  const rawLng =
    exif.GPSLongitude ??
    nestedGps?.Longitude ??
    nestedGps?.GPSLongitude ??
    exif.longitude ??
    exif.lng;
  const rawLngRef =
    exif.GPSLongitudeRef ?? nestedGps?.LongitudeRef ?? nestedGps?.GPSLongitudeRef;

  const lat = parseExifCoordinate(rawLat, rawLatRef);
  const lng = parseExifCoordinate(rawLng, rawLngRef);

  if (lat !== null && lng !== null) {
    return { lat, lng };
  }
  return { lat: null, lng: null };
}

function parseExifDateTime(
  exif: Record<string, unknown> | null | undefined,
  fileName: string | null | undefined,
  index: number
): string {
  const nestedExif = (exif?.['{Exif}'] as Record<string, unknown> | undefined) ?? undefined;
  const nestedTiff = (exif?.['{TIFF}'] as Record<string, unknown> | undefined) ?? undefined;

  const rawDate =
    (exif?.DateTimeOriginal as string | undefined) ||
    (exif?.DateTimeDigitized as string | undefined) ||
    (exif?.DateTime as string | undefined) ||
    (nestedExif?.DateTimeOriginal as string | undefined) ||
    (nestedExif?.DateTimeDigitized as string | undefined) ||
    (nestedTiff?.DateTime as string | undefined);

  if (rawDate && typeof rawDate === 'string') {
    const normalized = rawDate
      .trim()
      .replace(/^(\d{4}):(\d{2}):(\d{2})\s+/, '$1-$2-$3T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
      return normalized.endsWith('Z') || normalized.includes('+')
        ? normalized
        : `${normalized}+07:00`;
    }
  }

  // Fallback trích xuất ngày giờ từ tên file ảnh chụp trên điện thoại (VD: IMG_20261024_083015.jpg)
  if (fileName && typeof fileName === 'string') {
    const match = fileName.match(/(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/);
    if (match) {
      const [, y, m, d, hh, mm, ss] = match;
      return `${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`;
    }
  }

  const hour = String(8 + (index % 10)).padStart(2, '0');
  const min = String((index * 12) % 60).padStart(2, '0');
  return `2026-10-24T${hour}:${min}:00+07:00`;
}

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Đọc & Chuẩn hóa EXIF Metadata',
    desc: 'Trích xuất DateTimeOriginal & tọa độ GPS thật, giữ nguyên null cho ảnh thiếu GPS',
    threshold: 25,
    icon: 'compass-outline' as const,
  },
  {
    step: 2,
    title: 'Mã hóa Đặc trưng Thị giác CLIP',
    desc: 'Sinh vector nhúng đa phương thức (PyTorch + pgvector) phục vụ tìm kiếm tự nhiên',
    threshold: 55,
    icon: 'sparkles-outline' as const,
  },
  {
    step: 3,
    title: 'Phân cụm Không gian - Thời gian (Haversine)',
    desc: 'Tự động gom nhóm điểm dừng theo bán kính Haversine (<=350m) & ngưỡng thời gian (<=180p)',
    threshold: 85,
    icon: 'git-network-outline' as const,
  },
  {
    step: 4,
    title: 'Lưu trữ Bền vững & Dựng Bản đồ',
    desc: 'Ghi vào AsyncStorage, khởi tạo ấn phẩm hành trình kèm đường nối Polyline',
    threshold: 100,
    icon: 'map-outline' as const,
  },
];

export default function UploadProgressScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const baseTripId = params.tripId ?? 'trip_123';

  const [tripTitle, setTripTitle] = useState<string>('Ký ức Biển Đảo • Ấn phẩm mới');
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoItem[]>(SAMPLE_EXIF_PHOTOS);
  const [pickerSourceLabel, setPickerSourceLabel] = useState<string>(
    'Bộ ảnh mẫu chuẩn EXIF (5 ảnh có GPS • 1 ảnh khuyết GPS)'
  );
  const [job, setJob] = useState<ProcessingJobResponse | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  // Phục hồi lô ảnh đã chọn từ thiết bị trong AsyncStorage nếu có
  useEffect(() => {
    let mounted = true;
    loadSelectedDeviceBatch().then((saved) => {
      if (mounted && saved && saved.photos.length > 0) {
        setSelectedPhotos(saved.photos);
        setPickerSourceLabel(saved.sourceLabel);
        if (saved.title) {
          setTripTitle(saved.title);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const exifStats = useMemo(() => {
    const total = selectedPhotos.length;
    const validGps = selectedPhotos.filter(
      (p) => p.latitude !== null && p.longitude !== null
    ).length;
    const unknownGps = total - validGps;
    const coveragePercent = total > 0 ? Math.round((validGps / total) * 100) : 0;
    return { total, validGps, unknownGps, coveragePercent };
  }, [selectedPhotos]);

  // Xem trước kết quả phân cụm Spatio-Temporal thực tế (Haversine + Temporal) ngay khi chọn ảnh
  const clusterPreview = useMemo(() => {
    const { days } = clusterPhotosSpatioTemporal('preview', selectedPhotos, {
      maxDistanceMeters: 350,
      maxTimeGapMinutes: 180,
      missingGpsTimeThresholdMinutes: 90,
    });
    const totalStops = days.reduce((acc, d) => acc + d.stops.length, 0);
    return {
      daysCount: days.length,
      stopsCount: totalStops,
      days,
    };
  }, [selectedPhotos]);

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

      const batchSeed = Date.now().toString().slice(-4);
      const mappedPhotos: PhotoItem[] = result.assets.map((asset, idx) => {
        const exifData = (asset.exif ?? null) as Record<string, unknown> | null;
        const { lat, lng } = extractGpsFromExifObject(exifData);
        const takenAt = parseExifDateTime(exifData, asset.fileName, idx);

        return {
          photo_id: `dev_${batchSeed}_${idx + 1}`,
          thumbnail_url: asset.uri,
          original_url: asset.uri,
          taken_at: takenAt,
          latitude: lat,
          longitude: lng,
        };
      });

      const newLabel = `Thư viện Thiết bị (${mappedPhotos.length} bức ảnh thực tế • Đã lưu AsyncStorage)`;
      setSelectedPhotos(mappedPhotos);
      setPickerSourceLabel(newLabel);
      setJob(null);
      setCreatedTripId(null);

      await saveSelectedDeviceBatch({
        title: tripTitle,
        sourceLabel: newLabel,
        photos: mappedPhotos,
        savedAt: new Date().toISOString(),
      });
    } catch {
      Alert.alert(
        'Không thể mở Thư viện ảnh',
        'Đã xảy ra lỗi khi đọc ảnh từ thiết bị. Bạn có thể sử dụng bộ ảnh mẫu EXIF bên dưới.'
      );
    }
  };

  const handleLoadSampleExifBatch = async () => {
    const defaultLabel = 'Bộ ảnh mẫu chuẩn EXIF (5 ảnh có GPS • 1 ảnh khuyết GPS)';
    setSelectedPhotos(SAMPLE_EXIF_PHOTOS);
    setPickerSourceLabel(defaultLabel);
    setJob(null);
    setCreatedTripId(null);

    await saveSelectedDeviceBatch({
      title: tripTitle,
      sourceLabel: defaultLabel,
      photos: SAMPLE_EXIF_PHOTOS,
      savedAt: new Date().toISOString(),
    });
  };

  const handleStartAutoIndexing = async () => {
    if (selectedPhotos.length === 0 || isRunningPipeline) return;
    setIsRunningPipeline(true);
    setCreatedTripId(null);

    try {
      const uris = selectedPhotos.map((p) => p.original_url);
      const initialJob = await tripRepository.uploadTripPhotos(baseTripId, uris);
      setJob(initialJob);

      const step55 = await tripRepository.getJobStatus(initialJob.job_id, 55, baseTripId);
      setJob(step55);

      const step85 = await tripRepository.getJobStatus(initialJob.job_id, 85, baseTripId);
      setJob(step85);

      const newTripTimeline = await tripRepository.createTripFromUploadedPhotos({
        title: tripTitle,
        photos: selectedPhotos,
      });

      await saveSelectedDeviceBatch({
        title: tripTitle,
        sourceLabel: pickerSourceLabel,
        photos: selectedPhotos,
        savedAt: new Date().toISOString(),
      });

      const step100 = await tripRepository.getJobStatus(
        initialJob.job_id,
        100,
        newTripTimeline.trip_id
      );
      setJob(step100);
      setCreatedTripId(newTripTimeline.trip_id);

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
        {/* Top Navigation Row */}
        <View style={styles.topHeaderRow}>
          <Pressable
            style={({ pressed }) => [styles.backCircleBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại màn hình trước">
            <Feather name="arrow-left" size={IconSize.md} color={Palette.textPrimary} />
          </Pressable>

          <View style={styles.studioLightPill}>
            <View style={styles.studioTealDot} />
            <Text style={styles.studioLightPillText}>THÊM ẢNH HÀNH TRÌNH • EXIF</Text>
          </View>
        </View>

        {/* Luminous Gallery White Studio Import Card */}
        <View style={styles.lightStudioCard}>
          <Text style={styles.studioSerifTitle}>
            Khởi tạo Hành trình từ Thư viện Ảnh Thật
          </Text>
          <Text style={styles.studioSubtitle}>
            Chọn nhiều ảnh từ điện thoại để trích xuất DateTimeOriginal & tọa độ GPS gốc, tự
            động phân cụm Spatio-Temporal (Haversine) và lưu bền vững vào AsyncStorage.
          </Text>

          <View style={styles.titleInputBox}>
            <Text style={styles.titleInputLabel}>TÊN ẤN PHẨM HÀNH TRÌNH</Text>
            <View style={styles.titleInputRow}>
              <Feather name="book-open" size={IconSize.sm} color={Palette.teal700} />
              <TextInput
                style={styles.titleTextInput}
                value={tripTitle}
                onChangeText={setTripTitle}
                placeholder="Nhập tên chuyến đi..."
                placeholderTextColor={Palette.textMuted}
                accessibilityLabel="Tên chuyến đi mới"
              />
            </View>
          </View>

          <View style={styles.pickerActionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.devicePickerPrimaryBtn,
                pressed && styles.pressed,
              ]}
              onPress={handlePickRealPhotosFromDevice}
              accessibilityRole="button"
              accessibilityLabel="Chọn nhiều ảnh thật từ thư viện thiết bị">
              <Ionicons name="images" size={IconSize.md} color={Palette.surface} />
              <Text style={styles.devicePickerPrimaryText}>Chọn ảnh từ Thiết bị</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sampleBatchSecondaryBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleLoadSampleExifBatch}
              accessibilityRole="button"
              accessibilityLabel="Khôi phục bộ ảnh mẫu EXIF">
              <Feather name="refresh-cw" size={IconSize.xs} color={Palette.teal700} />
              <Text style={styles.sampleBatchSecondaryText}>Ảnh mẫu</Text>
            </Pressable>
          </View>
        </View>

        {/* 3-Column Bento EXIF Diagnostic Strip + Coverage Bar */}
        <View style={styles.diagnosticCard}>
          <View style={styles.diagnosticTopHeader}>
            <Text style={styles.diagnosticSectionTitle}>Chẩn đoán Metadata EXIF</Text>
            <Text style={styles.diagnosticSourceText} numberOfLines={1}>
              {pickerSourceLabel}
            </Text>
          </View>

          <View style={styles.bentoStatsRow}>
            <View style={styles.bentoStatCell}>
              <Text style={styles.bentoStatNumber}>{exifStats.total}</Text>
              <Text style={styles.bentoStatLabel}>Tổng số ảnh</Text>
            </View>

            <View style={[styles.bentoStatCell, styles.bentoStatEmerald]}>
              <Text style={[styles.bentoStatNumber, styles.emeraldNumber]}>
                {exifStats.validGps}
              </Text>
              <Text style={styles.bentoStatLabel}>Có tọa độ GPS</Text>
            </View>

            <View style={[styles.bentoStatCell, styles.bentoStatAmber]}>
              <Text style={[styles.bentoStatNumber, styles.amberNumber]}>
                {exifStats.unknownGps}
              </Text>
              <Text style={styles.bentoStatLabel}>Khuyết GPS (null)</Text>
            </View>
          </View>

          {/* GPS Coverage Bar */}
          <View style={styles.coverageBarGroup}>
            <View style={styles.coverageLabelRow}>
              <Text style={styles.coverageLabelText}>Tỷ lệ ảnh có tọa độ định vị</Text>
              <Text style={styles.coveragePercentText}>
                {exifStats.coveragePercent}% hợp lệ
              </Text>
            </View>
            <View style={styles.coverageTrack}>
              <View
                style={[
                  styles.coverageFill,
                  { width: `${exifStats.coveragePercent}%` },
                ]}
              />
            </View>
          </View>

          {/* Spatio-Temporal Haversine Clustering Live Preview */}
          <View style={styles.clusterPreviewBanner}>
            <View style={styles.clusterPreviewTopRow}>
              <Ionicons name="git-network-outline" size={IconSize.sm} color={Palette.teal700} />
              <Text style={styles.clusterPreviewTitle}>
                Dự kiến Phân cụm Spatio-Temporal: {clusterPreview.daysCount} ngày •{' '}
                {clusterPreview.stopsCount} điểm dừng
              </Text>
            </View>
            <Text style={styles.clusterPreviewDesc}>
              Thuật toán Haversine (bán kính &le; 350m, ngưỡng thời gian &le; 180 phút) tự động
              tính tâm Centroid thật cho từng cụm điểm dừng.
            </Text>
          </View>
        </View>

        {/* Filmstrip Preview Grid */}
        <View style={styles.filmstripSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionSerifTitle}>Cuộn phim Đã chọn</Text>
            <Text style={styles.sectionSubCount}>{selectedPhotos.length} khung hình</Text>
          </View>

          <View style={styles.photoGridWrap}>
            {selectedPhotos.map((photo, idx) => {
              const hasGps = photo.latitude !== null && photo.longitude !== null;
              return (
                <View key={photo.photo_id} style={styles.filmCard}>
                  <View style={styles.filmImageContainer}>
                    <Image
                      source={{ uri: photo.thumbnail_url }}
                      style={styles.filmImage}
                      resizeMode="cover"
                    />
                    <View style={styles.filmTopLeftBadge}>
                      <ExifStatusBadge hasGps={hasGps} compact />
                    </View>
                    <View style={styles.filmIndexPill}>
                      <Text style={styles.filmIndexText}>#{idx + 1}</Text>
                    </View>
                  </View>

                  <View style={styles.filmMetaFooter}>
                    <Text style={styles.filmTimeText}>
                      {photo.taken_at.slice(0, 16).replace('T', ' • ')}
                    </Text>
                    <Text
                      style={[
                        styles.filmCoordText,
                        !hasGps && styles.filmCoordMissing,
                      ]}
                      numberOfLines={1}>
                      {hasGps
                        ? `${photo.latitude?.toFixed(4)}°N, ${photo.longitude?.toFixed(4)}°E`
                        : 'GPS: null (unknown)'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4-Step Auto-Indexing Pipeline Card */}
        <View style={styles.pipelineCard}>
          <View style={styles.pipelineHeaderRow}>
            <View>
              <Text style={styles.pipelineEyebrow}>TIẾN TRÌNH XỬ LÝ TỰ ĐỘNG</Text>
              <Text style={styles.pipelineSerifTitle}>Auto-Indexing Pipeline</Text>
            </View>

            <View style={styles.progressBadgePill}>
              <Text style={styles.progressBadgeText}>
                {job ? `${job.progress_percent}%` : 'Sẵn sàng'}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${job?.progress_percent ?? 0}%` },
              ]}
            />
          </View>

          <View style={styles.stepsContainer}>
            {PIPELINE_STEPS.map((item) => {
              const currentPct = job?.progress_percent ?? 0;
              const isDone = currentPct >= item.threshold;
              return (
                <View key={item.step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepCircle,
                      isDone ? styles.stepCircleDone : styles.stepCircleIdle,
                    ]}>
                    <Ionicons
                      name={isDone ? 'checkmark' : item.icon}
                      size={IconSize.sm}
                      color={isDone ? Palette.surface : Palette.textMuted}
                    />
                  </View>

                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        styles.stepTitleText,
                        isDone && styles.stepTitleTextDone,
                      ]}>
                      {item.step}. {item.title}
                    </Text>
                    <Text style={styles.stepDescText}>{item.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.runPipelineCtaBtn,
              isRunningPipeline && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleStartAutoIndexing}
            disabled={isRunningPipeline}
            accessibilityRole="button"
            accessibilityLabel="Chạy Auto-Indexing và mở Bản đồ Hành trình">
            {isRunningPipeline ? (
              <>
                <ActivityIndicator size="small" color={Palette.surface} />
                <Text style={styles.runPipelineCtaText}>
                  Đang phân cụm Haversine & dựng hành trình...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={IconSize.md} color={Palette.surface} />
                <Text style={styles.runPipelineCtaText}>
                  Tái dựng Hành trình & Mở Bản đồ ({selectedPhotos.length} ảnh)
                </Text>
                <Feather name="arrow-right" size={IconSize.md} color={Palette.surface} />
              </>
            )}
          </Pressable>

          {createdTripId && (
            <Pressable
              style={({ pressed }) => [
                styles.openCreatedTripBtn,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/trips/[tripId]',
                  params: { tripId: createdTripId },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Mở ngay chuyến đi vừa tạo">
              <Ionicons name="map-outline" size={IconSize.md} color={Palette.teal700} />
              <Text style={styles.openCreatedTripBtnText}>
                Mở lại chuyến đi vừa tạo ({createdTripId})
              </Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 64,
    gap: Spacing.xl,
  },
  topHeaderRow: {
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
  studioLightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  studioTealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.teal600,
  },
  studioLightPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.8,
  },
  lightStudioCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Palette.teal100,
    ...Shadows.card,
  },
  studioSerifTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 32,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  studioSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Palette.textSecondary,
  },
  titleInputBox: {
    gap: 6,
    marginTop: 4,
  },
  titleInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.8,
  },
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  titleTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  pickerActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  devicePickerPrimaryBtn: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.teal700,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    ...Shadows.subtle,
  },
  devicePickerPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.surface,
  },
  sampleBatchSecondaryBtn: {
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.teal50,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Palette.teal100,
  },
  sampleBatchSecondaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  diagnosticCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  diagnosticTopHeader: {
    gap: 2,
  },
  diagnosticSectionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  diagnosticSourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  bentoStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoStatCell: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bentoStatEmerald: {
    backgroundColor: Palette.emeraldBg,
    borderColor: Palette.emeraldBorder,
  },
  bentoStatAmber: {
    backgroundColor: Palette.amberBg,
    borderColor: Palette.amberBorder,
  },
  bentoStatNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emeraldNumber: {
    color: Palette.emeraldText,
  },
  amberNumber: {
    color: Palette.amberText,
  },
  bentoStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  coverageBarGroup: {
    gap: 6,
  },
  coverageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverageLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  coveragePercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.emeraldText,
  },
  coverageTrack: {
    height: 8,
    backgroundColor: Palette.bgSecondary,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    backgroundColor: Palette.emeraldDot,
    borderRadius: Radius.pill,
  },
  clusterPreviewBanner: {
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  clusterPreviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clusterPreviewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal800,
    flex: 1,
  },
  clusterPreviewDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: Palette.textSecondary,
  },
  filmstripSection: {
    gap: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionSerifTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  sectionSubCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSubtle,
  },
  photoGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  filmCard: {
    width: '48.2%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.subtle,
  },
  filmImageContainer: {
    width: '100%',
    height: 118,
    position: 'relative',
    backgroundColor: Palette.bgSecondary,
  },
  filmImage: {
    width: '100%',
    height: '100%',
  },
  filmTopLeftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  filmIndexPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  filmIndexText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  filmMetaFooter: {
    padding: 10,
    gap: 3,
  },
  filmTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  filmCoordText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: Palette.emeraldText,
  },
  filmCoordMissing: {
    color: Palette.amberText,
  },
  pipelineCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  pipelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipelineEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 0.9,
  },
  pipelineSerifTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 2,
  },
  progressBadgePill: {
    backgroundColor: Palette.teal50,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Palette.bgSecondary,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.teal600,
    borderRadius: Radius.pill,
  },
  stepsContainer: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCircleDone: {
    backgroundColor: Palette.teal700,
  },
  stepCircleIdle: {
    backgroundColor: Palette.bgSecondary,
  },
  stepTextCol: {
    flex: 1,
    gap: 2,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  stepTitleTextDone: {
    color: Palette.textPrimary,
    fontWeight: '800',
  },
  stepDescText: {
    fontSize: 12,
    lineHeight: 17,
    color: Palette.textMuted,
  },
  runPipelineCtaBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.teal700,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    marginTop: 4,
    ...Shadows.floating,
  },
  runPipelineCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.surface,
  },
  openCreatedTripBtn: {
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.teal50,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.teal100,
  },
  openCreatedTripBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.78,
  },
});
