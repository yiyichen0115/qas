'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  HelpCircle,
  Wrench,
  FileCheck,
  Bell,
  ThumbsUp,
} from 'lucide-react'
import { knowledgeStorage, documentTypeStorage, userStorage } from '@/lib/storage'
import type { KnowledgeArticle, KnowledgeCategory, DocumentType } from '@/lib/types'

const categoryOptions: { value: KnowledgeCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'manual', label: '操作手册', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'faq', label: '常见问题', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'troubleshooting', label: '故障排查', icon: <Wrench className="h-4 w-4" /> },
  { value: 'specification', label: '技术规范', icon: <FileCheck className="h-4 w-4" /> },
  { value: 'notice', label: '通知公告', icon: <Bell className="h-4 w-4" /> },
  { value: 'other', label: '其他资料', icon: <FileText className="h-4 w-4" /> },
]

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-orange-100 text-orange-700',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

export default function KnowledgeManagementPage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<KnowledgeArticle | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    category: 'manual' as KnowledgeCategory,
    content: '',
    tags: '',
    keywords: '',
    relatedDocumentTypes: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setArticles(knowledgeStorage.getAll())
    setDocumentTypes(documentTypeStorage.getPublished())
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleCreate = () => {
    setCurrentArticle(null)
    setFormData({
      title: '',
      category: 'manual',
      content: '',
      tags: '',
      keywords: '',
      relatedDocumentTypes: [],
      status: 'draft',
    })
    setEditDialogOpen(true)
  }

  const handleEdit = (article: KnowledgeArticle) => {
    setCurrentArticle(article)
    setFormData({
      title: article.title,
      category: article.category,
      content: article.content,
      tags: article.tags.join(', '),
      keywords: article.keywords.join(', '),
      relatedDocumentTypes: article.relatedDocumentTypes || [],
      status: article.status,
    })
    setEditDialogOpen(true)
  }

  const handleView = (article: KnowledgeArticle) => {
    setCurrentArticle(article)
    knowledgeStorage.incrementViewCount(article.id)
    setViewDialogOpen(true)
  }

  const handleSave = () => {
    const user = userStorage.getCurrentUser()
    const article: KnowledgeArticle = {
      id: currentArticle?.id || `kb_${Date.now()}`,
      title: formData.title,
      category: formData.category,
      content: formData.content,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      relatedDocumentTypes: formData.relatedDocumentTypes,
      viewCount: currentArticle?.viewCount || 0,
      helpful: currentArticle?.helpful || 0,
      status: formData.status,
      createdBy: currentArticle?.createdBy || user?.id || 'user_admin',
      createdByName: currentArticle?.createdByName || user?.name || '管理员',
      createdAt: currentArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    knowledgeStorage.save(article)
    loadData()
    setEditDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这篇资料吗？')) {
      knowledgeStorage.delete(id)
      loadData()
    }
  }

  const getCategoryLabel = (category: KnowledgeCategory) => {
    return categoryOptions.find(c => c.value === category)?.label || category
  }

  const getCategoryIcon = (category: KnowledgeCategory) => {
    return categoryOptions.find(c => c.value === category)?.icon || <FileText className="h-4 w-4" />
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">资料管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理知识库资料，供AI助手参考解答用户问题
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            新建资料
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总资料数</p>
                  <p className="text-2xl font-bold">{articles.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已发布</p>
                  <p className="text-2xl font-bold">{articles.filter(a => a.status === 'published').length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总浏览量</p>
                  <p className="text-2xl font-bold">{articles.reduce((sum, a) => sum + a.viewCount, 0)}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">有帮助次数</p>
                  <p className="text-2xl font-bold">{articles.reduce((sum, a) => sum + a.helpful, 0)}</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选栏 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索标题或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="分类筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 资料列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-28">分类</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-20 text-center">浏览</TableHead>
                  <TableHead className="w-20 text-center">有帮助</TableHead>
                  <TableHead className="w-40">更新时间</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      暂无资料
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          {getCategoryIcon(article.category)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <button 
                            onClick={() => handleView(article)}
                            className="font-medium hover:text-primary hover:underline text-left"
                          >
                            {article.title}
                          </button>
                          {article.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                              {article.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{article.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryLabel(article.category)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[article.status]}>
                          {statusLabels[article.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{article.viewCount}</TableCell>
                      <TableCell className="text-center">{article.helpful}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(article.updatedAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(article)}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(article)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(article.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentArticle ? '编辑资料' : '新建资料'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标题 *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="请输入资料标题"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">分类 *</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as KnowledgeCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            {opt.icon}
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">内容 * （支持 Markdown）</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入资料内容，支持 Markdown 格式"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标签（逗号分隔）</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="如：求援, 填写指南, 操作手册"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">关键词（供AI搜索，逗号分隔）</label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="如：求援, 反馈单, VIN, 故障"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">关联单据类型</label>
                  <Select 
                    value={formData.relatedDocumentTypes[0] || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, relatedDocumentTypes: v ? [v] : [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联单据类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不关联</SelectItem>
                      {documentTypes.map(dt => (
                        <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">状态</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as 'draft' | 'published' | 'archived' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="published">发布</SelectItem>
                      <SelectItem value="archived">归档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave} disabled={!formData.title || !formData.content}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 查看对话框 */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentArticle && getCategoryIcon(currentArticle.category)}
                {currentArticle?.title}
              </DialogTitle>
            </DialogHeader>
            {currentArticle && (
              <div className="py-4">
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <span>分类：{getCategoryLabel(currentArticle.category)}</span>
                  <span>浏览：{currentArticle.viewCount}</span>
                  <span>有帮助：{currentArticle.helpful}</span>
                  <span>更新：{new Date(currentArticle.updatedAt).toLocaleDateString('zh-CN')}</span>
                </div>
                {currentArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentArticle.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {currentArticle.content}
                  </pre>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              <Button onClick={() => {
                setViewDialogOpen(false)
                if (currentArticle) handleEdit(currentArticle)
              }}>
                编辑
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
