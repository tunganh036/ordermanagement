import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    let updates = []

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

    // Dùng UPDATE với eq("id") thay vì upsert
    for (const update of updates) {
      const { error } = await supabase
        .from("orders")
        .update({ status: update.status })
        .eq("id", update.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Update status error:", err)
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}
