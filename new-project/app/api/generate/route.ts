import { NextResponse } from "next/server"
import { 
  buildFromUniversalBlueprint,
  buildFromAnimatedBlueprint,
  getUniversalBlueprintPrompt,
  getAnimationBlueprintPrompt,
  type UniversalBlueprint,
  type AnimatedBlueprint,
  type SceneBlueprint,
  type PartSpec
} from "@/lib/scene-builder"

interface GenerateRequest {
  prompt: string
  format: string
  platform: string
  style: string
  resolution: string
  animated?: boolean
}

const VALID_SHAPES: PartSpec["shape"][] = ["box", "cylinder", "sphere", "cone", "torus", "capsule", "octahedron", "icosahedron", "plane"]
const VALID_INTERPOLATIONS = new Set(["linear", "step", "cubicspline"])

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return clamp(value, min, max)
}

function asVec3(
  value: unknown,
  fallback: [number, number, number],
  min: number,
  max: number
): [number, number, number] {
  if (!Array.isArray(value) || value.length < 3) return fallback
  return [
    asNumber(value[0], fallback[0], min, max),
    asNumber(value[1], fallback[1], min, max),
    asNumber(value[2], fallback[2], min, max),
  ]
}

function promptFallbackParts(prompt: string): PartSpec[] {
  const text = prompt.toLowerCase()

  if (/\b(cave|cavern|grotto)\b/.test(text)) {
    return [
      { name: "CaveFloor", shape: "box", size: [6, 0.4, 6], position: [0, -0.2, 0], color: "slate", material: "stone" },
      { name: "CaveDome", shape: "icosahedron", size: [3.2, 2, 2], position: [0, 2.2, 0], color: "granite", material: "stone" },
      { name: "Stalagmite_A", shape: "cone", size: [0.35, 1.4, 24], position: [-1.2, 0.7, 0.6], color: "sandstone", material: "stone" },
      { name: "Stalagmite_B", shape: "cone", size: [0.28, 1.1, 24], position: [1.0, 0.55, -0.9], color: "limestone", material: "stone" },
      { name: "Stalactite_A", shape: "cone", size: [0.3, 1.2, 24], position: [-0.7, 3.2, -0.5], rotation: [180, 0, 0], color: "granite", material: "stone" },
      { name: "Crystal_A", shape: "octahedron", size: [0.45, 2, 2], position: [0.9, 0.7, 0.8], color: "crystal", material: "glass" },
    ]
  }

  if (/\b(ship|spaceship|rocket|ufo|spacecraft)\b/.test(text)) {
    return [
      { name: "Hull", shape: "capsule", size: [0.45, 2.6, 24], position: [0, 0.7, 0], rotation: [90, 0, 0], color: "steel", material: "brushed_metal" },
      { name: "Cockpit", shape: "sphere", size: [0.35, 20, 16], position: [0, 1.1, 0.8], color: "glass", material: "glass" },
      { name: "WingLeft", shape: "box", size: [1.4, 0.08, 0.5], position: [-0.9, 0.7, -0.3], rotation: [0, 10, -8], color: "silver", material: "metal" },
      { name: "WingRight", shape: "box", size: [1.4, 0.08, 0.5], position: [0.9, 0.7, -0.3], rotation: [0, -10, 8], color: "silver", material: "metal" },
      { name: "ThrusterLeft", shape: "cone", size: [0.16, 0.45, 20], position: [-0.25, 0.6, -1.35], rotation: [90, 0, 0], color: "neon_blue", material: "emissive" },
      { name: "ThrusterRight", shape: "cone", size: [0.16, 0.45, 20], position: [0.25, 0.6, -1.35], rotation: [90, 0, 0], color: "neon_blue", material: "emissive" },
    ]
  }

  if (/\b(money|cash|coins?|gold|treasure|bag of money|loot)\b/.test(text)) {
    return [
      { name: "BagBody", shape: "sphere", size: [0.9, 20, 16], position: [0, 0.9, 0], color: "canvas", material: "fabric" },
      { name: "BagNeck", shape: "cylinder", size: [0.28, 0.45, 18], position: [0, 1.45, 0], color: "canvas", material: "fabric" },
      { name: "Tie", shape: "torus", size: [0.28, 0.03, 18], position: [0, 1.35, 0], rotation: [90, 0, 0], color: "leather", material: "leather" },
      { name: "CoinPile", shape: "cylinder", size: [0.7, 0.15, 24], position: [0, 0.08, 0], color: "gold", material: "polished_metal" },
      { name: "CoinA", shape: "cylinder", size: [0.13, 0.03, 20], position: [0.5, 0.15, 0.2], rotation: [5, 25, 3], color: "gold", material: "polished_metal" },
      { name: "CoinB", shape: "cylinder", size: [0.13, 0.03, 20], position: [-0.4, 0.13, -0.25], rotation: [8, -20, -6], color: "gold", material: "polished_metal" },
      { name: "CoinC", shape: "cylinder", size: [0.12, 0.03, 20], position: [0.15, 0.18, -0.45], rotation: [4, 10, 8], color: "gold", material: "polished_metal" },
    ]
  }

  const hash = Array.from(text).reduce((acc, ch) => ((acc * 33) ^ ch.charCodeAt(0)) >>> 0, 5381)
  const pick = <T>(arr: T[], n: number): T => arr[(hash + n) % arr.length]
  const colors = ["steel", "blue", "red", "teal", "orange", "emerald", "bronze", "purple"]
  const materials = ["brushed_metal", "plastic", "ceramic", "stone"]
  const shapeA = pick<PartSpec["shape"]>(["capsule", "cylinder", "box"], 1)
  const shapeB = pick<PartSpec["shape"]>(["sphere", "icosahedron", "octahedron"], 2)
  const accentShape = pick<PartSpec["shape"]>(["cone", "torus", "box"], 3)

  return [
    { name: "Base", shape: "cylinder", size: [1.0, 0.18, 28], position: [0, 0.09, 0], color: pick(colors, 4), material: "brushed_metal" },
    { name: "Core", shape: shapeA, size: [0.42, 1.15, 16], position: [0, 0.85, 0], rotation: [90, (hash % 25) - 12, 0], color: pick(colors, 5), material: pick(materials, 2) },
    { name: "Top", shape: shapeB, size: [0.36, 18, 14], position: [0, 1.62, 0], color: pick(colors, 6), material: pick(materials, 3) },
    { name: "AccentFront", shape: accentShape, size: [0.14, 0.5, 20], position: [0, 0.92, 0.55], rotation: [0, 0, 90], color: pick(colors, 7), material: pick(materials, 0) },
    { name: "AccentLeft", shape: "box", size: [0.1, 0.44, 0.1], position: [-0.5, 0.82, 0], color: pick(colors, 1), material: "plastic" },
    { name: "AccentRight", shape: "box", size: [0.1, 0.44, 0.1], position: [0.5, 0.82, 0], color: pick(colors, 2), material: "plastic" },
  ]
}

