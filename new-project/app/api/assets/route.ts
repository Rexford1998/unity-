import { NextResponse } from "next/server"
import { getDb, getOrCreateUser, type Asset } from "@/lib/db"

// GET /api/assets - List all assets for current user
export async function GET(request: Request) {
  try {
    const db = getDb()
    
    // Get authenticated user (mock for now)
    // TODO: Replace with real authentication
    const user = await getOrCreateUser()

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const format = searchParams.get("format")
    const platform = searchParams.get("platform")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = db
      .from("assets")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && ["GENERATING", "COMPLETED", "FAILED"].includes(status)) {
      query = query.eq("status", status)
    }
    
    if (format && ["GLB", "FBX", "OBJ"].includes(format)) {
      query = query.eq("format", format)
    }
    
    if (platform && ["BLENDER", "UNITY", "BOTH"].includes(platform)) {
      query = query.eq("platform", platform)
    }
    
    if (search && search.trim().length > 0) {
      query = query.ilike("prompt", `%${search.trim()}%`)
    }

    const { data: assets, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch assets" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assets: assets as Asset[],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch assets"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
