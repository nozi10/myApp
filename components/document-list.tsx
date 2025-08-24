"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Play, Trash2 } from "lucide-react"
import { DocumentUpload } from "@/components/document-upload"

interface Document {
  id: string
  title: string
  status: "processing" | "ready" | "error"
  uploadedAt: string
  fileType: string
  audioUrl?: string
}

interface DocumentListProps {
  userId: string
}

export function DocumentList({ userId }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [userId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?userId=${userId}`)
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

  const handleUploadSuccess = () => {
    setShowUpload(false)
    fetchDocuments()
  }

  const handlePlayDocument = (documentId: string) => {
    window.location.href = `/reader/${documentId}`
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove document from local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Documents</h2>
          <p className="text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {showUpload && (
        <DocumentUpload userId={userId} onSuccess={handleUploadSuccess} onCancel={() => setShowUpload(false)} />
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first document to get started with AI audio reading
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{doc.title}</CardTitle>
                <Badge
                  variant={
                    doc.status === "ready" ? "default" : doc.status === "processing" ? "secondary" : "destructive"
                  }
                >
                  {doc.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    {doc.status === "ready" && doc.audioUrl && (
                      <Button size="sm" variant="outline" onClick={() => handlePlayDocument(doc.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        Listen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
