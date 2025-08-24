import { Redis } from "@upstash/redis"
import bcrypt from "bcryptjs"

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error("[ERROR] ADMIN_EMAIL and ADMIN_PASSWORD must be set")
      return
    }

    console.log("[INFO] Creating admin user:", adminEmail)

    // Test Redis connection first
    const pingResult = await redis.ping()
    console.log("[INFO] Redis connection test:", pingResult)

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    console.log("[INFO] Password hashed successfully")

    // Create user data
    const userData = {
      id: `admin_${Date.now()}`,
      email: adminEmail,
      password: hashedPassword, // Using 'password' field as expected by auth
      role: "admin",
      createdAt: new Date().toISOString(),
      isActive: "true",
    }

    // Store user data
    const userKey = `user:${adminEmail}`
    console.log("[INFO] Storing user data with key:", userKey)

    // Use hmset to store hash data
    await redis.hmset(userKey, userData)
    console.log("[INFO] User data stored successfully")

    // Verify the data was stored
    const storedData = await redis.hgetall(userKey)
    console.log("[INFO] Verification - stored data:", storedData)

    // Also store in users index
    await redis.sadd("users", userData.id)
    console.log("[INFO] Added to users index")

    console.log("[SUCCESS] Admin user created successfully!")
    console.log("[INFO] You can now login with:", adminEmail)
  } catch (error) {
    console.error("[ERROR] Failed to create admin:", error)
  }
}

createAdmin()
