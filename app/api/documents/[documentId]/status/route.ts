import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = params
    const documentKey = `document:${documentId}`
    const document = await kv.hgetall(documentKey)

    if (!document || document.userId !== session.userId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: documentId,
      status: document.status,
      title: document.title,
      error: document.error,
      audioUrl: document.audioUrl,
      processedAt: document.processedAt,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
