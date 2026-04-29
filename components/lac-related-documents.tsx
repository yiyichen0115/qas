'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowRight, Calendar, User, MapPin, AlertCircle, CheckCircle, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { documentStorage } from '@/lib/storage'
import type { Document } from '@/lib/types'

interface LACRelatedDocumentsProps {
  lacDocument: Document // 当前LAC单据
}

export function LACRelatedDocuments({ lacDocument }: LACRelatedDocumentsProps) {
  const router = useRouter()
  const [relatedDocs, setRelatedDocs] = useState<{
    returnGoods: Document[]
    sameClaims: Document[]
  }>({
    returnGoods: [],
    sameClaims: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRelatedDocuments()
  }, [lacDocument])

  const loadRelatedDocuments = () => {
    setIsLoading(true)
    try {
      const allDocs = documentStorage.getAll()
      const lacClaimNo = lacDocument.formData.claim_no as string

      // 查找关联回货单
      const returnGoodsDocs = allDocs.filter(doc => {
        return doc.formData.claim_no === lacClaimNo &&
               doc.documentTypeId === 'doctype_return_goods'
      })

      // 查找相同索赔单的其他LAC单据
      const sameClaimDocs = allDocs.filter(doc => {
        return doc.id !== lacDocument.id &&
               doc.formData.claim_no === lacClaimNo &&
               doc.documentTypeId === lacDocument.documentTypeId
      })

      setRelatedDocs({
        returnGoods: returnGoodsDocs,
        sameClaims: sameClaimDocs
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {
      label: string
      icon: React.ReactNode
      color: string
      bgColor: string
    }> = {
      draft: {
        label: '草稿',
        icon: <Clock className="h-3 w-3" />,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50'
      },
      generated: {
        label: '已生成',
        icon: <Package className="h-3 w-3" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      shipped: {
        label: '已发货',
        icon: <Package className="h-3 w-3" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      scanned: {
        label: '已扫码',
        icon: <CheckCircle className="h-3 w-3" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50'
      },
      received: {
        label: '已收货',
        icon: <CheckCircle className="h-3 w-3" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      completed: {
        label: '已完成',
        icon: <CheckCircle className="h-3 w-3" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      }
    }

    return statusMap[status] || {
      label: status,
      icon: <Clock className="h-3 w-3" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    }
  }

  const handleViewDocument = (doc: Document) => {
    router.push(`/runtime/documents/${doc.id}`)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">正在加载关联单据...</span>
        </div>
      </div>
    )
  }

  const hasRelatedDocs = relatedDocs.returnGoods.length > 0 || relatedDocs.sameClaims.length > 0

  if (!hasRelatedDocs) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted-foreground/5 flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            该索赔单暂无关联单据
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 关联回货单 */}
      {relatedDocs.returnGoods.length > 0 && (
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100">
                <Package className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span>关联回货单</span>
              <Badge variant="secondary" className="ml-auto">
                {relatedDocs.returnGoods.length} 条
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {relatedDocs.returnGoods.map((doc, index) => {
                const statusInfo = getStatusInfo(doc.status)
                return (
                  <div key={doc.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* 单号和状态 */}
                        <div className="flex items-center gap-2">
                          <button
                            className="text-primary hover:underline font-medium text-sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            {doc.documentNumber}
                          </button>
                          <Badge variant="outline" className={`text-xs ${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                            <span className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </Badge>
                        </div>

                        {/* 详细信息 */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{doc.formData.shipping_warehouse as string || '未指定发货地'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{doc.formData.service_station_name as string || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span>数量：{doc.formData.material_quantity as string || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* 问题类型 */}
                        {doc.formData.problem_type && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {doc.formData.problem_type as string}
                            </span>
                            {doc.formData.problem_remark && (
                              <span className="text-xs text-muted-foreground">
                                - {doc.formData.problem_remark as string}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewDocument(doc)}
                        title="查看详情"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 相同索赔单的其他LAC单据 */}
      {relatedDocs.sameClaims.length > 0 && (
        <Card className="border-purple-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-100">
                <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <span>相同索赔单的其他LAC单据</span>
              <Badge variant="secondary" className="ml-auto">
                {relatedDocs.sameClaims.length} 条
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {relatedDocs.sameClaims.map((doc, index) => {
                const statusInfo = getStatusInfo(doc.status)
                return (
                  <div key={doc.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            className="text-primary hover:underline font-medium text-sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            {doc.documentNumber}
                          </button>
                          <Badge variant="outline" className={`text-xs ${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                            <span className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {doc.formData.service_station_name as string || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewDocument(doc)}
                        title="查看详情"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}