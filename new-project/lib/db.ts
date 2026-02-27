import { createClient } from "@supabase/supabase-js"

// Database types
export interface User {
  id: string
  email: string
  credits: number
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  prompt: string
  format: string
  platform: string
  style?: string
  status: "GENERATING" | "COMPLETED" | "FAILED"
  file_url?: string
  thumbnail_url?: string
  polygon_count?: number
  texture_resolution?: string
  created_at: string
}

export interface Material {
  id: string
  user_id: string
  name: string
  prompt: string
  albedo_url?: string
  normal_url?: string
  roughness_url?: string
  metallic_url?: string
  status: "GENERATING" | "COMPLETED" | "FAILED"
  created_at: string
}

// Singleton pattern for Supabase client (safe for serverless)
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getDb() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

// Helper to get or create a mock user (replace with real auth later)
export async function getOrCreateUser(email: string = "demo@meshforge.ai"): Promise<User> {
  const db = getDb()
  
  // Try to get existing user
  const { data: existingUser } = await db
    .from("users")
    .select("*")
    .eq("email", email)
    .single()
  
  if (existingUser) {
    return existingUser as User
  }
  
  // Create new user with default credits
  const { data: newUser, error } = await db
    .from("users")
    .insert({ email, credits: 10 })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }
  
  return newUser as User
}
