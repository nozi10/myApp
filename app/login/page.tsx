import { LoginForm } from "@/components/login-form"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Audio Reader</h1>
            <p className="text-slate-600 dark:text-slate-400">Sign in to access your documents</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
