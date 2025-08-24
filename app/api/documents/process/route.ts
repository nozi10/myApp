import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { getSession } from "@/lib/auth"
import { put } from "@vercel/blob"
import { OpenAI } from "openai"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId, userId, voiceId = "Joanna" } = await request.json()

    if (userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const documentKey = `document:${documentId}`
    const document = await redis.hgetall(documentKey)

    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    await redis.hset(documentKey, {
      status: "processing",
      processingStartedAt: new Date().toISOString(),
      voiceId,
    })

    processDocumentAsync(documentId, document.fileUrl as string, document.fileType as string, voiceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Process error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

async function processDocumentAsync(documentId: string, fileUrl: string, fileType: string, voiceId: string) {
  const documentKey = `document:${documentId}`

  try {
    console.log(`[v0] Starting processing for document ${documentId}`)

    let extractedText = ""

    if (fileType === "application/pdf") {
      extractedText = await extractTextFromPDF(fileUrl)
    } else if (fileType.startsWith("image/")) {
      extractedText = await extractTextFromImage(fileUrl)
    }

    if (!extractedText.trim()) {
      throw new Error("No text could be extracted from the document")
    }

    console.log(`[v0] Extracted ${extractedText.length} characters from document`)

    await redis.hset(documentKey, {
      extractedText,
      extractedAt: new Date().toISOString(),
    })

    const cleanedText = await cleanTextWithAI(extractedText)
    console.log(`[v0] Cleaned text, reduced to ${cleanedText.length} characters`)

    await redis.hset(documentKey, {
      cleanedText,
      cleanedAt: new Date().toISOString(),
    })

    const audioResult = await convertToSpeech(cleanedText, documentId, voiceId)
    console.log(`[v0] Generated audio at ${audioResult.audioUrl}`)

    await redis.hset(documentKey, {
      audioUrl: audioResult.audioUrl,
      speechMarks: JSON.stringify(audioResult.speechMarks || []),
      status: "ready",
      processedAt: new Date().toISOString(),
    })

    console.log(`[v0] Document ${documentId} processing completed successfully`)
  } catch (error) {
    console.error(`[v0] Processing failed for document ${documentId}:`, error)

    await redis.hset(documentKey, {
      status: "error",
      error: error instanceof Error ? error.message : "Processing failed",
      errorAt: new Date().toISOString(),
    })
  }
}

async function extractTextFromPDF(fileUrl: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    const prompt =
      "Extract all text from this PDF document. Return only the text content in the order it appears, preserving paragraph breaks and structure. Do not include any descriptions or explanations."

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ])

    const extractedText = result.response.text()
    return extractedText || ""
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function extractTextFromImage(fileUrl: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = response.headers.get("content-type") || "image/jpeg"

    const prompt = "Extract all text from this image. Return only the text content, no descriptions or explanations."

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ])

    const extractedText = result.response.text()
    return extractedText || ""
  } catch (error) {
    console.error("OCR extraction error:", error)
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function cleanTextWithAI(text: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Please clean and optimize the following text for text-to-speech conversion. Remove any OCR artifacts, fix formatting issues, normalize punctuation, and ensure the text flows naturally when read aloud. Preserve the original meaning and structure:

${text}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const cleanedText = response.text()

    return cleanedText || text
  } catch (error) {
    console.error("AI text cleaning error:", error)
    return text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()
  }
}

async function convertToSpeech(
  text: string,
  documentId: string,
  voiceId: string,
): Promise<{ audioUrl: string; speechMarks?: any[] }> {
  try {
    if (process.env.AMAZON_POLLY_API_URL) {
      try {
        console.log(`[v0] Attempting Polly TTS conversion`)
        return await convertWithPolly(text, documentId, voiceId)
      } catch (pollyError) {
        console.error(`[v0] Polly TTS failed, falling back to OpenAI:`, pollyError)
      }
    }

    console.log(`[v0] Using OpenAI TTS conversion`)
    const audioUrl = await convertWithOpenAI(text, documentId)
    return { audioUrl }
  } catch (error) {
    console.error("TTS conversion error:", error)
    throw new Error(`Failed to convert text to speech: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function convertWithPolly(
  text: string,
  documentId: string,
  voiceId: string,
): Promise<{ audioUrl: string; speechMarks: any[] }> {
  try {
    console.log(`[v0] Attempting Polly TTS conversion for document ${documentId}`)
    console.log(`[v0] Using voice: ${voiceId}`)
    console.log(`[v0] Polly API URL: ${process.env.AMAZON_POLLY_API_URL ? "Set" : "Not set"}`)

    const response = await fetch(process.env.AMAZON_POLLY_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text: text,
        voiceId: voiceId,
      }),
    })

    console.log(`[v0] Polly API response status: ${response.status}`)
    console.log(`[v0] Polly API response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Polly API error response: ${errorText}`)
      throw new Error(`Polly API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`[v0] Polly API response keys: ${Object.keys(result).join(", ")}`)

    if (result.audioChunks && Array.isArray(result.audioChunks)) {
      console.log(`[v0] Combining ${result.audioChunks.length} audio chunks`)
      const combinedAudioData = result.audioChunks.join("")
      const audioBuffer = Buffer.from(combinedAudioData, "base64")
      const blob = await put(`audio/${documentId}.mp3`, audioBuffer, {
        access: "public",
        contentType: "audio/mpeg",
      })

      return {
        audioUrl: blob.url,
        speechMarks: result.speechMarks || [],
      }
    } else {
      console.error(`[v0] Unexpected Polly response format:`, result)
      throw new Error("No audio chunks received from Polly")
    }
  } catch (error) {
    console.error("Polly TTS error:", error)
    throw error
  }
}

async function convertWithOpenAI(text: string, documentId: string): Promise<string> {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const mp3 = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    const blob = await put(`audio/${documentId}.mp3`, buffer, {
      access: "public",
      contentType: "audio/mpeg",
    })

    return blob.url
  } catch (error) {
    console.error("OpenAI TTS error:", error)
    throw error
  }
}
