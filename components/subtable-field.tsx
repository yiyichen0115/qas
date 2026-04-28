'use client'

import { useState, useEffect } from 'react'
import type { FormField, SelectOption } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Search, Package } from 'lucide-react'
import { parts, getPartByCode, type Part } from '@/lib/base-data'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface SubtableRow {
  id: string
  [key: string]: unknown
}

interface SubtableFieldProps {
  field: FormField
  value: SubtableRow[]
  onChange?: (value: SubtableRow[]) => void
  readOnly?: boolean
  editableColumns?: string[] // 可编辑的列名
}

// 生成唯一ID
function generateRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function SubtableField({
  field,
  value = [],
  onChange,
  readOnly = false,
  editableColumns,
}: SubtableFieldProps) {
  const columns = field.columns || []
  const [rows, setRows] = useState<SubtableRow[]>(value)
  const [partSelectorOpen, setPartSelectorOpen] = useState(false)
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [partSearchKeyword, setPartSearchKeyword] = useState('')

  // 同步外部value变化
  useEffect(() => {
    setRows(value)
  }, [value])

  // 添加新行
  const addRow = () => {
    const newRow: SubtableRow = { id: generateRowId() }
    columns.forEach((col) => {
      if (col.defaultValue !== undefined) {
        newRow[col.name] = col.defaultValue
      } else if (col.type === 'number') {
        newRow[col.name] = ''
      } else {
        newRow[col.name] = ''
      }
    })
    const newRows = [...rows, newRow]
    setRows(newRows)
    onChange?.(newRows)
  }

  // 从基础数据中添加配件
  const addPartsFromBaseData = () => {
    const newRows: SubtableRow[] = []
    selectedParts.forEach(partCode => {
      const part = getPartByCode(partCode)
      if (part) {
        const newRow: SubtableRow = { id: generateRowId() }
        // 自动填充配件相关字段
        columns.forEach((col) => {
          if (col.name === 'part_drawing_no' || col.name === 'material_code') {
            newRow[col.name] = part.code
          } else if (col.name === 'part_name' || col.name === 'material_name') {
            newRow[col.name] = part.name
          } else if (col.name === 'unit_price' || col.name === 'price') {
            newRow[col.name] = part.price
          } else if (col.name === 'unit') {
            newRow[col.name] = part.unit
          } else if (col.defaultValue !== undefined) {
            newRow[col.name] = col.defaultValue
          } else if (col.type === 'number') {
            newRow[col.name] = col.name.includes('quantity') ? 1 : ''
          } else {
            newRow[col.name] = ''
          }
        })
        newRows.push(newRow)
      }
    })
    
    const updatedRows = [...rows, ...newRows]
    setRows(updatedRows)
    onChange?.(updatedRows)
    setSelectedParts([])
    setPartSelectorOpen(false)
  }

  // 删除行
  const deleteRow = (rowId: string) => {
    const newRows = rows.filter((r) => r.id !== rowId)
    setRows(newRows)
    onChange?.(newRows)
  }

  // 更新单元格
  const updateCell = (rowId: string, columnName: string, cellValue: unknown) => {
    const newRows = rows.map((r) => {
      if (r.id === rowId) {
        const updatedRow = { ...r, [columnName]: cellValue }
        
        // 如果更新的是配件编码，自动填充配件名称和单价
        if ((columnName === 'part_drawing_no' || columnName === 'material_code') && typeof cellValue === 'string') {
          const part = getPartByCode(cellValue)
          if (part) {
            columns.forEach((col) => {
              if (col.name === 'part_name' || col.name === 'material_name') {
                updatedRow[col.name] = part.name
              } else if (col.name === 'unit_price' || col.name === 'price') {
                updatedRow[col.name] = part.price
              } else if (col.name === 'unit') {
                updatedRow[col.name] = part.unit
              }
            })
          }
        }
        
        // 自动计算金额 = 数量 * 单价
        const quantityCol = columns.find(c => c.name.includes('quantity'))
        const priceCol = columns.find(c => c.name.includes('price') || c.name === 'unit_price')
        const amountCol = columns.find(c => c.name.includes('amount') || c.name === 'total_amount')
        
        if (quantityCol && priceCol && amountCol) {
          const qty = Number(updatedRow[quantityCol.name]) || 0
          const price = Number(updatedRow[priceCol.name]) || 0
          updatedRow[amountCol.name] = qty * price
        }
        
        return updatedRow
      }
      return r
    })
    setRows(newRows)
    onChange?.(newRows)
  }

  // 检查列是否可编辑
  const isColumnEditable = (columnName: string) => {
    if (readOnly) return false
    if (!editableColumns) return true // 默认所有列可编辑
    return editableColumns.includes(columnName)
  }

  // 过滤配件列表
  const filteredParts = parts.filter(p => {
    if (!p.enabled) return false
    if (!partSearchKeyword) return true
    const keyword = partSearchKeyword.toLowerCase()
    return p.code.toLowerCase().includes(keyword) || p.name.toLowerCase().includes(keyword)
  })

  // 渲染单元格内容
  const renderCell = (row: SubtableRow, column: FormField) => {
    const cellValue = row[column.name]
    const editable = isColumnEditable(column.name)

    if (!editable) {
      // 只读模式，显示值
      if (column.type === 'select' || column.type === 'radio') {
        const option = column.options?.find((o) => o.value === cellValue)
        return <span className="text-sm">{option?.label || String(cellValue || '-')}</span>
      }
      if (column.type === 'number' && (column.name.includes('price') || column.name.includes('amount'))) {
        return <span className="text-sm">{cellValue ? `¥${Number(cellValue).toFixed(2)}` : '-'}</span>
      }
      return <span className="text-sm">{String(cellValue || '-')}</span>
    }

    // 编辑模式
    switch (column.type) {
      case 'text':
        return (
          <Input
            value={String(cellValue || '')}
            onChange={(e) => updateCell(row.id, column.name, e.target.value)}
            placeholder={column.placeholder}
            className="h-8 text-sm"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={cellValue as number | ''}
            onChange={(e) =>
              updateCell(row.id, column.name, e.target.value ? Number(e.target.value) : '')
            }
            placeholder={column.placeholder}
            min={column.min}
            max={column.max}
            className="h-8 text-sm"
          />
        )
      case 'select':
        return (
          <Select
            value={String(cellValue || '')}
            onValueChange={(v) => updateCell(row.id, column.name, v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={column.placeholder || '请选择'} />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((opt: SelectOption) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            value={String(cellValue || '')}
            onChange={(e) => updateCell(row.id, column.name, e.target.value)}
            placeholder={column.placeholder}
            className="h-8 text-sm"
          />
        )
    }
  }

  // 只读模式下的空状态
  if (readOnly && rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 标题和操作按钮 */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{field.label}</span>
            {rows.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {rows.length} 条
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPartSelectorOpen(true)}>
              <Package className="mr-1.5 h-4 w-4" />
              从基础数据选择
            </Button>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-4 w-4" />
              手动添加
            </Button>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] text-xs font-medium text-center">序号</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.id} className="text-xs font-medium whitespace-nowrap min-w-[100px]">
                    {col.label}
                    {col.required && <span className="text-destructive ml-0.5">*</span>}
                  </TableHead>
                ))}
                {!readOnly && <TableHead className="w-[60px] text-xs font-medium text-center">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                    <p className="text-sm text-muted-foreground">暂无数据，请添加明细</p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.id} className="py-2">
                        {renderCell(row, col)}
                      </TableCell>
                    ))}
                    {!readOnly && (
                      <TableCell className="py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteRow(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 描述信息 */}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {/* 配件选择弹窗 */}
      <Dialog open={partSelectorOpen} onOpenChange={setPartSelectorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>从基础数据选择配件</DialogTitle>
          </DialogHeader>
          
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索配件编码或名称..."
              value={partSearchKeyword}
              onChange={(e) => setPartSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 配件列表 */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">选择</TableHead>
                  <TableHead>配件编码</TableHead>
                  <TableHead>配件名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>单位</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      未找到匹配的配件
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedParts.includes(part.code)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedParts([...selectedParts, part.code])
                            } else {
                              setSelectedParts(selectedParts.filter(c => c !== part.code))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{part.code}</TableCell>
                      <TableCell>{part.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{part.category}</Badge>
                      </TableCell>
                      <TableCell>{part.unit}</TableCell>
                      <TableCell className="text-right">¥{part.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {selectedParts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              已选择 {selectedParts.length} 个配件
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPartSelectorOpen(false)
              setSelectedParts([])
            }}>
              取消
            </Button>
            <Button onClick={addPartsFromBaseData} disabled={selectedParts.length === 0}>
              确定添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
