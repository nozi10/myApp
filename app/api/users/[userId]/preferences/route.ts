import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getSession()
    if (!session || session.userId !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await kv.hgetall(`user:${params.userId}:preferences`)

    // Default preferences if none exist
    const defaultPreferences = {
      preferredVoice: "alloy",
      defaultSpeed: 1,
      highlightMode: "word",
      autoScroll: true,
    }

    return NextResponse.json({
      preferences:
        Object.keys(preferences).length > 0
          ? {
              preferredVoice: preferences.preferredVoice || "alloy",
              defaultSpeed: Number.parseFloat(preferences.defaultSpeed as string) || 1,
              highlightMode: preferences.highlightMode || "word",
              autoScroll: preferences.autoScroll === "true",
            }
          : defaultPreferences,
    })
  } catch (error) {
    console.error("Preferences fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getSession()
    if (!session || session.userId !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { preferences } = await request.json()

    await kv.hset(`user:${params.userId}:preferences`, {
      preferredVoice: preferences.preferredVoice,
      defaultSpeed: preferences.defaultSpeed.toString(),
      highlightMode: preferences.highlightMode,
      autoScroll: preferences.autoScroll.toString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Preferences save error:", error)
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
  }
}
