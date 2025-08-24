"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, ImageIcon, X, CheckCircle, Volume2, Play } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/utils"

interface DocumentUploadProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "uploaded" | "processing" | "complete" | "error"
  error?: string
  documentId?: string
}

const VOICE_OPTIONS = {
  amazon: [
    { id: "Joanna", name: "Joanna (US Female)", language: "en-US" },
    { id: "Matthew", name: "Matthew (US Male)", language: "en-US" },
    { id: "Amy", name: "Amy (UK Female)", language: "en-GB" },
    { id: "Brian", name: "Brian (UK Male)", language: "en-GB" },
    { id: "Emma", name: "Emma (UK Female)", language: "en-GB" },
    { id: "Olivia", name: "Olivia (AU Female)", language: "en-AU" },
    { id: "Salli", name: "Salli (US Female)", language: "en-US" },
    { id: "Kimberly", name: "Kimberly (US Female)", language: "en-US" },
    { id: "Kendra", name: "Kendra (US Female)", language: "en-US" },
    { id: "Justin", name: "Justin (US Male)", language: "en-US" },
    { id: "Joey", name: "Joey (US Male)", language: "en-US" },
  ],
  openai: [
    { id: "alloy", name: "Alloy (Neutral)", language: "en-US" },
    { id: "echo", name: "Echo (Male)", language: "en-US" },
    { id: "fable", name: "Fable (British Male)", language: "en-GB" },
    { id: "onyx", name: "Onyx (Deep Male)", language: "en-US" },
    { id: "nova", name: "Nova (Female)", language: "en-US" },
    { id: "shimmer", name: "Shimmer (Soft Female)", language: "en-US" },
  ],
}

