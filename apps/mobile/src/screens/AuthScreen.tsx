import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Shadows } from '@/constants/designSystem';

export default function AuthScreen() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('student1@retrip.edu.vn');
  const [password, setPassword] = useState('retrip2026');
  const [fullName, setFullName] = useState('Thành viên 1 • Mobile UX');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Nút quay lại trang chủ */}
          <View style={styles.topNav}>
            <Pressable style={styles.backPill} onPress={() => router.back()}>
              <Feather name="arrow-left" size={16} color={Palette.textPrimary} />
              <Text style={styles.backPillText}>Quay lại Hành trình</Text>
            </Pressable>
          </View>

          {/* Hero Brand Header */}
          <View style={styles.heroBanner}>
            <View style={styles.logoCircle}>
              <Ionicons name="compass" size={34} color={Palette.textInverse} />
            </View>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={13} color={Palette.indigo600} />
              <Text style={styles.brandBadgeText}>ReTrip v2.0 • Modern Wanderlust</Text>
            </View>
            <Text style={styles.heroTitle}>Nhật ký Hành trình Tự động</Text>
            <Text style={styles.heroSubtitle}>
              Tự động tái dựng Timeline & Bản đồ từ metadata EXIF kết hợp tìm kiếm ảnh thông minh
              bằng ngôn ngữ tự nhiên (PyTorch + CLIP).
            </Text>

            <View style={styles.featurePillsRow}>
              <View style={styles.featurePill}>
                <Ionicons name="location" size={13} color={Palette.teal600} />
                <Text style={styles.featurePillText}>PostGIS Timeline</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="sparkles" size={13} color={Palette.indigo600} />
                <Text style={styles.featurePillText}>CLIP pgvector</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="shield-checkmark" size={13} color={Palette.emeraldText} />
                <Text style={styles.featurePillText}>Chuẩn EXIF</Text>
              </View>
            </View>
          </View>

          {/* Card Form Đăng nhập / Đăng ký */}
          <View style={styles.authCard}>
            {/* Segmented Mode Switcher */}
            <View style={styles.segmentedControl}>
              <Pressable
                style={[styles.segmentTab, !isRegisterMode && styles.segmentTabActive]}
                onPress={() => setIsRegisterMode(false)}>
                <Text
                  style={[styles.segmentTabText, !isRegisterMode && styles.segmentTabTextActive]}>
                  Đăng nhập
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentTab, isRegisterMode && styles.segmentTabActive]}
                onPress={() => setIsRegisterMode(true)}>
                <Text
                  style={[styles.segmentTabText, isRegisterMode && styles.segmentTabTextActive]}>
                  Tạo tài khoản
                </Text>
              </Pressable>
            </View>

            {isRegisterMode && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={Palette.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nhập họ và tên của bạn"
                    placeholderTextColor={Palette.textMuted}
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Địa chỉ Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="ban@retrip.edu.vn"
                  placeholderTextColor={Palette.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mật khẩu bảo mật</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Palette.textMuted}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={Palette.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonText}>
                {isRegisterMode ? 'Đăng ký & Khám phá ngay' : 'Đăng nhập vào ReTrip'}
              </Text>
              <Feather name="arrow-right" size={18} color={Palette.textInverse} />
            </Pressable>

            <Pressable style={styles.demoBypassBtn} onPress={handleSubmit}>
              <Ionicons name="flash" size={16} color={Palette.indigo600} />
              <Text style={styles.demoBypassText}>
                Vào nhanh chế độ Demo Bảo vệ Đồ án (Tài khoản mẫu)
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.subtle,
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  heroBanner: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Palette.teal600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.floating,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.indigo600,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  authCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.cardLg,
    padding: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 16,
    ...Shadows.card,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Palette.bgSecondary,
    borderRadius: Radius.pill,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: Palette.surface,
    ...Shadows.subtle,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  segmentTabTextActive: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Palette.bgPrimary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.textPrimary,
    paddingVertical: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.teal600,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    marginTop: 4,
    ...Shadows.subtle,
  },
  primaryButtonText: {
    color: Palette.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  demoBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.indigo50,
    borderWidth: 1,
    borderColor: Palette.indigo100,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  demoBypassText: {
    color: Palette.indigo600,
    fontSize: 12,
    fontWeight: '700',
  },
});