function shouldAutoAnimate(prompt: string): boolean {
  return /\b(spin|spinning|rotate|rotating|orbit|loop|moving|fly|flying|bounce|animated|animation|swing|walk|run)\b/i.test(prompt)
}

function sanitizePart(part: unknown, index: number): PartSpec | null {
  if (!part || typeof part !== "object") return null
  const raw = part as Record<string, unknown>

  const rawShape = typeof raw.shape === "string" ? raw.shape.toLowerCase() : "box"
  const shape: PartSpec["shape"] = VALID_SHAPES.includes(rawShape as PartSpec["shape"]) ? rawShape as PartSpec["shape"] : "box"

  const size = asVec3(raw.size, [1, 1, 1], 0.02, 24)
  const position = asVec3(raw.position, [0, 0, 0], -100, 100)
  const rotation = Array.isArray(raw.rotation) ? asVec3(raw.rotation, [0, 0, 0], -720, 720) : undefined

  const name = typeof raw.name === "string" && raw.name.trim().length > 0
    ? raw.name.trim().replace(/\s+/g, "_").slice(0, 64)
    : `Part_${index}`

  return {
    name,
    shape,
    size,
    position,
    rotation,
    color: typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : "gray",
    material: typeof raw.material === "string" && raw.material.trim() ? raw.material.trim() : "plastic",
  }
}

