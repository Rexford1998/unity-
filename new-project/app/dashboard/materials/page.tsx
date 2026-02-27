"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Download, 
  Trash2,
  Eye,
  MoreVertical,
  Plus,
  Circle
} from "lucide-react"

// Mock materials data
const mockMaterials = [
  {
    id: 1,
    name: "Rusty Metal",
    createdAt: "2026-02-24",
    resolution: 2048,
    maps: ["Albedo", "Normal", "Roughness", "Metallic"],
    color: "#8B4513",
  },
  {
    id: 2,
    name: "Worn Leather",
    createdAt: "2026-02-23",
    resolution: 1024,
    maps: ["Albedo", "Normal", "Roughness"],
    color: "#654321",
  },
  {
    id: 3,
    name: "Polished Marble",
    createdAt: "2026-02-22",
    resolution: 2048,
    maps: ["Albedo", "Normal", "Roughness", "Metallic"],
    color: "#F5F5F5",
  },
  {
    id: 4,
    name: "Ancient Stone",
    createdAt: "2026-02-21",
    resolution: 1024,
    maps: ["Albedo", "Normal", "Roughness"],
    color: "#808080",
  },
  {
    id: 5,
    name: "Glowing Crystal",
    createdAt: "2026-02-20",
    resolution: 1024,
    maps: ["Albedo", "Normal", "Roughness", "Emissive"],
    color: "#9932CC",
  },
  {
    id: 6,
    name: "Wooden Planks",
    createdAt: "2026-02-19",
    resolution: 2048,
    maps: ["Albedo", "Normal", "Roughness"],
    color: "#DEB887",
  },
]

const mapColors: Record<string, string> = {
  Albedo: "bg-primary",
  Normal: "bg-blue-500",
  Roughness: "bg-gray-500",
  Metallic: "bg-yellow-500",
  Emissive: "bg-green-500",
}

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState<typeof mockMaterials[0] | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const filteredMaterials = mockMaterials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePreview = (material: typeof mockMaterials[0]) => {
    setSelectedMaterial(material)
    setIsPreviewOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-muted-foreground">Manage your PBR materials and texture maps</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Material
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                {/* Preview Sphere */}
                <div className="aspect-square bg-muted/50 flex items-center justify-center relative p-8">
                  <div 
                    className="w-full h-full rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${material.color}88, ${material.color}44, ${material.color}22)`,
                      boxShadow: `inset -20px -20px 40px rgba(0,0,0,0.3), inset 10px 10px 20px rgba(255,255,255,0.1)`,
                    }}
                  />
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handlePreview(material)}>
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
                      <h3 className="font-medium truncate">{material.name}</h3>
                      <p className="text-sm text-muted-foreground">{material.resolution}px</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(material)}>
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
                  {/* PBR Maps */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {material.maps.map((map) => (
                      <div key={map} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${mapColors[map] || 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground">{map}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Circle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">No materials found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first PBR material to get started"}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Material
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Material Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview Sphere */}
            <div className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center p-12">
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${selectedMaterial?.color}88, ${selectedMaterial?.color}44, ${selectedMaterial?.color}22)`,
                  boxShadow: `inset -30px -30px 60px rgba(0,0,0,0.3), inset 15px 15px 30px rgba(255,255,255,0.1)`,
                }}
              />
            </div>
            {/* Maps & Metadata */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Texture Maps</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedMaterial?.maps.map((map) => (
                    <div key={map} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg ${mapColors[map] || 'bg-gray-400'} opacity-60`} />
                      <div>
                        <p className="text-sm font-medium">{map}</p>
                        <p className="text-xs text-muted-foreground">{selectedMaterial?.resolution}px</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Resolution</h4>
                  <p className="text-sm">{selectedMaterial?.resolution}px</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p className="text-sm">{selectedMaterial?.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download All Maps
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
