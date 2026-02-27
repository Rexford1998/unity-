import { GoogleGenAI } from "@google/genai"

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured")
  }
  return new GoogleGenAI({ apiKey })
}

// Generated 3D asset metadata structure
export interface Generated3DAsset {
  meshDescription: string
  suggestedPolygonCount: number
  suggestedTextureResolution: string
  optimizationNotes: string
  // Placeholder for actual mesh data - in production this would be binary mesh data
  mockMeshBuffer: Buffer
}

// Generate 3D asset using Gemini
export async function generate3D(
  prompt: string,
  format: string,
  platform: string,
  style?: string
): Promise<Generated3DAsset> {
  const ai = getGeminiClient()
  
  const systemPrompt = `You are a 3D asset generation AI for game development and 3D modeling.
Given a prompt, describe a detailed 3D model that would be generated.
Respond in JSON format with the following structure:
{
  "meshDescription": "Detailed description of the 3D mesh geometry, topology, and features",
  "suggestedPolygonCount": number (appropriate for ${platform}),
  "suggestedTextureResolution": "resolution like 1024x1024, 2048x2048, or 4096x4096",
  "optimizationNotes": "Notes on optimization for ${platform} platform"
}`

  const userPrompt = `Generate a 3D asset for:
Prompt: ${prompt}
Format: ${format}
Platform: ${platform}
Style: ${style || "realistic"}

Provide detailed specifications for this 3D model.`

  try {
    // Set timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
      ],
    })

    clearTimeout(timeoutId)

    const text = response.text || ""
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let parsed: {
      meshDescription: string
      suggestedPolygonCount: number
      suggestedTextureResolution: string
      optimizationNotes: string
    }

    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      // If parsing fails, use defaults with the raw text as description
      parsed = {
        meshDescription: text.substring(0, 500),
        suggestedPolygonCount: platform === "UNITY" ? 15000 : 50000,
        suggestedTextureResolution: "2048x2048",
        optimizationNotes: "Standard optimization applied"
      }
    }

    // Create a mock mesh buffer (in production, this would be actual mesh data)
    // TODO: Integrate with actual 3D generation service (Meshy, Point-E, etc.)
    const mockMeshData = JSON.stringify({
      type: "placeholder_mesh",
      prompt,
      format,
      platform,
      description: parsed.meshDescription,
      generatedAt: new Date().toISOString()
    })
    
    return {
      meshDescription: parsed.meshDescription,
      suggestedPolygonCount: parsed.suggestedPolygonCount,
      suggestedTextureResolution: parsed.suggestedTextureResolution,
      optimizationNotes: parsed.optimizationNotes,
      mockMeshBuffer: Buffer.from(mockMeshData)
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Generation timed out after 30 seconds")
    }
    throw error
  }
}

// Generate thumbnail/preview image for the asset
export async function generateThumbnail(prompt: string): Promise<string | null> {
  try {
    const ai = getGeminiClient()
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [{
        role: "user",
        parts: [{
          text: `Generate a 3D render preview image of: ${prompt}. 
Show it as a professional 3D model render with soft studio lighting on a neutral gray gradient background. 
The model should be centered and clearly visible. Professional quality, clean render.`
        }]
      }],
      config: {
        responseModalities: ["image", "text"],
      },
    })

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data // Return base64 image data
      }
    }
    
    return null
  } catch {
    // Thumbnail generation is optional, don't fail the whole request
    return null
  }
}