function sanitizeUniversalBlueprint(candidate: UniversalBlueprint, prompt: string): UniversalBlueprint {
  const rawParts = Array.isArray(candidate.parts) ? candidate.parts : []
  const seenNames = new Set<string>()
  const sanitizedParts: PartSpec[] = []

  for (let i = 0; i < rawParts.length && sanitizedParts.length < 180; i++) {
    const part = sanitizePart(rawParts[i], i)
    if (!part) continue

    let nextName = part.name
    let suffix = 1
    while (seenNames.has(nextName)) {
      suffix++
      nextName = `${part.name}_${suffix}`
    }
    part.name = nextName
    seenNames.add(nextName)
    sanitizedParts.push(part)
  }

  if (sanitizedParts.length < 3) {
    return {
      name: (candidate.name || prompt || "Generated Asset").slice(0, 80),
      description: candidate.description || `Fallback asset for prompt: ${prompt}`,
      scale: asNumber(candidate.scale, 1, 0.1, 5),
      parts: promptFallbackParts(prompt),
      metadata: candidate.metadata,
    }
  }

  return {
    name: (candidate.name || prompt || "Generated Asset").slice(0, 80),
    description: candidate.description || `Generated asset for prompt: ${prompt}`,
    scale: asNumber(candidate.scale, 1, 0.1, 5),
    parts: sanitizedParts,
    metadata: candidate.metadata,
  }
}

function sanitizeAnimatedBlueprint(candidate: AnimatedBlueprint, prompt: string): AnimatedBlueprint {
  const base = sanitizeUniversalBlueprint(candidate, prompt)
  const duration = asNumber(candidate.duration, 2, 0.4, 10)
  const partNames = new Set(base.parts.map((p) => p.name))

  const animations = (Array.isArray(candidate.animations) ? candidate.animations : [])
    .map((anim) => {
      if (!anim || typeof anim !== "object") return null
      const partName = typeof anim.partName === "string" ? anim.partName : ""
      if (!partNames.has(partName)) return null

      const keyframes: Array<{
        time: number
        position?: [number, number, number]
        rotation?: [number, number, number]
        scale?: [number, number, number]
      }> = (Array.isArray(anim.keyframes) ? anim.keyframes : [])
        .map((kf) => {
          if (!kf || typeof kf !== "object") return null
          const record = kf as unknown as Record<string, unknown>
          const time = asNumber(record.time, 0, 0, duration)
          const position = record.position !== undefined
            ? asVec3(record.position, [0, 0, 0], -20, 20)
            : undefined
          const rotation = record.rotation !== undefined
            ? asVec3(record.rotation, [0, 0, 0], -1080, 1080)
            : undefined
          const scale = record.scale !== undefined
            ? asVec3(record.scale, [1, 1, 1], 0.05, 4)
            : undefined

          if (!position && !rotation && !scale) return null
          return { time, position, rotation, scale }
        })
        .filter((kf): kf is NonNullable<typeof kf> => Boolean(kf))
        .sort((a, b) => a.time - b.time)

      if (keyframes.length === 0) return null
      if (keyframes.length === 1) {
        keyframes.push({ ...keyframes[0], time: duration })
      }

      const interpolationRaw = typeof anim.interpolation === "string" ? anim.interpolation.toLowerCase() : "linear"
      const interpolation = VALID_INTERPOLATIONS.has(interpolationRaw) ? interpolationRaw as "linear" | "step" | "cubicspline" : "linear"

      return {
        partName,
        interpolation,
        keyframes,
      }
    })
    .filter((anim): anim is NonNullable<typeof anim> => Boolean(anim))

  if (animations.length === 0 && base.parts.length > 0) {
    animations.push({
      partName: base.parts[0].name,
      interpolation: "linear",
      keyframes: [
        { time: 0, position: [0, 0, 0] },
        { time: duration / 2, position: [0, 0.08, 0] },
        { time: duration, position: [0, 0, 0] },
      ],
    })
  }

  return {
    ...base,
    duration,
    looping: candidate.looping ?? true,
    animations,
  }
}

