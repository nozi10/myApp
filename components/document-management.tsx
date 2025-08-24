"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Search, Trash2, Play, User } from "lucide-react"

interface Document {
  id: string
  title: string
  status: "processing" | "ready" | "error"
  uploadedAt: string
  fileType: string
  userEmail: string
  fileSize: number
  audioUrl?: string
}

interface DocumentManagementProps {
  onStatsUpdate: () => void
}

export function DocumentManagement({ onStatsUpdate }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.userEmail.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredDocuments(filtered)
    } else {
      setFilteredDocuments(documents)
    }
  }, [documents, searchQuery])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/admin/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchDocuments()
        onStatsUpdate()
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Document Management</h2>
          <p className="text-muted-foreground">{documents.length} total documents</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{doc.userEmail}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    doc.status === "ready" ? "default" : doc.status === "processing" ? "secondary" : "destructive"
                  }
                >
                  {doc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {doc.fileType} • {formatFileSize(doc.fileSize)}
                </div>
                <div className="flex space-x-2">
                  {doc.status === "ready" && doc.audioUrl && (
                    <Button size="sm" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{searchQuery ? "No documents found" : "No documents yet"}</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? "Try adjusting your search terms" : "Documents will appear here once users upload them"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
