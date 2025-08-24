import { requireAuth } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DocumentList } from "@/components/document-list"

export default async function DashboardPage() {
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardHeader user={session} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your Documents</h1>
          <p className="text-slate-600 dark:text-slate-400">Upload and manage your audio documents</p>
        </div>
        <DocumentList userId={session.userId} />
      </main>
    </div>
  )
}
