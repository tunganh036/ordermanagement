"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Plus, Minus, Trash2 } from "lucide-react"

type OrderItem = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  total: number
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  is_active?: boolean
}

export default function OrderEntryPage() {
  const [orderNumber] = useState(`ORD-${Date.now()}`)
  const [orderDate] = useState(new Date().toISOString().split("T")[0])
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [shipToAddress, setShipToAddress] = useState("")
  const [billingToName, setBillingToName] = useState("")
  const [billingToAddress, setBillingToAddress] = useState("")
  const [billingToTaxReg, setBillingToTaxReg] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showView, setShowView] = useState("order")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Add product to order
  const addProduct = (product: Product) => {
    const existingItem = orderItems.find((item) => item.id === product.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1, total: product.price * 1 }])
    }
  }

  // Update quantity
  const updateQuantity = (id: number, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta
            return newQuantity > 0 ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0),
    )
  }

  // Calculate totals
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0)
  }

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatVND = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleReviewOrder = () => {
    setShowView("review")
  }

  const handleSubmitOrder = async () => {
    try {
      const orderData = {
        orderNumber,
        orderDate,
        customerName,
        customerAddress,
        customerPhone,
        customerEmail,
        shipToAddress,
        billingName: billingToName,
        billingAddress: billingToAddress,
        billingTaxNumber: billingToTaxReg,
        items: orderItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
        subtotal: calculateTotal(),
      }

      console.log("[v0] Submitting order:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      console.log("[v0] Order submission result:", result)

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to submit order")
      }

      setShowConfirmation(false)
      setShowSuccessModal(true)
    } catch (error) {
      console.error("[v0] Error submitting order:", error)
      setShowConfirmation(false)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setShowErrorModal(true)
    }
  }

  const handleReturnToOrder = () => {
    setShowSuccessModal(false)
    setShowErrorModal(false)
    setShowView("order")
    setCustomerName("")
    setCustomerAddress("")
    setCustomerPhone("")
    setCustomerEmail("")
    setShipToAddress("")
    setBillingToName("")
    setBillingToAddress("")
    setBillingToTaxReg("")
    setOrderItems([])
  }

  const handleBackToOrder = () => {
    setShowView("order")
  }

  return (
    <div className="min-h-screen bg-background">
      {showView === "order" ? (
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Order Entry</h1>
            </div>
          </header>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Product Master List */}
            <Card className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-3 text-foreground">Product Master List</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              {isLoadingProducts ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading products...</div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-right ml-2 shrink-0">
                        {product.price.toLocaleString()} VND
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No products found</div>
                  )}
                </div>
              )}
            </Card>

            {/* Right Panel - Order Detail */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3 text-foreground">Order Detail</h2>

              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Trash2 className="h-12 w-12 mb-3 opacity-50" />
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
                                {formatVND(item.total)} VND
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
                      <span>{formatVND(calculateTotal())} VND</span>
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
      ) : (
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Review Order</h1>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBackToOrder}>
                  Back to Edit
                </Button>
                <Button onClick={() => setShowConfirmation(true)} size="lg">
                  Submit Order
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Header */}
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Order Number</label>
                  <p className="text-foreground font-medium">{orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Order Date</label>
                  <p className="text-foreground font-medium">{orderDate}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Name</label>
                  <p className="text-foreground font-medium">{customerName || "-"}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Address</label>
                  <p className="text-foreground font-medium">{customerAddress || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Phone</label>
                  <p className="text-foreground font-medium">{customerPhone || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Email</label>
                  <p className="text-foreground font-medium">{customerEmail || "-"}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Ship to Address</label>
                  <p className="text-foreground font-medium">{shipToAddress || "-"}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Billing to Name</label>
                  <p className="text-foreground font-medium">{billingToName || "-"}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Billing to Address</label>
                  <p className="text-foreground font-medium">{billingToAddress || "-"}</p>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Billing To Tax Registration Number
                  </label>
                  <p className="text-foreground font-medium">{billingToTaxReg || "-"}</p>
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
                          {formatVND(item.total)} VND
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
                      <td className="text-right text-xl font-bold text-foreground px-4 py-3">
                        {formatVND(calculateTotal())} VND
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Bạn chắc chắn đặt hàng với thông tin này chứ?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleSubmitOrder}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Order submitted</h3>
            <button
              onClick={handleReturnToOrder}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-destructive mb-4">Error</h3>
            <p className="text-foreground mb-4">Có lỗi xảy ra khi gửi đơn hàng: {errorMessage}. Vui lòng thử lại.</p>
            <button
              onClick={handleReturnToOrder}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
