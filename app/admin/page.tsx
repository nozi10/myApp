import { requireAdmin } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const session = await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminDashboard user={session} />
    </div>
  )
}