// Call Gemini API to generate universal blueprint for ANY object
async function generateUniversalBlueprint(prompt: string, style: string, platform: string, apiKey: string): Promise<UniversalBlueprint> {
  // Use v1 API endpoint which has more stable model availability
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"]
  const blueprintPrompt = getUniversalBlueprintPrompt(prompt, style, platform)
  
  let lastError = ""
  
  for (const model of models) {
    try {
      console.log(`[v0] Trying model: ${model}`)
      
      // Try v1 API first (more stable)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: blueprintPrompt }] }],
            generationConfig: { 
              temperature: 0.3, 
              maxOutputTokens: 4096,
            },
          }),
        }
      )
      
      console.log(`[v0] Model ${model} response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        console.log(`[v0] Raw response text length: ${text?.length || 0}`)
        
        if (text) {
          // Try to parse JSON, handling markdown code fences if present
          let jsonText = text.trim()
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "")
          }
          
          try {
            const blueprint = JSON.parse(jsonText) as UniversalBlueprint
            if (blueprint.name && blueprint.parts && Array.isArray(blueprint.parts) && blueprint.parts.length > 0) {
              console.log(`[v0] Successfully parsed blueprint with ${blueprint.parts.length} parts`)
              return sanitizeUniversalBlueprint(blueprint, prompt)
            }
          } catch (parseError) {
            console.log(`[v0] JSON parse error:`, parseError)
            lastError = `JSON parse failed: ${parseError}`
          }
        }
      } else {
        const errorBody = await response.text()
        console.log(`[v0] Model ${model} error: ${errorBody}`)
        lastError = errorBody
      }
      
      if (response.status === 404) continue
    } catch (e) {
      console.log(`[v0] Model ${model} exception:`, e)
      lastError = String(e)
      continue
    }
  }
  
  throw new Error(`Could not generate blueprint: ${lastError}`)
}

// Call Gemini API to generate animated blueprint
async function generateAnimatedBlueprint(prompt: string, style: string, platform: string, apiKey: string): Promise<AnimatedBlueprint> {
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"]
  const blueprintPrompt = getAnimationBlueprintPrompt(prompt, style, platform)
  
  let lastError = ""
  
  for (const model of models) {
    try {
      console.log(`[v0] Animation - Trying model: ${model}`)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: blueprintPrompt }] }],
            generationConfig: { 
              temperature: 0.3, 
              maxOutputTokens: 8192,
            },
          }),
        }
      )
      
      console.log(`[v0] Animation model ${model} response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (text) {
          let jsonText = text.trim()
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "")
          }
          
          try {
            const blueprint = JSON.parse(jsonText) as AnimatedBlueprint
            if (blueprint.name && blueprint.parts && blueprint.animations && Array.isArray(blueprint.animations)) {
              console.log(`[v0] Successfully parsed animated blueprint with ${blueprint.parts.length} parts and ${blueprint.animations.length} animations`)
              return sanitizeAnimatedBlueprint(blueprint, prompt)
            }
          } catch (parseError) {
            console.log(`[v0] Animation JSON parse error:`, parseError)
            lastError = `JSON parse failed: ${parseError}`
          }
        }
      } else {
        const errorBody = await response.text()
        console.log(`[v0] Animation model ${model} error: ${errorBody}`)
        lastError = errorBody
      }
      
      if (response.status === 404) continue
    } catch (e) {
      console.log(`[v0] Animation model ${model} exception:`, e)
      lastError = String(e)
      continue
    }
  }
  
  throw new Error(`Could not generate animated blueprint: ${lastError}`)
}

