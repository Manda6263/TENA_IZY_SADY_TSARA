import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Valid fallback values for development
const defaultUrl = 'https://demo.supabase.co'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Using demo mode.')
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file')
}

export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Database types
export interface Sale {
  id: string
  date: string
  product: string
  category: string
  subcategory: string
  price: number
  quantity: number
  total: number
  seller: string
  register: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  subcategory: string
  initial_stock: number
  current_stock: number
  price: number
  threshold: number
  created_at: string
  updated_at: string
}

export interface Log {
  id: string
  date: string
  user_id: string | null
  action: string
  details: string | null
  created_at: string
}