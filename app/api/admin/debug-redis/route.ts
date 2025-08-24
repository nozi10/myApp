import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Debug Redis API called")

    // Check environment variables
    const envVars = {
      hasKvUrl: !!process.env.KV_REST_API_URL,
      hasKvToken: !!process.env.KV_REST_API_TOKEN,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      kvUrlPrefix: process.env.KV_REST_API_URL?.substring(0, 20) + "...",
    }

    console.log("[v0] Environment variables:", envVars)

    // Try to get all keys
    const keys = await redis.keys("*")
    console.log("[v0] All Redis keys:", keys)

    // Check specific user keys
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const userKey = `user:${adminEmail}`
      const userData = await redis.hgetall(userKey)
      console.log("[v0] User data for", userKey, ":", userData)
    }

    return NextResponse.json({
      environmentVariables: envVars,
      redisKeys: keys,
      userCheck: adminEmail
        ? {
            key: `user:${adminEmail}`,
            data: await redis.hgetall(`user:${adminEmail}`),
          }
        : null,
    })
  } catch (error) {
    console.error("[v0] Redis debug error:", error)
    return NextResponse.json(
      {
        error: "Redis debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
