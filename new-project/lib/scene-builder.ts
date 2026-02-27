import * as THREE from "three"

// ============================================================================
// UNIVERSAL PROCEDURAL BUILDER - Builds ANY 3D asset from parts specification
// ============================================================================

export interface PartSpec {
  name: string
  shape: "box" | "cylinder" | "sphere" | "cone" | "torus" | "capsule" | "octahedron" | "icosahedron" | "plane"
  size: [number, number, number] // width, height, depth OR radius, height, segments
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  material: string // "metal", "wood", "stone", "glass", "fabric", "plastic", "rubber", "organic"
  children?: PartSpec[] // nested parts
}

export interface UniversalBlueprint {
  name: string
  description: string
  scale: number // overall scale multiplier (1.0 = real world meters)
  parts: PartSpec[]
  metadata?: {
    category?: string
    style?: string
    complexity?: "low" | "medium" | "high"
  }
}

// Animation types
export interface AnimationKeyframe {
  time: number // seconds
  position?: [number, number, number]
  rotation?: [number, number, number] // degrees
  scale?: [number, number, number]
}

export interface PartAnimation {
  partName: string
  keyframes: AnimationKeyframe[]
  interpolation?: "linear" | "step" | "cubicspline"
}

export interface AnimatedBlueprint extends UniversalBlueprint {
  duration: number // total animation duration in seconds
  animations: PartAnimation[]
  looping?: boolean
}

export interface SceneBlueprint {
  sceneType: string
  assets: Array<{
    type: string
    count: number
    scale?: [number, number, number]
    color?: string
    material?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
  }>
  lighting?: string
  ambience?: string
  groundPlane?: boolean
  exportNotes?: string
}

// ============================================================================
// COLOR AND MATERIAL SYSTEM
// ============================================================================

const COLOR_PALETTE: Record<string, number> = {
  // Metals
  chrome: 0xc0c0c0, silver: 0xc0c0c0, steel: 0x6b6b6b, iron: 0x3d3d3d,
  gold: 0xd4af37, bronze: 0x8b6b23, copper: 0xb87333, brass: 0xb5a642,
  aluminum: 0xa8a8a8, titanium: 0x878787, platinum: 0xe5e4e2,
  
  // Woods
  oak: 0x8b6914, pine: 0xc4a35a, mahogany: 0x4a0f0f, walnut: 0x3d2b1f,
  birch: 0xc9a66b, cherry: 0x8b4513, maple: 0xc19a6b, teak: 0x6b4423,
  ebony: 0x1a1a1a, bamboo: 0xa8c686,
  
  // Stones
  granite: 0x6b6b6b, marble: 0xe8e8e8, sandstone: 0xc2a366, slate: 0x4a4a4a,
  limestone: 0xd4c4a8, obsidian: 0x1a1a2e, jade: 0x00a86b, ruby: 0xe0115f,
  sapphire: 0x0f52ba, emerald: 0x50c878, amethyst: 0x9966cc, diamond: 0xb9f2ff,
  
  // Organic
  skin: 0xe0ac69, skin_light: 0xf5d6c6, skin_dark: 0x8d5524,
  leaf: 0x3a5f23, grass: 0x4a7c23, moss: 0x4a6b3a, bark: 0x4a3623,
  bone: 0xe3dac9, ivory: 0xfffff0, coral: 0xff7f50,
  
  // Fabrics
  leather: 0x6b4423, canvas: 0xc9a66b, velvet: 0x6b1a1a, silk: 0xf0e8e0,
  denim: 0x1560bd, cotton: 0xf5f5dc, wool: 0xc4a77d,
  
  // Synthetics
  plastic_white: 0xe8e8e8, plastic_black: 0x1a1a1a, plastic_red: 0xcc3333,
  plastic_blue: 0x3366cc, plastic_green: 0x33cc33, plastic_yellow: 0xcccc33,
  rubber: 0x2a2a2a, neon_pink: 0xff1493, neon_blue: 0x00ffff, neon_green: 0x39ff14,
  
  // Glass/Transparent
  glass: 0x87ceeb, glass_tinted: 0x4a7c8c, crystal: 0xb9f2ff,
  
  // Common colors
  white: 0xffffff, black: 0x1a1a1a, gray: 0x666666, grey: 0x666666,
  red: 0xcc3333, green: 0x33cc33, blue: 0x3366cc, yellow: 0xcccc33,
  orange: 0xcc6633, purple: 0x663399, pink: 0xcc6699, cyan: 0x33cccc,
  brown: 0x6b4423, tan: 0xd2b48c, beige: 0xf5f5dc, cream: 0xfffdd0,
  navy: 0x000080, maroon: 0x800000, olive: 0x808000, teal: 0x008080,
}

const MATERIAL_PROPERTIES: Record<string, { metalness: number; roughness: number }> = {
  metal: { metalness: 0.9, roughness: 0.3 },
  polished_metal: { metalness: 1.0, roughness: 0.1 },
  brushed_metal: { metalness: 0.85, roughness: 0.4 },
  rusty_metal: { metalness: 0.6, roughness: 0.8 },
  wood: { metalness: 0.0, roughness: 0.7 },
  polished_wood: { metalness: 0.0, roughness: 0.3 },
  rough_wood: { metalness: 0.0, roughness: 0.9 },
  stone: { metalness: 0.0, roughness: 0.8 },
  polished_stone: { metalness: 0.0, roughness: 0.2 },
  glass: { metalness: 0.0, roughness: 0.05 },
  frosted_glass: { metalness: 0.0, roughness: 0.4 },
  fabric: { metalness: 0.0, roughness: 0.9 },
  leather: { metalness: 0.0, roughness: 0.6 },
  plastic: { metalness: 0.0, roughness: 0.4 },
  matte_plastic: { metalness: 0.0, roughness: 0.7 },
  rubber: { metalness: 0.0, roughness: 0.95 },
  organic: { metalness: 0.0, roughness: 0.7 },
  skin: { metalness: 0.0, roughness: 0.6 },
  ceramic: { metalness: 0.0, roughness: 0.3 },
  concrete: { metalness: 0.0, roughness: 0.9 },
  paper: { metalness: 0.0, roughness: 0.95 },
  emissive: { metalness: 0.0, roughness: 0.5 },
}

function getColor(colorName: string): THREE.Color {
  const normalized = colorName.toLowerCase().replace(/[\s-]/g, '_')
  return new THREE.Color(COLOR_PALETTE[normalized] || 0x666666)
}

function getMaterial(materialType: string): { metalness: number; roughness: number } {
  const normalized = materialType.toLowerCase().replace(/[\s-]/g, '_')
  return MATERIAL_PROPERTIES[normalized] || { metalness: 0.1, roughness: 0.7 }
}

// ============================================================================
// GEOMETRY BUILDERS - HIGH DETAIL FOR REALISTIC OUTPUT
// ============================================================================

// Default segment counts for smooth, realistic geometry
const DETAIL_LEVEL = {
  CYLINDER_RADIAL: 32,      // Smooth circular profiles
  CYLINDER_HEIGHT: 4,       // Height segments for bending
  SPHERE_WIDTH: 32,         // Horizontal segments
  SPHERE_HEIGHT: 24,        // Vertical segments  
  CONE_RADIAL: 32,          // Smooth cone base
  CONE_HEIGHT: 4,           // Height segments
  TORUS_RADIAL: 24,         // Around the ring
  TORUS_TUBULAR: 48,        // Along the tube
  CAPSULE_CAP: 16,          // Cap detail
  CAPSULE_RADIAL: 32,       // Body detail
  OCTAHEDRON_DETAIL: 2,     // Subdivision level
  ICOSAHEDRON_DETAIL: 3,    // Higher = smoother sphere approximation
  BOX_SEGMENTS: 2,          // Segments per face for smoother shading
  PLANE_SEGMENTS: 8,        // Grid segments
}

function createGeometry(shape: PartSpec["shape"], size: [number, number, number]): THREE.BufferGeometry {
  const [w, h, d] = size
  
  switch (shape) {
    case "box":
      // More segments for smoother lighting on large surfaces
      return new THREE.BoxGeometry(w, h, d, DETAIL_LEVEL.BOX_SEGMENTS, DETAIL_LEVEL.BOX_SEGMENTS, DETAIL_LEVEL.BOX_SEGMENTS)
    case "cylinder":
      // High radial segments for smooth circular profile
      const cylSegments = d > 8 ? Math.floor(d) : DETAIL_LEVEL.CYLINDER_RADIAL
      return new THREE.CylinderGeometry(w, w, h, cylSegments, DETAIL_LEVEL.CYLINDER_HEIGHT)
    case "sphere":
      // High segments for smooth spheres
      const sphereW = h > 8 ? Math.floor(h) : DETAIL_LEVEL.SPHERE_WIDTH
      const sphereH = d > 8 ? Math.floor(d) : DETAIL_LEVEL.SPHERE_HEIGHT
      return new THREE.SphereGeometry(w, sphereW, sphereH)
    case "cone":
      const coneSegments = d > 8 ? Math.floor(d) : DETAIL_LEVEL.CONE_RADIAL
      return new THREE.ConeGeometry(w, h, coneSegments, DETAIL_LEVEL.CONE_HEIGHT)
    case "torus":
      return new THREE.TorusGeometry(w, h, DETAIL_LEVEL.TORUS_RADIAL, DETAIL_LEVEL.TORUS_TUBULAR)
    case "capsule":
      return new THREE.CapsuleGeometry(w, h, DETAIL_LEVEL.CAPSULE_CAP, DETAIL_LEVEL.CAPSULE_RADIAL)
    case "octahedron":
      // Detail level for subdivision (2 = smooth-ish, 3 = very smooth)
      const octDetail = h > 0 ? Math.floor(h) : DETAIL_LEVEL.OCTAHEDRON_DETAIL
      return new THREE.OctahedronGeometry(w, octDetail)
    case "icosahedron":
      // Detail 3+ makes a nearly perfect sphere
      const icoDetail = h > 0 ? Math.floor(h) : DETAIL_LEVEL.ICOSAHEDRON_DETAIL
      return new THREE.IcosahedronGeometry(w, icoDetail)
    case "plane":
      return new THREE.PlaneGeometry(w, h, DETAIL_LEVEL.PLANE_SEGMENTS, DETAIL_LEVEL.PLANE_SEGMENTS)
    default:
      return new THREE.BoxGeometry(w, h, d, DETAIL_LEVEL.BOX_SEGMENTS, DETAIL_LEVEL.BOX_SEGMENTS, DETAIL_LEVEL.BOX_SEGMENTS)
  }
}

