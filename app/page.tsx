"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"

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
  const [orderNumber, setOrderNumber] = useState("")
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
  const [showReview, setShowReview] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  // State cho lỗi inline
  const [errors, setErrors] = useState<{
    customerName?: string
    customerAddress?: string
    customerPhone?: string
    customerEmail?: string
  }>({})

  const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

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

  useEffect(() => {
    setOrderNumber(generateOrderNumber())
  }, [])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Add product to order
  const addProduct = (product: Product) => {
    const existingItem = orderItems.find((item) => item.id === product.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: item.price * (item.quantity + 1) }
            : item
        )
      )
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1, total: product.price * 1 }])
    }
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

  // Validation
  const validateRequiredFields = () => {
    const newErrors: typeof errors = {}

    if (!customerName.trim()) newErrors.customerName = "Tên khách hàng là bắt buộc"
    if (!customerAddress.trim()) newErrors.customerAddress = "Địa chỉ khách hàng là bắt buộc"
    if (!customerPhone.trim()) newErrors.customerPhone = "Số điện thoại là bắt buộc"
    if (!customerEmail.trim()) newErrors.customerEmail = "Email là bắt buộc"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleReviewOrder = () => {
    // Kiểm tra có sản phẩm chưa
    if (orderItems.length === 0) {
      setErrorMessage("Vui lòng thêm ít nhất một sản phẩm vào đơn hàng")
      setShowErrorModal(true)
      return
    }

    // Kiểm tra các trường bắt buộc
    const isValid = validateRequiredFields()

    if (!isValid) {
      // Cuộn đến trường lỗi đầu tiên
      const firstErrorKey = Object.keys(errors)[0] as keyof typeof errors
      const fieldId = {
        customerName: "customer-name",
        customerAddress: "customer-address",
        customerPhone: "customer-phone",
        customerEmail: "customer-email",
      }[firstErrorKey]

      document.getElementById(fieldId)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    // Xóa lỗi cũ và chuyển sang review
    setErrors({})
    setShowReview(true)
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

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

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
    setShowReview(false)
    setOrderNumber(generateOrderNumber())
    setCustomerName("")
    setCustomerAddress("")
    setCustomerPhone("")
    setCustomerEmail("")
    setShipToAddress("")
    setBillingToName("")
    setBillingToAddress("")
    setBillingToTaxReg("")
    setOrderItems([])
    setErrors({}) // reset lỗi
  }

  // Xóa lỗi khi người dùng bắt đầu nhập
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (showReview) {
    return (
      <>
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
          onBack={() => setShowReview(false)}
          onSubmit={() => setShowConfirmation(true)}
        />

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">Xác nhận đơn hàng</h3>
              <p className="text-muted-foreground mb-6">Bạn chắc chắn đặt hàng với thông tin này chứ?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-muted text-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors"
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

        {/* Error Modal (chỉ dùng khi submit thật sự lỗi) */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <h3 className="text-lg font-semibold text-destructive mb-4">Có lỗi xảy ra</h3>
              <p className="text-muted-foreground mb-6">{errorMessage || "Vui lòng thử lại."}</p>
              <button
                onClick={() => setShowErrorModal(false)} // Chỉ tắt modal, không reset form
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {!showReview ? (
        <>
          {/* ================= HEADER ================= */}
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-foreground">Order Place - ANHNT</h1>
          </header>

          {/* ================= PAGE CONTENT WRAPPER ================= */}
          <div className="mx-auto max-w-screen-2xl px-3 md:px-6 py-6">
            {/* ================= ORDER HEADER ================= */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Order Header</h2>
                <a
                  href="/ORION_CATALOGUE_B2B_TET2026_20251104.pdf"
                  download
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Tải về Catalog
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Order Number</label>
                  <Input value={orderNumber} disabled className="bg-muted" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Ngày Đặt Hàng</label>
                  <Input value={orderDate} disabled className="bg-muted" />
                </div>

                {/* Tên khách hàng */}
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Tên Khách Hàng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="Enter customer name..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (!billingToName) setBillingToName(e.target.value)
                      clearError("customerName")
                    }}
                    className={errors.customerName ? "border-red-500" : ""}
                  />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                </div>

                {/* Địa chỉ khách hàng */}
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Địa Chỉ Khách Hàng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-address"
                    type="text"
                    placeholder="Enter customer address..."
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value)
                      if (!shipToAddress) setShipToAddress(e.target.value)
                      if (!billingToAddress) setBillingToAddress(e.target.value)
                      clearError("customerAddress")
                    }}
                    className={errors.customerAddress ? "border-red-500" : ""}
                  />
                  {errors.customerAddress && <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Số Điện Thoại Đặt Hàng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    placeholder="Enter phone number..."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      clearError("customerPhone")
                    }}
                    className={errors.customerPhone ? "border-red-500" : ""}
                  />
                  {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Email Đặt Hàng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="Enter email..."
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value)
                      clearError("customerEmail")
                    }}
                    className={errors.customerEmail ? "border-red-500" : ""}
                  />
                  {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>}
                </div>

                {/* Các trường không bắt buộc */}
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Địa Chỉ Giao Hàng</label>
                  <Input
                    id="ship-to-address"
                    type="text"
                    placeholder="Enter shipping address..."
                    value={shipToAddress}
                    onChange={(e) => setShipToAddress(e.target.value)}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Tên Xuất Hóa Đơn</label>
                  <Input
                    id="billing-name"
                    type="text"
                    placeholder="Enter billing name..."
                    value={billingToName}
                    onChange={(e) => setBillingToName(e.target.value)}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Địa Chỉ Xuất Hóa Đơn</label>
                  <Input
                    id="billing-address"
                    type="text"
                    placeholder="Enter billing address..."
                    value={billingToAddress}
                    onChange={(e) => setBillingToAddress(e.target.value)}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Mã Số Thuế (nếu có)</label>
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

            {/* ================= MAIN CONTENT ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PRODUCT MASTER LIST */}
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-3">Product Master List</h2>
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />

                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => addProduct(product)}
                    >
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground whitespace-pre-line">
                          {product.description}
                        </div>
                      </div>
                      <div className="font-semibold text-sm">{formatVND(product.price)} VND</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* ORDER DETAIL */}
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-3">Order Detail</h2>

                {orderItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-20">No items in order</div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between border-b pb-2">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="font-medium">{formatVND(item.total)} VND</span>
                      </div>
                    ))}

                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>{formatVND(calculateTotal())} VND</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Review Button */}
            {orderItems.length > 0 && (
              <div className="fixed bottom-6 right--right-6">
                <Button onClick={handleReviewOrder} size="lg" className="shadow-lg">
                  Xem Lại Đơn Hàng
                </Button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

// ReviewOrderPage giữ nguyên như cũ
function ReviewOrderPage({
  orderHeader,
  orderItems,
  onBack,
  onSubmit,
}: {
  orderHeader: any
  orderItems: OrderItem[]
  onBack: () => void
  onSubmit: () => void
}) {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Review Order</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Back to Edit
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-2xl px-4 md:px-6 py-8">
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
                    <td className="text-right text-xl font-bold text-foreground px-4 py-3">
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

          <div className="flex justify-end mt-6">
            <Button onClick={onSubmit} size="lg">
              Submit Order
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
