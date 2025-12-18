"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { formatVND } from "@/lib/formatVND"

type Order = {
  orderNumber: string
  orderDate: string
  customerPhone: string
  status: string
  subtotal: number
}

export default function OrderStatusPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [filtered, setFiltered] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(data)
        setFiltered(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const lower = searchTerm.toLowerCase()
    setFiltered(orders.filter(o =>
      o.orderNumber.toLowerCase().includes(lower) ||
      o.customerPhone.includes(lower)
    ))
  }, [searchTerm, orders])

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Tra Cứu Tình Trạng Đơn Hàng</h1>
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Nhập mã đơn hàng hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline"><Search className="h-4 w-4" /></Button>
        </div>

        {loading ? (
          <p className="text-center py-10">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Không tìm thấy đơn hàng nào.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Đơn Hàng</TableHead>
                <TableHead>Ngày Đặt</TableHead>
                <TableHead>Số Điện Thoại</TableHead>
                <TableHead>Tình Trạng</TableHead>
                <TableHead className="text-right">Tổng Tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.orderNumber}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.orderDate}</TableCell>
                  <TableCell>{o.customerPhone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm font-medium
                      ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        o.status === 'ORDERED' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'RECEIVED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {o.status === 'PENDING' ? 'Chờ xử lý' :
                       o.status === 'RECEIVED' ? 'Đã nhận' :
                       o.status === 'ORDERED' ? 'Đã đặt NCC' :
                       o.status === 'DELIVERED' ? 'Đã giao' : o.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatVND(o.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
