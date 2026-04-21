'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, Car, Plus, Search, Pencil, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { MainLayout } from '@/components/layout/main-layout'
import { partStorage, orderStorage, vehicleStorage } from '@/lib/storage'
import type { Part, Order, Vehicle } from '@/lib/types'

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// 配件管理组件
function PartsManagement() {
  const [parts, setParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Part>>({})

  useEffect(() => {
    setParts(partStorage.getAll())
  }, [])

  const filteredParts = parts.filter(part => 
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingPart(null)
    setFormData({
      partNumber: '',
      partName: '',
      category: '',
      specification: '',
      unit: '件',
      price: 0,
      supplier: '',
      status: 'active',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (part: Part) => {
    setEditingPart(part)
    setFormData(part)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个配件吗？')) {
      partStorage.delete(id)
      setParts(partStorage.getAll())
    }
  }

  const handleSave = () => {
    const part: Part = {
      id: editingPart?.id || generateId('part'),
      partNumber: formData.partNumber || '',
      partName: formData.partName || '',
      category: formData.category,
      specification: formData.specification,
      unit: formData.unit,
      price: formData.price,
      supplier: formData.supplier,
      applicableModels: formData.applicableModels || [],
      status: formData.status as 'active' | 'inactive' || 'active',
      createdAt: editingPart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    partStorage.save(part)
    setParts(partStorage.getAll())
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索配件编号或名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增配件
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>配件编号</TableHead>
              <TableHead>配件名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>规格型号</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>单价</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-mono">{part.partNumber}</TableCell>
                <TableCell>{part.partName}</TableCell>
                <TableCell>{part.category || '-'}</TableCell>
                <TableCell>{part.specification || '-'}</TableCell>
                <TableCell>{part.unit || '-'}</TableCell>
                <TableCell>{part.price ? `¥${part.price}` : '-'}</TableCell>
                <TableCell>
                  <Badge variant={part.status === 'active' ? 'default' : 'secondary'}>
                    {part.status === 'active' ? '启用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(part)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(part.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredParts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无配件数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPart ? '编辑配件' : '新增配件'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>配件编号 *</Label>
                <Input
                  value={formData.partNumber || ''}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>配件名称 *</Label>
                <Input
                  value={formData.partName || ''}
                  onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <Input
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>规格型号</Label>
                <Input
                  value={formData.specification || ''}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>单位</Label>
                <Input
                  value={formData.unit || ''}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>单价</Label>
                <Input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>供应商</Label>
              <Input
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.partNumber || !formData.partName}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 订单管理组件
function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Order>>({})

  useEffect(() => {
    setOrders(orderStorage.getAll())
  }, [])

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.dealerCode?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAdd = () => {
    setEditingOrder(null)
    setFormData({
      orderNumber: '',
      deliveryNumber: '',
      warehouse: '',
      dealerCode: '',
      dealerName: '',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setFormData(order)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个订单吗？')) {
      orderStorage.delete(id)
      setOrders(orderStorage.getAll())
    }
  }

  const handleSave = () => {
    const order: Order = {
      id: editingOrder?.id || generateId('order'),
      orderNumber: formData.orderNumber || '',
      deliveryNumber: formData.deliveryNumber,
      warehouse: formData.warehouse,
      dealerCode: formData.dealerCode,
      dealerName: formData.dealerName,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      status: formData.status as 'pending' | 'shipped' | 'delivered' | 'cancelled' || 'pending',
      items: editingOrder?.items || [],
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    orderStorage.save(order)
    setOrders(orderStorage.getAll())
    setIsDialogOpen(false)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待发货'
      case 'shipped': return '已发货'
      case 'delivered': return '已签收'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'shipped': return 'default'
      case 'delivered': return 'default'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索订单号或发货号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增订单
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>发货号</TableHead>
              <TableHead>发货库</TableHead>
              <TableHead>经销商编码</TableHead>
              <TableHead>经销商名称</TableHead>
              <TableHead>订单日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.orderNumber}</TableCell>
                <TableCell>{order.deliveryNumber || '-'}</TableCell>
                <TableCell>{order.warehouse || '-'}</TableCell>
                <TableCell>{order.dealerCode || '-'}</TableCell>
                <TableCell>{order.dealerName || '-'}</TableCell>
                <TableCell>{order.orderDate || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status) as 'default' | 'secondary' | 'destructive'}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无订单数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOrder ? '编辑订单' : '新增订单'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单号 *</Label>
                <Input
                  value={formData.orderNumber || ''}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>发货号</Label>
                <Input
                  value={formData.deliveryNumber || ''}
                  onChange={(e) => setFormData({ ...formData, deliveryNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发货库</Label>
                <Input
                  value={formData.warehouse || ''}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'pending' | 'shipped' | 'delivered' | 'cancelled' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待发货</SelectItem>
                    <SelectItem value="shipped">已发货</SelectItem>
                    <SelectItem value="delivered">已签收</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>经销商编码</Label>
                <Input
                  value={formData.dealerCode || ''}
                  onChange={(e) => setFormData({ ...formData, dealerCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>经销商名称</Label>
                <Input
                  value={formData.dealerName || ''}
                  onChange={(e) => setFormData({ ...formData, dealerName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单日期</Label>
                <Input
                  type="date"
                  value={formData.orderDate || ''}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>发货日期</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate || ''}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.orderNumber}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 车辆管理组件
function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Vehicle>>({})

  useEffect(() => {
    setVehicles(vehicleStorage.getAll())
  }, [])

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.platform?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAdd = () => {
    setEditingVehicle(null)
    setFormData({
      vin: '',
      platform: '',
      model: '',
      productionDate: '',
      color: '',
      dealerCode: '',
      status: 'active',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData(vehicle)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个车辆吗？')) {
      vehicleStorage.delete(id)
      setVehicles(vehicleStorage.getAll())
    }
  }

  const handleSave = () => {
    const vehicle: Vehicle = {
      id: editingVehicle?.id || generateId('vehicle'),
      vin: formData.vin || '',
      platform: formData.platform,
      model: formData.model,
      productionDate: formData.productionDate,
      engineNumber: formData.engineNumber,
      color: formData.color,
      dealerCode: formData.dealerCode,
      saleDate: formData.saleDate,
      status: formData.status as 'active' | 'inactive' || 'active',
      createdAt: editingVehicle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    vehicleStorage.save(vehicle)
    setVehicles(vehicleStorage.getAll())
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索VIN或车型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增车辆
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>VIN码</TableHead>
              <TableHead>车型平台</TableHead>
              <TableHead>车型</TableHead>
              <TableHead>生产日期</TableHead>
              <TableHead>颜色</TableHead>
              <TableHead>经销商编码</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                <TableCell>{vehicle.platform || '-'}</TableCell>
                <TableCell>{vehicle.model || '-'}</TableCell>
                <TableCell>{vehicle.productionDate || '-'}</TableCell>
                <TableCell>{vehicle.color || '-'}</TableCell>
                <TableCell>{vehicle.dealerCode || '-'}</TableCell>
                <TableCell>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                    {vehicle.status === 'active' ? '正常' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无车辆数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? '编辑车辆' : '新增车辆'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>VIN码 *</Label>
              <Input
                value={formData.vin || ''}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                maxLength={17}
                placeholder="17位VIN码"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>车型平台</Label>
                <Input
                  value={formData.platform || ''}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>车型</Label>
                <Input
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>生产日期</Label>
                <Input
                  type="date"
                  value={formData.productionDate || ''}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>颜色</Label>
                <Input
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>经销商编码</Label>
                <Input
                  value={formData.dealerCode || ''}
                  onChange={(e) => setFormData({ ...formData, dealerCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>销售日期</Label>
              <Input
                type="date"
                value={formData.saleDate || ''}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.vin}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MasterDataPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">基础数据管理</h1>
          <p className="text-muted-foreground mt-1">管理配件、订单、车辆等基础库数据，支持PAC单据字段联动</p>
        </div>

        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              配件库
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              订单库
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              车辆库
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="parts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    配件基础库
                  </CardTitle>
                  <CardDescription>
                    管理配件编号、名称、规格等信息，在PAC单据填写时输入配件编号可自动带出配件名称
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PartsManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    订单基础库
                  </CardTitle>
                  <CardDescription>
                    管理订单号、发货号、发货库等信息，在PAC单据填写时输入订单号可自动带出发货信息
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrdersManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    车辆基础库
                  </CardTitle>
                  <CardDescription>
                    管理车辆VIN码、车型平台、生产日期等信息，支持VIN码联动查询
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VehiclesManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  )
}
