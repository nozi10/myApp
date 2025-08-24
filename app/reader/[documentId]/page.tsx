import { requireAuth } from "@/lib/auth"
import { kv } from "@vercel/kv"
import { notFound, redirect } from "next/navigation"
import { ReaderInterface } from "@/components/reader-interface"

interface ReaderPageProps {
  params: { documentId: string }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const session = await requireAuth()
  const { documentId } = params

  // Get document from Redis
  const documentKey = `document:${documentId}`
  const document = await kv.hgetall(documentKey)

  if (!document || document.userId !== session.userId) {
    notFound()
  }

  if (document.status !== "ready") {
    redirect(`/dashboard?error=Document not ready for reading`)
  }

  const speechMarksString = document.speechMarks as string | null
  const speechMarks = (speechMarksString && speechMarksString.length > 2)
    ? JSON.parse(speechMarksString)
    : []

  const documentData = {
    id: document.id as string,
    title: document.title as string,
    cleanedText: document.cleanedText as string,
    audioUrl: document.audioUrl as string,
    fileUrl: document.fileUrl as string,
    fileType: document.fileType as string,
    uploadedAt: document.uploadedAt as string,
    speechMarks: speechMarks,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ReaderInterface document={documentData} userId={session.userId} />
    </div>
  )
}
