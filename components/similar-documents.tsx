'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, ExternalLink, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { documentStorage } from '@/lib/storage'
import type { Document } from '@/lib/types'

interface SimilarDocumentsProps {
  document: Document
  documentTypeName: string
}

// 相似单据匹配条件类型
type MatchCondition = 'service_station' | 'part' | 'vin' | 'claim_no'

interface SimilarDocumentsGroup {
  condition: MatchCondition
  label: string
  documents: Document[]
  matchField: string
  displayField: string
}

export function SimilarDocuments({ document, documentTypeName }: SimilarDocumentsProps) {
  const router = useRouter()
  const [similarGroups, setSimilarGroups] = useState<SimilarDocumentsGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('service_station')

  useEffect(() => {
    loadSimilarDocuments()
  }, [document])

  const loadSimilarDocuments = () => {
    setIsLoading(true)
    try {
      const allDocs = documentStorage.getAll()
      const groups: SimilarDocumentsGroup[] = []

      // 1. 相同服务站的单据
      const serviceStationCode = document.formData.service_station_code as string
      if (serviceStationCode) {
        const sameStationDocs = allDocs.filter(doc => {
          return doc.id !== document.id &&
                 doc.documentTypeId === document.documentTypeId &&
                 doc.formData.service_station_code === serviceStationCode
        })
        if (sameStationDocs.length > 0) {
          groups.push({
            condition: 'service_station',
            label: `相同服务站 (${serviceStationCode})`,
            documents: sameStationDocs,
            matchField: 'service_station_code',
            displayField: 'service_station_name'
          })
        }
      }

      // 2. 相同配件的单据
      const partDrawingNo = document.formData.part_drawing_no as string
      if (partDrawingNo) {
        const samePartDocs = allDocs.filter(doc => {
          return doc.id !== document.id &&
                 doc.documentTypeId === document.documentTypeId &&
                 doc.formData.part_drawing_no === partDrawingNo
        })
        if (samePartDocs.length > 0) {
          groups.push({
            condition: 'part',
            label: `相同配件 (${partDrawingNo})`,
            documents: samePartDocs,
            matchField: 'part_drawing_no',
            displayField: 'part_name'
          })
        }
      }

      // 3. 相同VIN的单据
      const vin = document.formData.vin as string
      if (vin) {
        const sameVinDocs = allDocs.filter(doc => {
          return doc.id !== document.id &&
                 doc.documentTypeId === document.documentTypeId &&
                 doc.formData.vin === vin
        })
        if (sameVinDocs.length > 0) {
          groups.push({
            condition: 'vin',
            label: `相同VIN (${vin})`,
            documents: sameVinDocs,
            matchField: 'vin',
            displayField: 'vin'
          })
        }
      }

      // 4. 相同索赔单号的关联单据
      const claimNo = document.formData.claim_no as string
      if (claimNo) {
        const sameClaimDocs = allDocs.filter(doc => {
          return doc.id !== document.id &&
                 doc.formData.claim_no === claimNo
        })
        if (sameClaimDocs.length > 0) {
          groups.push({
            condition: 'claim_no',
            label: `相同索赔单 (${claimNo})`,
            documents: sameClaimDocs,
            matchField: 'claim_no',
            displayField: 'claim_no'
          })
        }
      }

      setSimilarGroups(groups)

      // 设置默认激活的标签页
      if (groups.length > 0) {
        setActiveTab(groups[0].condition)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (doc: Document) => {
    router.push(`/runtime/documents/${doc.id}`)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      pending: { label: '待处理', variant: 'default' },
      generated: { label: '已生成', variant: 'default' },
      shipped: { label: '已发货', variant: 'default' },
      scanned: { label: '已扫码', variant: 'outline' },
      received: { label: '已收货', variant: 'outline' },
      completed: { label: '已完成', variant: 'outline' },
      cancelled: { label: '已取消', variant: 'secondary' },
    }

    const config = statusConfig[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">正在查找相似单据...</span>
        </div>
      </div>
    )
  }

  if (similarGroups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-6">
        <div className="text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            未找到相似单据
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">相似单据</span>
        <Badge variant="secondary" className="ml-2">
          {similarGroups.reduce((total, group) => total + group.documents.length, 0)} 条
        </Badge>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {similarGroups.map(group => (
            <TabsTrigger key={group.condition} value={group.condition} className="text-xs">
              <span className="truncate">{group.label}</span>
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {group.documents.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {similarGroups.map(group => (
          <TabsContent key={group.condition} value={group.condition} className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-medium">单号</TableHead>
                    <TableHead className="text-xs font-medium">服务站</TableHead>
                    <TableHead className="text-xs font-medium">配件信息</TableHead>
                    <TableHead className="text-xs font-medium">创建时间</TableHead>
                    <TableHead className="text-xs font-medium">状态</TableHead>
                    <TableHead className="text-xs font-medium w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.documents.map(doc => (
                    <TableRow key={doc.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm">
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={() => handleView(doc)}
                        >
                          {doc.documentNumber}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{doc.formData.service_station_name as string || '-'}</span>
                          <span className="text-xs text-muted-foreground">{doc.formData.service_station_code as string || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{doc.formData.part_name as string || '-'}</span>
                          <span className="text-xs text-muted-foreground">{doc.formData.part_drawing_no as string || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleView(doc)}
                          title="查看详情"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}