"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, FileText } from "lucide-react"
import type { SessionData } from "@/lib/auth"

interface DashboardHeaderProps {
  user: SessionData
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Audio Reader</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user.isAdmin && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => router.push("/admin")} className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Button>
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>User Dashboard</span>
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.email}</p>
                  {user.isAdmin && <p className="text-xs text-muted-foreground">Administrator</p>}
                </div>
              </div>
              <DropdownMenuSeparator />
              {user.isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <FileText className="mr-2 h-4 w-4" />
                    User Dashboard
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
