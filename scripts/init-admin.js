import { kv } from "@vercel/kv"
import bcrypt from "bcryptjs"

async function initializeAdmin() {
  console.log("Creating initial admin user...")

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456"

  try {
    // Check if admin already exists using email-to-ID mapping
    const existingUserId = await kv.hget("emails_to_ids", adminEmail)
    if (existingUserId) {
      console.log(`⚠️  Admin user already exists: ${adminEmail}`)
      return
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Store user in Redis with proper key structure
    const userKey = `user:${userId}`
    await kv.hset(userKey, {
      id: userId,
      email: adminEmail,
      name: "Administrator",
      passwordHash: hashedPassword,
      isAdmin: "true",
      createdAt: new Date().toISOString(),
    })

    // Add email-to-ID mapping
    await kv.hset("emails_to_ids", adminEmail, userId)

    // Add to users set
    await kv.sadd("users", userId)

    // Initialize user's documents set
    await kv.sadd(`user:${userId}:documents`, "placeholder")
    await kv.srem(`user:${userId}:documents`, "placeholder")

    console.log(`✅ Admin user created successfully!`)
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
    console.log(`User ID: ${userId}`)
    console.log("\n⚠️  Please change the default password after first login!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

initializeAdmin()
