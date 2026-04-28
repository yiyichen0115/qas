'use client'

import { useState } from 'react'
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
import { Plus, Trash2 } from 'lucide-react'

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
        return { ...r, [columnName]: cellValue }
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
      {/* 表格 */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.id} className="text-xs font-medium whitespace-nowrap">
                    {col.label}
                    {col.required && <span className="text-destructive ml-0.5">*</span>}
                  </TableHead>
                ))}
                {!readOnly && <TableHead className="w-[60px] text-xs font-medium">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (readOnly ? 0 : 1)} className="h-24 text-center">
                    <p className="text-sm text-muted-foreground">暂无数据，点击下方按钮添加</p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((col) => (
                      <TableCell key={col.id} className="py-2">
                        {renderCell(row, col)}
                      </TableCell>
                    ))}
                    {!readOnly && (
                      <TableCell className="py-2">
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

      {/* 添加按钮 */}
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="mr-1.5 h-4 w-4" />
          添加一行
        </Button>
      )}

      {/* 描述信息 */}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
