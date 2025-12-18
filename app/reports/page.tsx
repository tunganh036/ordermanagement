"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowUpDown } from "lucide-react"  // Thêm ArrowUpDown cho nút sort
import { formatVND } from "@/lib/formatVND"

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

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)

  // Thêm state cho filter và sort của report tổng hợp
  const [productSearch, setProductSearch] = useState("")
  const [phoneProductSearch, setPhoneProductSearch] = useState("")
  const [productSort, setProductSort] = useState<{ field: 'qty' | 'total'; desc: boolean }>({ field: 'total', desc: true })
  const [phoneProductSort, setPhoneProductSort] = useState<{ field: 'qty' | 'total'; desc: boolean }>({ field: 'total', desc: true })

  // Simple password check (thay 'anhnt123' bằng pass thật)
  useEffect(() => {
    const stored = localStorage.getItem('reportPass')
    if (stored === 'anhnt123') {
      setAuthenticated(true)
      fetchOrders()
    }
  }, [])

  const handleLogin = () => {
    if (password === 'anhnt123') {
      localStorage.setItem('reportPass', password)
      setAuthenticated(true)
      fetchOrders()
    } else {
      alert('Mật khẩu sai!')
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data)
      setFilteredOrders(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

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
          map.set(productId, {
            name: productName,
            qty: i.quantity,
            total: i.total
          })
        }
      })
    })
    let result = Array.from(map.values())

    // Filter theo search
    if (productSearch) {
      const lower = productSearch.toLowerCase()
      result = result.filter(a => a.name.toLowerCase().includes(lower))
    }

    // Sort theo state
    result.sort((a, b) => {
      const valA = productSort.field === 'qty' ? a.qty : a.total
      const valB = productSort.field === 'qty' ? b.qty : b.total
      return productSort.desc ? valB - valA : valA - valB
    })

    return result
  }

  // Tổng hợp theo sản phẩm + SĐT
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

    // Filter theo search (tìm theo SĐT, tên KH, sản phẩm)
    if (phoneProductSearch) {
      const lower = phoneProductSearch.toLowerCase()
      result = result.filter(a =>
        a.phone.toLowerCase().includes(lower) ||
        (a.customerName || "").toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower)
      )
    }

    // Sort theo state
    result.sort((a, b) => {
      const valA = phoneProductSort.field === 'qty' ? a.qty : a.total
      const valB = phoneProductSort.field === 'qty' ? b.qty : b.total
      return phoneProductSort.desc ? valB - valA : valA - valB
    })

    return result
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Reports Access</h2>
          <Input
            type="password"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detail">Chi Tiết Đơn Hàng</TabsTrigger>
          <TabsTrigger value="by-product">Tổng Hợp Theo Sản Phẩm</TabsTrigger>
          <TabsTrigger value="by-phone-product">Theo SĐT & Sản Phẩm</TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm mã đơn, SĐT, email, mã thuế..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                  <TableRow key={o.id || o.order_number}>
                    <TableCell className="font-medium">{o.order_number || "-"}</TableCell>
                    <TableCell>{o.order_date || "-"}</TableCell>
                    <TableCell>{o.customer_name || "-"}</TableCell> {/* ← Thêm tên khách hàng */}
                    <TableCell>{o.customer_phone || "-"}</TableCell>
                    <TableCell>{o.customer_email || "-"}</TableCell>
                    <TableCell>{o.billing_tax_number || "-"}</TableCell>
                    <TableCell>{formatVND(o.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="by-product">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm sản phẩm..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">
                    Tổng SL
                    <Button variant="ghost" size="sm" onClick={() => setProductSort({ field: 'qty', desc: !productSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    Tổng Tiền
                    <Button variant="ghost" size="sm" onClick={() => setProductSort({ field: 'total', desc: !productSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
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
        <TabsContent value="by-phone-product">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Tìm SĐT, tên KH, sản phẩm..." value={phoneProductSearch} onChange={(e) => setPhoneProductSearch(e.target.value)} />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Tên Khách Hàng</TableHead>
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">
                    SL
                    <Button variant="ghost" size="sm" onClick={() => setPhoneProductSort({ field: 'qty', desc: !phoneProductSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    Tổng Tiền
                    <Button variant="ghost" size="sm" onClick={() => setPhoneProductSort({ field: 'total', desc: !phoneProductSort.desc })}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
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
      </Tabs>
    </div>
  )
}
