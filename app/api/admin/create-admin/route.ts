import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import bcrypt from "bcryptjs"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Admin creation API called")

    // Check if environment variables exist
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.log("[v0] Missing environment variables:", {
        hasEmail: !!adminEmail,
        hasPassword: !!adminPassword,
      })
      return NextResponse.json(
        {
          error: "ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Environment variables found, creating admin user for:", adminEmail)

    // Check if admin already exists
    const userKey = `user:${adminEmail}`
    const existingUser = await redis.hgetall(userKey)

    if (existingUser && Object.keys(existingUser).length > 0) {
      console.log("[v0] Admin user already exists")
      return NextResponse.json({
        message: "Admin user already exists",
        email: adminEmail,
      })
    }

    // Hash password
    console.log("[v0] Hashing password...")
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user data
    const userData = {
      id: `admin_${Date.now()}`,
      email: adminEmail,
      password: hashedPassword, // Note: using 'password' not 'passwordHash'
      role: "admin",
      createdAt: new Date().toISOString(),
      isActive: "true",
    }

    console.log("[v0] Storing user data with key:", userKey)

    // Store user data
    await redis.hmset(userKey, userData)

    // Verify storage
    const storedUser = await redis.hgetall(userKey)
    console.log("[v0] Verification - stored user keys:", Object.keys(storedUser))

    if (!storedUser || Object.keys(storedUser).length === 0) {
      throw new Error("Failed to store user data in Redis")
    }

    console.log("[v0] Admin user created successfully")

    return NextResponse.json({
      message: "Admin user created successfully",
      email: adminEmail,
      userId: userData.id,
      storedKeys: Object.keys(storedUser),
    })
  } catch (error) {
    console.error("[v0] Error creating admin user:", error)
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin creation API called via GET")

    // Check if environment variables exist
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.log("[v0] Missing environment variables:", {
        hasEmail: !!adminEmail,
        hasPassword: !!adminPassword,
      })
      return NextResponse.json(
        {
          error: "ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Environment variables found, creating admin user for:", adminEmail)

    // Check if admin already exists
    const userKey = `user:${adminEmail}`
    const existingUser = await redis.hgetall(userKey)

    if (existingUser && Object.keys(existingUser).length > 0) {
      console.log("[v0] Admin user already exists")
      return NextResponse.json({
        message: "Admin user already exists",
        email: adminEmail,
      })
    }

    // Hash password
    console.log("[v0] Hashing password...")
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user data
    const userData = {
      id: `admin_${Date.now()}`,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
      isActive: "true",
    }

    console.log("[v0] Storing user data with key:", userKey)

    // Store user data
    await redis.hmset(userKey, userData)

    // Verify storage
    const storedUser = await redis.hgetall(userKey)
    console.log("[v0] Verification - stored user keys:", Object.keys(storedUser))

    if (!storedUser || Object.keys(storedUser).length === 0) {
      throw new Error("Failed to store user data in Redis")
    }

    console.log("[v0] Admin user created successfully")

    return NextResponse.json({
      message: "Admin user created successfully",
      email: adminEmail,
      userId: userData.id,
      storedKeys: Object.keys(storedUser),
    })
  } catch (error) {
    console.error("[v0] Error creating admin user:", error)
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
