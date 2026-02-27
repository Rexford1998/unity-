"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Box, 
  Download, 
  Trash2,
  Eye,
  MoreVertical,
  Plus,
  Filter
} from "lucide-react"

// Mock assets data
const mockAssets = [
  {
    id: 1,
    name: "Medieval Sword",
    format: "GLB",
    createdAt: "2026-02-24",
    polygons: 12450,
    textureRes: 1024,
    prompt: "A medieval sword with ornate golden handle and glowing blue runes",
    thumbnail: null,
  },
  {
    id: 2,
    name: "Sci-Fi Helmet",
    format: "FBX",
    createdAt: "2026-02-23",
    polygons: 24800,
    textureRes: 2048,
    prompt: "A futuristic space helmet with holographic visor and breathing apparatus",
    thumbnail: null,
  },
  {
    id: 3,
    name: "Treasure Chest",
    format: "OBJ",
    createdAt: "2026-02-22",
    polygons: 8200,
    textureRes: 512,
    prompt: "An old wooden treasure chest with gold trim and rusty iron lock",
    thumbnail: null,
  },
  {
    id: 4,
    name: "Magic Potion Bottle",
    format: "GLB",
    createdAt: "2026-02-21",
    polygons: 3200,
    textureRes: 512,
    prompt: "A glass potion bottle with glowing purple liquid and cork stopper",
    thumbnail: null,
  },
  {
    id: 5,
    name: "Dragon Statue",
    format: "FBX",
    createdAt: "2026-02-20",
    polygons: 45600,
    textureRes: 2048,
    prompt: "An intricate stone dragon statue with detailed scales and fierce expression",
    thumbnail: null,
  },
  {
    id: 6,
    name: "Wooden Crate",
    format: "GLB",
    createdAt: "2026-02-19",
    polygons: 1200,
    textureRes: 256,
    prompt: "A simple wooden shipping crate with metal reinforcements",
    thumbnail: null,
  },
]

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [formatFilter, setFormatFilter] = useState("all")
  const [selectedAsset, setSelectedAsset] = useState<typeof mockAssets[0] | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFormat = formatFilter === "all" || asset.format === formatFilter
    return matchesSearch && matchesFormat
  })

  const handlePreview = (asset: typeof mockAssets[0]) => {
    setSelectedAsset(asset)
    setIsPreviewOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">Manage your generated 3D models</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Generate New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="GLB">GLB</SelectItem>
            <SelectItem value="FBX">FBX</SelectItem>
            <SelectItem value="OBJ">OBJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                  <Box className="w-16 h-16 text-muted-foreground/50" />
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handlePreview(asset)}>
                      <Eye className="mr-1 h-4 w-4" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Download className="mr-1 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.createdAt}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(asset)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">{asset.format}</Badge>
                    <span className="text-xs text-muted-foreground">{asset.polygons.toLocaleString()} polys</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Box className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">No assets found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || formatFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Generate your first 3D asset to get started"}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Asset
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Asset Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 3D Preview */}
            <div className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center">
              <Box className="w-24 h-24 text-muted-foreground/50" />
            </div>
            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Prompt Used</h4>
                <p className="text-sm">{selectedAsset?.prompt}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Polygon Count</h4>
                  <p className="text-sm">{selectedAsset?.polygons.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Texture Resolution</h4>
                  <p className="text-sm">{selectedAsset?.textureRes}px</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Format</h4>
                  <p className="text-sm">{selectedAsset?.format}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p className="text-sm">{selectedAsset?.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download {selectedAsset?.format}
                </Button>
                <Button variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
