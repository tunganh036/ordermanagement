"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, ArrowUpDown, Download, Upload } from "lucide-react"
import { formatVND } from "@/lib/formatVND"
import Papa from "papaparse"

type Order = {
  id: number
  order_number: string
  order_date: string
  customer_name: string
  customer_phone: string
  customer_email: string
  billing_tax_number: string
  subtotal: number
  order_items: { product_id: number; product_name: string; quantity: number; total: number }[]
  status: string
}

type OrderDetail = {
  order_number: string
  order_date: string
  customer_name: string
  customer_phone: string
  product_name: string
  quantity: number
  total: number
  status: string
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)

  // State cho filter và sort các tab
  const [productSearch, setProductSearch] = useState("")
  const [phoneProductSearch, setPhoneProductSearch] = useState("")
  const [detailSearch, setDetailSearch] = useState("")
  const [productSort, setProductSort] = useState<{ field: "name" | "qty" | "total"; desc: boolean }>({ field: "total", desc: true })
  const [phoneProductSort, setPhoneProductSort] = useState<{ field: "phone" | "name" | "qty" | "total"; desc: boolean }>({ field: "total", desc: true })
  const [orderDetailSort, setOrderDetailSort] = useState<{ field: "customer_phone" | "order_number" | "order_date"; desc: boolean }>({ field: "order_number", desc: true })

  // State cho tab Cập Nhật Trạng Thái
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [batchStatus, setBatchStatus] = useState<string>("")
  const [statusUpdates, setStatusUpdates] = useState<{ [id: number]: string }>({})

  // Password mới
  useEffect(() => {
    const stored = localStorage.getItem("reportPass")
    if (stored === "Tunganh@123") {
      setAuthenticated(true)
      fetchOrders()
    }
  }, [])

  const handleLogin = () => {
    if (password === "Tunganh@123") {
      localStorage.setItem("reportPass", password)
      setAuthenticated(true)
      fetchOrders()
    } else {
      alert("Mật khẩu sai!")
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(data)
      setFilteredOrders(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  // Filter cho tab Tổng Hợp Đơn Hàng
  useEffect(() => {
    if (!authenticated) return
    const lower = searchTerm.toLowerCase()
    const filtered = orders.filter(o => {
      const orderNumber = (o.order_number || "").toLowerCase()
      const customerPhone = (o.customer_phone || "").toLowerCase()
      const customerEmail = (o.customer_email || "").toLowerCase()
      const billingTaxNumber = (o.billing_tax_number || "").toLowerCase()
      const customerName = (o.customer_name || "").toLowerCase()
      return (
        orderNumber.includes(lower) ||
        customerPhone.includes(lower) ||
        customerEmail.includes(lower) ||
        billingTaxNumber.includes(lower) ||
        customerName.includes(lower)
      )
    })
    setFilteredOrders(filtered)
  }, [searchTerm, orders, authenticated])

  // Report chi tiết join header + line
  const getOrderDetails = () => {
    let details: OrderDetail[] = []
    orders.forEach(o => {
      (o.order_items || []).forEach(i => {
        details.push({
          order_number: o.order_number,
          order_date: o.order_date,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          product_name: i.product_name || "Không xác định",
          quantity: i.quantity,
          total: i.total,
          status: o.status
        })
      })
    })

    // Filter
    if (detailSearch) {
      const lower = detailSearch.toLowerCase()
      details = details.filter(d =>
        (d.order_number || "").toLowerCase().includes(lower) ||
        (d.customer_phone || "").toLowerCase().includes(lower)
      )
    }

    // Sort
    details.sort((a, b) => {
      if (orderDetailSort.field === "customer_phone") {
        const compare = a.customer_phone.localeCompare(b.customer_phone)
        return orderDetailSort.desc ? -compare : compare
      }
      if (orderDetailSort.field === "order_number") {
        const compare = a.order_number.localeCompare(b.order_number)
        return orderDetailSort.desc ? -compare : compare
      }
      const dateA = new Date(a.order_date).getTime()
      const dateB = new Date(b.order_date).getTime()
      return orderDetailSort.desc ? dateB - dateA : dateA - dateB
    })

    return details
  }

  // Tổng hợp theo sản phẩm
  const aggregateByProduct = () => {
    const map = new Map<number, { name: string; qty: number; total: number }>()
    orders.forEach(o => {
      (o.order_items || []).forEach((i: any) => {
        const productId = i.product_id
        const productName = i.product_name || "Không xác định"
        if (map.has(productId)) {
          const e = map.get(productId)!
          e.qty += i.quantity
          e.total += i.total
        } else {
          map.set(productId, { name: productName, qty: i.quantity, total: i.total })
        }
      })
    })
    let result = Array.from(map.values())

    if (productSearch) {
      const lower = productSearch.toLowerCase()
      result = result.filter(a => a.name.toLowerCase().includes(lower))
    }

    result.sort((a, b) => {
      if (productSort.field === "name") {
        const compare = a.name.localeCompare(b.name)
        return productSort.desc ? -compare : compare
      }
      const valA = productSort.field === "qty" ? a.qty : a.total
      const valB = productSort.field === "qty" ? b.qty : b.total
      return productSort.desc ? valB - valA : valA - valB
    })

    return result
  }

  // Tổng hợp theo SĐT & Sản Phẩm
  const aggregateByProductAndPhone = () => {
    const map = new Map<string, { phone: string; customerName: string; name: string; qty: number; total: number }>()
    orders.forEach(o => {
      (o.order_items || []).forEach((i: any) => {
        const key = `${o.customer_phone}-${i.product_id}`
        const productName = i.product_name || "Không xác định"
        if (map.has(key)) {
          const e = map.get(key)!
          e.qty += i.quantity
          e.total += i.total
        } else {
          map.set(key, {
            phone: o.customer_phone,
            customerName: o.customer_name || "Không xác định",
            name: productName,
            qty: i.quantity,
            total: i.total
          })
        }
      })
    })
    let result = Array.from(map.values())

    if (phoneProductSearch) {
      const lower = phoneProductSearch.toLowerCase()
      result = result.filter(a =>
        a.phone.toLowerCase().includes(lower) ||
        (a.customerName || "").toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower)
      )
    }

    result.sort((a, b) => {
      if (phoneProductSort.field === "phone") {
        const compare = a.phone.localeCompare(b.phone)
        return phoneProductSort.desc ? -compare : compare
      }
      if (phoneProductSort.field === "name") {
        const compare = a.name.localeCompare(b.name)
        return phoneProductSort.desc ? -compare : compare
      }
      const valA = phoneProductSort.field === "qty" ? a.qty : a.total
      const valB = phoneProductSort.field === "qty" ? b.qty : b.total
      return phoneProductSort.desc ? valB - valA : valA - valB
    })

    return result
  }

  // Cập nhật trạng thái
  const updateOrderStatus = async () => {
    const updates = Object.entries(statusUpdates)
      .filter(([id, status]) => status && status !== orders.find(o => o.id === Number(id))?.status)  // Chỉ update nếu thay đổi
      .map(([id, status]) => ({ id: Number(id), status }))
  
    if (updates.length === 0) {
      alert("Chưa có thay đổi trạng thái nào!")
      return
    }
  
    console.log("[DEBUG] Sending updates:", updates)  // Log để check
  
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchUpdates: updates })  // ← Thống nhất dùng batchUpdates cho cả 2 trường hợp
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Update failed: ${res.status} ${errorText}`)
      }
  
      fetchOrders()
      setStatusUpdates({})
      alert("Cập nhật thành công!")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Cập nhật thất bại!")
    }
  }

  // Download CSV
  const downloadCSV = () => {
    const csvData = orders.map(o => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status
    }))
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "orders_status.csv"
    link.click()
  }

  // Upload CSV
  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      complete: async results => {
        const updates = results.data.map((row: any) => ({
          id: Number(row.id),
          status: row.status
        })).filter(u => u.id && u.status)
        try {
          const res = await fetch("/api/orders/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
          })
          if (!res.ok) throw new Error("Upload failed")
          fetchOrders()
          alert("Upload và cập nhật thành công!")
        } catch (err) {
          alert("Upload thất bại!")
        }
      }
    })
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Reports Access</h2>
          <Input type="password" placeholder="Nhập mật khẩu..." value={password} onChange={e => setPassword(e.target.value)} className="mb-4" />
          <Button onClick={handleLogin} className="w-full">Đăng nhập</Button>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6">Báo Cáo Đơn Hàng (Admin)</h1>

      <Tabs defaultValue="detail">
        <TabsList className="flex flex-wrap gap-2 justify-start mb-6 h-auto">
          <TabsTrigger value="detail">Tổng Hợp Đơn Hàng</TabsTrigger>
          <TabsTrigger value="by-product">Theo Sản Phẩm</TabsTrigger>
          <TabsTrigger value="by-phone-product">Theo SĐT & Sản Phẩm</TabsTrigger>
          <TabsTrigger value="update-status">Cập Nhật Trạng Thái</TabsTrigger>
          <TabsTrigger value="order-details">Chi Tiết Đơn Hàng</TabsTrigger>
        </TabsList>

        {/* Tab Chi Tiết Đơn Hàng (Tổng Hợp Đơn Hàng) */}
        <TabsContent value="detail">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm mã đơn, SĐT, email, mã thuế..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mã Thuế</TableHead>
                  <TableHead>Tổng Tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>{o.order_date}</TableCell>
                    <TableCell>{o.customer_name}</TableCell>
                    <TableCell>{o.customer_phone}</TableCell>
                    <TableCell>{o.customer_email}</TableCell>
                    <TableCell>{o.billing_tax_number || "-"}</TableCell>
                    <TableCell>{formatVND(o.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Tổng Hợp Theo Sản Phẩm */}
        <TabsContent value="by-product">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm sản phẩm..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">Tổng SL</TableHead>
                  <TableHead className="text-right">Tổng Tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregateByProduct().map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-right">{a.qty}</TableCell>
                    <TableCell className="text-right">{formatVND(a.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Theo SĐT & Sản Phẩm */}
        <TabsContent value="by-phone-product">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm SĐT, tên KH, sản phẩm..." value={phoneProductSearch} onChange={e => setPhoneProductSearch(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Tên Khách Hàng</TableHead>
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Tổng Tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregateByProductAndPhone().map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell>{a.customerName || "Không xác định"}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-right">{a.qty}</TableCell>
                    <TableCell className="text-right">{formatVND(a.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Cập Nhật Trạng Thái */}
        <TabsContent value="update-status">
          <Card className="p-4">
            <div className="flex gap-4 mb-4 items-center">
              <Button onClick={updateOrderStatus} disabled={Object.keys(statusUpdates).length === 0}>
                Lưu Thay Đổi
              </Button>
              <Button onClick={downloadCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <label className="cursor-pointer">
                <Input type="file" accept=".csv" onChange={handleUploadCSV} className="hidden" />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </span>
                </Button>
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>Trạng Thái Hiện Tại</TableHead>
                  <TableHead>Cập Nhật Trạng Thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(o.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedOrders([...selectedOrders, o.id])
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== o.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>{o.customer_phone}</TableCell>
                    <TableCell>{o.customer_name}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>
                      <Select
                        value={statusUpdates[o.id] || o.status}
                        onValueChange={value => setStatusUpdates({ ...statusUpdates, [o.id]: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                          <SelectItem value="RECEIVED">Đã nhận</SelectItem>
                          <SelectItem value="ORDERED">Đã đặt NCC</SelectItem>
                          <SelectItem value="DELIVERED">Đã giao</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Chi Tiết Đơn Hàng Join */}
        <TabsContent value="order-details">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm SĐT, số đơn hàng..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Số Đơn Hàng
                    <Button variant="ghost" size="sm" onClick={() => setOrderDetailSort(prev => ({ ...prev, desc: !prev.desc }))}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    Ngày Đặt Hàng
                    <Button variant="ghost" size="sm" onClick={() => setOrderDetailSort({ field: "order_date", desc: !orderDetailSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    SĐT
                    <Button variant="ghost" size="sm" onClick={() => setOrderDetailSort({ field: "customer_phone", desc: !orderDetailSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Tên Khách Hàng</TableHead>
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">Số Lượng</TableHead>
                  <TableHead className="text-right">Thành Tiền</TableHead>
                  <TableHead>Tình Trạng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getOrderDetails().map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.order_number}</TableCell>
                    <TableCell>{d.order_date}</TableCell>
                    <TableCell>{d.customer_phone}</TableCell>
                    <TableCell>{d.customer_name}</TableCell>
                    <TableCell>{d.product_name}</TableCell>
                    <TableCell className="text-right">{d.quantity}</TableCell>
                    <TableCell className="text-right">{formatVND(d.total)}</TableCell>
                    <TableCell>{d.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
