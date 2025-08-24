"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, Settings, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { UserManagement } from "@/components/user-management"
import { SystemOverview } from "@/components/system-overview"
import { DocumentManagement } from "@/components/document-management"
import type { SessionData } from "@/lib/auth"

interface AdminDashboardProps {
  user: SessionData
}

interface SystemStats {
  totalUsers: number
  totalDocuments: number
  processingDocuments: number
  totalStorage: string
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalDocuments: 0,
    processingDocuments: 0,
    totalStorage: "0 MB",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching system stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">System administration and user management</p>
            </div>
          </div>
          <Badge variant="secondary">Administrator</Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active user accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Uploaded documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stats.processingDocuments}</div>
              <p className="text-xs text-muted-foreground">Documents in queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalStorage}</div>
              <p className="text-xs text-muted-foreground">Total file storage</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="documents">Document Management</TabsTrigger>
            <TabsTrigger value="system">System Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement onStatsUpdate={fetchSystemStats} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement onStatsUpdate={fetchSystemStats} />
          </TabsContent>

          <TabsContent value="system">
            <SystemOverview stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
