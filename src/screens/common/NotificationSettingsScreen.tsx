import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import {
	useNotificationSettings,
	useUpdateNotificationSettings,
} from '@/hooks/queries/useNotificationSettings';
import type { NotificationSettingsKeys } from '@/types';

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
	{ key: 'notification_meeting_reminders', label: '約束リマインダー',          description: '会った記録の次回の約束が近づいたとき' },
];

export default function NotificationSettingsScreen() {
	const { data: settings, isPending, isError, error, refetch } =
		useNotificationSettings();
	const updateMutation = useUpdateNotificationSettings();

	// optimistic update 中のキー（該当トグルのみ無効化する）
	const updatingKey =
		updateMutation.isPending && updateMutation.variables
			? (Object.keys(updateMutation.variables)[0] as keyof NotificationSettingsKeys)
			: null;

	const handleToggle = (key: keyof NotificationSettingsKeys, value: boolean) => {
		if (!settings || updatingKey === key) return;
		updateMutation.mutate({ [key]: value });
	};

	if (isPending) {
		return (
			<View style={styles.container}>
				<SkeletonList count={5} />
			</View>
		);
	}

	if (isError) {
		return <ErrorView error={error} onRetry={refetch} />;
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
						disabled={updatingKey === item.key}
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
