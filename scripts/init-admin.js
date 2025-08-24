const { kv } = require("@vercel/kv")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

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
    const userId = uuidv4()

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Store user in Redis with proper key structure
    const userKey = `user:${adminEmail}`
    await kv.hset(userKey, {
      id: userId,
      email: adminEmail,
      name: "Administrator",
      password: hashedPassword,
      isAdmin: "true",
      createdAt: new Date().toISOString(),
    })

    // Add to user ID -> email index
    await kv.set(`user-id-to-email:${userId}`, adminEmail)

    // Add to users set
    await kv.sadd("users", adminEmail)

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
