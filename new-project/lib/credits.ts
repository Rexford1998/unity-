import { getDb, type User } from "./db"

export class InsufficientCreditsError extends Error {
  constructor(currentCredits: number, required: number = 1) {
    super(`Insufficient credits. You have ${currentCredits} credits but need ${required}.`)
    this.name = "InsufficientCreditsError"
  }
}

// Check if user has enough credits and deduct atomically
export async function checkAndDeductCredits(
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; remainingCredits: number }> {
  const db = getDb()
  
  // Get current credits
  const { data: user, error: fetchError } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single()
  
  if (fetchError || !user) {
    throw new Error("User not found")
  }
  
  if (user.credits < amount) {
    throw new InsufficientCreditsError(user.credits, amount)
  }
  
  // Deduct credits atomically using RPC or direct update
  const { data: updated, error: updateError } = await db
    .from("users")
    .update({ credits: user.credits - amount })
    .eq("id", userId)
    .eq("credits", user.credits) // Optimistic locking
    .select("credits")
    .single()
  
  if (updateError || !updated) {
    // Race condition - retry or fail
    throw new Error("Failed to deduct credits. Please try again.")
  }
  
  return {
    success: true,
    remainingCredits: updated.credits
  }
}

// Refund credits (used when generation fails)
export async function refundCredits(
  userId: string,
  amount: number = 1
): Promise<void> {
  const db = getDb()
  
  const { data: user } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single()
  
  if (!user) {
    throw new Error("User not found for refund")
  }
  
  await db
    .from("users")
    .update({ credits: user.credits + amount })
    .eq("id", userId)
}

// Get user's current credit balance
export async function getCredits(userId: string): Promise<number> {
  const db = getDb()
  
  const { data: user, error } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single()
  
  if (error || !user) {
    throw new Error("User not found")
  }
  
  return user.credits
}

// Add credits (for purchases, bonuses, etc.)
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ newBalance: number }> {
  const db = getDb()
  
  const { data: user } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single()
  
  if (!user) {
    throw new Error("User not found")
  }
  
  const { data: updated, error } = await db
    .from("users")
    .update({ credits: user.credits + amount })
    .eq("id", userId)
    .select("credits")
    .single()
  
  if (error || !updated) {
    throw new Error("Failed to add credits")
  }
  
  return { newBalance: updated.credits }
}

// TODO: Add functions for:
// - Credit purchase via Stripe
// - Subscription-based credit allocation
// - Credit usage history/audit log
// - Promotional credit codes
