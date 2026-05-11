import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { supabase } from './src/lib/supabase';
import { getProfile, getCastProfile } from './src/services/authService';
import { registerPushToken } from './src/services/notificationService';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function App() {
  const { setSession, setUser, setProfile, setCastProfile, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(async (result: any) => {
      const session = result.data.session;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        try {
          const profile = await getProfile(session.user.id);
          setProfile(profile);
          registerPushToken(session.user.id).catch(() => {});
          if (profile.role === 'cast') {
            try {
              const castProfile = await getCastProfile(session.user.id);
              setCastProfile(castProfile);
            } catch {
              // cast_profilesが未作成の場合はnull
            }
          }
        } catch {
          // プロフィール未作成の場合
        }
      }
      setLoading(false);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        try {
          const profile = await getProfile(session.user.id);
          setProfile(profile);
          registerPushToken(session.user.id).catch(() => {});
          if (profile.role === 'cast') {
            try {
              const castProfile = await getCastProfile(session.user.id);
              setCastProfile(castProfile);
            } catch {
              // cast_profilesが未作成の場合
            }
          }
        } catch {
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setCastProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
