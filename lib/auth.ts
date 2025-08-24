import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import bcrypt from "bcryptjs"
import { Redis } from "@upstash/redis"

export interface SessionData {
  userId: string
  email: string
  isAdmin: boolean
  isLoggedIn: boolean
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "ai-audio-reader-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (!session.isLoggedIn) {
    return null
  }

  return session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (!session.isAdmin) {
    redirect("/dashboard")
  }
  return session
}

export async function login(email: string, password: string) {
  try {
    console.log("[v0] Login attempt for:", email)

    // Get user from Redis
    const userKey = `user:${email}`
    console.log("[v0] Looking up user key:", userKey)

    const userData = await redis.hgetall(userKey)
    console.log("[v0] User data found:", userData ? "Yes" : "No")

    if (!userData || !userData.password) {
      console.log("[v0] No user data or password found")
      return { success: false, error: "Invalid credentials" }
    }

    console.log("[v0] Comparing passwords...")
    // Verify password
    const isValid = await bcrypt.compare(password, userData.password as string)
    console.log("[v0] Password valid:", isValid)

    if (!isValid) {
      return { success: false, error: "Invalid credentials" }
    }

    // Create session
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    session.userId = userData.id as string
    session.email = email
    session.isAdmin = userData.isAdmin === "true"
    session.isLoggedIn = true

    await session.save()
    console.log("[v0] Session created successfully")

    return { success: true }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function logout() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  session.destroy()
}

export async function createUser(email: string, password: string, isAdmin = false) {
  try {
    // Check if user already exists
    const existingUser = await redis.hgetall(`user:${email}`)
    if (existingUser && Object.keys(existingUser).length > 0) {
      return { success: false, error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store user in Redis
    const userKey = `user:${email}`
    await redis.hset(userKey, {
      id: userId,
      email,
      password: hashedPassword,
      isAdmin: isAdmin.toString(),
      createdAt: new Date().toISOString(),
    })

    // Add to user index
    await redis.sadd("users", email)

    return { success: true, userId }
  } catch (error) {
    console.error("Create user error:", error)
    return { success: false, error: "Failed to create user" }
  }
}
