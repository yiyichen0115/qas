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
  replyStorage 
} from '@/lib/storage'
import type { Document, FormConfig, DocumentReply, ApprovalRecord, DocumentStatus } from '@/lib/types'

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
  const [form, setForm] = useState<FormConfig | null>(null)
  const [replies, setReplies] = useState<DocumentReply[]>([])
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof userStorage.getCurrentUser>>(null)
  
  const [newReply, setNewReply] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')

  useEffect(() => {
    loadData()
    setCurrentUser(userStorage.getCurrentUser())
  }, [resolvedParams.id])

  const loadData = () => {
    const doc = documentStorage.getById(resolvedParams.id)
    if (doc) {
      setDocument(doc)
      const loadedForm = formStorage.getById(doc.formId)
      setForm(loadedForm || null)
      setReplies(replyStorage.getByDocumentId(doc.id))
      setApprovals(approvalStorage.getByDocumentId(doc.id))
    }
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
  const canApprove = currentUser && document?.status === 'pending' && 
    (currentUser.roles.includes('role_admin') || currentUser.roles.includes('role_approver'))

  if (!document || !form) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                <Button variant="outline" onClick={() => router.push(`/runtime/documents/${document.id}/edit`)}>
                  编辑
                </Button>
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
            {canApprove && (
              <>
                <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  驳回
                </Button>
                <Button onClick={() => setShowApproveDialog(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  通过
                </Button>
              </>
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
                {form.enableReply && (
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

              <TabsContent value="detail" className="mt-6">
                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">基本信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">单号:</span>
                        <span className="font-mono text-sm">{document.documentNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">创建人:</span>
                        <span className="text-sm">{document.createdByName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">创建时间:</span>
                        <span className="text-sm">{new Date(document.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">更新时间:</span>
                        <span className="text-sm">{new Date(document.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 表单数据 */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">表单内容</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {form.fields
                        .filter(field => !field.hidden && field.type !== 'divider' && field.type !== 'description')
                        .map((field) => {
                          const value = document.formData[field.name]
                          let displayValue = '-'
                          
                          if (value !== undefined && value !== null && value !== '') {
                            if (Array.isArray(value)) {
                              // 多选或复选框
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
                          
                          // 根据字段宽度设置样式
                          const widthClass = field.width === 'full' 
                            ? 'col-span-1 md:col-span-2 lg:col-span-3' 
                            : field.width === 'half' 
                              ? 'col-span-1 md:col-span-1 lg:col-span-1'
                              : field.width === 'third'
                                ? 'col-span-1'
                                : 'col-span-1' // 默认单列

                          // textarea 类型默认整行
                          const isFullWidth = field.type === 'textarea'
                          const finalWidthClass = isFullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : widthClass
                          
                          return (
                            <div key={field.id} className={`rounded-lg bg-muted/30 p-3 ${finalWidthClass}`}>
                              <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                              <div className="text-sm font-medium">{displayValue}</div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
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

              {form.enableReply && (
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
