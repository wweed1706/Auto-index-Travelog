import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { palette } from '../constants/theme';
import { useApiHealth } from '../hooks/useApiHealth';

const healthLabels = {
  'not-configured': 'Chưa cấu hình URL backend',
  checking: 'Đang kết nối backend…',
  online: 'Backend đã kết nối',
  offline: 'Chưa kết nối được backend',
} as const;

export default function HomeScreen() {
  const health = useApiHealth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brand}>ReTrip</Text>
          <View style={styles.beta}>
            <Text style={styles.betaText}>MVP</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TRAVEL MEMORY RECONSTRUCTION</Text>
          <Text style={styles.heading}>Những chuyến đi, được kể lại.</Text>
          <Text style={styles.subtitle}>
            Khám phá bản thử nghiệm nhập ảnh và kiểm tra metadata trước khi xây dựng bộ máy
            Auto-Indexing.
          </Text>
          <ActionButton label="Chọn ảnh từ thư viện" onPress={() => router.push('/import')} />
          <ActionButton label="Tìm hiểu dự án" secondary onPress={() => router.push('/about')} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trạng thái hệ thống</Text>
          <View style={styles.healthRow}>
            <View
              style={[
                styles.healthDot,
                { backgroundColor: health === 'online' ? palette.green : palette.orange },
              ]}
            />
            <Text style={styles.healthText}>{healthLabels[health]}</Text>
          </View>
          <Text style={styles.caption}>Kiểm tra endpoint /health của FastAPI khi có cấu hình.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sắp triển khai</Text>
          <Text style={styles.step}>01  Quản lý chuyến đi và lưu trữ ảnh</Text>
          <Text style={styles.step}>02  Phân nhóm ảnh theo thời gian, GPS và hình ảnh</Text>
          <Text style={styles.step}>03  Timeline, bản đồ và nhật ký AI</Text>
        </View>

        <Text style={styles.footer}>ReTrip · Đồ án tốt nghiệp · Prototype v0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  logo: {
    backgroundColor: palette.green,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#FFFFFF', fontWeight: '900', fontSize: 22 },
  brand: { fontSize: 23, fontWeight: '800', color: palette.title, marginLeft: 10 },
  beta: {
    marginLeft: 'auto',
    backgroundColor: palette.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
  },
  betaText: { color: palette.green, fontWeight: '700', fontSize: 11 },
  hero: { paddingBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.green,
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  heading: { fontSize: 34, lineHeight: 42, fontWeight: '800', color: palette.title },
  subtitle: { fontSize: 15, lineHeight: 24, marginTop: 14, marginBottom: 18, color: palette.text },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    marginTop: 16,
  },
  cardTitle: { color: palette.title, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  healthDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  healthText: { fontSize: 14, fontWeight: '700', color: palette.text },
  caption: { fontSize: 12, lineHeight: 18, color: palette.muted },
  step: { fontSize: 14, lineHeight: 24, color: palette.text, paddingVertical: 5 },
  footer: { marginTop: 28, textAlign: 'center', color: palette.muted, fontSize: 12 },
});
