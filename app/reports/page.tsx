"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { formatVND } from "@/lib/formatVND"

type Order = {
  id: number
  orderNumber: string
  orderDate: string
  customerName: string
  customerPhone: string
  customerEmail: string
  billingToTaxReg: string
  subtotal: number
  items: { id: number; name: string; quantity: number; total: number }[]
  status: string
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)

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
    const customerName = (o.customer_name || "").toLowerCase()  // ← thêm để lọc được theo tên khách hàng luôn

    return (
      orderNumber.includes(lower) ||
      customerPhone.includes(lower) ||
      customerEmail.includes(lower) ||
      billingTaxNumber.includes(lower) ||
      customerName.includes(lower)  // ← lọc thêm theo tên khách hàng
    )
  })

  setFilteredOrders(filtered)
}, [searchTerm, orders, authenticated])
  // Tổng hợp theo sản phẩm
  const aggregateByProduct = () => {
    const map = new Map<number, { name: string; qty: number; total: number }>()
    orders.forEach(o => o.items.forEach(i => {
      if (map.has(i.id)) {
        const e = map.get(i.id)!
        e.qty += i.quantity
        e.total += i.total
      } else {
        map.set(i.id, { name: i.productName, qty: i.quantity, total: i.total })
      }
    }))
    return Array.from(map.values())
  }

  // Tổng hợp theo sản phẩm + SĐT
  const aggregateByProductAndPhone = () => {
    const map = new Map<string, { phone: string; customerName: string; name: string; qty: number; total: number }>()
    orders.forEach(o => {
      o.items.forEach(i => {
        const key = `${o.customer_phone}-${i.id}`
        if (map.has(key)) {
          const e = map.get(key)!
          e.qty += i.quantity
          e.total += i.total
        } else {
          map.set(key, {
            phone: o.customer_phone,
            customerName: o.customer_name || "Không xác định",  // ← Thêm tên khách hàng
            name: i.productName,
            qty: i.quantity,
            total: i.total
          })
        }
      })
    })
    return Array.from(map.values())
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
                    <TableCell>{o.customer_name || "-"}</TableCell>   {/* ← Thêm tên khách hàng */}
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

        <TabsContent value="by-phone-product">
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Tên Khách Hàng</TableHead>   {/* ← Thêm cột mới */}
                  <TableHead>Sản Phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Tổng Tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregateByProductAndPhone().map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell>{a.customerName || "Không xác định"}</TableCell>  {/* ← Lấy tên khách hàng */}
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
