import { NextResponse } from "next/server"
import { getDb, getOrCreateUser, type Asset } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/assets/[id] - Get single asset by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = getDb()
    
    // Get authenticated user (mock for now)
    // TODO: Replace with real authentication
    const user = await getOrCreateUser()

    const { data: asset, error } = await db
      .from("assets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(asset as Asset)

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch asset"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// DELETE /api/assets/[id] - Delete an asset
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = getDb()
    
    // Get authenticated user
    const user = await getOrCreateUser()

    // Verify ownership and delete
    const { error } = await db
      .from("assets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete asset" },
        { status: 500 }
      )
    }

    // TODO: Also delete files from Vercel Blob storage

    return NextResponse.json({ success: true })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete asset"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
