// Script to clean up orphaned data in Redis
// Run this periodically to maintain database integrity

import { kv } from "@vercel/kv"

async function cleanupOrphanedData() {
  console.log("Starting cleanup of orphaned data...")

  try {
    // Get all user emails
    const userEmails = await kv.smembers("users")
    console.log(`Found ${userEmails.length} users`)

    // Check for orphaned documents
    let orphanedDocuments = 0
    let totalDocuments = 0

    for (const email of userEmails) {
      const userDocuments = await kv.smembers(`user:${email}:documents`)
      totalDocuments += userDocuments.length

      for (const docId of userDocuments) {
        const document = await kv.hgetall(`document:${docId}`)

        if (!document || Object.keys(document).length === 0) {
          // Remove orphaned document reference
          await kv.srem(`user:${email}:documents`, docId)
          orphanedDocuments++
          console.log(`Removed orphaned document reference: ${docId}`)
        }
      }
    }

    console.log(`✅ Cleanup completed!`)
    console.log(`Total documents: ${totalDocuments}`)
    console.log(`Orphaned references removed: ${orphanedDocuments}`)
  } catch (error) {
    console.error("❌ Error during cleanup:", error)
  }
}

cleanupOrphanedData()
