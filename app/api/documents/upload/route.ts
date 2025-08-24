import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { kv } from "@vercel/kv"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/bmp",
      "image/webp",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Generate document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Upload to Vercel Blob
    const blob = await put(`documents/${documentId}/${file.name}`, file, {
      access: "public",
    })

    // Store document metadata in Redis
    const documentKey = `document:${documentId}`
    await kv.hset(documentKey, {
      id: documentId,
      userId,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      originalFilename: file.name,
      fileType: file.type,
      fileSize: file.size.toString(),
      fileUrl: blob.url,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
    })

    // Add to user's document index
    await kv.sadd(`user:${userId}:documents`, documentId)

    return NextResponse.json({
      documentId,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
