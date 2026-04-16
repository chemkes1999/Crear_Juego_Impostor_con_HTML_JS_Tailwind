import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabase() {
  if (client) return client

  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env
  const url = env?.VITE_SUPABASE_URL
  const anonKey = env?.VITE_SUPABASE_ANON_KEY

  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Falta VITE_SUPABASE_URL")
  }

  if (typeof anonKey !== "string" || !anonKey.trim()) {
    throw new Error("Falta VITE_SUPABASE_ANON_KEY")
  }

  client = createClient(url, anonKey)
  return client
}
