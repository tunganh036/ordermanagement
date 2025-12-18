import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Trường hợp batch update từ CSV hoặc batch select
    if (body.batchUpdates) {
      const updates = body.batchUpdates
      const { error } = await supabase
        .from("orders")
        .upsert(updates.map((u: any) => ({ id: u.id, status: u.status })))

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // Trường hợp update nhiều đơn từ checkbox
    if (body.orderIds && body.status) {
      const { error } = await supabase
        .from("orders")
        .update({ status: body.status })
        .in("id", body.orderIds)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (err: any) {
    console.error("Update status error:", err)
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}
