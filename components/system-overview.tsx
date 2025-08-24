"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Database, Cloud, Activity } from "lucide-react"

interface SystemStats {
  totalUsers: number
  totalDocuments: number
  processingDocuments: number
  totalStorage: string
}

interface SystemOverviewProps {
  stats: SystemStats
}

export function SystemOverview({ stats }: SystemOverviewProps) {
  const systemInfo = [
    {
      label: "Application Version",
      value: "1.0.0",
      icon: Server,
    },
    {
      label: "Database Status",
      value: "Connected",
      status: "healthy",
      icon: Database,
    },
    {
      label: "Storage Provider",
      value: "Vercel Blob",
      status: "healthy",
      icon: Cloud,
    },
    {
      label: "Processing Queue",
      value: `${stats.processingDocuments} active`,
      status: stats.processingDocuments > 0 ? "active" : "idle",
      icon: Activity,
    },
  ]

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "default"
      case "active":
        return "secondary"
      case "idle":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">System Overview</h2>
        <p className="text-muted-foreground">System status and configuration</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemInfo.map((info, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{info.label}</CardTitle>
              <info.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{info.value}</div>
                {info.status && <Badge variant={getStatusColor(info.status)}>{info.status}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">File Processing</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>Max file size: 50 MB</p>
                <p>Supported formats: PDF, PNG, JPG, GIF, BMP, WebP</p>
                <p>Text extraction: OCR + PDF parsing</p>
                <p>AI cleaning: Google AI/Gemini</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Audio Generation</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>TTS Provider: Amazon Polly / OpenAI</p>
                <p>Audio format: MP3</p>
                <p>Quality: High (128kbps)</p>
                <p>Highlighting: Word-level sync</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Storage</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>File storage: Vercel Blob</p>
                <p>Database: Upstash Redis</p>
                <p>Session storage: Iron Session</p>
                <p>Total usage: {stats.totalStorage}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Security</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>Authentication: bcrypt + sessions</p>
                <p>Admin-only user creation</p>
                <p>Secure file access</p>
                <p>HTTPS enforced</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
