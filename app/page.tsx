"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Minus, ShoppingCart } from "lucide-react"

// Sample product data
const PRODUCTS = [
  {
    id: 1,
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 122222222.99,
  },
  { id: 2, name: "Mechanical Keyboard", description: "RGB backlit mechanical gaming keyboard", price: 89.99 },
  { id: 3, name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI and USB ports", price: 49.99 },
  { id: 4, name: "Laptop Stand", description: "Adjustable aluminum laptop stand", price: 39.99 },
  { id: 5, name: "Desk Lamp", description: "LED desk lamp with adjustable brightness", price: 34.99 },
  { id: 6, name: "Monitor Mount", description: "Dual monitor arm mount for desks", price: 79.99 },
  { id: 7, name: "Webcam HD", description: "1080p HD webcam with built-in microphone", price: 69.99 },
  { id: 8, name: "Headphones", description: "Noise-cancelling over-ear headphones", price: 149.99 },
  { id: 9, name: "Phone Charger", description: "Fast charging USB-C phone charger", price: 19.99 },
  { id: 10, name: "Cable Organizer", description: "Desk cable management organizer", price: 12.99 },
]

type OrderItem = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
}

type OrderHeader = {
  orderNumber: string
  orderDate: string
  customerName: string
  customerAddress: string
  customerPhone: string
  customerEmail: string
  shipToAddress: string
  billingToName: string
  billingToAddress: string
  billingToTaxReg: string
}

