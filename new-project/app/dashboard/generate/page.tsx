"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { 
  Sparkles, 
  Box, 
  Download, 
  RefreshCw,
  Loader2,
  Maximize2,
  AlertCircle,
  FileDown,
  Play
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GeneratedAsset {
  id: string
  name: string
  previewUrl: string | null
  modelUrl: string | null
  format: string
  polygonCount: number
  fileSize: number
  animated?: boolean
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [platform, setPlatform] = useState("both")
  const [format, setFormat] = useState("glb")
  const [resolution, setResolution] = useState([512])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (animated: boolean = false) => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setError(null)
    setGeneratedAsset(null)
    setPreviewImage(null)
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          platform,
          format,
          resolution: resolution[0].toString(),
          animated,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Generation failed")
      }
      
      if (data.asset) {
        const asset: GeneratedAsset = {
          id: data.asset.id,
          name: data.asset.name,
          previewUrl: data.asset.preview_url,
          modelUrl: data.asset.model_url,
          format: data.asset.format || "glb",
          polygonCount: data.asset.polygon_count || 0,
          fileSize: data.asset.file_size || 0,
          animated: data.asset.animated || false,
        }
        setGeneratedAsset(asset)
        if (asset.previewUrl) {
          setPreviewImage(asset.previewUrl)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate asset")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFile = (filename: string) => {
    if (!generatedAsset?.modelUrl) return
    
    // Convert data URL to blob for reliable download
    const dataUrl = generatedAsset.modelUrl
    
    // Extract base64 data from data URL
    const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!base64Match) {
      // Fallback for regular URLs
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }
    
    const mimeType = base64Match[1]
    const base64Data = base64Match[2]
    
    // Convert base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Create blob and download
    const blob = new Blob([bytes], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
  }

  const handleDownload = () => {
    const filename = `${generatedAsset?.name.replace(/\s+/g, '_') || 'asset'}.${generatedAsset?.format || 'glb'}`
    downloadFile(filename)
  }

  const handleDownloadForUnity = () => {
    // Unity imports GLB files directly - no conversion needed
    // The GLB format is fully compatible with Unity 2019.1+
    const filename = `${generatedAsset?.name.replace(/\s+/g, '_') || 'asset'}_Unity.glb`
    downloadFile(filename)
  }

  const handleDownloadForBlender = () => {
    // Blender has native GLB/GLTF support via File > Import > glTF 2.0
    const filename = `${generatedAsset?.name.replace(/\s+/g, '_') || 'asset'}_Blender.glb`
    downloadFile(filename)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const hasGenerated = generatedAsset !== null

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Generate 3D Asset</h1>
        <p className="text-muted-foreground">Describe what you want to create and our AI will generate it.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left: Prompt Input Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the 3D model you want to generate... e.g., 'A medieval sword with ornate golden handle and glowing blue runes'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="stylized">Stylized</SelectItem>
                  <SelectItem value="lowpoly">Low Poly</SelectItem>
                  <SelectItem value="gameready">Game Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Platform */}
            <div className="space-y-2">
              <Label>Target Platform</Label>
              <ToggleGroup type="single" value={platform} onValueChange={(v) => v && setPlatform(v)} className="justify-start">
                <ToggleGroupItem value="blender" className="px-4">
                  Blender
                </ToggleGroupItem>
                <ToggleGroupItem value="unity" className="px-4">
                  Unity
                </ToggleGroupItem>
                <ToggleGroupItem value="both" className="px-4">
                  Both
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glb">GLB (Recommended)</SelectItem>
                  <SelectItem value="gltf">GLTF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Texture Resolution</Label>
                <span className="text-sm text-muted-foreground">{resolution[0]}px</span>
              </div>
              <Slider
                value={resolution}
                onValueChange={setResolution}
                min={256}
                max={2048}
                step={256}
              />
            </div>

            {/* Generate Buttons */}
            <div className="mt-auto pt-4 space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Asset
                  </>
                )}
              </Button>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={() => handleGenerate(true)}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Generate Animation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Preview</CardTitle>
            {hasGenerated && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleGenerate(generatedAsset?.animated || false)} disabled={isGenerating}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {/* 3D Viewer */}
            <div className="flex-1 relative rounded-xl bg-muted/50 border border-border overflow-hidden min-h-[300px]">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Box className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Generating your asset...</p>
                    <p className="text-sm text-muted-foreground">Building 3D scene with Three.js</p>
                  </div>
                </div>
              ) : previewImage ? (
                <div className="absolute inset-0">
                  <img 
                    src={previewImage} 
                    alt="Generated asset preview" 
                    className="w-full h-full object-contain"
                  />
                  <Button variant="ghost" size="sm" className="absolute bottom-2 right-2">
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              ) : hasGenerated ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Box className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">3D Model Ready</p>
                  <p className="text-xs text-muted-foreground mt-1">Download to view in Blender/Unity</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Box className="w-16 h-16 mb-4 opacity-30" />
                  <p>Enter a prompt and generate to preview</p>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            {hasGenerated && generatedAsset?.modelUrl && (
              <div className="space-y-3">
                <Label className="text-sm">Download Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleDownloadForUnity} className="w-full">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download for Unity
                  </Button>
                  <Button onClick={handleDownloadForBlender} variant="outline" className="w-full">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download for Blender
                  </Button>
                </div>
                <Button onClick={handleDownload} variant="secondary" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download .{generatedAsset.format.toUpperCase()}
                </Button>
              </div>
            )}

            {/* Asset Info */}
            {hasGenerated && generatedAsset && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{generatedAsset.polygonCount.toLocaleString()} polygons</Badge>
                <Badge variant="secondary">{resolution[0]}px textures</Badge>
                <Badge variant="secondary">{generatedAsset.format.toUpperCase()}</Badge>
                <Badge variant="secondary">{formatFileSize(generatedAsset.fileSize)}</Badge>
                <Badge variant="secondary">{style}</Badge>
                {generatedAsset.animated && (
                  <Badge variant="default" className="bg-green-600">Animated</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
