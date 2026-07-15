// ============================================================
// Mistella - AppTabNavigator（両ロール共通のボトムタブ）
// タブ構成:
//   キャスト: ホーム / おしごと / 記録 / メッセージ / マイページ
//   顧客:     ホーム / さがす / 記録 / メッセージ / マイページ
// 旧 CastTabNavigator / CustomerTabNavigator を1本に統合。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { stackScreenOptions, tabBarStyles } from '@/navigation/navigationTheme';
import { COLORS } from '@/constants/colors';
import { useAppStore } from '@/store/appStore';
import { tapLight } from '@/utils/haptics';
import type {
  CastStackParamList,
  CastTabParamList,
  CustomerStackParamList,
  CustomerTabParamList,
  UserRole,
} from '@/types';

// 画面
import TimelineScreen from '@/screens/common/TimelineScreen';
import CustomerHomeScreen from '@/screens/customer/CustomerHomeScreen';
import DiscoverScreen from '@/screens/customer/DiscoverScreen';
import TonightSendScreen from '@/screens/customer/TonightSendScreen';
import WorkingStatusScreen from '@/screens/cast/WorkingStatusScreen';
import ShopInfoScreen from '@/screens/cast/ShopInfoScreen';
import TonightRequestsScreen from '@/screens/cast/TonightRequestsScreen';
import MatchesScreen from '@/screens/common/MatchesScreen';
import ChatScreen from '@/screens/common/ChatScreen';
import ContactsScreen from '@/screens/common/ContactsScreen';
import PartnerNoteScreen from '@/screens/common/PartnerNoteScreen';
import MeetingRecordEditScreen from '@/screens/common/MeetingRecordEditScreen';
import ProfileScreen from '@/screens/common/ProfileScreen';
import EditProfileScreen from '@/screens/common/EditProfileScreen';
import FavoritesScreen from '@/screens/common/FavoritesScreen';
import FootprintsScreen from '@/screens/common/FootprintsScreen';
import UserProfileScreen from '@/screens/common/UserProfileScreen';
import NotificationSettingsScreen from '@/screens/common/NotificationSettingsScreen';

// -----------------------------------------------------------
// スタック定義
// 両ロールの ParamList を統合し、各タブのルート画面名（*Main）を追加。
// -----------------------------------------------------------

type AppStacks = CastStackParamList &
  CustomerStackParamList & {
    HomeMain: undefined;
    DiscoverMain: undefined;
    MatchesMain: undefined;
    ProfileMain: undefined;
  };

const Stack = createNativeStackNavigator<AppStacks>();

/** どのタブからも遷移しうる共通画面（プロフィール・チャット・記録詳細） */
function CommonScreens({ role }: { role: UserRole }) {
  return (
    <Stack.Group>
      {/* ヒーロー写真を画面最上部まで届かせるため透過ヘッダー（ボタン類は画面側で設定） */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '', headerTransparent: true }} />
      <Stack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'メッセージ' }} />
      <Stack.Screen name="PartnerNote" component={PartnerNoteScreen} options={{ title: '記録詳細' }} />
      <Stack.Screen name="MeetingRecordEdit" component={MeetingRecordEditScreen} options={{ title: '会った記録' }} />
      {role === 'customer' && (
        <Stack.Screen name="SendTonightRequest" component={TonightSendScreen} options={{ title: '今夜行ける？' }} />
      )}
    </Stack.Group>
  );
}

// ---- ホーム --------------------------------------------------

function CastHomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeMain" component={TimelineScreen} options={{ headerShown: false }} />
      {CommonScreens({ role: 'cast' })}
    </Stack.Navigator>
  );
}

function CustomerHomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeMain" component={CustomerHomeScreen} options={{ headerShown: false }} />
      {CommonScreens({ role: 'customer' })}
    </Stack.Navigator>
  );
}

// ---- さがす（顧客）/ おしごと（キャスト） --------------------

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DiscoverMain" component={DiscoverScreen} options={{ headerShown: false }} />
      {CommonScreens({ role: 'customer' })}
    </Stack.Navigator>
  );
}

function WorkStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="WorkingStatus" component={WorkingStatusScreen} options={{ title: 'おしごと' }} />
      <Stack.Screen name="ShopInfo" component={ShopInfoScreen} options={{ title: '店舗情報' }} />
      <Stack.Screen name="TonightRequests" component={TonightRequestsScreen} options={{ title: '今夜行ける？' }} />
      {CommonScreens({ role: 'cast' })}
    </Stack.Navigator>
  );
}

// ---- 記録 ----------------------------------------------------

function RecordsStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: role === 'cast' ? '顧客記録' : '会った記録' }}
      />
      {CommonScreens({ role })}
    </Stack.Navigator>
  );
}
const CastRecordsStack = () => <RecordsStack role="cast" />;
const CustomerRecordsStack = () => <RecordsStack role="customer" />;

// ---- メッセージ ----------------------------------------------

function MessagesStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MatchesMain" component={MatchesScreen} options={{ title: 'メッセージ' }} />
      {CommonScreens({ role })}
    </Stack.Navigator>
  );
}
const CastMessagesStack = () => <MessagesStack role="cast" />;
const CustomerMessagesStack = () => <MessagesStack role="customer" />;

// ---- マイページ ----------------------------------------------

function ProfileStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'マイページ' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'プロフィール編集' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'お気に入り' }} />
      <Stack.Screen name="Footprints" component={FootprintsScreen} options={{ title: '足跡' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: '通知設定' }} />
      {role === 'customer' && (
        <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: '会った記録' }} />
      )}
      {CommonScreens({ role })}
    </Stack.Navigator>
  );
}
const CastProfileStack = () => <ProfileStack role="cast" />;
const CustomerProfileStack = () => <ProfileStack role="customer" />;

// -----------------------------------------------------------
// タブナビゲーター
// -----------------------------------------------------------

type TabIconName = keyof typeof MaterialIcons.glyphMap;

interface TabConfig {
  name: string;
  label: string;
  icon: TabIconName;
  component: React.ComponentType;
  /** appStore の未読カウントをバッジ表示する */
  badge?: 'messages' | 'tonightRequests';
}

const CAST_TABS: TabConfig[] = [
  { name: 'Home', label: 'ホーム', icon: 'home', component: CastHomeStack },
  { name: 'Work', label: 'おしごと', icon: 'work', component: WorkStack, badge: 'tonightRequests' },
  { name: 'Records', label: '記録', icon: 'menu-book', component: CastRecordsStack },
  { name: 'Messages', label: 'メッセージ', icon: 'chat-bubble', component: CastMessagesStack, badge: 'messages' },
  { name: 'Profile', label: 'マイページ', icon: 'person', component: CastProfileStack },
];

const CUSTOMER_TABS: TabConfig[] = [
  { name: 'Home', label: 'ホーム', icon: 'home', component: CustomerHomeStack },
  { name: 'Discover', label: 'さがす', icon: 'search', component: DiscoverStack },
  { name: 'Records', label: '記録', icon: 'menu-book', component: CustomerRecordsStack },
  { name: 'Messages', label: 'メッセージ', icon: 'chat-bubble', component: CustomerMessagesStack, badge: 'messages' },
  { name: 'Profile', label: 'マイページ', icon: 'person', component: CustomerProfileStack },
];

const Tab = createBottomTabNavigator<CastTabParamList & CustomerTabParamList>();

export default function AppTabNavigator({ role }: { role: UserRole }) {
  const unreadMessageCount = useAppStore((s) => s.unreadMessageCount);
  const unreadTonightRequestCount = useAppStore((s) => s.unreadTonightRequestCount);

  const tabs = role === 'cast' ? CAST_TABS : CUSTOMER_TABS;
  const badgeCounts = {
    messages: unreadMessageCount,
    tonightRequests: unreadTonightRequestCount,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarStyles.tabBar,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: tabBarStyles.tabBarLabel,
        tabBarItemStyle: tabBarStyles.tabBarItem,
      }}
    >
      {tabs.map((tab) => {
        const badgeCount = tab.badge ? badgeCounts[tab.badge] : 0;
        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name as keyof (CastTabParamList & CustomerTabParamList)}
            component={tab.component}
            listeners={{ tabPress: () => tapLight() }}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name={tab.icon} size={size} color={color} />
              ),
              tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
              tabBarBadgeStyle: tabBarStyles.badge,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
