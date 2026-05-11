import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import {
	getNotificationSettings,
	updateNotificationSettings,
} from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';
import type { NotificationSettingsKeys, PushToken } from '../../types';

type SettingItem = {
	key: keyof NotificationSettingsKeys;
	label: string;
	description: string;
};

const SETTINGS: SettingItem[] = [
	{ key: 'notification_messages',          label: '新しいメッセージ',        description: 'DM受信時に通知' },
	{ key: 'notification_matches',           label: 'マッチング成立',           description: '相互いいねが成立したとき' },
	{ key: 'notification_likes',             label: 'いいね',                   description: 'いいねを受け取ったとき' },
	{ key: 'notification_tonight_requests',  label: '今夜行ける？リクエスト',    description: 'リクエストを受信したとき（キャスト）' },
	{ key: 'notification_tonight_responses', label: '今夜行ける？返答',          description: '承諾・辞退を受け取ったとき（顧客）' },
];

export default function NotificationSettingsScreen() {
	const { user } = useAuthStore();
	const [settings, setSettings] = useState<PushToken | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<keyof NotificationSettingsKeys | null>(null);

	const loadSettings = useCallback(async () => {
		if (!user) return;
		try {
			const data = await getNotificationSettings(user.id);
			setSettings(data);
		} catch {
			Alert.alert('エラー', '設定の読み込みに失敗しました。');
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const handleToggle = async (key: keyof NotificationSettingsKeys, value: boolean) => {
		if (!user || !settings) return;
		setUpdating(key);
		const prev = { ...settings };
		setSettings({ ...settings, [key]: value });
		try {
			await updateNotificationSettings(user.id, { [key]: value });
		} catch {
			setSettings(prev);
			Alert.alert('エラー', '設定の更新に失敗しました。');
		} finally {
			setUpdating(null);
		}
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={COLORS.gold} />
			</View>
		);
	}

	if (!settings) {
		return (
			<View style={styles.center}>
				<Text style={styles.emptyText}>
					プッシュ通知が有効になっていません。{'\n'}
					端末の設定からMistellaの通知を許可してください。
				</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.sectionHeader}>通知設定</Text>
			{SETTINGS.map((item) => (
				<View key={item.key} style={styles.row}>
					<View style={styles.rowText}>
						<Text style={styles.label}>{item.label}</Text>
						<Text style={styles.description}>{item.description}</Text>
					</View>
					<Switch
						value={settings[item.key]}
						onValueChange={(v) => handleToggle(item.key, v)}
						disabled={updating === item.key}
						trackColor={{ false: COLORS.border, true: COLORS.gold }}
						thumbColor={COLORS.text}
					/>
				</View>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	content:   { paddingBottom: 40 },
	center:    { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
	emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
	sectionHeader: {
		color: COLORS.textMuted, fontSize: 12, fontWeight: '600',
		paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
		textTransform: 'uppercase', letterSpacing: 0.5,
	},
	row: {
		flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
		paddingHorizontal: 16, paddingVertical: 14,
		borderBottomWidth: 1, borderBottomColor: COLORS.border,
		backgroundColor: COLORS.surface,
	},
	rowText:     { flex: 1, marginRight: 12 },
	label:       { color: COLORS.text, fontSize: 15, fontWeight: '500' },
	description: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
