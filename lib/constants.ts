// Application constants

export const APP_CONFIG = {
  name: "AI Audio Reader",
  version: "1.0.0",
  maxUsers: 5,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedFileTypes: [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/bmp",
    "image/webp",
  ],
  session: {
    maxAge: 60 * 60 * 24 * 7, // 1 week
    cookieName: "ai-audio-reader-session",
  },
  processing: {
    maxRetries: 3,
    timeoutMinutes: 10,
    pollIntervalSeconds: 5,
  },
}

export const DOCUMENT_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
} as const

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
  },
  DOCUMENTS: {
    LIST: "/api/documents",
    UPLOAD: "/api/documents/upload",
    PROCESS: "/api/documents/process",
    STATUS: "/api/documents/[id]/status",
    DELETE: "/api/documents/[id]/delete",
  },
  ADMIN: {
    STATS: "/api/admin/stats",
    USERS: "/api/admin/users",
    DOCUMENTS: "/api/admin/documents",
  },
} as const
