const { Redis } = require("@upstash/redis")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

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
    const userId = uuidv4()
    const userData = {
      id: userId,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: "true",
      createdAt: new Date().toISOString(),
    }

    // Store user data
    const userKey = `user:${adminEmail}`
    console.log("[INFO] Storing user data with key:", userKey)

    // Use hset to store hash data for consistency
    await redis.hset(userKey, userData)
    console.log("[INFO] User data stored successfully")

    // Verify the data was stored
    const storedData = await redis.hgetall(userKey)
    console.log("[INFO] Verification - stored data:", storedData)

    // Add to users set with email
    await redis.sadd("users", adminEmail)
    console.log("[INFO] Added to users index")

    // Add to user ID -> email index
    await redis.set(`user-id-to-email:${userId}`, adminEmail)

    console.log("[SUCCESS] Admin user created successfully!")
    console.log("[INFO] You can now login with:", adminEmail)
  } catch (error) {
    console.error("[ERROR] Failed to create admin:", error)
  }
}

createAdmin()
