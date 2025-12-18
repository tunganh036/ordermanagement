import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    let updates = []

    // Xử lý cả 2 format
    if (body.batchUpdates) {
      updates = body.batchUpdates
    } else if (body.orderIds && body.status) {
      updates = body.orderIds.map((id: number) => ({ id, status: body.status }))
    } else {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const { error } = await supabase
      .from("orders")
      .upsert(updates.map((u: any) => ({ id: u.id, status: u.status })))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Update status error:", err)
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}
