import Sidebar from '@/components/Sidebar'
import { requireAdmin } from '@/lib/admin/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { adminUser } = await requireAdmin()
	return (
		<div className="flex min-h-screen bg-[#080b12]">
			<Sidebar adminName={adminUser.name} />
			<main className="flex-1 min-w-0 p-5 md:p-8 lg:p-10 overflow-auto">{children}</main>
		</div>
	)
}
