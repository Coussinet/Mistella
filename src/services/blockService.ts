import { supabase } from '../lib/supabase';
import type { ReportReason } from '../types';

export async function blockUser(
	blockerId: string,
	blockedId: string,
): Promise<void> {
	const { error } = await supabase
		.from('blocks')
		.insert({ blocker_id: blockerId, blocked_id: blockedId });
	if (error) throw error;
}

export async function unblockUser(
	blockerId: string,
	blockedId: string,
): Promise<void> {
	const { error } = await supabase
		.from('blocks')
		.delete()
		.eq('blocker_id', blockerId)
		.eq('blocked_id', blockedId);
	if (error) throw error;
}

export async function isBlocked(
	blockerId: string,
	blockedId: string,
): Promise<boolean> {
	const { data, error } = await supabase
		.from('blocks')
		.select('id')
		.eq('blocker_id', blockerId)
		.eq('blocked_id', blockedId)
		.maybeSingle();
	if (error) throw error;
	return data !== null;
}

export async function reportUser(params: {
	reporterId: string;
	reportedUserId: string;
	reason: ReportReason;
	detail?: string;
}): Promise<void> {
	const { error } = await supabase.from('reports').insert({
		reporter_id: params.reporterId,
		reported_user_id: params.reportedUserId,
		reason: params.reason,
		detail: params.detail ?? null,
	});
	if (error) throw error;
}
