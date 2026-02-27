import { NextResponse } from "next/server"
import { getDb, getOrCreateUser, type Material } from "@/lib/db"
import { checkAndDeductCredits, refundCredits, InsufficientCreditsError } from "@/lib/credits"
import { generateThumbnail } from "@/lib/gemini"
import { saveMaterialTexture } from "@/lib/storage"

// GET /api/materials - List all materials for current user
export async function GET(request: Request) {
  try {
    const db = getDb()
    const user = await getOrCreateUser()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = db
      .from("materials")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search && search.trim().length > 0) {
      query = query.ilike("name", `%${search.trim()}%`)
    }

    const { data: materials, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch materials" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      materials: materials as Material[],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch materials"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST /api/materials - Generate a new PBR material
export async function POST(request: Request) {
  let materialId: string | null = null
  let userId: string | null = null
  const db = getDb()

  try {
    const body = await request.json()
    
    if (!body.name || !body.prompt) {
      return NextResponse.json(
        { error: "Name and prompt are required" },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser()
    userId = user.id

    // Check and deduct credits
    const { remainingCredits } = await checkAndDeductCredits(userId)

    // Create material record
    const { data: material, error: createError } = await db
      .from("materials")
      .insert({
        user_id: userId,
        name: body.name.trim(),
        prompt: body.prompt.trim(),
        status: "GENERATING"
      })
      .select()
      .single()

    if (createError || !material) {
      await refundCredits(userId)
      return NextResponse.json(
        { error: "Failed to create material record" },
        { status: 500 }
      )
    }

    materialId = material.id

    // Generate PBR textures using Gemini
    // TODO: Use specialized texture generation model
    const texturePrompts = {
      albedo: `${body.prompt} - diffuse albedo color texture, seamless tileable, PBR material`,
      normal: `${body.prompt} - normal map texture, seamless tileable, blue-purple tint, PBR material`,
      roughness: `${body.prompt} - roughness map texture, grayscale, seamless tileable, PBR material`,
      metallic: `${body.prompt} - metallic map texture, grayscale, seamless tileable, PBR material`
    }

    const textureUrls: Record<string, string | null> = {}

    for (const [type, prompt] of Object.entries(texturePrompts)) {
      const textureData = await generateThumbnail(prompt)
      if (textureData) {
        textureUrls[type] = await saveMaterialTexture(
          materialId,
          type as "albedo" | "normal" | "roughness" | "metallic",
          textureData
        )
      }
    }

    // Update material with completed status and URLs
    await db
      .from("materials")
      .update({
        status: "COMPLETED",
        albedo_url: textureUrls.albedo,
        normal_url: textureUrls.normal,
        roughness_url: textureUrls.roughness,
        metallic_url: textureUrls.metallic
      })
      .eq("id", materialId)

    return NextResponse.json({
      materialId,
      ...textureUrls,
      status: "COMPLETED",
      remainingCredits
    }, { status: 201 })

  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      )
    }

    if (materialId && userId) {
      await db
        .from("materials")
        .update({ status: "FAILED" })
        .eq("id", materialId)
      
      await refundCredits(userId)
    }

    const message = error instanceof Error ? error.message : "Generation failed"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
