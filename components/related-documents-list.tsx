'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Printer, Package, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { documentStorage } from '@/lib/storage'
import type { Document, RelatedDocumentConfig } from '@/lib/types'

interface RelatedDocumentsListProps {
  config: RelatedDocumentConfig
  sourceValue: string // 源字段的值（如索赔单号）
  documentId: string // 当前单据ID
  onCreateClick?: () => void // 创建回货单的回调
}

// 状态配置
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  pending: { label: '待处理', variant: 'default' },
  pending_shipping: { label: '待发货', variant: 'default' },
  shipped: { label: '已发货', variant: 'default' },
  pending_receive: { label: '待签收', variant: 'default' },
  received: { label: '已签收', variant: 'outline' },
  pending_audit: { label: '待审核', variant: 'default' },
  completed: { label: '已完成', variant: 'outline' },
  closed: { label: '已关闭', variant: 'secondary' },
}

// 收货状态配置
const receiveStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待收货', color: 'text-amber-600 bg-amber-50' },
  partial: { label: '部分收货', color: 'text-blue-600 bg-blue-50' },
  complete: { label: '已收货', color: 'text-green-600 bg-green-50' },
  rejected: { label: '已拒收', color: 'text-red-600 bg-red-50' },
}

// 审核结果配置
const auditResultConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'text-amber-600 bg-amber-50' },
  pass: { label: '通过', color: 'text-green-600 bg-green-50' },
  fail: { label: '不通过', color: 'text-red-600 bg-red-50' },
  push_supplier: { label: '推供应商', color: 'text-purple-600 bg-purple-50' },
}

export function RelatedDocumentsList({ 
  config, 
  sourceValue, 
  documentId,
  onCreateClick 
}: RelatedDocumentsListProps) {
  const router = useRouter()
  const [relatedDocs, setRelatedDocs] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRelatedDocuments()
  }, [sourceValue, config.docTypeId])

  const loadRelatedDocuments = () => {
    setIsLoading(true)
    try {
      // 获取所有单据，按关联字段筛选
      const allDocs = documentStorage.getAll()
      const filtered = allDocs.filter(doc => {
        // 匹配单据类型
        if (doc.documentTypeId !== config.docTypeId) return false
        // 匹配关联字段值
        const linkValue = doc.formData[config.linkField]
        return linkValue === sourceValue
      })
      setRelatedDocs(filtered)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (doc: Document) => {
    router.push(`/runtime/documents/${doc.id}`)
  }

  const handlePrint = (doc: Document) => {
    // 打开打印预览
    window.open(`/runtime/documents/${doc.id}/print`, '_blank')
  }

  // 获取单据状态显示值
  const getDocStatus = (doc: Document, field: string) => {
    // 优先使用 doc.status
    const statusValue = field === 'return_goods_status' ? doc.status : doc.formData[field]
    const status = statusConfig[String(statusValue)] || { label: String(statusValue), variant: 'secondary' }
    return <Badge variant={status.variant}>{status.label}</Badge>
  }
  
  // 格式化字段值
  const formatValue = (doc: Document, field: string, value: unknown, format?: string) => {
    if (value === undefined || value === null || value === '') return '-'
    
    if (field === 'return_goods_status') {
      return getDocStatus(doc, field)
    }
    
    if (field === 'receive_status') {
      const status = receiveStatusConfig[String(value)] || { label: String(value), color: 'text-muted-foreground' }
      return <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
    }
    
    if (field === 'quality_audit_result') {
      const result = auditResultConfig[String(value)] || { label: String(value), color: 'text-muted-foreground' }
      return <span className={`text-xs px-2 py-0.5 rounded ${result.color}`}>{result.label}</span>
    }
    
    if (format === 'date' && value) {
      return new Date(String(value)).toLocaleDateString()
    }
    
    if (format === 'datetime' && value) {
      return new Date(String(value)).toLocaleString()
    }
    
    if (format === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }
    
    return String(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{config.docTypeName}</span>
          {relatedDocs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {relatedDocs.length} 条
            </Badge>
          )}
        </div>
        {config.allowCreate && onCreateClick && (
          <Button variant="outline" size="sm" onClick={onCreateClick}>
            <Plus className="mr-1.5 h-4 w-4" />
            {config.createButtonText || '新建'}
          </Button>
        )}
      </div>

      {/* 列表 */}
      {relatedDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8">
          <div className="text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {config.emptyText || '暂无关联单据'}
            </p>
            {config.allowCreate && onCreateClick && (
              <Button variant="link" size="sm" className="mt-2" onClick={onCreateClick}>
                <Plus className="mr-1 h-4 w-4" />
                {config.createButtonText || '新建'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {config.displayColumns.map(col => (
                  <TableHead 
                    key={col.field} 
                    style={{ width: col.width }}
                    className="text-xs font-medium"
                  >
                    {col.label}
                  </TableHead>
                ))}
                {config.actions && config.actions.length > 0 && (
                  <TableHead className="text-xs font-medium w-24">操作</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedDocs.map(doc => (
                <TableRow key={doc.id} className="hover:bg-muted/30">
                  {config.displayColumns.map(col => (
                    <TableCell key={col.field} className="text-sm">
                      {col.field === 'return_goods_no' ? (
                        <button 
                          className="text-primary hover:underline font-medium"
                          onClick={() => handleView(doc)}
                        >
                          {doc.documentNumber || formatValue(doc, col.field, doc.formData[col.field], col.format)}
                        </button>
                      ) : (
                        formatValue(doc, col.field, doc.formData[col.field], col.format)
                      )}
                    </TableCell>
                  ))}
                  {config.actions && config.actions.length > 0 && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {config.actions.map(action => (
                          <Button
                            key={action.code}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              if (action.code === 'view') handleView(doc)
                              if (action.code === 'print') handlePrint(doc)
                            }}
                            title={action.label}
                          >
                            {action.icon === 'Eye' && <Eye className="h-4 w-4" />}
                            {action.icon === 'Printer' && <Printer className="h-4 w-4" />}
                            {action.icon === 'ExternalLink' && <ExternalLink className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
