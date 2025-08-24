import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { deleteDocument, getDocumentById } from "@/lib/database"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    await requireAdmin()

    const { documentId } = params
    const document = await getDocumentById(documentId)

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete files from blob storage
    try {
      if (document.fileUrl) {
        await del(document.fileUrl)
      }
      if (document.audioUrl) {
        await del(document.audioUrl)
      }
    } catch (blobError) {
      console.error("Error deleting blob files:", blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await deleteDocument(documentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Document deletion error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
