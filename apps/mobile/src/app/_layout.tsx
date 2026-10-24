import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
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