export default function OrderEntryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [showReviewPage, setShowReviewPage] = useState(false)
  const [orderDate] = useState(new Date().toLocaleDateString())
  const [orderNumber] = useState(`ORD-${Date.now().toString().slice(-6)}`)
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [shipToAddress, setShipToAddress] = useState("")
  const [billingToName, setBillingToName] = useState("")
  const [billingToAddress, setBillingToAddress] = useState("")
  const [billingToTaxReg, setBillingToTaxReg] = useState("")

  // Filter products based on search
  const filteredProducts = PRODUCTS.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Add product to order
  const addProduct = (product: (typeof PRODUCTS)[0]) => {
    const existingItem = orderItems.find((item) => item.id === product.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }])
    }
  }

  // Update quantity
  const updateQuantity = (id: number, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0),
    )
  }

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatVND = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleReviewOrder = () => {
    setShowReviewPage(true)
  }

  if (showReviewPage) {
    return (
      <ReviewOrderPage
        orderHeader={{
          orderNumber,
          orderDate,
          customerName,
          customerAddress,
          customerPhone,
          customerEmail,
          shipToAddress,
          billingToName,
          billingToAddress,
          billingToTaxReg,
        }}
        orderItems={orderItems}
        onBack={() => setShowReviewPage(false)}
        onSubmitSuccess={() => {
          setOrderItems([])
          setShowReviewPage(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Order Entry</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Order Header</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Order Info */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Order Number</label>
              <Input value={orderNumber} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Order Date</label>
              <Input value={orderDate} disabled className="bg-muted" />
            </div>

            {/* Customer Info */}
            <div className="lg:col-span-2">
              <label htmlFor="customer-name" className="text-sm font-medium text-foreground block mb-1">
                Customer Name
              </label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="customer-address" className="text-sm font-medium text-foreground block mb-1">
                Customer Address
              </label>
              <Input
                id="customer-address"
                type="text"
                placeholder="Enter customer address..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-phone" className="text-sm font-medium text-foreground block mb-1">
                Customer Phone
              </label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="Enter phone number..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-email" className="text-sm font-medium text-foreground block mb-1">
                Customer Email
              </label>
              <Input
                id="customer-email"
                type="email"
                placeholder="Enter email..."
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            {/* Shipping & Billing */}
            <div className="lg:col-span-2">
              <label htmlFor="ship-to-address" className="text-sm font-medium text-foreground block mb-1">
                Ship to Address
              </label>
              <Input
                id="ship-to-address"
                type="text"
                placeholder="Enter shipping address..."
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="billing-name" className="text-sm font-medium text-foreground block mb-1">
                Billing to Name
              </label>
              <Input
                id="billing-name"
                type="text"
                placeholder="Enter billing name..."
                value={billingToName}
                onChange={(e) => setBillingToName(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="billing-address" className="text-sm font-medium text-foreground block mb-1">
                Billing to Address
              </label>
              <Input
                id="billing-address"
                type="text"
                placeholder="Enter billing address..."
                value={billingToAddress}
                onChange={(e) => setBillingToAddress(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="billing-tax-reg" className="text-sm font-medium text-foreground block mb-1">
                Billing To Tax Registration Number
              </label>
              <Input
                id="billing-tax-reg"
                type="text"
                placeholder="Enter tax registration number..."
                value={billingToTaxReg}
                onChange={(e) => setBillingToTaxReg(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Product Master List */}
          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-3 text-foreground">Product Master List</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-[1fr,auto,auto] gap-3 pb-2 border-b border-border text-xs font-semibold text-muted-foreground">
                <div>Product Name</div>
                <div className="text-right">Unit Price</div>
                <div className="w-16"></div>
              </div>

              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-[1fr,auto,auto] gap-3 py-2 border-b border-border/50 items-center hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="text-foreground text-sm font-medium">{product.name}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{product.description}</div>
                  </div>
                  <div className="text-right text-foreground text-sm font-medium">{formatVND(product.price)} VND</div>
                  <Button size="sm" variant="outline" onClick={() => addProduct(product)} className="w-16 h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Right Panel - Order Detail */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Order Detail</h2>

            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-base">No items in order</p>
                <p className="text-sm">Add products from the left panel</p>
              </div>
            ) : (
              <>
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border">
                            Product
                          </th>
                          <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border">
                            Price
                          </th>
                          <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border">
                            Quantity
                          </th>
                          <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="text-foreground text-sm px-3 py-2">{item.name}</td>
                            <td className="text-right text-foreground text-sm px-3 py-2">
                              {formatVND(item.price)} VND
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="h-6 w-6"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium text-foreground text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="h-6 w-6"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="text-right font-medium text-foreground text-sm px-3 py-2">
                              {formatVND(item.price * item.quantity)} VND
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-3 mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>Subtotal:</span>
                    <span>{formatVND(subtotal)} VND</span>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Review Section */}
        {orderItems.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button onClick={handleReviewOrder} size="lg" className="shadow-lg">
              Review Order
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewOrderPage({
  orderHeader,
  orderItems,
  onBack,
  onSubmitSuccess,
}: {
  orderHeader: OrderHeader
  orderItems: OrderItem[]
  onBack: () => void
  onSubmitSuccess: () => void
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatVND = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleSubmit = () => {
    setShowConfirmModal(true)
  }

  const confirmOrder = () => {
    alert("Order submitted successfully!")
    setShowConfirmModal(false)
    onSubmitSuccess()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Review Order</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Back to Edit
            </Button>
            <Button onClick={handleSubmit} size="lg">
              Submit Order
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Order Header */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Order Number</label>
              <p className="text-foreground font-medium">{orderHeader.orderNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Order Date</label>
              <p className="text-foreground font-medium">{orderHeader.orderDate}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Name</label>
              <p className="text-foreground font-medium">{orderHeader.customerName || "-"}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Address</label>
              <p className="text-foreground font-medium">{orderHeader.customerAddress || "-"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Phone</label>
              <p className="text-foreground font-medium">{orderHeader.customerPhone || "-"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Email</label>
              <p className="text-foreground font-medium">{orderHeader.customerEmail || "-"}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Ship to Address</label>
              <p className="text-foreground font-medium">{orderHeader.shipToAddress || "-"}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Billing to Name</label>
              <p className="text-foreground font-medium">{orderHeader.billingToName || "-"}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Billing to Address</label>
              <p className="text-foreground font-medium">{orderHeader.billingToAddress || "-"}</p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Billing To Tax Registration Number
              </label>
              <p className="text-foreground font-medium">{orderHeader.billingToTaxReg || "-"}</p>
            </div>
          </div>
        </Card>

        {/* Order Detail Panel */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Order Detail</h2>

          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
                    Product
                  </th>
                  <th className="text-right text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
                    Price
                  </th>
                  <th className="text-center text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
                    Quantity
                  </th>
                  <th className="text-right text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="text-foreground px-4 py-3">{item.name}</td>
                    <td className="text-right text-foreground px-4 py-3">{formatVND(item.price)} VND</td>
                    <td className="text-center font-medium text-foreground px-4 py-3">{item.quantity}</td>
                    <td className="text-right font-semibold text-foreground px-4 py-3">
                      {formatVND(item.price * item.quantity)} VND
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td colSpan={2} className="text-right font-semibold text-foreground px-4 py-3">
                    Total Items:
                  </td>
                  <td className="text-center font-semibold text-foreground px-4 py-3">{totalItems}</td>
                  <td className="text-right text-xl font-bold text-foreground px-4 py-3">{formatVND(subtotal)} VND</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Submit Button in Bottom Right */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSubmit} size="lg">
              Submit Order
            </Button>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal with Vietnamese text */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Xác nhận đặt hàng</h3>
            <p className="text-foreground mb-6">Bạn chắc chắn đặt hàng với thông tin này chứ?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                No
              </Button>
              <Button onClick={confirmOrder}>Yes</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
