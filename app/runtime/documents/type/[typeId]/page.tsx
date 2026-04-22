'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Search, Plus, Eye, Edit2, Trash2, 
  Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  FolderOpen, Users, Wallet, Briefcase, Package, Settings,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/layout/page-header'
import { documentStorage, documentTypeStorage } from '@/lib/storage'
import type { Document, DocumentType } from '@/lib/types'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: '草稿', variant: 'secondary', icon: Edit2 },
  pending: { label: '审批中', variant: 'default', icon: Clock },
  approved: { label: '已通过', variant: 'outline', icon: CheckCircle },
  rejected: { label: '已驳回', variant: 'destructive', icon: XCircle },
  cancelled: { label: '已取消', variant: 'secondary', icon: AlertCircle },
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Wallet,
  Briefcase,
  Package,
  Settings,
  FolderOpen,
}

interface PageProps {
  params: Promise<{ typeId: string }>
}

export default function DocumentTypeListPage({ params }: PageProps) {
  const { typeId } = use(params)
  const router = useRouter()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [typeId])

  const loadData = () => {
    setLoading(true)
    const type = documentTypeStorage.getById(typeId)
    setDocumentType(type || null)
    
    if (type) {
      const docs = documentStorage.getByDocumentTypeId(typeId)
      setDocuments(docs)
    }
    setLoading(false)
  }

  const filteredDocuments = documents
    .filter(doc => {
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
      const matchesSearch = !searchQuery || 
        doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.createdByName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleView = (id: string) => {
    router.push(`/runtime/documents/${id}`)
  }

  const handleEdit = (doc: Document) => {
    if (doc.status === 'draft') {
      router.push(`/runtime/documents/${doc.id}/edit`)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此单据吗？')) {
      documentStorage.delete(id)
      loadData()
    }
  }

  const handleCreateNew = () => {
    router.push(`/runtime/documents/create?documentTypeId=${typeId}`)
  }

  const IconComponent = documentType?.icon ? iconMap[documentType.icon] || FolderOpen : FolderOpen

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  if (!documentType) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">单据类型不存在</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  该单据类型可能已被删除或尚未发布
                </p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => router.push('/runtime/documents')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回单据中心
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <PageHeader
            title={documentType.name}
            description={documentType.description || `管理${documentType.name}的所有单据记录`}
          />

          {/* 筛选器 */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索单号或创建人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="pending">审批中</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已驳回</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" onClick={() => router.push('/runtime/documents')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                新建{documentType.name}
              </Button>
            </div>
          </div>

          {/* 单据列表 */}
          <Card className="mt-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">单号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建人</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-muted">
                          <IconComponent className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-muted-foreground">暂无{documentType.name}单据</p>
                        <Button 
                          className="mt-4" 
                          onClick={handleCreateNew}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          创建第一个{documentType.name}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const status = statusConfig[doc.status] || statusConfig.draft
                      const StatusIcon = status.icon
                      return (
                        <TableRow 
                          key={doc.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleView(doc.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {doc.documentNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.createdByName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(doc.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  操作
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(doc.id) }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  查看详情
                                </DropdownMenuItem>
                                {doc.status === 'draft' && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(doc) }}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    编辑
                                  </DropdownMenuItem>
                                )}
                                {(doc.status === 'draft' || doc.status === 'cancelled') && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>共 {filteredDocuments.length} 条记录</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Edit2 className="h-3 w-3" />
                草稿: {documents.filter(d => d.status === 'draft').length}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                审批中: {documents.filter(d => d.status === 'pending').length}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                已通过: {documents.filter(d => d.status === 'approved').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
