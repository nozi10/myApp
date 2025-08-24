import { Redis } from "@upstash/redis"
import { formatBytes } from "./utils"

// Database utility functions for Redis operations

let redis: Redis

function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return redis
}

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
    const userData = await getRedis().hgetall(`user:${email}`)
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
    // 1. Look up email from user ID using the index
    const email = await getRedis().get<string>(`user-id-to-email:${userId}`)

    if (!email) {
      return null // User not found
    }

    // 2. Fetch the user data using the email (which is efficient)
    return await getUserByEmail(email)
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  const redis = getRedis()
  const userEmails = await redis.smembers("users")

  if (userEmails.length === 0) {
    return []
  }

  const pipeline = redis.pipeline()
  userEmails.forEach((email) => {
    pipeline.hgetall(`user:${email}`)
  })
  const results = (await pipeline.exec<Record<string, unknown>[]>()) as User[]

  const users = results.filter((user) => user !== null && Object.keys(user).length > 0)

  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Document operations
export async function getDocumentById(documentId: string): Promise<Document | null> {
  try {
    const documentData = await getRedis().hgetall(`document:${documentId}`)
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
  const redis = getRedis()
  const documentIds = await redis.smembers(`user:${userId}:documents`)

  if (documentIds.length === 0) {
    return []
  }

  const pipeline = redis.pipeline()
  documentIds.forEach((docId) => {
    pipeline.hgetall(`document:${docId}`)
  })
  const results = (await pipeline.exec<Record<string, unknown>[]>()) as Document[]

  const documents = results.filter((doc) => doc !== null && Object.keys(doc).length > 0)

  return documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export async function getAllDocuments(): Promise<Document[]> {
  const redis = getRedis()
  const documentIds = await redis.smembers("documents")

  if (documentIds.length === 0) {
    return []
  }

  const pipeline = redis.pipeline()
  documentIds.forEach((docId) => {
    pipeline.hgetall(`document:${docId}`)
  })
  const results = (await pipeline.exec<Record<string, unknown>[]>()) as Document[]

  const documents = results.filter((doc) => doc !== null && Object.keys(doc).length > 0)

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

  await getRedis().hset(`document:${documentId}`, updateData)
}

export async function deleteDocument(documentId: string): Promise<void> {
  const document = await getDocumentById(documentId)
  if (!document) return

  // Remove from user's document set
  await getRedis().srem(`user:${document.userId}:documents`, documentId)

  // Remove from global documents set
  await getRedis().srem("documents", documentId)

  // Delete document data
  await getRedis().del(`document:${documentId}`)
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
  await getRedis().srem("users", user.email)

  // Delete user data
  await getRedis().del(`user:${user.email}`)
  await getRedis().del(`user:${userId}:documents`)
  await getRedis().del(`user-id-to-email:${userId}`)
}

// Statistics
export async function getSystemStats() {
  const users = await getAllUsers()
  const documents = await getAllDocuments()

  const processingDocuments = documents.filter((doc) => doc.status === "processing").length
  const totalStorageBytes = documents.reduce((total, doc) => total + Number(doc.fileSize || 0), 0)

  return {
    totalUsers: users.length,
    totalDocuments: documents.length,
    processingDocuments,
    totalStorage: formatBytes(totalStorageBytes),
  }
}
