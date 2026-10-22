import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '../constants/theme';

const milestones = [
  ['P0 · Bước 1', 'Chọn ảnh, upload và trích xuất EXIF'],
  ['P0 · Bước 2', 'Phát hiện trùng lặp và phân nhóm ảnh'],
  ['P0 · Bước 3', 'Hiệu chỉnh sự kiện, Timeline và Map'],
  ['P1 · Bước 4', 'Nhật ký AI có căn cứ và chia sẻ'],
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ReTrip là gì?</Text>
        <Text style={styles.body}>
          ReTrip là đề tài tốt nghiệp về tự động lập chỉ mục và tái dựng hành trình từ
          ảnh du lịch. Mục tiêu là phân cụm ảnh theo thời gian, GPS và đặc trưng hình
          ảnh ngay cả khi một phần metadata bị thiếu.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kế hoạch triển khai</Text>
          {milestones.map(([stage, description]) => (
            <View key={stage} style={styles.item}>
              <Text style={styles.stage}>{stage}</Text>
              <Text style={styles.detail}>{description}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.warning}>
          Bản v0.1 mới có giao diện, chọn ảnh để xem trước metadata và kiểm tra kết nối
          FastAPI. Chưa có tài khoản, lưu trữ ảnh, phân cụm hay bản đồ hoạt động.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { padding: 22 },
  title: { fontSize: 27, fontWeight: '800', color: palette.title, marginBottom: 14 },
  body: { fontSize: 15, lineHeight: 25, color: palette.text },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 24,
  },
  cardTitle: { fontWeight: '800', fontSize: 17, color: palette.title, marginBottom: 14 },
  item: { marginBottom: 15 },
  stage: { fontSize: 12, fontWeight: '800', color: palette.green },
  detail: { fontSize: 14, color: palette.text, marginTop: 4 },
  warning: {
    fontSize: 13,
    lineHeight: 21,
    color: palette.orange,
    backgroundColor: palette.orangeLight,
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
  },
});
