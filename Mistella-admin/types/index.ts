export interface AdminUser {
	id: string
	email: string
	name: string
	created_at: string
}

export interface AppUser {
	id: string
	role: 'cast' | 'customer'
	nickname: string
	avatar_url: string | null
	bio: string | null
	is_premium: boolean
	is_blocked: boolean
	created_at: string
}

export interface CastProfile {
	user_id: string
	shop_name: string | null
	shop_address: string | null
	price_info: string | null
	is_sponsored: boolean
	is_working: boolean
	work_status: 'working' | 'break' | 'off'
	shift_starts_at: string | null
	shift_ends_at: string | null
}

export type ReportReason = 'spam' | 'inappropriate_content' | 'harassment' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface Report {
	id: string
	reporter_id: string
	reported_user_id: string
	reason: ReportReason
	detail: string | null
	status: ReportStatus
	created_at: string
	reviewed_at: string | null
	reviewed_by: string | null
	reporter?: AppUser
	reported_user?: AppUser
}

export interface Announcement {
	id: string
	title: string
	body: string
	target_type: 'all' | 'all_male' | 'all_female' | 'individual'
	target_user_id: string | null
	sent_at: string | null
	created_by: string
	created_at: string
}
