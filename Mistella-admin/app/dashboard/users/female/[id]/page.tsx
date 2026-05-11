import UserEditPage from '@/components/UserEditPage'

export default function EditFemalePage({ params }: { params: { id: string } }) {
	return <UserEditPage userId={params.id} backPath="/dashboard/users/female" />
}
