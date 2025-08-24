import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { deleteUser, getUserById } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdmin()

    const { userId } = params
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
