'use client'

/**
 * 单据类型管理页面
 * 管理系统中的单据类型，如求援反馈单、质量问题单等
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, FileText, Settings, ChevronRight, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/layout/page-header'
import { documentTypeStorage, documentStorage } from '@/lib/storage'
import type { DocumentType } from '@/lib/types'

function generateId() {
  return `doctype_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function DocumentTypesPage() {
  const router = useRouter()
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [editingType, setEditingType] = useState<DocumentType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // 表单状态
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft')

  useEffect(() => {
    loadDocumentTypes()
  }, [])

  const loadDocumentTypes = () => {
    const types = documentTypeStorage.getAll()
    setDocumentTypes(types.sort((a, b) => a.order - b.order))
  }

  const handleOpenDialog = (docType?: DocumentType) => {
    if (docType) {
      setEditingType(docType)
      setFormName(docType.name)
      setFormCode(docType.code)
      setFormDescription(docType.description || '')
      setFormStatus(docType.status)
    } else {
      setEditingType(null)
      setFormName('')
      setFormCode('')
      setFormDescription('')
      setFormStatus('draft')
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim() || !formCode.trim()) return

    const docType: DocumentType = {
      id: editingType?.id || generateId(),
      name: formName.trim(),
      code: formCode.trim(),
      description: formDescription.trim(),
      fields: editingType?.fields || [],
      layout: editingType?.layout || 'vertical',
      numberRule: editingType?.numberRule,
      workflowEnabled: editingType?.workflowEnabled || false,
      actionButtons: editingType?.actionButtons || [],
      enableReply: editingType?.enableReply || false,
      status: formStatus,
      order: editingType?.order || documentTypes.length + 1,
      createdAt: editingType?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    documentTypeStorage.save(docType)
    loadDocumentTypes()
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    // 检查是否有单据使用此类型
    const docs = documentStorage.getAll()
    const usingDocs = docs.filter(d => d.documentTypeId === id || d.formId === id)
    
    if (usingDocs.length > 0) {
      alert(`无法删除：有 ${usingDocs.length} 个单据正在使用此类型`)
      return
    }

    if (confirm('确定要删除此单据类型吗？')) {
      documentTypeStorage.delete(id)
      loadDocumentTypes()
    }
  }

  const handleDuplicate = (docType: DocumentType) => {
    const newType: DocumentType = {
      ...docType,
      id: generateId(),
      name: `${docType.name} (副本)`,
      code: `${docType.code}_copy`,
      status: 'draft',
      order: documentTypes.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    documentTypeStorage.save(newType)
    loadDocumentTypes()
  }

  const getDocumentCount = (typeId: string) => {
    const docs = documentStorage.getAll()
    return docs.filter(d => d.documentTypeId === typeId || d.formId === typeId).length
  }

  const goToFormDesign = (typeId: string) => {
    router.push(`/designer/form?documentTypeId=${typeId}`)
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="单据类型管理"
          description="管理系统中的单据类型，定义后可在「单据表单设计」中配置具体字段"
        />

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>单据类型列表</CardTitle>
              <CardDescription>所有已定义的单据类型</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新建单据类型
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>单据类型名称</TableHead>
                  <TableHead>类型编码</TableHead>
                  <TableHead>字段数量</TableHead>
                  <TableHead>单据数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无单据类型，点击上方按钮创建
                    </TableCell>
                  </TableRow>
                ) : (
                  documentTypes.map((docType) => (
                    <TableRow key={docType.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{docType.name}</div>
                            {docType.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {docType.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {docType.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {docType.fields?.length || 0} 个字段
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {getDocumentCount(docType.id)} 个单据
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={docType.status === 'published' ? 'default' : 'secondary'}>
                          {docType.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToFormDesign(docType.id)}
                            title="设计表单字段"
                          >
                            <Settings className="mr-1 h-4 w-4" />
                            设计表单
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(docType)}
                            title="编辑基本信息"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(docType)}
                            title="复制"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(docType.id)}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 新建/编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingType ? '编辑单据类型' : '新建单据类型'}
              </DialogTitle>
              <DialogDescription>
                设置单据类型的基本信息，保存后可在「单据表单设计」中配置具体字段
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">单据类型名称 *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="如：求援反馈单、质量问题单"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">类型编码 *</Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="如：support_feedback、quality_issue"
                />
                <p className="text-xs text-muted-foreground">
                  编码用于系统内部识别，建议使用英文和下划线
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="简要描述此单据类型的用途"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as 'draft' | 'published')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  只有「已发布」状态的单据类型才能被用户使用
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
