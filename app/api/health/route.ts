import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    // Test Redis connection
    await kv.ping()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        redis: "connected",
        blob: "available",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 503 },
    )
  }
}
