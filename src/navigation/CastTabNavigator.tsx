import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useAppStore } from '../store/appStore';
import type { CastTabParamList } from '../types';

import TimelineScreen from '../screens/common/TimelineScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import MatchesScreen from '../screens/common/MatchesScreen';
import ChatScreen from '../screens/common/ChatScreen';
import FavoritesScreen from '../screens/common/FavoritesScreen';
import FootprintsScreen from '../screens/common/FootprintsScreen';
import UserProfileScreen from '../screens/common/UserProfileScreen';
import WorkingStatusScreen from '../screens/cast/WorkingStatusScreen';
import ShopInfoScreen from '../screens/cast/ShopInfoScreen';
import TonightRequestsScreen from '../screens/cast/TonightRequestsScreen';
import CRMScreen from '../screens/cast/CRMScreen';
import CustomerNoteScreen from '../screens/cast/CustomerNoteScreen';

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
      <TimelineStack.Screen name="TimelineMain" component={TimelineScreen} options={{ title: 'タイムライン' }} />
      <TimelineStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'プロフィール' }} />
    </TimelineStack.Navigator>
  );
}

const SearchStack = createNativeStackNavigator();
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={stackScreenOptions}>
      <SearchStack.Screen name="WorkingStatus" component={WorkingStatusScreen} options={{ title: '出勤管理' }} />
      <SearchStack.Screen name="ShopInfo" component={ShopInfoScreen} options={{ title: '店舗情報' }} />
      <SearchStack.Screen name="TonightRequests" component={TonightRequestsScreen} options={{ title: '今夜行ける？' }} />
      <SearchStack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'メッセージ' }} />
    </SearchStack.Navigator>
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

const CRMStack = createNativeStackNavigator();
function CRMStackNavigator() {
  return (
    <CRMStack.Navigator screenOptions={stackScreenOptions}>
      <CRMStack.Screen name="CRMMain" component={CRMScreen} options={{ title: '顧客管理' }} />
      <CRMStack.Screen name="CustomerNote" component={CustomerNoteScreen} options={{ title: '顧客メモ' }} />
      <CRMStack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'メッセージ' }} />
    </CRMStack.Navigator>
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
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<CastTabParamList>();

export default function CastTabNavigator() {
  const unreadMessageCount = useAppStore((s) => s.unreadMessageCount);
  const unreadTonightRequestCount = useAppStore((s) => s.unreadTonightRequestCount);

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
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: '出勤管理',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="work" size={size} color={color} />
          ),
          tabBarBadge: unreadTonightRequestCount > 0 ? unreadTonightRequestCount : undefined,
          tabBarBadgeStyle: styles.badge,
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
        component={CRMStackNavigator}
        options={{
          tabBarLabel: '顧客管理',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
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
