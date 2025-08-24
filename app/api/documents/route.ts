import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get user's document IDs
    const documentIds = await kv.smembers(`user:${userId}:documents`)

    // Get document details
    const documents = []
    for (const documentId of documentIds) {
      const document = await kv.hgetall(`document:${documentId}`)
      if (document && Object.keys(document).length > 0) {
        documents.push({
          id: document.id,
          title: document.title,
          status: document.status,
          uploadedAt: document.uploadedAt,
          fileType: document.fileType,
          audioUrl: document.audioUrl,
        })
      }
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
