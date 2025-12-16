import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: products, error } = await supabase.from("products").select("*").eq("is_active", true).order("name")

    if (error) {
      console.error("Failed to fetch products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Return products in the format: { id, name, price, description }
    return NextResponse.json(products)
  } catch (error) {
    console.error("Failed to fetch products:", error)

    const mockProducts = [
      {
        id: 1,
        name: "Laptop Dell XPS 13",
        price: 25000000,
        description: "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
        is_active: true,
      },
      {
        id: 2,
        name: "iPhone 15 Pro",
        price: 30000000,
        description: "Latest iPhone with A17 Pro chip, 256GB storage, titanium design",
        is_active: true,
      },
      {
        id: 3,
        name: "Samsung Galaxy S24",
        price: 22000000,
        description: "Flagship Android phone with Snapdragon 8 Gen 3, 12GB RAM",
        is_active: true,
      },
      {
        id: 4,
        name: "MacBook Air M3",
        price: 35000000,
        description: "Ultra-thin laptop with M3 chip, 16GB RAM, stunning Retina display",
        is_active: true,
      },
      {
        id: 5,
        name: 'iPad Pro 12.9"',
        price: 28000000,
        description: "Professional tablet with M2 chip, 256GB storage, ProMotion display",
        is_active: true,
      },
      {
        id: 6,
        name: "Sony WH-1000XM5",
        price: 8000000,
        description: "Premium noise-cancelling wireless headphones with exceptional audio",
        is_active: true,
      },
      {
        id: 7,
        name: "Dell UltraSharp Monitor",
        price: 12000000,
        description: "27-inch 4K monitor with USB-C connectivity and excellent color accuracy",
        is_active: true,
      },
      {
        id: 8,
        name: "Logitech MX Master 3S",
        price: 2500000,
        description: "Advanced wireless mouse with ergonomic design and precision tracking",
        is_active: true,
      },
    ]

    return NextResponse.json(mockProducts)
  }
}
