import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { palette } from '../constants/theme';

function hasGps(asset: ImagePicker.ImagePickerAsset): boolean {
  const exif = asset.exif;
  return exif != null && exif.GPSLatitude != null && exif.GPSLongitude != null;
}

function captureTime(asset: ImagePicker.ImagePickerAsset): string {
  const exif = asset.exif;
  const value = exif?.DateTimeOriginal ?? exif?.DateTimeDigitized ?? exif?.DateTime;
  return value == null ? 'Không tìm thấy trong EXIF' : String(value);
}

function readableSize(size: number | null | undefined): string {
  return size == null ? 'Không rõ dung lượng' : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImportScreen() {
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [busy, setBusy] = useState(false);

  async function selectPhotos() {
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        orderedSelection: true,
        allowsEditing: false,
        exif: true,
        quality: 1,
      });
      if (!result.canceled) {
        setAssets(result.assets);
      }
    } catch {
      Alert.alert('Không thể mở thư viện ảnh', 'Vui lòng kiểm tra quyền truy cập và thử lại.');
    } finally {
      setBusy(false);
    }
  }

  const gpsCount = assets.filter(hasGps).length;
  const exifCount = assets.filter((asset) => asset.exif != null).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Kiểm tra thư viện ảnh</Text>
        <Text style={styles.description}>
          Chọn nhiều ảnh để kiểm tra tên tệp, thời gian chụp và sự hiện diện của GPS.
          Đây là bước thử nghiệm cục bộ: ảnh chưa được tải lên máy chủ.
        </Text>

        <ActionButton
          label={busy ? 'Đang mở thư viện…' : 'Chọn nhiều ảnh'}
          onPress={() => void selectPhotos()}
          disabled={busy}
        />

        {assets.length > 0 ? (
          <>
            <View style={styles.stats}>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{assets.length}</Text>
                <Text style={styles.statLabel}>Ảnh được chọn</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{exifCount}</Text>
                <Text style={styles.statLabel}>Có EXIF</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{gpsCount}</Text>
                <Text style={styles.statLabel}>Có GPS</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Xem trước ảnh ({Math.min(assets.length, 10)} ảnh đầu)</Text>
            {assets.slice(0, 10).map((asset, index) => (
              <View key={`${asset.uri}-${index}`} style={styles.item}>
                <Image style={styles.thumbnail} source={{ uri: asset.uri }} />
                <View style={styles.info}>
                  <Text numberOfLines={1} style={styles.fileName}>
                    {asset.fileName ?? `Ảnh ${index + 1}`}
                  </Text>
                  <Text style={styles.detail}>{readableSize(asset.fileSize)}</Text>
                  <Text numberOfLines={1} style={styles.detail}>
                    Chụp: {captureTime(asset)}
                  </Text>
                  <Text style={[styles.gps, { color: hasGps(asset) ? palette.green : palette.orange }]}>
                    GPS: {hasGps(asset) ? 'Có trong EXIF' : 'Không có / không đọc được'}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={styles.note}>
              EXIF từ thư viện ảnh có thể thiếu hoặc đã bị hệ điều hành biến đổi. Backend
              sẽ phải kiểm tra lại ảnh gốc sau khi tính năng upload được phát triển.
              Không suy đoán tọa độ từ ảnh thiếu GPS.
            </Text>
            <ActionButton label="Xóa danh sách xem trước" secondary onPress={() => setAssets([])} />
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Chưa chọn ảnh nào</Text>
            <Text style={styles.emptyBody}>Bạn có thể thử bằng các ảnh từ chuyến đi gần đây.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: palette.title },
  description: { fontSize: 14, lineHeight: 22, color: palette.text, marginTop: 10, marginBottom: 10 },
  stats: {
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: palette.surface,
    paddingVertical: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNumber: { color: palette.green, fontSize: 25, fontWeight: '800' },
  statLabel: { color: palette.muted, fontSize: 11, marginTop: 5, textAlign: 'center' },
  sectionTitle: { color: palette.title, fontWeight: '800', fontSize: 16, marginTop: 22, marginBottom: 10 },
  item: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  thumbnail: { width: 76, height: 76, borderRadius: 10, backgroundColor: palette.greenLight },
  info: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  fileName: { fontSize: 13, fontWeight: '700', color: palette.title },
  detail: { fontSize: 11, color: palette.muted, marginTop: 5 },
  gps: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  empty: { marginTop: 24, padding: 26, borderWidth: 1, borderColor: palette.border, borderRadius: 18, backgroundColor: palette.surface },
  emptyTitle: { fontWeight: '800', color: palette.title, fontSize: 16 },
  emptyBody: { color: palette.muted, lineHeight: 22, marginTop: 8, fontSize: 13 },
  note: { fontSize: 12, lineHeight: 19, color: palette.muted, marginTop: 8 },
});
