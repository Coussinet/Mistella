import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useAppStore } from '../store/appStore';
import type { CustomerTabParamList } from '../types';

import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import CastSearchScreen from '../screens/customer/CastSearchScreen';
import MapScreen from '../screens/customer/MapScreen';
import TonightSendScreen from '../screens/customer/TonightSendScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import MatchesScreen from '../screens/common/MatchesScreen';
import ChatScreen from '../screens/common/ChatScreen';
import FavoritesScreen from '../screens/common/FavoritesScreen';
import FootprintsScreen from '../screens/common/FootprintsScreen';
import UserProfileScreen from '../screens/common/UserProfileScreen';
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { color: COLORS.text, fontWeight: '600' as const },
  contentStyle: { backgroundColor: COLORS.background },
};

const TimelineStack = createNativeStackNavigator();
function TimelineStackNavigator() {
  return (
    <TimelineStack.Navigator screenOptions={stackScreenOptions}>
      <TimelineStack.Screen name="TimelineMain" component={CustomerHomeScreen} options={{ title: 'タイムライン' }} />
      <TimelineStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
      <TimelineStack.Screen name="SendTonightRequest" component={TonightSendScreen} options={{ title: '今夜行ける？' }} />
    </TimelineStack.Navigator>
  );
}

const CastSearchStack = createNativeStackNavigator();
function CastSearchStackNavigator() {
  return (
    <CastSearchStack.Navigator screenOptions={stackScreenOptions}>
      <CastSearchStack.Screen name="CastSearchMain" component={CastSearchScreen} options={{ title: 'キャスト検索' }} />
      <CastSearchStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
      <CastSearchStack.Screen name="SendTonightRequest" component={TonightSendScreen} options={{ title: '今夜行ける？' }} />
    </CastSearchStack.Navigator>
  );
}

const MapStack = createNativeStackNavigator();
function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={stackScreenOptions}>
      <MapStack.Screen name="MapMain" component={MapScreen} options={{ title: '近くのキャスト' }} />
      <MapStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
    </MapStack.Navigator>
  );
}

const MatchesStack = createNativeStackNavigator();
function MatchesStackNavigator() {
  return (
    <MatchesStack.Navigator screenOptions={stackScreenOptions}>
      <MatchesStack.Screen name="MatchesMain" component={MatchesScreen} options={{ title: 'マッチ一覧' }} />
      <MatchesStack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'メッセージ' }} />
      <MatchesStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
    </MatchesStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'マイページ' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'プロフィール編集' }} />
      <ProfileStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'お気に入り' }} />
      <ProfileStack.Screen name="Footprints" component={FootprintsScreen} options={{ title: '足跡' }} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
      <ProfileStack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'メッセージ' }} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: '通知設定' }} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export default function CustomerTabNavigator() {
  const unreadMessageCount = useAppStore((s) => s.unreadMessageCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Timeline"
        component={TimelineStackNavigator}
        options={{
          tabBarLabel: 'タイムライン',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CastSearch"
        component={CastSearchStackNavigator}
        options={{
          tabBarLabel: 'キャスト',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapStackNavigator}
        options={{
          tabBarLabel: 'マップ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesStackNavigator}
        options={{
          tabBarLabel: 'マッチ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MatchesStackNavigator}
        options={{
          tabBarLabel: 'メッセージ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble" size={size} color={color} />
          ),
          tabBarBadge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'マイページ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.error,
    color: COLORS.text,
    fontSize: 10,
  },
});
