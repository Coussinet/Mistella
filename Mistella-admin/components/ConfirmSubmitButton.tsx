'use client'

interface Props {
	children: React.ReactNode
	message: string
	className?: string
}

export default function ConfirmSubmitButton({ children, message, className }: Props) {
	return (
		<button
			type="submit"
			className={className}
			onClick={(event) => {
				if (!window.confirm(message)) event.preventDefault()
			}}
		>
			{children}
		</button>
	)
}