export function DocumentUpload({ userId, onSuccess, onCancel }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>("Joanna")
  const [showVoiceSelection, setShowVoiceSelection] = useState(false)
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: uuidv4(),
      progress: 0,
      status: "uploaded" as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    uploadFiles(newFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading,
  })

  const uploadFiles = async (filesToUpload: UploadFile[]) => {
    setIsUploading(true)

    for (const uploadFile of filesToUpload) {
      try {
        // Validate file size and type
        if (!uploadFile.file) {
          throw new Error("Invalid file")
        }

        if (uploadFile.file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`)
        }

        if (!ALLOWED_FILE_TYPES.includes(uploadFile.file.type)) {
          throw new Error("Unsupported file type")
        }

        // Update progress to show upload starting
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f)))

        // Upload file to blob storage
        const formData = new FormData()
        formData.append("file", uploadFile.file)
        formData.append("userId", userId)

        const uploadResponse = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`)
        }

        const uploadData = await uploadResponse.json()

        if (!uploadData.documentId) {
          throw new Error("Invalid upload response")
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: 100, status: "uploaded", documentId: uploadData.documentId } : f,
          ),
        )
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
              : f,
          ),
        )
      }
    }

    setIsUploading(false)
    if (files.every((f) => f.status === "uploaded")) {
      setShowVoiceSelection(true)
    }
  }

  const startProcessing = async () => {
    const uploadedFiles = files.filter((f) => f.status === "uploaded" && f.documentId)

    for (const uploadFile of uploadedFiles) {
      try {
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "processing", progress: 0 } : f)))

        // Start processing pipeline with voice selection
        const processResponse = await fetch("/api/documents/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: uploadFile.documentId,
            userId,
            voiceId: selectedVoice,
          }),
        })

        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `Processing failed: ${processResponse.status}`)
        }

        // Poll for completion
        await pollProcessingStatus(uploadFile.id, uploadFile.documentId!)
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: error instanceof Error ? error.message : "Processing failed" }
              : f,
          ),
        )
      }
    }
  }

  const pollProcessingStatus = async (fileId: string, documentId: string) => {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/status`)
        const data = await response.json()

        const progress = Math.min(30 + (attempts / maxAttempts) * 60, 90)
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))

        if (data.status === "ready") {
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: "complete" } : f)))
          return
        }

        if (data.status === "error") {
          throw new Error(data.error || "Processing failed")
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          throw new Error("Processing timeout")
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "error", error: error instanceof Error ? error.message : "Processing failed" }
              : f,
          ),
        )
      }
    }

    poll()
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const previewVoice = async (voiceId: string) => {
    if (isPreviewingVoice) return

    setIsPreviewingVoice(true)
    try {
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.currentTime = 0
        setPreviewAudio(null)
      }

      const sampleText = "Hello, this is a preview of how this voice sounds. You can use this voice for your document."

      // Determine if it's Amazon or OpenAI voice
      const isAmazonVoice = VOICE_OPTIONS.amazon.some((v) => v.id === voiceId)

      let audioUrl = ""

      if (isAmazonVoice) {
        // Use Amazon Polly for preview
        const pollyUrl = process.env.NEXT_PUBLIC_AMAZON_POLLY_API_URL
        if (!pollyUrl) {
          throw new Error("Amazon Polly API URL not configured")
        }

        const response = await fetch(pollyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ text: sampleText, voiceId }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error")
          throw new Error(`Polly API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        if (data.audioChunks && data.audioChunks.length > 0) {
          // Decode the base64 chunks and create a blob.
          const audioData = data.audioChunks.map((chunk: string) =>
            Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0)),
          )
          const blob = new Blob(audioData, { type: "audio/mpeg" })
          audioUrl = URL.createObjectURL(blob)
        } else {
          throw new Error("No audio data received from Polly")
        }
      } else {
        // Use OpenAI TTS for preview
        const response = await fetch("/api/voice-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sampleText, voice: voiceId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(`OpenAI TTS error: ${errorData.error || response.statusText}`)
        }

        const blob = await response.blob()
        if (blob.size === 0) {
          throw new Error("Empty audio response from OpenAI")
        }
        audioUrl = URL.createObjectURL(blob)
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl)
        setPreviewAudio(audio)

        audio.onloadeddata = () => {
          audio.play().catch((error) => {
            console.error("Audio play error:", error)
            setIsPreviewingVoice(false)
          })
        }

        audio.onended = () => {
          setIsPreviewingVoice(false)
          URL.revokeObjectURL(audioUrl)
          setPreviewAudio(null)
        }

        audio.onerror = () => {
          setIsPreviewingVoice(false)
          URL.revokeObjectURL(audioUrl)
          setPreviewAudio(null)
          console.error("Audio playback error")
        }
      } else {
        throw new Error("Failed to generate audio URL")
      }
    } catch (error) {
      console.error("Voice preview error:", error)
      setIsPreviewingVoice(false)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      console.error("Full voice preview error:", error)
      alert(`Voice preview failed: ${errorMessage}`)
    }
  }

  const allComplete = files.length > 0 && files.every((f) => f.status === "complete")
  const hasErrors = files.some((f) => f.status === "error")
  const hasUploaded = files.some((f) => f.status === "uploaded")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Upload Documents</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {files.length === 0 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{isDragActive ? "Drop files here" : "Drag & drop files here"}</p>
              <p className="text-muted-foreground mb-4">or click to select files</p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, DOCX, and image files (PNG, JPG, etc.) up to 50MB
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {uploadFile.file.type.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      ) : uploadFile.file.type.includes("word") ? (
                        <FileText className="h-5 w-5 text-blue-700" />
                      ) : (
                        <FileText className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === "complete" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {uploadFile.status !== "complete" && (
                        <Button variant="ghost" size="sm" onClick={() => removeFile(uploadFile.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploadFile.status === "processing" && (
                    <div className="space-y-2">
                      <Progress value={uploadFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">Processing document...</p>
                    </div>
                  )}

                  {uploadFile.status === "error" && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">{uploadFile.error}</AlertDescription>
                    </Alert>
                  )}

                  {uploadFile.status === "uploaded" && <p className="text-sm text-blue-600">Ready for processing</p>}

                  {uploadFile.status === "complete" && (
                    <p className="text-sm text-green-600">Document processed successfully!</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showVoiceSelection && hasUploaded && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <Volume2 className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Choose Voice</h4>
              </div>

              <div className="space-y-3">
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Amazon Polly</div>
                    {VOICE_OPTIONS.amazon.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                      OpenAI TTS
                    </div>
                    {VOICE_OPTIONS.openai.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Voice preview section */}
                {selectedVoice && (
                  <div className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Preview:</span>
                      <span className="text-sm text-muted-foreground">
                        {VOICE_OPTIONS.amazon.find((v) => v.id === selectedVoice)?.name ||
                          VOICE_OPTIONS.openai.find((v) => v.id === selectedVoice)?.name}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewVoice(selectedVoice)}
                      disabled={isPreviewingVoice}
                      className="flex items-center space-x-1"
                    >
                      <Play className="h-3 w-3" />
                      <span className="text-xs">{isPreviewingVoice ? "Playing..." : "Preview"}</span>
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Selected voice will be used for text-to-speech conversion. Click preview to hear the voice.
              </p>
            </div>
          )}

          {files.length > 0 && !isUploading && (
            <div className="flex justify-end space-x-2">
              {!allComplete && !hasUploaded && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Trigger file picker
                    const input = document.createElement("input")
                    input.type = "file"
                    input.multiple = true
                    input.accept = ".pdf,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                    input.onchange = (e) => {
                      const filesToAdd = Array.from((e.target as HTMLInputElement).files || [])
                      onDrop(filesToAdd)
                    }
                    input.click()
                  }}
                >
                  Add More Files
                </Button>
              )}
              {hasUploaded && (
                <Button onClick={startProcessing} className="bg-primary">
                  Process Documents
                </Button>
              )}
              {allComplete && <Button onClick={onSuccess}>Done</Button>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
