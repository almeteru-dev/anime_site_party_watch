import { Suspense } from "react"
import { AdminMALCallbackClient } from "./callback-client"

export const dynamic = "force-dynamic"

export default function AdminMALCallbackPage() {
	return (
		<Suspense>
			<AdminMALCallbackClient />
		</Suspense>
	)
}

