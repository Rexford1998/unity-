import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt, style, format } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY not configured" },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    // Build the generation prompt for 3D asset visualization
    const visualizationPrompt = `Generate a photorealistic product visualization image of a 3D model: ${prompt}. 
Style: ${style || "realistic"}. 
The image should show the 3D model from a 3/4 view angle with studio lighting, soft shadows, and a neutral gray gradient background.
Make it look like a professional 3D render suitable for a game asset or product visualization.
High quality, detailed textures, proper materials.`

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [{ text: visualizationPrompt }]
        }
      ],
      config: {
        responseModalities: ["Text", "Image"]
      }
    })

    const images: { id: string; imageData: string; mediaType: string }[] = []

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push({
            id: "preview",
            imageData: part.inlineData.data,
            mediaType: part.inlineData.mimeType
          })
        }
      }
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error("[v0] Error in generate-images:", error)
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    )
  }
}
