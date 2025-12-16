import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  // Connect to your database (Supabase, Neon, etc.)
  // Example with Supabase:
  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
 // const { createServerClient } = require('@supabase/ssr')
//  const { cookies } = require('next/headers')
  
//  const cookieStore = cookies()
  
 // const supabase = createServerClient(
 //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
 //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 //   {
 //     cookies: {
 //      get(name: string) {
 //         return cookieStore.get(name)?.value
 //       },
 //     },
//  }
//  )
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
  
  // Return products in the format: { id, name, price, description }
  return NextResponse.json(products)

  // const mockProducts = [
    // {
      // id: 1,
      // name: "Laptop Dell XPS 13",
      // price: 25000000,
      // description: "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
    // },
    // {
      // id: 2,
      // name: "iPhone 15 Pro",
      // price: 30000000,
      // description: "Latest iPhone with A17 Pro chip, 256GB storage, titanium design",
    // },
    // {
      // id: 3,
      // name: "Samsung Galaxy S24",
      // price: 22000000,
      // description: "Flagship Android phone with Snapdragon 8 Gen 3, 12GB RAM",
    // },
    // {
      // id: 4,
      // name: "MacBook Air M3",
      // price: 35000000,
      // description: "Ultra-thin laptop with M3 chip, 16GB RAM, stunning Retina display",
    // },
    // {
      // id: 5,
      // name: 'iPad Pro 12.9"',
      // price: 28000000,
      // description: "Professional tablet with M2 chip, 256GB storage, ProMotion display",
    // },
    // {
      // id: 6,
      // name: "Sony WH-1000XM5",
      // price: 8000000,
      // description: "Premium noise-cancelling wireless headphones with exceptional audio",
    // },
    // {
      // id: 7,
      // name: "Dell UltraSharp Monitor",
      // price: 12000000,
      // description: "27-inch 4K monitor with USB-C connectivity and excellent color accuracy",
    // },
    // {
      // id: 8,
      // name: "Logitech MX Master 3S",
      // price: 2500000,
      // description: "Advanced wireless mouse with ergonomic design and precision tracking",
    // },
  // ]

 // return NextResponse.json(mockProducts)
}
