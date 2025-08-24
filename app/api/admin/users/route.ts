import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { requireAdmin, createUser } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"

export async function GET() {
  try {
    await requireAdmin()

    const userEmails = await kv.smembers("users")
    const users = []

    for (const email of userEmails) {
      const userData = await kv.hgetall(`user:${email}`)
      if (userData && Object.keys(userData).length > 0) {
        // Get document count for this user
        const userDocuments = await kv.smembers(`user:${email}:documents`)

        users.push({
          id: userData.id,
          email,
          isAdmin: userData.isAdmin === "true",
          createdAt: userData.createdAt,
          documentCount: userDocuments.length,
        })
      }
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { email, password, isAdmin } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const result = await createUser(email, password, isAdmin)

    if (result.success) {
      const emailResult = await sendWelcomeEmail(email, password)

      return NextResponse.json({
        success: true,
        userId: result.userId,
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : emailResult.error,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
