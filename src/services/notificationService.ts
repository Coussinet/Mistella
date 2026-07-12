import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { MeetingRecord, NotificationSettingsKeys } from '@/types';

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
			'notification_messages, notification_matches, notification_likes, notification_tonight_requests, notification_tonight_responses, notification_meeting_reminders',
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

// -----------------------------------------------------------
// 約束リマインダー（ローカル通知）
// 会った記録の next_promise_at に合わせて前日19時と当日朝9時に通知する。
// identifier は記録 ID ベースにして更新/削除時に再登録・解除できるようにする。
// -----------------------------------------------------------

function promiseReminderIds(recordId: string): [string, string] {
	return [`promise-${recordId}-daybefore`, `promise-${recordId}-morning`];
}

/** 記録の約束リマインダー通知を（再）スケジュールする。 */
export async function schedulePromiseReminder(record: MeetingRecord): Promise<void> {
	if (!record.next_promise_at) return;

	// 既存の通知を消してから登録し直す（更新時の重複防止）
	await cancelPromiseReminder(record.id);

	const promiseDate = new Date(record.next_promise_at);
	const now = new Date();
	const [dayBeforeId, morningId] = promiseReminderIds(record.id);

	const partnerName = record.partner?.nickname ?? '相手';
	const noteText = record.next_promise_note ? `：${record.next_promise_note}` : '';

	// 前日 19:00
	const dayBefore = new Date(promiseDate);
	dayBefore.setDate(dayBefore.getDate() - 1);
	dayBefore.setHours(19, 0, 0, 0);
	if (dayBefore > now) {
		await Notifications.scheduleNotificationAsync({
			identifier: dayBeforeId,
			content: {
				title: '明日の約束',
				body: `${partnerName}さんとの約束が明日あります${noteText}`,
				data: { recordId: record.id, partnerId: record.partner_id },
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: dayBefore,
			},
		});
	}

	// 当日 9:00
	const morning = new Date(promiseDate);
	morning.setHours(9, 0, 0, 0);
	if (morning > now && morning < promiseDate) {
		await Notifications.scheduleNotificationAsync({
			identifier: morningId,
			content: {
				title: '今日の約束',
				body: `${partnerName}さんとの約束が今日あります${noteText}`,
				data: { recordId: record.id, partnerId: record.partner_id },
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: morning,
			},
		});
	}
}

/** 記録の約束リマインダー通知をキャンセルする。 */
export async function cancelPromiseReminder(recordId: string): Promise<void> {
	for (const id of promiseReminderIds(recordId)) {
		try {
			await Notifications.cancelScheduledNotificationAsync(id);
		} catch {
			// 未登録なら無視
		}
	}
}
