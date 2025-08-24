import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

async function debugRedis() {
  try {
    console.log("[DEBUG] Checking Redis connection...")

    // Test basic connection
    const pingResult = await redis.ping()
    console.log("[DEBUG] Redis ping result:", pingResult)

    // List all keys
    const keys = await redis.keys("*")
    console.log("[DEBUG] All Redis keys:", keys)

    // Check specific user keys
    const userKeys = keys.filter((key) => key.startsWith("user:"))
    console.log("[DEBUG] User keys found:", userKeys)

    // Check each user key
    for (const key of userKeys) {
      const userData = await redis.hgetall(key)
      console.log(`[DEBUG] Data for ${key}:`, userData)
    }

    // Check environment variables
    console.log("[DEBUG] ADMIN_EMAIL:", process.env.ADMIN_EMAIL ? "Set" : "Not set")
    console.log("[DEBUG] ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD ? "Set" : "Not set")
    console.log("[DEBUG] KV_REST_API_URL:", process.env.KV_REST_API_URL ? "Set" : "Not set")
    console.log("[DEBUG] KV_REST_API_TOKEN:", process.env.KV_REST_API_TOKEN ? "Set" : "Not set")
  } catch (error) {
    console.error("[DEBUG] Redis error:", error)
  }
}

debugRedis()
