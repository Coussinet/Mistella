import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin/auth'

export async function GET() {
	const context = await getAdminContext()
	if (!context) {
		return NextResponse.json({ admin: false }, { status: 403 })
	}
	return NextResponse.json({ admin: true, name: context.adminUser.name })
}
