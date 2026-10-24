import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Danh sách chuyến đi' }} />
        <Stack.Screen name="auth" options={{ title: 'Đăng nhập / Đăng ký' }} />
        <Stack.Screen name="upload" options={{ title: 'Tải ảnh & Auto-Indexing' }} />
        <Stack.Screen name="trips/[tripId]" options={{ title: 'Timeline & Bản đồ' }} />
        <Stack.Screen name="search" options={{ title: 'Tìm kiếm ngôn ngữ tự nhiên' }} />
        <Stack.Screen name="explore" options={{ title: 'Khám phá & Tìm kiếm' }} />
      </Stack>
    </ThemeProvider>
  );
}
