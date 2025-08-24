const { Redis } = require("@upstash/redis")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

async function createAdmin() {
  console.log("🚀 Starting admin user creation...")

  // Get credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error("❌ Missing required environment variables:")
    console.error("   - ADMIN_EMAIL")
    console.error("   - ADMIN_PASSWORD")
    console.error("\nPlease set these in your Vercel project settings.")
    process.exit(1)
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error("❌ Missing Redis environment variables:")
    console.error("   - KV_REST_API_URL")
    console.error("   - KV_REST_API_TOKEN")
    console.error("\nPlease ensure Upstash Redis integration is properly configured.")
    process.exit(1)
  }

  try {
    // Test Redis connection
    console.log("🔍 Testing Redis connection...")
    await redis.ping()
    console.log("✅ Redis connection successful")

    console.log("🔍 Checking for existing admin...")
    const userKey = `user:${adminEmail}`
    const existingUser = await redis.hgetall(userKey)
    if (existingUser && Object.keys(existingUser).length > 0) {
      console.log(`⚠️  Admin user already exists: ${adminEmail}`)
      console.log(`   User ID: ${existingUser.id}`)
      return
    }

    // Generate unique user ID
    const userId = uuidv4()
    console.log(`🆔 Generated User ID: ${userId}`)

    // Hash password
    console.log("🔐 Hashing password...")
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    console.log("💾 Creating user record...")
    await redis.hset(userKey, {
      id: userId,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: "true",
      createdAt: new Date().toISOString(),
    })

    console.log("👥 Adding to users set...")
    await redis.sadd("users", adminEmail)

    // Add to user ID -> email index
    await redis.set(`user-id-to-email:${userId}`, adminEmail)

    // Verify creation
    console.log("✅ Verifying admin creation...")
    const createdUser = await redis.hgetall(userKey)

    if (createdUser && createdUser.password) {
      console.log("\n🎉 Admin user created successfully!")
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🆔 User ID: ${userId}`)
      console.log(`👑 Admin Status: ${createdUser.isAdmin}`)
      console.log(`📅 Created: ${createdUser.createdAt}`)
      console.log("\n✅ You can now login with your admin credentials!")
    } else {
      throw new Error("Failed to verify user creation")
    }
  } catch (error) {
    console.error("❌ Error creating admin user:")
    console.error(error.message)
    console.error("\nTroubleshooting:")
    console.error("1. Check that Redis (Upstash) integration is properly configured")
    console.error("2. Verify environment variables are set correctly")
    console.error("3. Ensure you have the required dependencies installed")
    process.exit(1)
  }
}

// Run the script
createAdmin()