function buildPart(part: PartSpec, parentPosition: [number, number, number] = [0, 0, 0]): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  
  const geometry = createGeometry(part.shape, part.size)
  const matProps = getMaterial(part.material)
  
  const material = new THREE.MeshStandardMaterial({
    color: getColor(part.color),
    metalness: matProps.metalness,
    roughness: matProps.roughness,
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = part.name
  
  // Position relative to parent
  mesh.position.set(
    parentPosition[0] + part.position[0],
    parentPosition[1] + part.position[1],
    parentPosition[2] + part.position[2]
  )
  
  // Rotation
  if (part.rotation) {
    mesh.rotation.set(
      part.rotation[0] * Math.PI / 180,
      part.rotation[1] * Math.PI / 180,
      part.rotation[2] * Math.PI / 180
    )
  }
  
  meshes.push(mesh)
  
  // Build children
  if (part.children) {
    for (const child of part.children) {
      meshes.push(...buildPart(child, [mesh.position.x, mesh.position.y, mesh.position.z]))
    }
  }
  
  return meshes
}

// ============================================================================
// UNIVERSAL BUILD FUNCTION
// ============================================================================

export async function buildFromUniversalBlueprint(blueprint: UniversalBlueprint): Promise<Buffer> {
  const scene = new THREE.Scene()
  scene.name = blueprint.name
  
  for (const part of blueprint.parts) {
    const meshes = buildPart(part)
    for (const mesh of meshes) {
      // Apply overall scale
      mesh.position.multiplyScalar(blueprint.scale)
      mesh.scale.multiplyScalar(blueprint.scale)
      scene.add(mesh)
    }
  }
  
  return sceneToGLB(scene)
}

// ============================================================================
// ANIMATED BUILD FUNCTION
// ============================================================================

export async function buildFromAnimatedBlueprint(blueprint: AnimatedBlueprint): Promise<Buffer> {
  const scene = new THREE.Scene()
  scene.name = blueprint.name
  
  // Build meshes and track by name
  const meshMap: Map<string, THREE.Mesh> = new Map()
  
  for (const part of blueprint.parts) {
    const meshes = buildPart(part)
    for (const mesh of meshes) {
      mesh.position.multiplyScalar(blueprint.scale)
      mesh.scale.multiplyScalar(blueprint.scale)
      scene.add(mesh)
      meshMap.set(mesh.name, mesh)
    }
  }
  
  // Build animation data
  const animationData = blueprint.animations.map(anim => ({
    partName: anim.partName,
    keyframes: anim.keyframes,
    interpolation: anim.interpolation || "linear"
  }))
  
  return sceneToAnimatedGLB(scene, meshMap, animationData, blueprint.duration, blueprint.looping ?? true)
}

// ============================================================================
// LLM PROMPT FOR GENERATING UNIVERSAL BLUEPRINTS
// ============================================================================

export function getUniversalBlueprintPrompt(userPrompt: string, style: string, platform: string): string {
  return `You are a 3D modeling expert. Generate a detailed construction blueprint for: "${userPrompt}"

RULES:
1. DECOMPOSE the object into detailed sub-components (e.g., for a car: chassis, wheels, windshield, lights, seats, steering wheel).
2. Create 10-30 individual PARTS for high detail.
3. Each part uses primitive shapes: box, cylinder, sphere, cone, torus, capsule, octahedron, icosahedron, plane.
4. Use REALISTIC colors from the palette (no placeholder colors).
5. Specify appropriate materials for each part.
6. Positions are in METERS (real-world scale).
7. Think about how the object is constructed in real life - structure, joints, details.

AVAILABLE COLORS:
- Metals: chrome, silver, steel, iron, gold, bronze, copper, brass, aluminum, titanium
- Woods: oak, pine, mahogany, walnut, birch, cherry, maple, teak, ebony, bamboo
- Stones: granite, marble, sandstone, slate, limestone, obsidian, jade
- Organic: skin, leaf, grass, moss, bark, bone, ivory
- Fabrics: leather, canvas, velvet, silk, denim, cotton, wool
- Synthetics: plastic_white, plastic_black, plastic_red, rubber, neon_pink, neon_blue
- Common: white, black, gray, red, green, blue, yellow, orange, purple, pink, brown, tan, beige, cream

AVAILABLE MATERIALS (affects shininess):
- metal, polished_metal, brushed_metal, rusty_metal
- wood, polished_wood, rough_wood
- stone, polished_stone
- glass, frosted_glass
- fabric, leather
- plastic, matte_plastic, rubber
- organic, skin, ceramic, concrete

SHAPES:
- box: [width, height, depth]
- cylinder: [radius, height, segments]
- sphere: [radius, widthSegments, heightSegments]
- cone: [radius, height, segments]
- torus: [radius, tubeRadius, segments]
- capsule: [radius, length, segments]
- octahedron: [radius, detail]
- icosahedron: [radius, detail]
- plane: [width, height]

Return ONLY valid JSON:
{
  "name": "ObjectName",
  "description": "Brief description",
  "scale": 1.0,
  "parts": [
    {
      "name": "PartName",
      "shape": "box",
      "size": [1, 1, 1],
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "color": "steel",
      "material": "metal"
    }
  ],
  "metadata": {
    "category": "vehicle|weapon|furniture|building|nature|character|prop|tool",
    "style": "${style}",
    "complexity": "medium"
  }
}

EXAMPLE - Spaceship:
{
  "name": "Spaceship",
  "description": "Futuristic spacecraft with cockpit and engines",
  "scale": 1.0,
  "parts": [
    {"name": "MainHull", "shape": "box", "size": [2, 0.6, 4], "position": [0, 0, 0], "color": "steel", "material": "brushed_metal"},
    {"name": "Cockpit", "shape": "sphere", "size": [0.5, 16, 16], "position": [0, 0.4, 1.5], "color": "glass", "material": "glass"},
    {"name": "LeftWing", "shape": "box", "size": [2, 0.1, 1.5], "position": [-1.5, 0, -0.5], "rotation": [0, 0, -15], "color": "steel", "material": "brushed_metal"},
    {"name": "RightWing", "shape": "box", "size": [2, 0.1, 1.5], "position": [1.5, 0, -0.5], "rotation": [0, 0, 15], "color": "steel", "material": "brushed_metal"},
    {"name": "LeftEngine", "shape": "cylinder", "size": [0.25, 1.2, 16], "position": [-1.2, -0.1, -2], "rotation": [90, 0, 0], "color": "titanium", "material": "polished_metal"},
    {"name": "RightEngine", "shape": "cylinder", "size": [0.25, 1.2, 16], "position": [1.2, -0.1, -2], "rotation": [90, 0, 0], "color": "titanium", "material": "polished_metal"},
    {"name": "LeftThruster", "shape": "cone", "size": [0.2, 0.4, 16], "position": [-1.2, -0.1, -2.6], "rotation": [-90, 0, 0], "color": "neon_blue", "material": "emissive"},
    {"name": "RightThruster", "shape": "cone", "size": [0.2, 0.4, 16], "position": [1.2, -0.1, -2.6], "rotation": [-90, 0, 0], "color": "neon_blue", "material": "emissive"},
    {"name": "Antenna", "shape": "cylinder", "size": [0.02, 0.5, 8], "position": [0, 0.6, 0.8], "color": "chrome", "material": "polished_metal"},
    {"name": "NoseCone", "shape": "cone", "size": [0.3, 0.8, 16], "position": [0, 0, 2.4], "rotation": [-90, 0, 0], "color": "red", "material": "plastic"}
  ],
  "metadata": {"category": "vehicle", "style": "realistic", "complexity": "medium"}
}

Now generate for: "${userPrompt}"
Style: ${style}
Platform: ${platform}`
}

// ============================================================================
// ANIMATION BLUEPRINT PROMPT
// ============================================================================

export function getAnimationBlueprintPrompt(userPrompt: string, style: string, platform: string): string {
  return `You are a 3D animator expert. Generate a detailed animated model blueprint for: "${userPrompt}"

RULES:
1. DECOMPOSE the object into detailed sub-components (e.g., for a dog: head, neck, torso, upper_leg_FL, lower_leg_FL, paw_FL, tail, ears).
2. Create 10-25 individual PARTS for high detail.
3. Add KEYFRAME ANIMATIONS to parts that should move.
4. Animation duration should be 1-5 seconds (looping animations).
5. Use realistic motion - ease in/out, anticipation, follow-through.
6. Positions/rotations change over time via keyframes.

ANIMATION TYPES TO CONSIDER:
- Walk/Run cycles (legs moving in correct quadruped/biped rhythm)
- Idle breathing/bobbing (subtle up/down, scale)
- Mechanical movement (gears rotating, pistons)
- Flying (wings flapping, body tilting)
- Swimming (tail, fins oscillating)

KEYFRAME FORMAT:
- time: seconds (0.0 to duration)
- position: [x, y, z] offset from base position
- rotation: [x, y, z] in degrees
- scale: [x, y, z] multiplier

SHAPES: box, cylinder, sphere, cone, torus, capsule, octahedron, icosahedron, plane

COLORS: chrome, silver, steel, gold, bronze, oak, pine, mahogany, granite, marble,
        leather, rubber, plastic_white, plastic_black, plastic_red, red, green, blue, white, black, gray, brown, tan, beige

MATERIALS: metal, polished_metal, wood, stone, glass, fabric, leather, plastic, rubber, organic, skin

Return ONLY valid JSON:
{
  "name": "AnimatedObject",
  "description": "Description with animation",
  "scale": 1.0,
  "duration": 2.0,
  "looping": true,
  "parts": [
    {
      "name": "PartName",
      "shape": "box",
      "size": [1, 1, 1],
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "color": "steel",
      "material": "metal"
    }
  ],
  "animations": [
    {
      "partName": "PartName",
      "interpolation": "linear",
      "keyframes": [
        {"time": 0.0, "rotation": [0, 0, 0]},
        {"time": 1.0, "rotation": [0, 360, 0]},
        {"time": 2.0, "rotation": [0, 720, 0]}
      ]
    }
  ],
  "metadata": {"category": "animated", "style": "${style}", "complexity": "medium"}
}

EXAMPLE - Dog Walking:
{
  "name": "DogWalking",
  "description": "Dog walking cycle",
  "scale": 1.0,
  "duration": 1.2,
  "looping": true,
  "parts": [
    {"name": "Torso", "shape": "capsule", "size": [0.25, 0.7, 16], "position": [0, 0.5, 0], "rotation": [90, 0, 0], "color": "brown", "material": "organic"},
    {"name": "Neck", "shape": "cylinder", "size": [0.15, 0.3, 16], "position": [0, 0.7, 0.4], "rotation": [45, 0, 0], "color": "brown", "material": "organic"},
    {"name": "Head", "shape": "sphere", "size": [0.2, 16, 16], "position": [0, 0.9, 0.6], "color": "brown", "material": "organic"},
    {"name": "Leg_FL_Upper", "shape": "capsule", "size": [0.08, 0.35, 8], "position": [-0.2, 0.4, 0.3], "color": "brown", "material": "organic"},
    {"name": "Leg_FR_Upper", "shape": "capsule", "size": [0.08, 0.35, 8], "position": [0.2, 0.4, 0.3], "color": "brown", "material": "organic"},
    {"name": "Leg_BL_Upper", "shape": "capsule", "size": [0.08, 0.35, 8], "position": [-0.2, 0.4, -0.3], "color": "brown", "material": "organic"},
    {"name": "Leg_BR_Upper", "shape": "capsule", "size": [0.08, 0.35, 8], "position": [0.2, 0.4, -0.3], "color": "brown", "material": "organic"},
    {"name": "Tail", "shape": "cone", "size": [0.08, 0.4, 8], "position": [0, 0.6, -0.4], "rotation": [-45, 0, 0], "color": "brown", "material": "organic"}
  ],
  "animations": [
    {
      "partName": "Leg_FL_Upper",
      "interpolation": "linear",
      "keyframes": [
        {"time": 0.0, "rotation": [20, 0, 0]},
        {"time": 0.3, "rotation": [-20, 0, 0]},
        {"time": 0.6, "rotation": [20, 0, 0]},
        {"time": 0.9, "rotation": [-20, 0, 0]},
        {"time": 1.2, "rotation": [20, 0, 0]}
      ]
    },
    {
      "partName": "Leg_FR_Upper",
      "interpolation": "linear",
      "keyframes": [
        {"time": 0.0, "rotation": [-20, 0, 0]},
        {"time": 0.3, "rotation": [20, 0, 0]},
        {"time": 0.6, "rotation": [-20, 0, 0]},
        {"time": 0.9, "rotation": [20, 0, 0]},
        {"time": 1.2, "rotation": [-20, 0, 0]}
      ]
    },
    {
      "partName": "Leg_BL_Upper",
      "interpolation": "linear",
      "keyframes": [
        {"time": 0.0, "rotation": [-20, 0, 0]},
        {"time": 0.3, "rotation": [20, 0, 0]},
        {"time": 0.6, "rotation": [-20, 0, 0]},
        {"time": 0.9, "rotation": [20, 0, 0]},
        {"time": 1.2, "rotation": [-20, 0, 0]}
      ]
    },
    {
      "partName": "Leg_BR_Upper",
      "interpolation": "linear",
      "keyframes": [
        {"time": 0.0, "rotation": [20, 0, 0]},
        {"time": 0.3, "rotation": [-20, 0, 0]},
        {"time": 0.6, "rotation": [20, 0, 0]},
        {"time": 0.9, "rotation": [-20, 0, 0]},
        {"time": 1.2, "rotation": [20, 0, 0]}
      ]
    }
  ],
  "metadata": {"category": "creature", "style": "realistic", "complexity": "medium"}
}

Now generate animated model for: "${userPrompt}"
Style: ${style}
Platform: ${platform}`
}

// ============================================================================
// LEGACY PROCEDURAL BUILDERS (for common objects - faster than LLM)
// ============================================================================

// ============================================================================
// CAVE CHAMBER - Generic cave scene without forced vehicles
// ============================================================================

export async function buildProceduralCave(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "cave"
  const parts: PartSpec[] = []
  const seed = (i: number, offset: number = 0) => Math.sin((i + offset) * 12.9898) * 0.5 + 0.5

  const floorColor = style === "ice" ? "crystal" : style === "lava" ? "obsidian" : "slate"
  const wallColor = style === "ice" ? "glass" : style === "lava" ? "maroon" : "granite"
  const accentMaterial = style === "ice" ? "glass" : style === "lava" ? "emissive" : "stone"

  parts.push({
    name: "CaveFloor",
    shape: "box",
    size: [16, 0.5, 16],
    position: [0, -0.25, 0],
    color: floorColor,
    material: style === "ice" ? "polished_stone" : "stone"
  })

  for (let i = 0; i < 22; i++) {
    parts.push({
      name: `WallRock_${i}`,
      shape: "icosahedron",
      size: [1.1 + seed(i, 5) * 1.2, 2, 2],
      position: [
        (seed(i, 10) - 0.5) * 14,
        1.4 + (seed(i, 15) - 0.5) * 1.6,
        (seed(i, 20) - 0.5) * 14
      ],
      rotation: [seed(i, 25) * 40, seed(i, 30) * 360, seed(i, 35) * 40],
      color: wallColor,
      material: "stone"
    })
  }

  for (let i = 0; i < 18; i++) {
    const baseX = (seed(i, 40) - 0.5) * 12
    const baseZ = (seed(i, 45) - 0.5) * 12
    const height = 0.8 + seed(i, 50) * 1.8
    parts.push({
      name: `Stalagmite_${i}`,
      shape: "cone",
      size: [0.15 + seed(i, 55) * 0.3, height, 24],
      position: [baseX, -0.25 + height / 2, baseZ],
      rotation: [(seed(i, 60) - 0.5) * 12, 0, (seed(i, 65) - 0.5) * 12],
      color: style === "ice" ? "glass" : "limestone",
      material: accentMaterial
    })
  }

  for (let i = 0; i < 18; i++) {
    const baseX = (seed(i, 70) - 0.5) * 12
    const baseZ = (seed(i, 75) - 0.5) * 12
    const height = 0.9 + seed(i, 80) * 1.9
    parts.push({
      name: `Stalactite_${i}`,
      shape: "cone",
      size: [0.15 + seed(i, 85) * 0.28, height, 24],
      position: [baseX, 4.8, baseZ],
      rotation: [180 + (seed(i, 90) - 0.5) * 12, 0, (seed(i, 95) - 0.5) * 12],
      color: style === "ice" ? "crystal" : "sandstone",
      material: accentMaterial
    })
  }

  if (style === "lava") {
    for (let i = 0; i < 10; i++) {
      const x = (seed(i, 100) - 0.5) * 10
      const z = (seed(i, 105) - 0.5) * 10
      parts.push({
        name: `LavaPool_${i}`,
        shape: "cylinder",
        size: [0.55 + seed(i, 110) * 0.8, 0.08, 24],
        position: [x, -0.18, z],
        color: i % 2 === 0 ? "orange" : "red",
        material: "emissive"
      })
    }
  } else if (style === "ice" || style === "crystal") {
    for (let i = 0; i < 14; i++) {
      parts.push({
        name: `Crystal_${i}`,
        shape: "octahedron",
        size: [0.25 + seed(i, 120) * 0.45, 3, 3],
        position: [(seed(i, 125) - 0.5) * 11, 0.5 + seed(i, 130) * 1.4, (seed(i, 135) - 0.5) * 11],
        rotation: [seed(i, 140) * 30, seed(i, 145) * 360, seed(i, 150) * 30],
        color: i % 3 === 0 ? "neon_blue" : i % 3 === 1 ? "crystal" : "neon_green",
        material: style === "ice" ? "glass" : "emissive"
      })
    }
  }

  return buildFromUniversalBlueprint({
    name: "CaveChamber",
    description: `${style} cave chamber scene`,
    scale: 1.0,
    parts,
    metadata: { category: "scene", style, complexity: "high" }
  })
}

// ============================================================================
// TUNNEL WITH PLANE - Cave flythrough scene
// ============================================================================

export async function buildProceduralTunnel(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "cave"
  
  const parts: PartSpec[] = []
  
  // Tunnel parameters - longer and more detailed
  const tunnelLength = 30
  const tunnelRadius = 4
  const segments = 20
  
  // Seed for consistent "random" variation
  const seed = (i: number, offset: number = 0) => Math.sin((i + offset) * 12.9898) * 0.5 + 0.5
  
  // Create organic tunnel with rock clusters instead of flat walls
  for (let i = 0; i < segments; i++) {
    const z = (i / segments) * tunnelLength - tunnelLength / 2
    const tunnelVariation = Math.sin(i * 0.4) * 0.8
    const ringRadius = tunnelRadius + tunnelVariation
    
    // FLOOR - multiple overlapping rocks for organic look
    for (let r = 0; r < 5; r++) {
      const rockScale = 0.5 + seed(i, r) * 1.2
      const xOffset = (seed(i, r + 10) - 0.5) * ringRadius * 1.5
      parts.push({
        name: `FloorRock_${i}_${r}`,
        shape: "icosahedron",
        size: [rockScale * 1.2, 2], // detail level 2 for smoother rocks
        position: [xOffset, -tunnelRadius * 0.6 - seed(i, r) * 0.3, z + (seed(i, r + 5) - 0.5) * 2],
        rotation: [seed(i, r) * 30, seed(i, r + 1) * 360, seed(i, r + 2) * 20],
        color: style === "ice" ? "crystal" : style === "lava" ? "obsidian" : seed(i, r) > 0.5 ? "granite" : "slate",
        material: style === "ice" ? "polished_stone" : "stone"
      })
    }
    
    // LEFT WALL - organic rock cluster
    for (let r = 0; r < 4; r++) {
      const rockScale = 0.8 + seed(i, r + 20) * 1.5
      const yOffset = (seed(i, r + 25) - 0.5) * tunnelRadius
      parts.push({
        name: `LeftWallRock_${i}_${r}`,
        shape: "icosahedron",
        size: [rockScale, 2],
        position: [-ringRadius - 0.5 + seed(i, r) * 0.8, yOffset, z + (seed(i, r + 30) - 0.5) * 1.5],
        rotation: [seed(i, r + 35) * 40, seed(i, r + 36) * 360, seed(i, r + 37) * 40],
        color: style === "ice" ? "glass" : style === "lava" ? "maroon" : seed(i, r) > 0.6 ? "limestone" : "sandstone",
        material: style === "ice" ? "glass" : "stone"
      })
    }
    
    // RIGHT WALL - organic rock cluster
    for (let r = 0; r < 4; r++) {
      const rockScale = 0.8 + seed(i, r + 40) * 1.5
      const yOffset = (seed(i, r + 45) - 0.5) * tunnelRadius
      parts.push({
        name: `RightWallRock_${i}_${r}`,
        shape: "icosahedron",
        size: [rockScale, 2],
        position: [ringRadius + 0.5 - seed(i, r) * 0.8, yOffset, z + (seed(i, r + 50) - 0.5) * 1.5],
        rotation: [seed(i, r + 55) * 40, seed(i, r + 56) * 360, seed(i, r + 57) * 40],
        color: style === "ice" ? "glass" : style === "lava" ? "maroon" : seed(i, r) > 0.6 ? "limestone" : "sandstone",
        material: style === "ice" ? "glass" : "stone"
      })
    }
    
    // CEILING - domed rock clusters
    for (let r = 0; r < 5; r++) {
      const rockScale = 0.6 + seed(i, r + 60) * 1.3
      const xOffset = (seed(i, r + 65) - 0.5) * ringRadius * 1.2
      parts.push({
        name: `CeilingRock_${i}_${r}`,
        shape: "icosahedron",
        size: [rockScale, 2],
        position: [xOffset, tunnelRadius * 0.7 + seed(i, r + 70) * 0.5, z + (seed(i, r + 75) - 0.5) * 1.5],
        rotation: [seed(i, r + 80) * 60, seed(i, r + 81) * 360, seed(i, r + 82) * 60],
        color: style === "ice" ? "crystal" : style === "lava" ? "obsidian" : seed(i, r) > 0.4 ? "granite" : "slate",
        material: style === "ice" ? "polished_stone" : "stone"
      })
    }
    
    // STALACTITES - multiple sizes hanging from ceiling
    if (i % 2 === 0) {
      for (let s = 0; s < 3; s++) {
        const stalSize = 0.15 + seed(i, s + 100) * 0.25
        const stalHeight = 0.8 + seed(i, s + 105) * 1.5
        parts.push({
          name: `Stalactite_${i}_${s}`,
          shape: "cone",
          size: [stalSize, stalHeight, 32], // High detail cone
          position: [(seed(i, s + 110) - 0.5) * ringRadius * 1.2, tunnelRadius * 0.5, z + (seed(i, s + 115) - 0.5) * 2],
          rotation: [180 + (seed(i, s + 120) - 0.5) * 15, 0, (seed(i, s + 125) - 0.5) * 15],
          color: style === "ice" ? "crystal" : style === "lava" ? "orange" : "limestone",
          material: style === "ice" ? "glass" : style === "lava" ? "emissive" : "stone"
        })
      }
    }
    
    // STALAGMITES - growing up from floor
    if (i % 3 === 0) {
      for (let s = 0; s < 2; s++) {
        const stalSize = 0.12 + seed(i, s + 130) * 0.2
        const stalHeight = 0.6 + seed(i, s + 135) * 1.2
        parts.push({
          name: `Stalagmite_${i}_${s}`,
          shape: "cone",
          size: [stalSize, stalHeight, 32],
          position: [(seed(i, s + 140) - 0.5) * ringRadius * 1.4, -tunnelRadius * 0.5 + stalHeight / 2, z + (seed(i, s + 145) - 0.5) * 2],
          rotation: [(seed(i, s + 150) - 0.5) * 10, 0, (seed(i, s + 155) - 0.5) * 10],
          color: style === "ice" ? "glass" : style === "lava" ? "red" : "sandstone",
          material: style === "ice" ? "glass" : style === "lava" ? "emissive" : "stone"
        })
      }
    }
  }
  
  // DETAILED JET PLANE flying through
  // Main fuselage - smooth capsule shape
  parts.push({
    name: "Jet_Fuselage",
    shape: "capsule",
    size: [0.35, 3.0, 32],
    position: [0, 0, 3],
    rotation: [90, 0, 0],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Nose cone - sleek pointed nose
  parts.push({
    name: "Jet_NoseCone",
    shape: "cone",
    size: [0.35, 1.2, 32],
    position: [0, 0, 5.2],
    rotation: [-90, 0, 0],
    color: "titanium",
    material: "polished_metal"
  })
  
  // Cockpit canopy - smooth glass bubble
  parts.push({
    name: "Jet_Canopy",
    shape: "sphere",
    size: [0.32, 32, 24],
    position: [0, 0.25, 4.2],
    color: "glass",
    material: "glass"
  })
  
  // Canopy frame
  parts.push({
    name: "Jet_CanopyFrame",
    shape: "torus",
    size: [0.33, 0.02, 32],
    position: [0, 0.25, 4.2],
    rotation: [90, 0, 0],
    color: "chrome",
    material: "polished_metal"
  })
  
  // Left main wing - swept back
  parts.push({
    name: "Jet_LeftWing",
    shape: "box",
    size: [2.5, 0.06, 0.9],
    position: [-1.4, -0.05, 2.8],
    rotation: [0, 15, -4],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Left wing tip
  parts.push({
    name: "Jet_LeftWingTip",
    shape: "box",
    size: [0.3, 0.4, 0.15],
    position: [-2.6, 0.1, 2.5],
    color: "red",
    material: "plastic"
  })
  
  // Right main wing
  parts.push({
    name: "Jet_RightWing",
    shape: "box",
    size: [2.5, 0.06, 0.9],
    position: [1.4, -0.05, 2.8],
    rotation: [0, -15, 4],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Right wing tip
  parts.push({
    name: "Jet_RightWingTip",
    shape: "box",
    size: [0.3, 0.4, 0.15],
    position: [2.6, 0.1, 2.5],
    color: "red",
    material: "plastic"
  })
  
  // Vertical stabilizer (tail fin)
  parts.push({
    name: "Jet_TailFin",
    shape: "box",
    size: [0.06, 0.8, 0.6],
    position: [0, 0.45, 1.0],
    rotation: [15, 0, 0],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Tail fin tip with light
  parts.push({
    name: "Jet_TailLight",
    shape: "sphere",
    size: [0.05, 16, 16],
    position: [0, 0.85, 0.85],
    color: "red",
    material: "emissive"
  })
  
  // Left horizontal stabilizer
  parts.push({
    name: "Jet_LeftStabilizer",
    shape: "box",
    size: [0.9, 0.04, 0.35],
    position: [-0.5, 0.05, 0.8],
    rotation: [0, 10, -3],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Right horizontal stabilizer
  parts.push({
    name: "Jet_RightStabilizer",
    shape: "box",
    size: [0.9, 0.04, 0.35],
    position: [0.5, 0.05, 0.8],
    rotation: [0, -10, 3],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Left engine nacelle
  parts.push({
    name: "Jet_LeftEngine",
    shape: "cylinder",
    size: [0.22, 1.8, 32],
    position: [-0.8, -0.2, 1.5],
    rotation: [90, 0, 0],
    color: "titanium",
    material: "polished_metal"
  })
  
  // Left engine intake
  parts.push({
    name: "Jet_LeftIntake",
    shape: "torus",
    size: [0.22, 0.03, 24],
    position: [-0.8, -0.2, 2.4],
    rotation: [90, 0, 0],
    color: "chrome",
    material: "polished_metal"
  })
  
  // Left engine exhaust glow
  parts.push({
    name: "Jet_LeftExhaust",
    shape: "cone",
    size: [0.18, 0.5, 32],
    position: [-0.8, -0.2, 0.5],
    rotation: [90, 0, 0],
    color: "neon_blue",
    material: "emissive"
  })
  
  // Right engine nacelle
  parts.push({
    name: "Jet_RightEngine",
    shape: "cylinder",
    size: [0.22, 1.8, 32],
    position: [0.8, -0.2, 1.5],
    rotation: [90, 0, 0],
    color: "titanium",
    material: "polished_metal"
  })
  
  // Right engine intake
  parts.push({
    name: "Jet_RightIntake",
    shape: "torus",
    size: [0.22, 0.03, 24],
    position: [0.8, -0.2, 2.4],
    rotation: [90, 0, 0],
    color: "chrome",
    material: "polished_metal"
  })
  
  // Right engine exhaust glow
  parts.push({
    name: "Jet_RightExhaust",
    shape: "cone",
    size: [0.18, 0.5, 32],
    position: [0.8, -0.2, 0.5],
    rotation: [90, 0, 0],
    color: "neon_blue",
    material: "emissive"
  })
  
  // Landing gear doors (closed)
  parts.push({
    name: "Jet_GearDoor",
    shape: "box",
    size: [0.3, 0.02, 0.5],
    position: [0, -0.36, 3.5],
    color: "steel",
    material: "brushed_metal"
  })
  
  // Speed/motion trail particles
  for (let i = 0; i < 12; i++) {
    const trailZ = -3 - i * 1.2
    const spread = 0.3 + i * 0.15
    parts.push({
      name: `SpeedTrail_${i}`,
      shape: "cylinder",
      size: [0.015 + i * 0.002, 2.5 + i * 0.4, 8],
      position: [
        (Math.sin(i * 2.5) * spread),
        (Math.cos(i * 3.2) * spread * 0.5),
        trailZ
      ],
      rotation: [90, 0, 0],
      color: "white",
      material: "emissive"
    })
  }
  
  // Atmospheric effects based on style
  if (style === "cave" || style === "crystal") {
    // Glowing crystal formations
    for (let i = 0; i < 15; i++) {
      const z = (i / 15) * tunnelLength - tunnelLength / 2
      const side = i % 2 === 0 ? -1 : 1
      parts.push({
        name: `GlowCrystal_${i}`,
        shape: "octahedron",
        size: [0.25 + seed(i, 200) * 0.3, 3], // High detail octahedron
        position: [
          side * (tunnelRadius - 0.8 - seed(i, 205) * 0.5),
          -tunnelRadius * 0.4 + seed(i, 210) * 0.8,
          z
        ],
        rotation: [(seed(i, 215) - 0.5) * 40, seed(i, 220) * 360, (seed(i, 225) - 0.5) * 40],
        color: i % 4 === 0 ? "neon_blue" : i % 4 === 1 ? "neon_green" : i % 4 === 2 ? "neon_pink" : "crystal",
        material: "emissive"
      })
    }
  }
  
  if (style === "lava") {
    // Lava streams and pools
    for (let i = 0; i < 8; i++) {
      const z = (i / 8) * tunnelLength - tunnelLength / 2
      parts.push({
        name: `LavaPool_${i}`,
        shape: "cylinder",
        size: [0.6 + seed(i, 230) * 0.8, 0.08, 32],
        position: [(seed(i, 235) - 0.5) * tunnelRadius * 1.2, -tunnelRadius * 0.58, z],
        color: "orange",
        material: "emissive"
      })
      // Lava glow sphere above pool
      parts.push({
        name: `LavaGlow_${i}`,
        shape: "sphere",
        size: [0.3 + seed(i, 240) * 0.3, 16, 16],
        position: [(seed(i, 235) - 0.5) * tunnelRadius * 1.2, -tunnelRadius * 0.45, z],
        color: "neon_pink",
        material: "emissive"
      })
    }
  }
  
  if (style === "ice") {
    // Ice crystal formations
    for (let i = 0; i < 12; i++) {
      const z = (i / 12) * tunnelLength - tunnelLength / 2
      parts.push({
        name: `IceCrystal_${i}`,
        shape: "octahedron",
        size: [0.4 + seed(i, 250) * 0.5, 3],
        position: [
          (seed(i, 255) - 0.5) * tunnelRadius * 1.5,
          (seed(i, 260) - 0.5) * tunnelRadius * 0.8,
          z
        ],
        rotation: [(seed(i, 265) - 0.5) * 60, seed(i, 270) * 360, (seed(i, 275) - 0.5) * 60],
        color: "crystal",
        material: "glass"
      })
    }
  }
  
  return buildFromUniversalBlueprint({
    name: "TunnelFlythrough",
    description: `High-speed ${style} tunnel flythrough with detailed jet fighter`,
    scale: 1.0,
    parts,
    metadata: { category: "scene", style, complexity: "high" }
  })
}

export async function buildProceduralTree(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  
  const params: Record<string, { trunkH: number; trunkR: number; canopyLayers: number; canopyR: number; branches: number }> = {
    default: { trunkH: 3.0, trunkR: 0.18, canopyLayers: 6, canopyR: 1.8, branches: 8 },
    oak: { trunkH: 4.0, trunkR: 0.25, canopyLayers: 8, canopyR: 2.5, branches: 12 },
    pine: { trunkH: 5.0, trunkR: 0.15, canopyLayers: 10, canopyR: 1.2, branches: 0 },
    palm: { trunkH: 5.0, trunkR: 0.15, canopyLayers: 1, canopyR: 1.5, branches: 0 },
  }
  const p = params[style] || params.default
  
  const parts: PartSpec[] = []
  const seed = (i: number, offset: number = 0) => Math.sin((i + offset) * 12.9898) * 0.5 + 0.5
  
  // TRUNK - tapered with bark texture bumps
  // Main trunk (tapered cylinder approximation using multiple sections)
  for (let t = 0; t < 5; t++) {
    const sectionH = p.trunkH / 5
    const taperFactor = 1 - t * 0.15
    parts.push({
      name: `Trunk_${t}`,
      shape: "cylinder",
      size: [p.trunkR * taperFactor, sectionH + 0.05, 32],
      position: [0, sectionH * t + sectionH / 2, 0],
      rotation: [0, t * 35, 0], // Slight twist for organic feel
      color: t % 2 === 0 ? "bark" : "walnut",
      material: "rough_wood"
    })
  }
  
  // ROOT FLARES at base
  for (let r = 0; r < 6; r++) {
    const angle = (r / 6) * 360
    const rootLen = 0.4 + seed(r, 50) * 0.3
    parts.push({
      name: `Root_${r}`,
      shape: "capsule",
      size: [p.trunkR * 0.4, rootLen, 16],
      position: [
        Math.sin(angle * Math.PI / 180) * p.trunkR * 1.2,
        0.1,
        Math.cos(angle * Math.PI / 180) * p.trunkR * 1.2
      ],
      rotation: [70 + seed(r, 55) * 20, angle, 0],
      color: "bark",
      material: "rough_wood"
    })
  }
  
  if (style === "pine") {
    // PINE - layered cone foliage with organic variation
    for (let i = 0; i < p.canopyLayers; i++) {
      const layerY = p.trunkH * 0.3 + i * 0.45
      const layerRadius = p.canopyR * (1 - i * 0.08)
      const layerHeight = 0.7 - i * 0.03
      
      // Main cone layer
      parts.push({
        name: `PineLayer_${i}`,
        shape: "cone",
        size: [layerRadius, layerHeight, 32],
        position: [(seed(i, 100) - 0.5) * 0.1, layerY, (seed(i, 105) - 0.5) * 0.1],
        rotation: [seed(i, 110) * 5, seed(i, 115) * 360, seed(i, 120) * 5],
        color: i % 3 === 0 ? "leaf" : i % 3 === 1 ? "grass" : "moss",
        material: "organic"
      })
      
      // Sub-branches for detail
      if (i < p.canopyLayers - 2) {
        for (let b = 0; b < 4; b++) {
          const bAngle = (b / 4) * 360 + i * 45
          parts.push({
            name: `PineBranch_${i}_${b}`,
            shape: "cone",
            size: [layerRadius * 0.3, 0.25, 16],
            position: [
              Math.sin(bAngle * Math.PI / 180) * layerRadius * 0.7,
              layerY - 0.1,
              Math.cos(bAngle * Math.PI / 180) * layerRadius * 0.7
            ],
            rotation: [45, bAngle, 0],
            color: "leaf",
            material: "organic"
          })
        }
      }
    }
    
  } else if (style === "palm") {
    // PALM - curved fronds with multiple segments
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 360
      const droop = 15 + (i % 3) * 10
      
      // Frond stem
      parts.push({
        name: `FrondStem_${i}`,
        shape: "capsule",
        size: [0.04, 2.0, 16],
        position: [
          Math.sin(angle * Math.PI / 180) * 0.2,
          p.trunkH - 0.2,
          Math.cos(angle * Math.PI / 180) * 0.2
        ],
        rotation: [-droop, angle, 0],
        color: "grass",
        material: "organic"
      })
      
      // Frond leaflets (multiple per frond)
      for (let l = 0; l < 6; l++) {
        const leafOffset = 0.3 + l * 0.25
        parts.push({
          name: `Leaflet_${i}_${l}`,
          shape: "box",
          size: [0.5 - l * 0.05, 0.01, 0.08],
          position: [
            Math.sin(angle * Math.PI / 180) * (0.3 + leafOffset),
            p.trunkH - 0.3 - leafOffset * 0.3,
            Math.cos(angle * Math.PI / 180) * (0.3 + leafOffset)
          ],
          rotation: [-droop - l * 5, angle, l % 2 === 0 ? 25 : -25],
          color: l < 3 ? "leaf" : "grass",
          material: "organic"
        })
      }
    }
    
    // Coconuts
    for (let c = 0; c < 3; c++) {
      const cAngle = c * 120
      parts.push({
        name: `Coconut_${c}`,
        shape: "sphere",
        size: [0.12, 24, 24],
        position: [
          Math.sin(cAngle * Math.PI / 180) * 0.15,
          p.trunkH - 0.4,
          Math.cos(cAngle * Math.PI / 180) * 0.15
        ],
        color: "walnut",
        material: "organic"
      })
    }
    
  } else {
    // OAK/DEFAULT - organic canopy with multiple overlapping spheres and branches
    const greens = ["leaf", "grass", "moss", "grass"]
    
    // Main canopy clusters - using icosahedrons with high detail for organic shape
    for (let i = 0; i < p.canopyLayers; i++) {
      const layerY = p.trunkH * 0.8 + (i / p.canopyLayers) * p.canopyR * 0.8
      const layerSpread = p.canopyR * (0.3 + (i / p.canopyLayers) * 0.7)
      
      // Main canopy ball
      parts.push({
        name: `Canopy_${i}`,
        shape: "icosahedron",
        size: [p.canopyR * (0.5 + seed(i, 300) * 0.4), 3], // Detail 3 for smooth
        position: [
          (seed(i, 305) - 0.5) * layerSpread,
          layerY,
          (seed(i, 310) - 0.5) * layerSpread
        ],
        rotation: [seed(i, 315) * 30, seed(i, 320) * 360, seed(i, 325) * 30],
        color: greens[i % greens.length],
        material: "organic"
      })
      
      // Sub-clusters around main canopy
      for (let s = 0; s < 3; s++) {
        const subAngle = (s / 3) * 360 + i * 60
        parts.push({
          name: `SubCanopy_${i}_${s}`,
          shape: "icosahedron",
          size: [p.canopyR * (0.25 + seed(i + s, 330) * 0.2), 3],
          position: [
            (seed(i, 305) - 0.5) * layerSpread + Math.sin(subAngle * Math.PI / 180) * p.canopyR * 0.5,
            layerY + (seed(i + s, 335) - 0.5) * 0.4,
            (seed(i, 310) - 0.5) * layerSpread + Math.cos(subAngle * Math.PI / 180) * p.canopyR * 0.5
          ],
          color: greens[(i + s) % greens.length],
          material: "organic"
        })
      }
    }
    
    // BRANCHES extending from trunk
    for (let b = 0; b < p.branches; b++) {
      const branchY = p.trunkH * (0.4 + (b / p.branches) * 0.5)
      const branchAngle = (b / p.branches) * 360 + seed(b, 350) * 45
      const branchLen = 0.5 + seed(b, 355) * 0.8
      
      parts.push({
        name: `Branch_${b}`,
        shape: "capsule",
        size: [0.04 + seed(b, 360) * 0.03, branchLen, 16],
        position: [
          Math.sin(branchAngle * Math.PI / 180) * (p.trunkR + branchLen * 0.3),
          branchY,
          Math.cos(branchAngle * Math.PI / 180) * (p.trunkR + branchLen * 0.3)
        ],
        rotation: [45 + seed(b, 365) * 30, branchAngle, 0],
        color: "bark",
        material: "rough_wood"
      })
      
      // Branch foliage
      parts.push({
        name: `BranchFoliage_${b}`,
        shape: "icosahedron",
        size: [0.3 + seed(b, 370) * 0.3, 2],
        position: [
          Math.sin(branchAngle * Math.PI / 180) * (p.trunkR + branchLen * 0.8),
          branchY + branchLen * 0.3,
          Math.cos(branchAngle * Math.PI / 180) * (p.trunkR + branchLen * 0.8)
        ],
        color: greens[b % greens.length],
        material: "organic"
      })
    }
  }
  
  return buildFromUniversalBlueprint({ name: "Tree", description: `Realistic ${style} tree`, scale: 1.0, parts })
}

export async function buildProceduralRock(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  
  const params: Record<string, { radius: number; detail: number; count: number; color: string }> = {
    default: { radius: 0.5, detail: 2, count: 1, color: "granite" },
    boulder: { radius: 1.0, detail: 2, count: 1, color: "granite" },
    pebble: { radius: 0.15, detail: 1, count: 5, color: "gray" },
    cliff: { radius: 1.5, detail: 2, count: 1, color: "slate" },
    crystal: { radius: 0.4, detail: 0, count: 3, color: "diamond" },
  }
  const p = params[style] || params.default
  
  const parts: PartSpec[] = []
  for (let i = 0; i < p.count; i++) {
    parts.push({
      name: `Rock_${i}`,
      shape: style === "crystal" ? "octahedron" : "icosahedron",
      size: [p.radius * (0.8 + Math.random() * 0.4), p.detail, p.detail],
      position: p.count > 1 ? [(Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2] : [0, 0, 0],
      color: p.color,
      material: style === "crystal" ? "glass" : "stone"
    })
  }
  
  return buildFromUniversalBlueprint({ name: "Rock", description: `${style} rock formation`, scale: 1.0, parts })
}

export async function buildProceduralSword(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  const len = style === "dagger" ? 0.4 : style === "greatsword" ? 1.8 : 1.0
  const w = style === "dagger" ? 0.04 : style === "greatsword" ? 0.12 : 0.08
  
  const parts: PartSpec[] = [
    { name: "Blade", shape: "box", size: [w, len, 0.015], position: [0, len / 2 + 0.15, 0], color: "chrome", material: "polished_metal" },
    { name: "BladeTip", shape: "cone", size: [w / 2, 0.15, 4], position: [0, len + 0.225, 0], rotation: [180, 0, 0], color: "chrome", material: "polished_metal" },
    { name: "Guard", shape: "box", size: [0.25, 0.03, 0.04], position: [0, 0.12, 0], color: "gold", material: "polished_metal" },
    { name: "Handle", shape: "cylinder", size: [0.025, 0.2, 8], position: [0, 0, 0], color: "leather", material: "leather" },
    { name: "Pommel", shape: "sphere", size: [0.035, 8, 8], position: [0, -0.12, 0], color: "gold", material: "polished_metal" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Sword", description: `${style} sword`, scale: 1.0, parts })
}

export async function buildProceduralShield(options: { style?: string; platform?: string }): Promise<Buffer> {
  const parts: PartSpec[] = [
    { name: "ShieldBody", shape: "cylinder", size: [0.4, 0.05, 32], position: [0, 0, 0], rotation: [90, 0, 0], color: "oak", material: "wood" },
    { name: "Boss", shape: "sphere", size: [0.08, 16, 16], position: [0, 0, 0.03], color: "bronze", material: "polished_metal" },
    { name: "Rim", shape: "torus", size: [0.4, 0.02, 32], position: [0, 0, 0], rotation: [90, 0, 0], color: "iron", material: "metal" },
    { name: "HandleStrap", shape: "box", size: [0.25, 0.03, 0.02], position: [0, 0, -0.03], color: "leather", material: "leather" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Shield", description: "round shield", scale: 1.0, parts })
}

export async function buildProceduralHouse(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  
  const params: Record<string, { w: number; d: number; h: number; roofH: number; wallColor: string }> = {
    default: { w: 3, d: 2.5, h: 2.5, roofH: 1.2, wallColor: "tan" },
    cottage: { w: 2.5, d: 2, h: 2, roofH: 1.5, wallColor: "cream" },
    cabin: { w: 3, d: 2.5, h: 2, roofH: 1, wallColor: "oak" },
    tower: { w: 1.5, d: 1.5, h: 5, roofH: 2, wallColor: "gray" },
    mansion: { w: 5, d: 4, h: 3.5, roofH: 1.5, wallColor: "marble" },
  }
  const p = params[style] || params.default
  
  const parts: PartSpec[] = [
    { name: "Walls", shape: "box", size: [p.w, p.h, p.d], position: [0, p.h / 2, 0], color: p.wallColor, material: style === "cabin" ? "wood" : "concrete" },
    { name: "Roof", shape: "cone", size: [Math.max(p.w, p.d) * 0.8, p.roofH, 4], position: [0, p.h + p.roofH / 2, 0], rotation: [0, 45, 0], color: "maroon", material: "ceramic" },
    { name: "Door", shape: "box", size: [0.6, 1.4, 0.1], position: [0, 0.7, p.d / 2 + 0.05], color: "walnut", material: "wood" },
    { name: "Window_L", shape: "box", size: [0.5, 0.5, 0.1], position: [-p.w * 0.3, p.h * 0.6, p.d / 2 + 0.05], color: "glass", material: "glass" },
    { name: "Window_R", shape: "box", size: [0.5, 0.5, 0.1], position: [p.w * 0.3, p.h * 0.6, p.d / 2 + 0.05], color: "glass", material: "glass" },
  ]
  
  if (style === "cottage" || style === "cabin") {
    parts.push({ name: "Chimney", shape: "box", size: [0.3, 1.2, 0.3], position: [p.w * 0.3, p.h + p.roofH * 0.5, 0], color: "maroon", material: "ceramic" })
  }
  
  return buildFromUniversalBlueprint({ name: "House", description: `${style} house`, scale: 1.0, parts })
}

export async function buildProceduralChest(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  const bandColor = style === "gold" ? "gold" : "iron"
  
  const parts: PartSpec[] = [
    { name: "Base", shape: "box", size: [0.8, 0.4, 0.5], position: [0, 0.2, 0], color: "oak", material: "wood" },
    { name: "Lid", shape: "cylinder", size: [0.25, 0.8, 16], position: [0, 0.4, 0], rotation: [0, 0, 90], color: "oak", material: "wood" },
    { name: "Band_0", shape: "box", size: [0.82, 0.04, 0.52], position: [0, 0.1, 0], color: bandColor, material: "metal" },
    { name: "Band_1", shape: "box", size: [0.82, 0.04, 0.52], position: [0, 0.25, 0], color: bandColor, material: "metal" },
    { name: "Band_2", shape: "box", size: [0.82, 0.04, 0.52], position: [0, 0.4, 0], color: bandColor, material: "metal" },
    { name: "Lock", shape: "box", size: [0.1, 0.1, 0.06], position: [0, 0.35, 0.28], color: bandColor, material: "metal" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Chest", description: `${style} treasure chest`, scale: 1.0, parts })
}

export async function buildProceduralCar(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  const len = style === "truck" ? 3.0 : style === "sports" ? 2.2 : 2.5
  const bodyColor = style === "sports" ? "red" : style === "truck" ? "steel" : "blue"
  
  const parts: PartSpec[] = [
    { name: "Body", shape: "box", size: [len, 0.5, 1.0], position: [0, 0.5, 0], color: bodyColor, material: "polished_metal" },
    { name: "Cabin", shape: "box", size: [style === "truck" ? 1.0 : len * 0.5, 0.4, 0.9], position: [style === "truck" ? -len * 0.25 : 0, 0.95, 0], color: bodyColor, material: "polished_metal" },
    { name: "Windshield", shape: "box", size: [style === "truck" ? 0.9 : len * 0.45, 0.3, 0.01], position: [style === "truck" ? -len * 0.25 : 0, 1.0, 0.46], color: "glass", material: "glass" },
    { name: "Wheel_FL", shape: "cylinder", size: [0.2, 0.15, 16], position: [-len * 0.35, 0.2, 0.55], rotation: [90, 0, 0], color: "rubber", material: "rubber" },
    { name: "Wheel_FR", shape: "cylinder", size: [0.2, 0.15, 16], position: [-len * 0.35, 0.2, -0.55], rotation: [90, 0, 0], color: "rubber", material: "rubber" },
    { name: "Wheel_RL", shape: "cylinder", size: [0.2, 0.15, 16], position: [len * 0.35, 0.2, 0.55], rotation: [90, 0, 0], color: "rubber", material: "rubber" },
    { name: "Wheel_RR", shape: "cylinder", size: [0.2, 0.15, 16], position: [len * 0.35, 0.2, -0.55], rotation: [90, 0, 0], color: "rubber", material: "rubber" },
    { name: "Headlight_L", shape: "sphere", size: [0.08, 8, 8], position: [len * 0.5, 0.5, 0.35], color: "white", material: "glass" },
    { name: "Headlight_R", shape: "sphere", size: [0.08, 8, 8], position: [len * 0.5, 0.5, -0.35], color: "white", material: "glass" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Car", description: `${style} car`, scale: 1.0, parts })
}

export async function buildProceduralChair(options: { style?: string; platform?: string }): Promise<Buffer> {
  const parts: PartSpec[] = [
    { name: "Seat", shape: "box", size: [0.45, 0.05, 0.45], position: [0, 0.45, 0], color: "oak", material: "wood" },
    { name: "Backrest", shape: "box", size: [0.45, 0.5, 0.05], position: [0, 0.72, -0.2], color: "oak", material: "wood" },
    { name: "Leg_FL", shape: "cylinder", size: [0.025, 0.45, 8], position: [-0.18, 0.225, 0.18], color: "oak", material: "wood" },
    { name: "Leg_FR", shape: "cylinder", size: [0.025, 0.45, 8], position: [0.18, 0.225, 0.18], color: "oak", material: "wood" },
    { name: "Leg_BL", shape: "cylinder", size: [0.025, 0.45, 8], position: [-0.18, 0.225, -0.18], color: "oak", material: "wood" },
    { name: "Leg_BR", shape: "cylinder", size: [0.025, 0.45, 8], position: [0.18, 0.225, -0.18], color: "oak", material: "wood" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Chair", description: "wooden chair", scale: 1.0, parts })
}

export async function buildProceduralTable(options: { style?: string; platform?: string }): Promise<Buffer> {
  const style = options.style || "default"
  const w = style === "coffee" ? 0.8 : 1.2
  const h = style === "coffee" ? 0.4 : 0.75
  
  const parts: PartSpec[] = [
    { name: "Tabletop", shape: "box", size: [w, 0.05, w * 0.6], position: [0, h, 0], color: "oak", material: "polished_wood" },
    { name: "Leg_FL", shape: "cylinder", size: [0.04, h, 8], position: [-w * 0.4, h / 2, w * 0.25], color: "oak", material: "wood" },
    { name: "Leg_FR", shape: "cylinder", size: [0.04, h, 8], position: [w * 0.4, h / 2, w * 0.25], color: "oak", material: "wood" },
    { name: "Leg_BL", shape: "cylinder", size: [0.04, h, 8], position: [-w * 0.4, h / 2, -w * 0.25], color: "oak", material: "wood" },
    { name: "Leg_BR", shape: "cylinder", size: [0.04, h, 8], position: [w * 0.4, h / 2, -w * 0.25], color: "oak", material: "wood" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Table", description: `${style} table`, scale: 1.0, parts })
}

export async function buildProceduralBarrel(options: { style?: string; platform?: string }): Promise<Buffer> {
  const parts: PartSpec[] = [
    { name: "Body", shape: "cylinder", size: [0.3, 0.8, 16], position: [0, 0.4, 0], color: "oak", material: "wood" },
    { name: "Band_Top", shape: "torus", size: [0.31, 0.02, 16], position: [0, 0.7, 0], color: "iron", material: "metal" },
    { name: "Band_Mid", shape: "torus", size: [0.32, 0.02, 16], position: [0, 0.4, 0], color: "iron", material: "metal" },
    { name: "Band_Bot", shape: "torus", size: [0.31, 0.02, 16], position: [0, 0.1, 0], color: "iron", material: "metal" },
  ]
  
  return buildFromUniversalBlueprint({ name: "Barrel", description: "wooden barrel", scale: 1.0, parts })
}

export async function buildSimpleAsset(prompt: string, style: string, platform: string): Promise<Buffer> {
  // Simple fallback - just a cube with appropriate color
  const parts: PartSpec[] = [
    { name: "Main", shape: "box", size: [1, 1, 1], position: [0, 0.5, 0], color: "gray", material: "plastic" }
  ]
  return buildFromUniversalBlueprint({ name: "Object", description: prompt, scale: 1.0, parts })
}

// Legacy function for old blueprint format
export async function buildSceneFromBlueprint(blueprint: SceneBlueprint, platform: string): Promise<Buffer> {
  const parts: PartSpec[] = blueprint.assets.map((asset, i) => ({
    name: `${asset.type}_${i}`,
    shape: "box" as const,
    size: asset.scale || [1, 1, 1],
    position: asset.position || [0, 0.5, 0],
    rotation: asset.rotation,
    color: asset.color || "gray",
    material: asset.material || "plastic"
  }))
  
  return buildFromUniversalBlueprint({ name: blueprint.sceneType, description: blueprint.sceneType, scale: 1.0, parts })
}

// ============================================================================
// GLB EXPORT (Node.js compatible - no FileReader)
// ============================================================================

async function sceneToGLB(scene: THREE.Scene): Promise<Buffer> {
  const meshes: THREE.Mesh[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) meshes.push(obj)
  })
  
  if (meshes.length === 0) {
    // Empty scene - return minimal valid GLB
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x666666 })
    meshes.push(new THREE.Mesh(geometry, material))
  }
  
  // Build GLTF JSON structure
  const gltf: {
    asset: { version: string; generator: string }
    scene: number
    scenes: Array<{ nodes: number[] }>
    nodes: Array<{ name: string; mesh: number; translation?: number[]; rotation?: number[]; scale?: number[] }>
    meshes: Array<{ name: string; primitives: Array<{ attributes: { POSITION: number; NORMAL: number }; indices: number; material: number }> }>
    accessors: Array<{ bufferView: number; componentType: number; count: number; type: string; max?: number[]; min?: number[] }>
    bufferViews: Array<{ buffer: number; byteOffset: number; byteLength: number; target?: number }>
    buffers: Array<{ byteLength: number }>
    materials: Array<{ name: string; pbrMetallicRoughness: { baseColorFactor: number[]; metallicFactor: number; roughnessFactor: number } }>
  } = {
    asset: { version: "2.0", generator: "MeshForge" },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    materials: [],
  }
  
  const binaryChunks: Buffer[] = []
  let byteOffset = 0
  
  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i]
    const geometry = mesh.geometry
    const material = mesh.material as THREE.MeshStandardMaterial
    
    // Add material
    const color = material.color
    gltf.materials.push({
      name: `Material_${i}`,
      pbrMetallicRoughness: {
        baseColorFactor: [color.r, color.g, color.b, 1.0],
        metallicFactor: material.metalness,
        roughnessFactor: material.roughness,
      },
    })
    
    // Get geometry data
    const positions = geometry.attributes.position.array as Float32Array
    const normals = geometry.attributes.normal?.array as Float32Array || new Float32Array(positions.length)
    const indices = geometry.index?.array as Uint16Array || generateIndices(positions.length / 3)
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let j = 0; j < positions.length; j += 3) {
      minX = Math.min(minX, positions[j])
      minY = Math.min(minY, positions[j + 1])
      minZ = Math.min(minZ, positions[j + 2])
      maxX = Math.max(maxX, positions[j])
      maxY = Math.max(maxY, positions[j + 1])
      maxZ = Math.max(maxZ, positions[j + 2])
    }
    
    // Pad to 4-byte boundary
    const posBuffer = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength)
    const normBuffer = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength)
    const idxBuffer = Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength)
    
    const posLen = posBuffer.length
    const normLen = normBuffer.length
    const idxLen = idxBuffer.length
    
    // Buffer views
    const posViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: posLen, target: 34962 })
    binaryChunks.push(posBuffer)
    byteOffset += posLen
    if (byteOffset % 4 !== 0) {
      const pad = 4 - (byteOffset % 4)
      binaryChunks.push(Buffer.alloc(pad))
      byteOffset += pad
    }
    
    const normViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: normLen, target: 34962 })
    binaryChunks.push(normBuffer)
    byteOffset += normLen
    if (byteOffset % 4 !== 0) {
      const pad = 4 - (byteOffset % 4)
      binaryChunks.push(Buffer.alloc(pad))
      byteOffset += pad
    }
    
    const idxViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: idxLen, target: 34963 })
    binaryChunks.push(idxBuffer)
    byteOffset += idxLen
    if (byteOffset % 4 !== 0) {
      const pad = 4 - (byteOffset % 4)
      binaryChunks.push(Buffer.alloc(pad))
      byteOffset += pad
    }
    
    // Accessors
    const posAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: posViewIdx, componentType: 5126, count: positions.length / 3, type: "VEC3", min: [minX, minY, minZ], max: [maxX, maxY, maxZ] })
    
    const normAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: normViewIdx, componentType: 5126, count: normals.length / 3, type: "VEC3" })
    
    const idxAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: idxViewIdx, componentType: 5123, count: indices.length, type: "SCALAR" })
    
    // Mesh
    gltf.meshes.push({
      name: mesh.name || `Mesh_${i}`,
      primitives: [{ attributes: { POSITION: posAccIdx, NORMAL: normAccIdx }, indices: idxAccIdx, material: i }],
    })
    
    // Node with transform
    const node: typeof gltf.nodes[0] = { name: mesh.name || `Node_${i}`, mesh: i }
    if (mesh.position.x !== 0 || mesh.position.y !== 0 || mesh.position.z !== 0) {
      node.translation = [mesh.position.x, mesh.position.y, mesh.position.z]
    }
    if (mesh.rotation.x !== 0 || mesh.rotation.y !== 0 || mesh.rotation.z !== 0) {
      node.rotation = [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w]
    }
    if (mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1) {
      node.scale = [mesh.scale.x, mesh.scale.y, mesh.scale.z]
    }
    gltf.nodes.push(node)
    gltf.scenes[0].nodes.push(i)
  }
  
  // Set buffer size
  gltf.buffers.push({ byteLength: byteOffset })
  
  // Build GLB
  const jsonString = JSON.stringify(gltf)
  const jsonBuffer = Buffer.from(jsonString)
  const jsonPadded = jsonBuffer.length % 4 === 0 ? jsonBuffer : Buffer.concat([jsonBuffer, Buffer.alloc(4 - (jsonBuffer.length % 4), 0x20)])
  
  const binaryBuffer = Buffer.concat(binaryChunks)
  
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546C67, 0) // "glTF"
  header.writeUInt32LE(2, 4) // version
  header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binaryBuffer.length, 8)
  
  const jsonChunkHeader = Buffer.alloc(8)
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0)
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4) // "JSON"
  
  const binChunkHeader = Buffer.alloc(8)
  binChunkHeader.writeUInt32LE(binaryBuffer.length, 0)
  binChunkHeader.writeUInt32LE(0x004E4942, 4) // "BIN\0"
  
  return Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binaryBuffer])
}

