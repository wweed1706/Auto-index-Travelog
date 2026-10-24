import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('student1@retrip.edu.vn');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Thành viên 1');

  const handleSubmit = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.badge}>ReTrip v2.0 • Mobile-First</Text>
          <Text style={styles.title}>
            {isRegisterMode ? 'Tạo tài khoản mới' : 'Đăng nhập ReTrip'}
          </Text>
          <Text style={styles.subtitle}>
            Tự động tái dựng hành trình du lịch theo Timeline & Bản đồ kết hợp tìm kiếm ngữ nghĩa
            CLIP.
          </Text>

          {isRegisterMode && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ban@example.com"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {isRegisterMode ? 'Đăng ký & Bắt đầu' : 'Đăng nhập vào Chuyến đi'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.switchButton}
            onPress={() => setIsRegisterMode((prev) => !prev)}>
            <Text style={styles.switchButtonText}>
              {isRegisterMode
                ? 'Đã có tài khoản? Đăng nhập ngay'
                : 'Chưa có tài khoản? Đăng ký mới'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});
