import { Redis } from "@upstash/redis"

// Database utility functions for Redis operations

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface User {
  id: string
  email: string
  password: string
  isAdmin: boolean
  createdAt: string
}

export interface Document {
  id: string
  userId: string
  title: string
  originalFilename: string
  fileType: string
  fileSize: number
  fileUrl: string
  status: "uploaded" | "processing" | "ready" | "error"
  uploadedAt: string
  processingStartedAt?: string
  extractedText?: string
  extractedAt?: string
  cleanedText?: string
  cleanedAt?: string
  audioUrl?: string
  processedAt?: string
  error?: string
  errorAt?: string
}

// User operations
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const userData = await redis.hgetall(`user:${email}`)
    if (!userData || Object.keys(userData).length === 0) {
      return null
    }

    return {
      id: userData.id as string,
      email,
      password: userData.password as string,
      isAdmin: userData.isAdmin === "true",
      createdAt: userData.createdAt as string,
    }
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    // Find user by scanning all user keys (not efficient for large scale, but works for small user base)
    const userEmails = await redis.smembers("users")

    for (const email of userEmails) {
      const userData = await redis.hgetall(`user:${email}`)
      if (userData.id === userId) {
        return {
          id: userId,
          email,
          password: userData.password as string,
          isAdmin: userData.isAdmin === "true",
          createdAt: userData.createdAt as string,
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  const userEmails = await redis.smembers("users")
  const users: User[] = []

  for (const email of userEmails) {
    const user = await getUserByEmail(email)
    if (user) {
      users.push(user)
    }
  }

  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Document operations
export async function getDocumentById(documentId: string): Promise<Document | null> {
  try {
    const documentData = await redis.hgetall(`document:${documentId}`)
    if (!documentData || Object.keys(documentData).length === 0) {
      return null
    }

    return {
      id: documentData.id as string,
      userId: documentData.userId as string,
      title: documentData.title as string,
      originalFilename: documentData.originalFilename as string,
      fileType: documentData.fileType as string,
      fileSize: Number.parseInt(documentData.fileSize as string, 10),
      fileUrl: documentData.fileUrl as string,
      status: documentData.status as Document["status"],
      uploadedAt: documentData.uploadedAt as string,
      processingStartedAt: documentData.processingStartedAt as string,
      extractedText: documentData.extractedText as string,
      extractedAt: documentData.extractedAt as string,
      cleanedText: documentData.cleanedText as string,
      cleanedAt: documentData.cleanedAt as string,
      audioUrl: documentData.audioUrl as string,
      processedAt: documentData.processedAt as string,
      error: documentData.error as string,
      errorAt: documentData.errorAt as string,
    }
  } catch (error) {
    console.error("Error fetching document by ID:", error)
    return null
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  const documentIds = await redis.smembers(`user:${userId}:documents`)
  const documents: Document[] = []

  for (const documentId of documentIds) {
    const document = await getDocumentById(documentId)
    if (document) {
      documents.push(document)
    }
  }

  return documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export async function getAllDocuments(): Promise<Document[]> {
  const userEmails = await redis.smembers("users")
  const documents: Document[] = []

  for (const email of userEmails) {
    const userDocuments = await redis.smembers(`user:${email}:documents`)

    for (const docId of userDocuments) {
      const document = await getDocumentById(docId)
      if (document) {
        documents.push(document)
      }
    }
  }

  return documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export async function updateDocumentStatus(
  documentId: string,
  status: Document["status"],
  additionalData?: Partial<Document>,
): Promise<void> {
  const updateData: Record<string, string> = {
    status,
    ...Object.fromEntries(Object.entries(additionalData || {}).map(([key, value]) => [key, String(value)])),
  }

  await redis.hset(`document:${documentId}`, updateData)
}

export async function deleteDocument(documentId: string): Promise<void> {
  const document = await getDocumentById(documentId)
  if (!document) return

  // Remove from user's document set
  await redis.srem(`user:${document.userId}:documents`, documentId)

  // Delete document data
  await redis.del(`document:${documentId}`)
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await getUserById(userId)
  if (!user) return

  // Delete all user's documents
  const userDocuments = await getUserDocuments(userId)
  for (const document of userDocuments) {
    await deleteDocument(document.id)
  }

  // Remove user from users set
  await redis.srem("users", user.email)

  // Delete user data
  await redis.del(`user:${user.email}`)
  await redis.del(`user:${userId}:documents`)
}

// Statistics
export async function getSystemStats() {
  const users = await getAllUsers()
  const documents = await getAllDocuments()

  const processingDocuments = documents.filter((doc) => doc.status === "processing").length
  const totalStorageBytes = documents.reduce((total, doc) => total + doc.fileSize, 0)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return {
    totalUsers: users.length,
    totalDocuments: documents.length,
    processingDocuments,
    totalStorage: formatBytes(totalStorageBytes),
  }
}
