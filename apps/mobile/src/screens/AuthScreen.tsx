import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
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

import {
  IconSize,
  Palette,
  Radius,
  SERIF_FONT,
  Shadows,
  Spacing,
  TouchTarget,
} from '@/theme';

const COVER_COLLAGE_URLS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80',
];

export default function AuthScreen() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('explorer@retrip.vn');
  const [password, setPassword] = useState('retrip2026');
  const [fullName, setFullName] = useState('Nguyễn Minh Khôi');
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
          {/* Top Navigation Row */}
          <View style={styles.topNav}>
            <Pressable
              style={({ pressed }) => [styles.backCircleBtn, pressed && styles.pressed]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Quay lại danh sách hành trình">
              <Feather name="arrow-left" size={IconSize.md} color={Palette.textPrimary} />
            </Pressable>

            <Text style={styles.topIssueText}>RETRIP JOURNAL • PASSPORT</Text>
          </View>

          {/* Luminous Editorial Postcard Collage Hero Card (Light Theme) */}
          <View style={styles.lightCoverCard}>
            <View style={styles.postcardStripRow}>
              {COVER_COLLAGE_URLS.map((uri, idx) => (
                <View
                  key={uri}
                  style={[
                    styles.postcardFrame,
                    idx === 1 && styles.postcardFrameCenter,
                  ]}>
                  <Image
                    source={{ uri }}
                    style={styles.postcardImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>

            <View style={styles.coverTextBlock}>
              <Text style={styles.coverBrandTitle}>ReTrip.</Text>
              <Text style={styles.coverSerifHeadline}>
                Lưu giữ mọi hành trình như một cuốn tạp chí sống động.
              </Text>
              <Text style={styles.coverDescription}>
                Đồng bộ nhật ký bản đồ, điểm dừng thời gian và tìm kiếm khoảnh khắc bằng
                trí nhớ thị giác AI.
              </Text>
            </View>
          </View>

          {/* Minimalist Gallery White Passport Form Card */}
          <View style={styles.formCard}>
            <View style={styles.segmentedControl}>
              <Pressable
                style={({ pressed }) => [
                  styles.segmentButton,
                  !isRegisterMode && styles.segmentButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setIsRegisterMode(false)}
                accessibilityRole="tab"
                accessibilityState={{ selected: !isRegisterMode }}
                accessibilityLabel="Chế độ Đăng nhập">
                <Text
                  style={[
                    styles.segmentButtonText,
                    !isRegisterMode && styles.segmentButtonTextActive,
                  ]}>
                  Đăng nhập
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.segmentButton,
                  isRegisterMode && styles.segmentButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setIsRegisterMode(true)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isRegisterMode }}
                accessibilityLabel="Chế độ Tạo tài khoản">
                <Text
                  style={[
                    styles.segmentButtonText,
                    isRegisterMode && styles.segmentButtonTextActive,
                  ]}>
                  Tạo tài khoản
                </Text>
              </Pressable>
            </View>

            {isRegisterMode && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>TÊN HIỂN THỊ TRÊN TẠP CHÍ</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={IconSize.md}
                    color={Palette.textMuted}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nhập họ và tên của bạn"
                    placeholderTextColor={Palette.textMuted}
                    accessibilityLabel="Họ và tên"
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ĐỊA CHỈ EMAIL</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={IconSize.md}
                  color={Palette.textMuted}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="explorer@retrip.vn"
                  placeholderTextColor={Palette.textMuted}
                  accessibilityLabel="Địa chỉ Email"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={IconSize.md}
                  color={Palette.textMuted}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Palette.textMuted}
                  accessibilityLabel="Mật khẩu"
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.eyeToggleBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={TouchTarget.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                  }>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={IconSize.md}
                    color={Palette.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel={
                isRegisterMode ? 'Đăng ký và bắt đầu' : 'Đăng nhập vào ReTrip'
              }>
              <Text style={styles.submitButtonText}>
                {isRegisterMode ? 'Khởi tạo Sổ tay Hành trình' : 'Mở Sổ tay Hành trình'}
              </Text>
              <Feather name="arrow-right" size={IconSize.md} color={Palette.surface} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickDemoButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel="Trải nghiệm ngay với dữ liệu mẫu">
              <Ionicons name="sparkles" size={IconSize.sm} color={Palette.teal700} />
              <Text style={styles.quickDemoButtonText}>
                Trải nghiệm ngay với Ấn phẩm Mẫu (Vũng Tàu & Đà Lạt)
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 48,
    gap: Spacing.xl,
  },
  topNav: {
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
  topIssueText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.teal700,
    letterSpacing: 1.1,
  },
  lightCoverCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Palette.teal100,
    ...Shadows.card,
  },
  postcardStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  postcardFrame: {
    flex: 1,
    height: 98,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.bgSecondary,
  },
  postcardFrameCenter: {
    height: 112,
    borderColor: Palette.teal500,
  },
  postcardImage: {
    width: '100%',
    height: '100%',
  },
  coverTextBlock: {
    gap: 6,
  },
  coverBrandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 32,
    fontWeight: '700',
    color: Palette.teal700,
    letterSpacing: -0.6,
  },
  coverSerifHeadline: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29,
    color: Palette.textPrimary,
  },
  coverDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: Palette.textSecondary,
  },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Palette.bgSecondary,
    borderRadius: Radius.pill,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  segmentButtonActive: {
    backgroundColor: Palette.teal700,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  segmentButtonTextActive: {
    color: Palette.surface,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textSubtle,
    letterSpacing: 0.8,
  },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.bgPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    paddingVertical: 10,
  },
  eyeToggleBtn: {
    padding: 4,
  },
  submitButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.teal700,
    borderRadius: Radius.pill,
    marginTop: 4,
    ...Shadows.floating,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.surface,
  },
  quickDemoButton: {
    minHeight: TouchTarget.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.teal50,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.teal100,
    paddingHorizontal: Spacing.md,
  },
  quickDemoButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.teal700,
  },
  pressed: {
    opacity: 0.8,
  },
});
