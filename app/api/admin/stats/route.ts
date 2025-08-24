import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    // Get total users
    const userEmails = await kv.smembers("users")
    const totalUsers = userEmails.length

    // Get all document IDs across all users
    let totalDocuments = 0
    let processingDocuments = 0
    let totalStorageBytes = 0

    for (const email of userEmails) {
      const userDocuments = await kv.smembers(`user:${email}:documents`)
      totalDocuments += userDocuments.length

      // Check document statuses and sizes
      for (const docId of userDocuments) {
        const doc = await kv.hgetall(`document:${docId}`)
        if (doc.status === "processing") {
          processingDocuments++
        }
        if (doc.fileSize) {
          totalStorageBytes += Number.parseInt(doc.fileSize as string, 10)
        }
      }
    }

    // Format storage size
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 MB"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    }

    return NextResponse.json({
      totalUsers,
      totalDocuments,
      processingDocuments,
      totalStorage: formatBytes(totalStorageBytes),
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
