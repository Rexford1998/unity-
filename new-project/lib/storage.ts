import { put } from "@vercel/blob"

// Save asset file to Vercel Blob storage
export async function saveAsset(
  assetId: string,
  buffer: Buffer,
  format: string
): Promise<string> {
  const extension = format.toLowerCase()
  const filename = `assets/${assetId}.${extension}`
  
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: getContentType(format),
  })
  
  return blob.url
}

// Save thumbnail image to Vercel Blob storage
export async function saveThumbnail(
  assetId: string,
  base64Data: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64")
  const filename = `thumbnails/${assetId}.png`
  
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
  })
  
  return blob.url
}

// Save material texture to Vercel Blob storage
export async function saveMaterialTexture(
  materialId: string,
  textureType: "albedo" | "normal" | "roughness" | "metallic",
  base64Data: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64")
  const filename = `materials/${materialId}/${textureType}.png`
  
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
  })
  
  return blob.url
}

// Get content type for 3D file formats
function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    GLB: "model/gltf-binary",
    GLTF: "model/gltf+json",
    FBX: "application/octet-stream",
    OBJ: "text/plain",
    STL: "application/sla",
  }
  return contentTypes[format.toUpperCase()] || "application/octet-stream"
}

// TODO: Add functions for:
// - Presigned upload URLs for large files
// - Direct upload from Blender/Unity plugins
// - Asset version management
