// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '@/navigation/AppNavigator';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { getProfile, getCastProfile } from '@/services/authService';
import { registerPushToken } from '@/services/notificationService';
import { queryClient } from '@/lib/queryClient';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'デフォルト',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export default function App() {
  const { setSession, setUser, setProfile, setCastProfile, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    /**
     * プロフィール一式を取得して authStore に反映する。
     * 起動直後はトークン更新と競合して一時的に失敗することがあるため、
     * 少し待ってリトライする（初回起動でローディングが止まる問題への対策）。
     */
    const loadUserData = async (userId: string) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const profile = await getProfile(userId);
          setProfile(profile);
          registerPushToken(userId).catch(() => {});
          if (profile.role === 'cast') {
            try {
              const castProfile = await getCastProfile(userId);
              setCastProfile(castProfile);
            } catch {
              // cast_profiles が未作成の場合は null のまま
            }
          }
          return;
        } catch {
          // 1秒待ってリトライ（トークン更新完了待ち）
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      // 3回失敗した場合はプロフィール未取得のまま（listener の後続イベントで再試行される）
    };

    supabase.auth.getSession().then(async (result: any) => {
      const session = result.data.session;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      }
    }).finally(() => {
      setLoading(false);
    });

    // 注意: onAuthStateChange のコールバック内で Supabase を直接 await すると
    // supabase-js の内部ロックとデッドロックする（公式が警告している既知問題）。
    // コールバックは同期処理のみとし、Supabase 呼び出しは setTimeout で
    // ロック解放後に実行する。
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const userId = session.user.id;
        setTimeout(() => {
          loadUserData(userId);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setCastProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setCastProfile, setLoading, setProfile, setSession, setUser]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style="light" />
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
