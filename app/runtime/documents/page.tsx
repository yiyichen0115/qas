'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  FileText, Search, Plus, Eye, Edit2, Trash2, 
  Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  FolderOpen, Users, Wallet, Briefcase, Package, Settings,
  LayoutGrid, List
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
import { documentStorage, documentTypeStorage, userStorage } from '@/lib/storage'
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

const IconComponent = ({ name }: { name?: string }) => {
  const Icon = iconMap[name || 'FolderOpen'] || FolderOpen
  return <Icon className="h-5 w-5" />
}

function DocumentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docTypeIdParam = searchParams.get('documentTypeId') || searchParams.get('formId')
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>(docTypeIdParam || 'all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(docTypeIdParam ? 'list' : 'cards')
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof userStorage.getCurrentUser>>(null)

  useEffect(() => {
    loadData()
    setCurrentUser(userStorage.getCurrentUser())
  }, [])

  useEffect(() => {
    if (docTypeIdParam) {
      setSelectedDocTypeId(docTypeIdParam)
      setViewMode('list')
    }
  }, [docTypeIdParam])

  const loadData = () => {
    setDocuments(documentStorage.getAll())
    setDocumentTypes(documentTypeStorage.getPublished())
  }

  const filteredDocuments = documents
    .filter(doc => {
      const docTypeId = doc.documentTypeId || doc.formId
      const matchesDocType = selectedDocTypeId === 'all' || docTypeId === selectedDocTypeId
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
      const matchesSearch = !searchQuery || 
        doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.createdByName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDocType && matchesStatus && matchesSearch
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredDocumentTypes = documentTypes.filter(dt => {
    const matchesSearch = !searchQuery || 
      dt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getDocTypeName = (docTypeId: string) => {
    const docType = documentTypes.find(dt => dt.id === docTypeId)
    return docType?.name || '未知类型'
  }

  const getDocumentCount = (docTypeId: string) => {
    return documents.filter(d => (d.documentTypeId || d.formId) === docTypeId).length
  }

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

  const handleCreateNew = (docTypeId?: string) => {
    if (docTypeId) {
      router.push(`/runtime/documents/create?documentTypeId=${docTypeId}`)
    } else if (selectedDocTypeId && selectedDocTypeId !== 'all') {
      router.push(`/runtime/documents/create?documentTypeId=${selectedDocTypeId}`)
    } else if (documentTypes.length > 0) {
      if (documentTypes.length === 1) {
        router.push(`/runtime/documents/create?documentTypeId=${documentTypes[0].id}`)
      } else {
        router.push('/runtime/documents/select-type')
      }
    }
  }

  const handleViewDocuments = (docTypeId: string) => {
    // 跳转到单据类型专属列表页面
    router.push(`/runtime/documents/type/${docTypeId}`)
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <PageHeader
            title="单据中心"
            description="选择表单创建新的业务单据或查看已有记录"
          />

          {/* 筛选器和视图切换 */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={viewMode === 'cards' ? '搜索表单...' : '搜索单号或创建人...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {viewMode === 'list' && (
              <>
                <Select value={selectedDocTypeId} onValueChange={setSelectedDocTypeId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {documentTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id}>
                        {dt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
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
              </>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center border rounded-lg p-1">
                <Button 
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => {
                    setViewMode('cards')
                    setSelectedDocTypeId('all')
                  }}
                >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  表单
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  列表
                </Button>
              </div>
              
              <Button onClick={() => handleCreateNew()}>
                <Plus className="mr-2 h-4 w-4" />
                新建单据
              </Button>
            </div>
          </div>

          {/* 表单卡片视图 */}
          {viewMode === 'cards' && (
            <div className="mt-6">
              {filteredDocumentTypes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">暂无可用表单</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      请联系管理员在设计中心创建并发布表单
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredDocumentTypes.map((docType) => (
                    <Card 
                      key={docType.id} 
                      className="group transition-all hover:shadow-md cursor-pointer"
                      onClick={() => handleViewDocuments(docType.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <IconComponent name={docType.icon} />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {docType.code || '未分类'}
                          </Badge>
                        </div>
                        <CardTitle className="mt-3 text-base">{docType.name}</CardTitle>
                        {docType.description && (
                          <CardDescription className="line-clamp-2">
                            {docType.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{docType.fields.length} 个字段</span>
                          <span>{getDocumentCount(docType.id)} 条记录</span>
                        </div>
                        {docType.numberRule?.prefix && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            单号: {docType.numberRule.prefix}***
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); handleCreateNew(docType.id) }}
                          >
                            <Plus className="mr-1.5 h-4 w-4" />
                            新建单据
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleViewDocuments(docType.id) }}
                          >
                            查看
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 单据列表视图 */}
          {viewMode === 'list' && (
            <>
              <Card className="mt-6">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">单号</TableHead>
                        <TableHead>单据类型</TableHead>
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
                          <TableCell colSpan={7} className="text-center py-16">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">暂无单据</p>
                            {selectedDocTypeId !== 'all' && (
                              <Button 
                                className="mt-4" 
                                onClick={() => handleCreateNew(selectedDocTypeId)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                创建第一个单据
                              </Button>
                            )}
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
                              <TableCell>{getDocTypeName(doc.documentTypeId || doc.formId)}</TableCell>
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
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    }>
      <DocumentsContent />
    </Suspense>
  )
}
