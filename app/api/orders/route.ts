import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const orderData = await request.json()

    // 1. Save to database
    // Example with Supabase:
    // const { createServerClient } = require('@supabase/ssr')
    // const supabase = createServerClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //   {
    //     cookies: {
    //       get: (name: string) => request.cookies.get(name)?.value,
    //     },
    //   }
    // )
    
    // Insert order header
    const { data: order, error: orderError } = await supabase
      .from('orders')
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
        subtotal: orderData.subtotal
      })
      .select()
      .single()
    
    if (orderError) throw orderError
    
    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderData.items.map((item: any) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }))
      )
    
    if (itemsError) throw itemsError

    // 2. Send Slack notification
    await sendSlackNotification(orderData)

    return NextResponse.json({
      success: true,
      orderId: orderData.orderNumber, // Use actual order.id from database when connected
    })
  } catch (error) {
    console.error("Order creation failed:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

async function sendSlackNotification(orderData: any) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!slackWebhookUrl) {
    console.warn("Slack webhook URL not configured")
    return
  }

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
            text: `*Total:*\n${orderData.subtotal.toLocaleString()} VND`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Items:*\n${orderData.items.map((item: any) => `• ${item.productName} (x${item.quantity}) - ${item.total.toLocaleString()} VND`).join("\n")}`,
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
