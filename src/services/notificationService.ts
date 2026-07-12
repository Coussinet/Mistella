import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { NotificationSettingsKeys, PushToken } from '@/types';

export async function registerPushToken(userId: string): Promise<void> {
	if (!Device.isDevice) return;

	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== 'granted') return;

	const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
	const tokenData = await Notifications.getExpoPushTokenAsync(
		projectId ? { projectId } : undefined,
	);
	const token = tokenData.data;
	const platform = Platform.OS === 'ios' ? 'ios' : 'android';

	const { error } = await supabase.from('push_tokens').upsert(
		{ user_id: userId, token, platform },
		{ onConflict: 'token' },
	);
	if (error) throw error;
}

export async function getNotificationSettings(
	userId: string,
): Promise<NotificationSettingsKeys | null> {
	const { data, error } = await supabase
		.from('push_tokens')
		.select(
			'notification_messages, notification_matches, notification_likes, notification_tonight_requests, notification_tonight_responses',
		)
		.eq('user_id', userId)
		.maybeSingle();
	if (error) throw error;
	return data as NotificationSettingsKeys | null;
}

export async function updateNotificationSettings(
	userId: string,
	settings: Partial<NotificationSettingsKeys>,
): Promise<void> {
	const { error } = await supabase
		.from('push_tokens')
		.update(settings)
		.eq('user_id', userId);
	if (error) throw error;
}

type NotificationKey = keyof NotificationSettingsKeys;

export async function sendPushNotification(params: {
	recipientUserId: string;
	title: string;
	body: string;
	notificationKey: NotificationKey;
	data?: Record<string, string>;
}): Promise<void> {
	try {
		await supabase.functions.invoke('send-push-notification', {
			body: {
				recipient_user_id: params.recipientUserId,
				title: params.title,
				body: params.body,
				notification_key: params.notificationKey,
				data: params.data ?? {},
			},
		});
	} catch {
		// 通知の失敗はサイレントに処理（本体機能に影響させない）
	}
}
