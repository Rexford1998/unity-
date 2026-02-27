import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/db"
import { getCredits } from "@/lib/credits"

// GET /api/user - Get current user info
export async function GET() {
  try {
    // Get authenticated user (mock for now)
    // TODO: Replace with real authentication
    const user = await getOrCreateUser()
    const credits = await getCredits(user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      credits,
      createdAt: user.created_at
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
