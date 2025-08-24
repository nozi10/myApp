import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const userEmails = await kv.smembers("users")
    const documents = []

    for (const email of userEmails) {
      const userDocuments = await kv.smembers(`user:${email}:documents`)

      for (const docId of userDocuments) {
        const doc = await kv.hgetall(`document:${docId}`)
        if (doc && Object.keys(doc).length > 0) {
          documents.push({
            id: doc.id,
            title: doc.title,
            status: doc.status,
            uploadedAt: doc.uploadedAt,
            fileType: doc.fileType,
            fileSize: Number.parseInt(doc.fileSize as string, 10) || 0,
            userEmail: email,
            audioUrl: doc.audioUrl,
          })
        }
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
