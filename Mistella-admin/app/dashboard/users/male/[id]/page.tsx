import UserEditPage from '@/components/UserEditPage'

export default function EditMalePage({ params }: { params: { id: string } }) {
	return <UserEditPage userId={params.id} backPath="/dashboard/users/male" />
}
