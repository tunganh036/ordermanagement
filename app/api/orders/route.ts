import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const orderData = await request.json()

    console.log("[v0] Received order data:", JSON.stringify(orderData, null, 2))

    const supabase = await createClient()

    // Insert order header
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderData.orderNumber,
        order_date: orderData.orderDate,
        customer_name: orderData.customerName,
        customer_address: orderData.customerAddress,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        ship_to_address: orderData.shipToAddress,
        billing_name: orderData.billingName,
        billing_address: orderData.billingAddress,
        billing_tax_number: orderData.billingTaxNumber,
        subtotal: orderData.subtotal,
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order insertion error:", orderError)
      throw orderError
    }

    console.log("[v0] Order created successfully:", order)

    // Insert order items
    const itemsToInsert = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity,
    }))

    console.log("[v0] Inserting order items:", itemsToInsert)

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert)

    if (itemsError) {
      console.error("[v0] Order items insertion error:", itemsError)
      throw itemsError
    }

    console.log("[v0] Order items inserted successfully")

    await sendSlackNotification(orderData)

    return NextResponse.json({
      success: true,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error("[v0] Order creation failed:", error)
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message || "Unknown error",
        code: error.code || null,
      },
      { status: 500 },
    )
  }
}

async function sendSlackNotification(orderData: any) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!slackWebhookUrl) {
    console.warn("Slack webhook URL not configured")
    return
  }

  const itemsList = orderData.items
    .map((item: any) => {
      const itemTotal = (item.total || item.price * item.quantity).toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `• ${item.name} (x${item.quantity}) - ${itemTotal} VND`
    })
    .join("\n")

  const formattedSubtotal = orderData.subtotal.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const message = {
    text: `🎉 New Order Received!`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `New Order: ${orderData.orderNumber}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Customer:*\n${orderData.customerName}`,
          },
          {
            type: "mrkdwn",
            text: `*Phone:*\n${orderData.customerPhone}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${orderData.customerEmail}`,
          },
          {
            type: "mrkdwn",
            text: `*Total:*\n${formattedSubtotal} VND`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Items:*\n${itemsList}`,
        },
      },
    ],
  }

  try {
    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })
  } catch (error) {
    console.error("Failed to send Slack notification:", error)
  }
}