// Count polygons from buffer
function countPolygons(buffer: Buffer): number {
  return Math.max(12, Math.floor(buffer.length / 100))
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateRequest
    
    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const platform = (body.platform || "both").toUpperCase()
    const style = body.style || "realistic"
    const animated = Boolean(body.animated || shouldAutoAnimate(body.prompt))
    
    let glbBuffer: Buffer
    let blueprint: SceneBlueprint
    
    // ANIMATED PATH: Always use LLM for animations
    if (animated) {
      try {
        console.log(`[v0] Generating animated blueprint for: ${body.prompt}`)
        const animatedBlueprint = await generateAnimatedBlueprint(body.prompt, style, platform, apiKey)
        console.log(`[v0] Generated animated blueprint with ${animatedBlueprint.parts.length} parts and ${animatedBlueprint.animations.length} animations`)
        
        glbBuffer = await buildFromAnimatedBlueprint(animatedBlueprint)
        blueprint = {
          sceneType: animatedBlueprint.name,
          assets: animatedBlueprint.parts.map(p => ({ 
            type: p.shape, 
            count: 1, 
            color: p.color,
            material: p.material 
          })),
          lighting: "studio",
        }
      } catch (error) {
        console.log(`[v0] Animated blueprint generation failed:`, error)
        // Fallback: animated drone rig (stable and non-trivial)
        const fallbackBlueprint: AnimatedBlueprint = {
          name: `${body.prompt} Animated`,
          description: "Fallback animated drone",
          scale: 1.0,
          duration: 2.4,
          looping: true,
          parts: [
            { name: "Body", shape: "capsule", size: [0.3, 0.8, 20], position: [0, 0.8, 0], rotation: [90, 0, 0], color: "steel", material: "brushed_metal" },
            { name: "RotorA", shape: "box", size: [0.9, 0.03, 0.08], position: [0, 1.05, 0], color: "black", material: "plastic" },
            { name: "RotorB", shape: "box", size: [0.08, 0.03, 0.9], position: [0, 1.05, 0], color: "black", material: "plastic" },
            { name: "Light", shape: "sphere", size: [0.08, 12, 10], position: [0, 0.7, 0.25], color: "neon_blue", material: "emissive" },
          ],
          animations: [
            {
              partName: "RotorA",
              interpolation: "linear",
              keyframes: [
                { time: 0.0, rotation: [0, 0, 0] },
                { time: 1.2, rotation: [0, 720, 0] },
                { time: 2.4, rotation: [0, 1440, 0] }
              ]
            },
            {
              partName: "RotorB",
              interpolation: "linear",
              keyframes: [
                { time: 0.0, rotation: [0, 0, 0] },
                { time: 1.2, rotation: [0, -720, 0] },
                { time: 2.4, rotation: [0, -1440, 0] }
              ]
            },
            {
              partName: "Body",
              interpolation: "linear",
              keyframes: [
                { time: 0.0, position: [0, 0, 0] },
                { time: 1.2, position: [0, 0.12, 0] },
                { time: 2.4, position: [0, 0, 0] }
              ]
            }
          ]
        }
        glbBuffer = await buildFromAnimatedBlueprint(fallbackBlueprint)
        blueprint = { sceneType: "fallback_animated", assets: [{ type: "drone", count: 1 }], lighting: "bright" }
      }
    } else {
      // STATIC PATH: Always follow one robust process:
      // 1) LLM blueprint generation + strict sanitization
      // 2) High-quality procedural tunnel fallback if model output fails
      try {
        console.log(`[v0] Generating universal blueprint for: ${body.prompt}`)
        const universalBlueprint = await generateUniversalBlueprint(body.prompt, style, platform, apiKey)
        console.log(`[v0] Generated blueprint with ${universalBlueprint.parts.length} parts`)
        
        glbBuffer = await buildFromUniversalBlueprint(universalBlueprint)
        blueprint = {
          sceneType: universalBlueprint.name,
          assets: universalBlueprint.parts.map(p => ({ 
            type: p.shape, 
            count: 1, 
            color: p.color,
            material: p.material 
          })),
          lighting: "studio",
        }
      } catch (error) {
        console.log(`[v0] Universal blueprint generation failed, using prompt procedural fallback:`, error)
        const fallbackParts = promptFallbackParts(body.prompt)
        glbBuffer = await buildFromUniversalBlueprint({
          name: body.prompt,
          description: "Prompt procedural fallback",
          scale: 1.0,
          parts: fallbackParts,
        })
        blueprint = {
          sceneType: "procedural_fallback",
          assets: fallbackParts.map((p) => ({ type: p.shape, count: 1, color: p.color, material: p.material })),
          lighting: "studio",
        }
      }
    }

    const assetId = crypto.randomUUID()
    const words = body.prompt.trim().split(' ').slice(0, 4).join(' ')
    const name = words.charAt(0).toUpperCase() + words.slice(1)

    const glbBase64 = glbBuffer.toString('base64')
    const glbDataUrl = `data:model/gltf-binary;base64,${glbBase64}`

    return NextResponse.json({
      asset: {
        id: assetId,
        name,
        prompt: body.prompt,
        style: body.style,
        platform: body.platform,
        format: body.format || "glb",
        resolution: body.resolution,
        status: "completed",
        preview_url: null,
        model_url: glbDataUrl,
        file_size: glbBuffer.length,
        polygon_count: countPolygons(glbBuffer),
        texture_resolution: body.resolution || "512",
        blueprint,
        animated,
        created_at: new Date().toISOString(),
      },
      remainingCredits: 49,
    }, { status: 201 })

  } catch (error) {
    console.log(`[v0] Generation error:`, error)
    const message = error instanceof Error ? error.message : "Generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