function generateIndices(vertexCount: number): Uint16Array {
  const indices = new Uint16Array(vertexCount)
  for (let i = 0; i < vertexCount; i++) indices[i] = i
  return indices
}

// ============================================================================
// ANIMATED GLB EXPORT
// ============================================================================

interface AnimationDataInput {
  partName: string
  keyframes: AnimationKeyframe[]
  interpolation: string
}

function toGLTFInterpolation(interpolation: string): "LINEAR" | "STEP" | "CUBICSPLINE" {
  const normalized = interpolation.toLowerCase()
  if (normalized === "step") return "STEP"
  if (normalized === "cubicspline") return "CUBICSPLINE"
  return "LINEAR"
}

async function sceneToAnimatedGLB(
  scene: THREE.Scene, 
  meshMap: Map<string, THREE.Mesh>,
  animations: AnimationDataInput[],
  duration: number,
  looping: boolean
): Promise<Buffer> {
  const meshes: THREE.Mesh[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) meshes.push(obj)
  })
  
  if (meshes.length === 0) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x666666 })
    meshes.push(new THREE.Mesh(geometry, material))
  }
  
  // Build GLTF JSON with animations
  const gltf: {
    asset: { version: string; generator: string }
    scene: number
    scenes: Array<{ nodes: number[] }>
    nodes: Array<{ name: string; mesh?: number; translation?: number[]; rotation?: number[]; scale?: number[] }>
    meshes: Array<{ name: string; primitives: Array<{ attributes: { POSITION: number; NORMAL: number }; indices: number; material: number }> }>
    accessors: Array<{ bufferView: number; componentType: number; count: number; type: string; max?: number[]; min?: number[] }>
    bufferViews: Array<{ buffer: number; byteOffset: number; byteLength: number; target?: number }>
    buffers: Array<{ byteLength: number }>
    materials: Array<{ name: string; pbrMetallicRoughness: { baseColorFactor: number[]; metallicFactor: number; roughnessFactor: number } }>
    animations?: Array<{
      name: string
      channels: Array<{ sampler: number; target: { node: number; path: string } }>
      samplers: Array<{ input: number; output: number; interpolation: string }>
    }>
  } = {
    asset: { version: "2.0", generator: "MeshForge" },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    materials: [],
    animations: [],
  }
  
  const binaryChunks: Buffer[] = []
  let byteOffset = 0
  
  // Create mesh name to node index map
  const meshNameToNodeIdx: Map<string, number> = new Map()
  
  // Add mesh data (same as before)
  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i]
    const geometry = mesh.geometry
    const material = mesh.material as THREE.MeshStandardMaterial
    
    const color = material.color
    gltf.materials.push({
      name: `Material_${i}`,
      pbrMetallicRoughness: {
        baseColorFactor: [color.r, color.g, color.b, 1.0],
        metallicFactor: material.metalness,
        roughnessFactor: material.roughness,
      },
    })
    
    const positions = geometry.attributes.position.array as Float32Array
    const normals = geometry.attributes.normal?.array as Float32Array || new Float32Array(positions.length)
    const indices = geometry.index?.array as Uint16Array || generateIndices(positions.length / 3)
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let j = 0; j < positions.length; j += 3) {
      minX = Math.min(minX, positions[j])
      minY = Math.min(minY, positions[j + 1])
      minZ = Math.min(minZ, positions[j + 2])
      maxX = Math.max(maxX, positions[j])
      maxY = Math.max(maxY, positions[j + 1])
      maxZ = Math.max(maxZ, positions[j + 2])
    }
    
    const posBuffer = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength)
    const normBuffer = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength)
    const idxBuffer = Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength)
    
    const posViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: posBuffer.length, target: 34962 })
    binaryChunks.push(posBuffer)
    byteOffset += posBuffer.length
    if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
    
    const normViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: normBuffer.length, target: 34962 })
    binaryChunks.push(normBuffer)
    byteOffset += normBuffer.length
    if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
    
    const idxViewIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: idxBuffer.length, target: 34963 })
    binaryChunks.push(idxBuffer)
    byteOffset += idxBuffer.length
    if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
    
    const posAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: posViewIdx, componentType: 5126, count: positions.length / 3, type: "VEC3", min: [minX, minY, minZ], max: [maxX, maxY, maxZ] })
    
    const normAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: normViewIdx, componentType: 5126, count: normals.length / 3, type: "VEC3" })
    
    const idxAccIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: idxViewIdx, componentType: 5123, count: indices.length, type: "SCALAR" })
    
    gltf.meshes.push({
      name: mesh.name || `Mesh_${i}`,
      primitives: [{ attributes: { POSITION: posAccIdx, NORMAL: normAccIdx }, indices: idxAccIdx, material: i }],
    })
    
    const nodeIdx = gltf.nodes.length
    const node: typeof gltf.nodes[0] = { name: mesh.name || `Node_${i}`, mesh: i }
    if (mesh.position.x !== 0 || mesh.position.y !== 0 || mesh.position.z !== 0) {
      node.translation = [mesh.position.x, mesh.position.y, mesh.position.z]
    }
    if (mesh.rotation.x !== 0 || mesh.rotation.y !== 0 || mesh.rotation.z !== 0) {
      node.rotation = [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w]
    }
    if (mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1) {
      node.scale = [mesh.scale.x, mesh.scale.y, mesh.scale.z]
    }
    gltf.nodes.push(node)
    gltf.scenes[0].nodes.push(nodeIdx)
    meshNameToNodeIdx.set(mesh.name, nodeIdx)
  }
  
  // Add animation data
  if (animations.length > 0) {
    const animationObj: {
      name: string
      channels: Array<{ sampler: number; target: { node: number; path: string } }>
      samplers: Array<{ input: number; output: number; interpolation: string }>
    } = {
      name: "Animation",
      channels: [],
      samplers: [],
    }
    
    for (const anim of animations) {
      const nodeIdx = meshNameToNodeIdx.get(anim.partName)
      if (nodeIdx === undefined) continue
      
      // Extract times
      const sortedKeyframes = [...anim.keyframes].sort((a, b) => a.time - b.time)
      const times = sortedKeyframes.map(kf => kf.time)
      if (times.length < 2) continue
      const timeBuffer = Buffer.from(new Float32Array(times).buffer)
      
      const timeViewIdx = gltf.bufferViews.length
      gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: timeBuffer.length })
      binaryChunks.push(timeBuffer)
      byteOffset += timeBuffer.length
      if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
      
      const timeAccIdx = gltf.accessors.length
      gltf.accessors.push({
        bufferView: timeViewIdx,
        componentType: 5126,
        count: times.length,
        type: "SCALAR",
        min: [Math.min(...times)],
        max: [Math.max(...times)]
      })
      
      // Check for translation animation
      if (sortedKeyframes.some(kf => kf.position)) {
        const translations: number[] = []
        for (const kf of sortedKeyframes) {
          const pos = kf.position || [0, 0, 0]
          translations.push(pos[0], pos[1], pos[2])
        }
        const transBuffer = Buffer.from(new Float32Array(translations).buffer)
        
        const transViewIdx = gltf.bufferViews.length
        gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: transBuffer.length })
        binaryChunks.push(transBuffer)
        byteOffset += transBuffer.length
        if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
        
        const transAccIdx = gltf.accessors.length
        gltf.accessors.push({ bufferView: transViewIdx, componentType: 5126, count: sortedKeyframes.length, type: "VEC3" })

        const samplerIdx = animationObj.samplers.length
        animationObj.samplers.push({ input: timeAccIdx, output: transAccIdx, interpolation: toGLTFInterpolation(anim.interpolation) })
        animationObj.channels.push({ sampler: samplerIdx, target: { node: nodeIdx, path: "translation" } })
      }
      
      // Check for rotation animation
      if (sortedKeyframes.some(kf => kf.rotation)) {
        const rotations: number[] = []
        for (const kf of sortedKeyframes) {
          const rot = kf.rotation || [0, 0, 0]
          // Convert Euler degrees to quaternion
          const euler = new THREE.Euler(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180)
          const quat = new THREE.Quaternion().setFromEuler(euler)
          rotations.push(quat.x, quat.y, quat.z, quat.w)
        }
        const rotBuffer = Buffer.from(new Float32Array(rotations).buffer)
        
        const rotViewIdx = gltf.bufferViews.length
        gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: rotBuffer.length })
        binaryChunks.push(rotBuffer)
        byteOffset += rotBuffer.length
        if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
        
        const rotAccIdx = gltf.accessors.length
        gltf.accessors.push({ bufferView: rotViewIdx, componentType: 5126, count: sortedKeyframes.length, type: "VEC4" })

        const samplerIdx = animationObj.samplers.length
        animationObj.samplers.push({ input: timeAccIdx, output: rotAccIdx, interpolation: toGLTFInterpolation(anim.interpolation) })
        animationObj.channels.push({ sampler: samplerIdx, target: { node: nodeIdx, path: "rotation" } })
      }
      
      // Check for scale animation
      if (sortedKeyframes.some(kf => kf.scale)) {
        const scales: number[] = []
        for (const kf of sortedKeyframes) {
          const s = kf.scale || [1, 1, 1]
          scales.push(s[0], s[1], s[2])
        }
        const scaleBuffer = Buffer.from(new Float32Array(scales).buffer)
        
        const scaleViewIdx = gltf.bufferViews.length
        gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: scaleBuffer.length })
        binaryChunks.push(scaleBuffer)
        byteOffset += scaleBuffer.length
        if (byteOffset % 4 !== 0) { const pad = 4 - (byteOffset % 4); binaryChunks.push(Buffer.alloc(pad)); byteOffset += pad }
        
        const scaleAccIdx = gltf.accessors.length
        gltf.accessors.push({ bufferView: scaleViewIdx, componentType: 5126, count: sortedKeyframes.length, type: "VEC3" })

        const samplerIdx = animationObj.samplers.length
        animationObj.samplers.push({ input: timeAccIdx, output: scaleAccIdx, interpolation: toGLTFInterpolation(anim.interpolation) })
        animationObj.channels.push({ sampler: samplerIdx, target: { node: nodeIdx, path: "scale" } })
      }
    }
    
    if (animationObj.channels.length > 0) {
      gltf.animations!.push(animationObj)
    }
  }
  
  // Set buffer size
  gltf.buffers.push({ byteLength: byteOffset })
  
  // Build GLB
  const jsonString = JSON.stringify(gltf)
  const jsonBuffer = Buffer.from(jsonString)
  const jsonPadded = jsonBuffer.length % 4 === 0 ? jsonBuffer : Buffer.concat([jsonBuffer, Buffer.alloc(4 - (jsonBuffer.length % 4), 0x20)])
  
  const binaryBuffer = Buffer.concat(binaryChunks)
  
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546C67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binaryBuffer.length, 8)
  
  const jsonChunkHeader = Buffer.alloc(8)
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0)
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4)
  
  const binChunkHeader = Buffer.alloc(8)
  binChunkHeader.writeUInt32LE(binaryBuffer.length, 0)
  binChunkHeader.writeUInt32LE(0x004E4942, 4)
  
  return Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binaryBuffer])
}
