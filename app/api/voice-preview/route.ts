import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json()

    if (!text || !voice) {
      return NextResponse.json({ error: "Text and voice are required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("[v0] Generating OpenAI TTS preview for voice:", voice)

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any,
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    console.log("[v0] OpenAI TTS preview generated, buffer size:", buffer.length)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Voice preview error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Voice preview failed",
      },
      { status: 500 },
    )
  }
}
