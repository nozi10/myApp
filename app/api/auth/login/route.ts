import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { login } from "@/lib/auth"

const MAX_LOGIN_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 // 1 minute

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1"
  const rateLimitKey = `login-attempt:${ip}`

  const attempts = await kv.get<number>(rateLimitKey)

  if (attempts && attempts >= MAX_LOGIN_ATTEMPTS) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await login(email, password)

    if (result.success) {
      // On successful login, reset the rate limit counter
      await kv.del(rateLimitKey)
      return NextResponse.json({ success: true })
    } else {
      // On failed login, increment the counter
      const newAttempts = await kv.incr(rateLimitKey)
      if (newAttempts === 1) {
        await kv.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS)
      }
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
  } catch (error) {
    // Also increment on server errors during login process
    await kv.incr(rateLimitKey)
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
