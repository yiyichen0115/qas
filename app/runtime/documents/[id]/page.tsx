'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Send, CheckCircle, XCircle, MessageSquare, 
  Clock, User, FileText, Loader2, CornerDownRight 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainLayout } from '@/components/layout/main-layout'
import {
  documentStorage,
  formStorage,
  userStorage,
  workflowStorage,
  approvalStorage,
  replyStorage,
  documentTypeStorage
} from '@/lib/storage'
import { roleStorage } from '@/lib/storage'
import type { Document, FormConfig, DocumentReply, ApprovalRecord, DocumentStatus, DocumentType, WorkflowConfig, WorkflowNode, NodePermission } from '@/lib/types'

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: '草稿', variant: 'secondary', color: 'text-muted-foreground' },
  pending: { label: '审批中', variant: 'default', color: 'text-primary' },
  approved: { label: '已通过', variant: 'outline', color: 'text-green-600' },
  rejected: { label: '已驳回', variant: 'destructive', color: 'text-destructive' },
  cancelled: { label: '已取消', variant: 'secondary', color: 'text-muted-foreground' },
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [form, setForm] = useState<FormConfig | DocumentType | null>(null)
  const [replies, setReplies] = useState<DocumentReply[]>([])
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof userStorage.getCurrentUser>>(null)
  const [workflow, setWorkflow] = useState<WorkflowConfig | null>(null)
  const [currentNode, setCurrentNode] = useState<WorkflowNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [newReply, setNewReply] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')

  useEffect(() => {
    setIsLoading(true)
    try {
      loadData()
      setCurrentUser(userStorage.getCurrentUser())
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.id])

  const loadData = () => {
    console.log('Loading document with ID:', resolvedParams.id)
    console.log('All documents:', documentStorage.getAll().map(d => ({ id: d.id, number: d.documentNumber })))
    console.log('All forms:', formStorage.getAll().map(f => ({ id: f.id, name: f.name })))
    console.log('All document types:', documentTypeStorage.getAll().map(dt => ({ id: dt.id, name: dt.name })))

    setError(null)
    const doc = documentStorage.getById(resolvedParams.id)
    if (doc) {
      console.log('Found document:', doc)
      setDocument(doc)

      // 优先尝试从单据类型存储获取表单配置
      const loadedDocType = documentTypeStorage.getById(doc.documentTypeId)
      console.log('Loaded document type for ID:', doc.documentTypeId, 'Type:', loadedDocType)

      if (loadedDocType) {
        setForm(loadedDocType)
        setReplies(replyStorage.getByDocumentId(doc.id))
        setApprovals(approvalStorage.getByDocumentId(doc.id))
      } else {
        // 如果单据类型不存在，尝试从表单存储获取
        const loadedForm = formStorage.getById(doc.formId)
        console.log('Loaded form for ID:', doc.formId, 'Form:', loadedForm)
        if (loadedForm) {
          setForm(loadedForm)
          setReplies(replyStorage.getByDocumentId(doc.id))
          setApprovals(approvalStorage.getByDocumentId(doc.id))
        } else {
          setError(`表单不存在 (documentTypeId: ${doc.documentTypeId}, formId: ${doc.formId})`)
        }
      }

      // 加载工作流配置
      if (doc.workflowId) {
        const workflows = workflowStorage.getAll()
        const foundWorkflow = workflows.find(w => w.id === doc.workflowId)
        if (foundWorkflow) {
          setWorkflow(foundWorkflow)
          // 找到当前节点
          const currentNode = foundWorkflow.nodes.find(n => n.id === doc.currentNodeId)
          setCurrentNode(currentNode || null)
        }
      }
    } else {
      console.error('Document not found:', resolvedParams.id)
      setError(`文档不存在 (ID: ${resolvedParams.id})`)
    }
  }

  // 检查用户是否有指定权限
  const hasPermission = (action: 'view' | 'edit' | 'approve' | 'reject' | 'transfer' | 'comment', fieldId?: string): boolean => {
    if (!currentUser || !currentNode || !workflow) return false

    // 获取用户的角色
    const userRoles = currentUser.roles

    // 查找当前节点的权限配置
    const nodePermissions = currentNode.data.permissions || []

    // 检查用户所属角色的权限
    for (const roleId of userRoles) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission) {
        // 检查操作权限
        if (action === 'view' && permission.canView) return true
        if (action === 'edit' && permission.canEdit) return true
        if (action === 'approve' && permission.canApprove) return true
        if (action === 'reject' && permission.canReject) return true
        if (action === 'transfer' && permission.canTransfer) return true
        if (action === 'comment' && permission.canComment) return true

        // 检查字段权限
        if (fieldId && permission.fieldPermissions[fieldId]) {
          const fieldPerm = permission.fieldPermissions[fieldId]
          if (action === 'view' && fieldPerm.visible) return true
          if (action === 'edit' && fieldPerm.editable) return true
        }
      }
    }

    return false
  }

  // 获取用户对指定字段的权限
  const getFieldPermission = (fieldId: string): { visible: boolean; editable: boolean } => {
    if (!currentUser || !currentNode || !workflow) {
      return { visible: true, editable: false }
    }

    const userRoles = currentUser.roles
    const nodePermissions = currentNode.data.permissions || []

    for (const roleId of userRoles) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission && permission.fieldPermissions[fieldId]) {
        return permission.fieldPermissions[fieldId]
      }
    }

    return { visible: true, editable: false }
  }

  const handleSubmitReply = async () => {
    if (!newReply.trim() || !currentUser || !document) return
    
    setIsSubmitting(true)
    try {
      const reply: DocumentReply = {
        id: generateId(),
        documentId: document.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newReply.trim(),
        parentId: replyingTo || undefined,
        createdAt: new Date().toISOString(),
      }
      
      replyStorage.save(reply)
      setNewReply('')
      setReplyingTo(null)
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!document || !currentUser) return
    
    setIsSubmitting(true)
    try {
      const approval: ApprovalRecord = {
        id: generateId(),
        documentId: document.id,
        nodeId: document.currentNodeId || '',
        nodeName: '审批',
        approverId: currentUser.id,
        approverName: currentUser.name,
        action: 'approve',
        comment: approvalComment,
        createdAt: new Date().toISOString(),
      }
      
      approvalStorage.save(approval)
      
      // 更新单据状态
      const updatedDoc: Document = {
        ...document,
        status: 'approved',
        updatedAt: new Date().toISOString(),
      }
      documentStorage.save(updatedDoc)
      
      setShowApproveDialog(false)
      setApprovalComment('')
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!document || !currentUser) return
    
    setIsSubmitting(true)
    try {
      const approval: ApprovalRecord = {
        id: generateId(),
        documentId: document.id,
        nodeId: document.currentNodeId || '',
        nodeName: '审批',
        approverId: currentUser.id,
        approverName: currentUser.name,
        action: 'reject',
        comment: approvalComment,
        createdAt: new Date().toISOString(),
      }
      
      approvalStorage.save(approval)
      
      // 更新单据状态
      const updatedDoc: Document = {
        ...document,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      }
      documentStorage.save(updatedDoc)
      
      setShowRejectDialog(false)
      setApprovalComment('')
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDocument = () => {
    if (!document) return
    
    const updatedDoc: Document = {
      ...document,
      status: 'pending',
      updatedAt: new Date().toISOString(),
    }
    documentStorage.save(updatedDoc)
    loadData()
  }

  const handleCancelDocument = () => {
    if (!document) return
    
    if (confirm('确定要撤销此单据吗？')) {
      const updatedDoc: Document = {
        ...document,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      }
      documentStorage.save(updatedDoc)
      loadData()
    }
  }

  // 判断当前用户是否可以审批
  const canApprove = hasPermission('approve')
  const canReject = hasPermission('reject')
  const canEdit = hasPermission('edit')
  const canView = hasPermission('view')
  const canComment = hasPermission('comment')

  // 获取表单的enableReply属性，兼容FormConfig和DocumentType
  const formEnableReply = form?.enableReply ?? true

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-lg font-medium text-foreground">加载失败</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!document || !form) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-medium text-foreground">未找到数据</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {!document ? '文档不存在' : '表单不存在'}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const status = statusConfig[document.status]

  // 按层级组织回复
  const topLevelReplies = replies.filter(r => !r.parentId)
  const getRepliesForParent = (parentId: string) => replies.filter(r => r.parentId === parentId)

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{document.documentNumber}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{form.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {document.status === 'draft' && (
              <>
                {canEdit && (
                  <Button variant="outline" onClick={() => router.push(`/runtime/documents/${document.id}/edit`)}>
                    编辑
                  </Button>
                )}
                <Button onClick={handleSubmitDocument}>
                  <Send className="mr-2 h-4 w-4" />
                  提交审批
                </Button>
              </>
            )}
            {document.status === 'pending' && document.createdBy === currentUser?.id && (
              <Button variant="outline" onClick={handleCancelDocument}>
                撤销
              </Button>
            )}
            {canReject && (
              <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                驳回
              </Button>
            )}
            {canApprove && (
              <Button onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                通过
              </Button>
            )}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-5xl">
            <Tabs defaultValue="detail">
              <TabsList>
                <TabsTrigger value="detail">单据详情</TabsTrigger>
                <TabsTrigger value="approval">审批记录</TabsTrigger>
                {formEnableReply && canView && (
                  <TabsTrigger value="reply" className="flex items-center gap-1">
                    回复
                    {replies.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                        {replies.length}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="detail" className="mt-6 space-y-6">
                {/* 基本信息 - 参考图片的分组样式 */}
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-medium text-foreground">基本信息</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground shrink-0">单号</span>
                        <span className="font-mono text-sm font-medium">{document.documentNumber}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground shrink-0">创建人</span>
                        <span className="text-sm font-medium">{document.createdByName}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground shrink-0">创建时间</span>
                        <span className="text-sm">{new Date(document.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground shrink-0">更新时间</span>
                        <span className="text-sm">{new Date(document.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 表单数据 - 参考图片的多列布局 */}
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-medium text-foreground">表单内容</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                      {form.fields
                        .filter(field => {
                          if (field.hidden) return false
                          if (field.type === 'divider' || field.type === 'description') return false
                          const fieldPerm = getFieldPermission(field.id)
                          return fieldPerm.visible
                        })
                        .map((field) => {
                          const value = document.formData[field.name]
                          const fieldPerm = getFieldPermission(field.id)
                          let displayValue = '-'

                          if (value !== undefined && value !== null && value !== '') {
                            if (Array.isArray(value)) {
                              const labels = value.map(v => {
                                const opt = field.options?.find(o => o.value === v)
                                return opt?.label || v
                              })
                              displayValue = labels.join(', ')
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? '是' : '否'
                            } else if (field.type === 'select' || field.type === 'radio') {
                              const opt = field.options?.find(o => o.value === value)
                              displayValue = opt?.label || String(value)
                            } else {
                              displayValue = String(value)
                            }
                          }

                          // 根据字段宽度和类型设置样式
                          const getWidthClass = () => {
                            if (field.type === 'textarea') return 'sm:col-span-2 lg:col-span-3'
                            switch (field.width) {
                              case 'full': return 'sm:col-span-2 lg:col-span-3'
                              case 'half': return 'lg:col-span-1'
                              case 'third': return ''
                              default: return ''
                            }
                          }

                          // textarea 类型使用特殊展示
                          if (field.type === 'textarea') {
                            return (
                              <div key={field.id} className={`${getWidthClass()}`}>
                                <div className="text-sm text-muted-foreground mb-2">{field.label}</div>
                                <div className="rounded-lg bg-muted/30 p-3 text-sm min-h-[60px] whitespace-pre-wrap">
                                  {displayValue}
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={field.id} className={`flex items-baseline gap-2 ${getWidthClass()}`}>
                              <span className="text-sm text-muted-foreground shrink-0">{field.label}</span>
                              <span className="text-sm font-medium truncate">
                                {displayValue}
                                {!fieldPerm.editable && canEdit && (
                                  <span className="ml-1 text-xs text-muted-foreground">(只读)</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="approval" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">审批记录</CardTitle>
                    <CardDescription>单据的审批历史</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {approvals.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        暂无审批记录
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {approvals.map((approval, index) => (
                          <div key={approval.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                approval.action === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {approval.action === 'approve' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </div>
                              {index < approvals.length - 1 && (
                                <div className="w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{approval.approverName}</span>
                                <span className={approval.action === 'approve' ? 'text-green-600' : 'text-destructive'}>
                                  {approval.action === 'approve' ? '通过' : '驳回'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(approval.createdAt).toLocaleString()}
                              </p>
                              {approval.comment && (
                                <p className="mt-2 text-sm bg-muted rounded-lg p-3">
                                  {approval.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {formEnableReply && (
                <TabsContent value="reply" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        回复讨论
                      </CardTitle>
                      <CardDescription>在此处进行单据相关的讨论</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* 回复输入框 */}
                      {currentUser && (
                        <div className="mb-6">
                          {replyingTo && (
                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <CornerDownRight className="h-4 w-4" />
                              回复: {replies.find(r => r.id === replyingTo)?.userName}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                                onClick={() => setReplyingTo(null)}
                              >
                                取消
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder="输入回复内容..."
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                rows={3}
                              />
                              <div className="flex justify-end">
                                <Button 
                                  size="sm" 
                                  onClick={handleSubmitReply}
                                  disabled={!newReply.trim() || isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                  )}
                                  发送
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator className="my-4" />

                      {/* 回复列表 */}
                      {topLevelReplies.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          暂无回复，快来发表第一条回复吧
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {topLevelReplies.map((reply) => (
                            <div key={reply.id} className="space-y-3">
                              <div className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{reply.userName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{reply.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm">{reply.content}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-1 h-7 px-2 text-xs"
                                    onClick={() => setReplyingTo(reply.id)}
                                  >
                                    回复
                                  </Button>
                                </div>
                              </div>
                              
                              {/* 子回复 */}
                              {getRepliesForParent(reply.id).map((childReply) => (
                                <div key={childReply.id} className="ml-11 flex gap-3">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs">{childReply.userName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{childReply.userName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(childReply.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm">{childReply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* 通过对话框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批通过</DialogTitle>
            <DialogDescription>确认通过此单据的审批</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="输入审批意见（可选）"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回对话框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回单据</DialogTitle>
            <DialogDescription>请填写驳回原因</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入驳回原因"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isSubmitting || !approvalComment.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
