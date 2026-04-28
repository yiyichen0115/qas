'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Send, CheckCircle, XCircle, MessageSquare, 
  Clock, User, FileText, Loader2, Plus,
  Paperclip, X, Image as ImageIcon, File, Pencil, Save, Check, RotateCcw, PackageCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'

import { MainLayout } from '@/components/layout/main-layout'
import { RelatedDocumentsList } from '@/components/related-documents-list'
import { SubtableField } from '@/components/subtable-field'
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
import type { Document, FormConfig, DocumentReply, ApprovalRecord, DocumentStatus, DocumentType, WorkflowConfig, WorkflowNode, NodePermission, RelatedDocumentConfig, ActionButton } from '@/lib/types'

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: '草稿', variant: 'secondary', color: 'text-muted-foreground' },
  pending: { label: '审批中', variant: 'default', color: 'text-primary' },
  approved: { label: '已通过', variant: 'outline', color: 'text-green-600' },
  rejected: { label: '已驳回', variant: 'destructive', color: 'text-destructive' },
  cancelled: { label: '已取消', variant: 'secondary', color: 'text-muted-foreground' },
}

interface AttachmentFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
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
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [returnReason, setReturnReason] = useState('')
  
  // 字段编辑状态
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editingFieldValue, setEditingFieldValue] = useState<unknown>(null)
  const [isSavingField, setIsSavingField] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    try {
      loadData()
      // 获取当前用户，如果没有登录则使用默认管理员用户
      let user = userStorage.getCurrentUser()
      if (!user) {
        // 获取默认管理员用户
        const allUsers = userStorage.getAll()
        user = allUsers.find(u => u.roles?.some(r => r === 'role_admin' || r === 'admin')) || allUsers[0] || null
        if (user) {
          userStorage.setCurrentUser(user)
        }
      }
      setCurrentUser(user)
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.id])

  const loadData = () => {
    setError(null)
    const doc = documentStorage.getById(resolvedParams.id)

    if (doc) {
      setDocument(doc)

      // 优先尝试从单据类型存储获取表单配置
      const loadedDocType = documentTypeStorage.getById(doc.documentTypeId)

      if (loadedDocType) {
        setForm(loadedDocType)
        setReplies(replyStorage.getByDocumentId(doc.id))
        setApprovals(approvalStorage.getByDocumentId(doc.id))
      } else {
        // 如果单据类型不存在，尝试从表单存储获取
        const loadedForm = formStorage.getById(doc.formId)
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
      setError(`文档不存在 (ID: ${resolvedParams.id})`)
    }
  }

  // 获取当前有效用户（优先使用 state，如果没有则从 storage 获取）
  const getEffectiveUser = () => {
    if (currentUser) return currentUser
    // 尝试从 storage 获取用户
    let user = userStorage.getCurrentUser()
    if (!user) {
      // 获取默认管理员用户
      const allUsers = userStorage.getAll()
      user = allUsers.find(u => u.roles?.some(r => r === 'role_admin' || r === 'admin')) || allUsers[0] || null
      if (user) {
        userStorage.setCurrentUser(user)
      }
    }
    return user
  }
  
  // 获取用户的所有角色标识（包括角色ID和角色代码）
  const getUserRoleIdentifiers = (): string[] => {
    const user = getEffectiveUser()
    if (!user) return []
    const userRoles = user.roles || []
    const allRoles = roleStorage.getAll()
    
    // 收集所有角色标识：角色ID、角色代码
    const identifiers: string[] = []
    for (const roleId of userRoles) {
      identifiers.push(roleId) // 添加角色ID
      const role = allRoles.find(r => r.id === roleId)
      if (role?.code) {
        identifiers.push(role.code) // 添加角色代码
      }
    }
    return identifiers
  }
  
  // 检查用户是否有指定权限
  const hasPermission = (action: 'view' | 'edit' | 'approve' | 'reject' | 'transfer' | 'comment', fieldId?: string): boolean => {
    const user = getEffectiveUser()
    if (!user) return false
    
    // 获取用户的所有角色标识
    const userRoleIdentifiers = getUserRoleIdentifiers()
    
    // 检查是��是管理员角色
    const isAdmin = userRoleIdentifiers.some(r => r === 'role_admin' || r === 'admin')
    
    // 管理员拥有所有权限
    if (isAdmin) {
      return true
    }
    
    // 如果没有工作流配置，使用默认权限逻辑
    if (!workflow || !currentNode) {
      // 创建者总是可以查看和评论
      if (document?.createdBy === user.id) {
        if (action === 'view' || action === 'comment') return true
        // 草稿状态下创建者可以编辑
        if (action === 'edit' && document?.status === 'draft') return true
      }
      
      // 管理员角色有审批权限
      if (isAdmin) {
        if (action === 'view' || action === 'comment') return true
        // 审批中状态可以审批/驳回
        if ((action === 'approve' || action === 'reject') && document?.status === 'pending') return true
      }
      
      // 所有登录用户都可以查看和评论
      if (action === 'view' || action === 'comment') return true
      
      return false
    }

    // 查找当前节点的权限配置
    const nodePermissions = currentNode.data.permissions || []
    
    // 如果节点没有权限配置，使用默认逻辑
    if (nodePermissions.length === 0) {
      // 创建者总是可以查看和评论
      if (document?.createdBy === user.id) {
        if (action === 'view' || action === 'comment') return true
        if (action === 'edit' && document?.status === 'draft') return true
      }
      
      // 检查工作流事件中的权限配置
      const events = workflow.events || []
      const currentStatus = document?.status
      
      for (const event of events) {
        // 根据当前状态找到可执行的事件
        if (event.fromStatus?.includes(currentStatus || '')) {
          // 检查用户角色是否有权限执行该事件
          const eventPermissions = event.permissions || []
          const hasEventPermission = eventPermissions.some(p => userRoleIdentifiers.includes(p))
          
          if (hasEventPermission) {
            if (event.type === 'approve' && (action === 'approve' || action === 'reject')) return true
            if (event.type === 'submit' && action === 'edit') return true
          }
        }
      }
      
      // 管理员角色有审批权限
      if (isAdmin && document?.status === 'pending') {
        if (action === 'approve' || action === 'reject' || action === 'view' || action === 'comment') return true
      }
      
      // 所有登录用户都可以查看和评论
      if (action === 'view' || action === 'comment') return true
      
      return false
    }

    // 检查用户所属角色的权限
    for (const roleId of userRoleIdentifiers) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission) {
        // 检查操作权限
        if (action === 'view' && permission.canView) return true
        if (action === 'edit' && permission.canEdit) return true
        if (action === 'approve' && permission.canApprove) return true
        if (action === 'reject' && permission.canReject) return true
        if (action === 'return' && permission.canReturn) return true
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

  // 开始编辑字段
  const startEditField = (fieldId: string, fieldName: string) => {
    if (!document) return
    setEditingFieldId(fieldId)
    setEditingFieldValue(document.formData[fieldName])
  }

  // 取消编辑字段
  const cancelEditField = () => {
    setEditingFieldId(null)
    setEditingFieldValue(null)
  }

  // 保存字段编辑
  const saveFieldEdit = async (fieldName: string) => {
    if (!document) return
    
    setIsSavingField(true)
    try {
      // 更新文档数据
      const updatedDoc: Document = {
        ...document,
        formData: {
          ...document.formData,
          [fieldName]: editingFieldValue,
        },
        updatedAt: new Date().toISOString(),
      }
      
      documentStorage.save(updatedDoc)
      setDocument(updatedDoc)
      setEditingFieldId(null)
      setEditingFieldValue(null)
    } finally {
      setIsSavingField(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }))

    setAttachments(prev => [...prev, ...newAttachments])
    
    // 重置 input 以便可以重新选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSubmitReply = async () => {
    const user = getEffectiveUser()
    if (!newReply.trim() || !user || !document) return
    
    setIsSubmitting(true)
    try {
      const reply: DocumentReply = {
        id: generateId(),
        documentId: document.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: newReply.trim(),
        attachments: attachments.map(a => a.name),
        parentId: replyingTo || undefined,
        createdAt: new Date().toISOString(),
      }
      
      replyStorage.save(reply)
      setNewReply('')
      setReplyingTo(null)
      setAttachments([])
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    const user = getEffectiveUser()
    if (!document || !user) return
    
    setIsSubmitting(true)
    try {
      const approval: ApprovalRecord = {
        id: generateId(),
        documentId: document.id,
        nodeId: document.currentNodeId || '',
        nodeName: '审批',
        approverId: user.id,
        approverName: user.name,
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
    const user = getEffectiveUser()
    if (!document || !user) return
    
    setIsSubmitting(true)
    try {
      const approval: ApprovalRecord = {
        id: generateId(),
        documentId: document.id,
        nodeId: document.currentNodeId || '',
        nodeName: '审批',
        approverId: user.id,
        approverName: user.name,
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

  // 退回单据到草稿状态
  const handleReturnDocument = async () => {
    const user = getEffectiveUser()
    if (!document || !user) return
    
    setIsSubmitting(true)
    try {
      // 创建退回记录
      const approval: ApprovalRecord = {
        id: generateId(),
        documentId: document.id,
        nodeId: document.currentNodeId || '',
        nodeName: '退回',
        approverId: user.id,
        approverName: user.name,
        action: 'return',
        comment: returnReason || '单据被退回，请重新编辑后提交',
        createdAt: new Date().toISOString(),
      }
      
      approvalStorage.save(approval)
      
      // 更新单据状态为草稿
      const updatedDoc: Document = {
        ...document,
        status: 'draft',
        currentNodeId: undefined, // 清除当前节点，回到初始状态
        updatedAt: new Date().toISOString(),
      }
      documentStorage.save(updatedDoc)
      
      setShowReturnDialog(false)
      setReturnReason('')
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  // 生成关联单据（如从LAC生成回货单）
  const handleGenerateDocument = async (button: ActionButton) => {
    const user = getEffectiveUser()
    if (!document) {
      alert('无法生成单据：当前单据不存在')
      return
    }
    if (!user) {
      alert('无法生成单据：请先登录')
      return
    }
    if (!button.generateDocTypeId) {
      alert(`无法生成单据：按钮"${button.name}"未配置目标单据类型(generateDocTypeId)`)
      return
    }

    // 确认操作
    if (button.confirmRequired && button.confirmMessage) {
      if (!confirm(button.confirmMessage)) return
    }

    setIsSubmitting(true)
    try {
      // 获取目标单据类型
      const targetDocType = documentTypeStorage.getById(button.generateDocTypeId)
      if (!targetDocType) {
        alert(`无法生成单据：目标单据类型"${button.generateDocTypeId}"不存在，请确保已初始化回货单单据类型`)
        return
      }

      // 生成新单号
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const newDocNumber = `${targetDocType.numberRule?.prefix || targetDocType.code}${dateStr}${randomNum}`

      // 根据字段映射生成表单数据
      const newFormData: Record<string, unknown> = {
        // 记录源单据信息
        source_document_id: document.id,
        source_document_number: document.documentNumber,
        source_document_type: document.documentTypeId || document.formId,
      }

      // 应用字段映射
      if (button.fieldMapping) {
        for (const [sourceField, targetField] of Object.entries(button.fieldMapping)) {
          if (document.formData[sourceField] !== undefined) {
            newFormData[targetField] = document.formData[sourceField]
          }
        }
      }

      // 创建新单据
      const newDocument: Document = {
        id: generateId(),
        documentNumber: newDocNumber,
        documentTypeId: button.generateDocTypeId,
        formId: button.generateDocTypeId,
        formData: newFormData,
        status: 'draft',
        createdBy: user.id,
        createdByName: user.name,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }

      documentStorage.save(newDocument)

      // 提示用户并跳转
      alert(`已成功生成${targetDocType.name}：${newDocNumber}`)
      router.push(`/runtime/documents/${newDocument.id}`)
    } catch (error) {
      alert(`生成单据失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取当前单据类型的操作按钮
  const getVisibleActionButtons = (): ActionButton[] => {
    if (!form || !document) return []
    
    const docType = form as DocumentType
    if (!docType.actionButtons) return []

    const userRoles = currentUser?.roles || []
    
    return docType.actionButtons.filter(button => {
      // 检查是否启用
      if (!button.enabled) return false
      
      // 检查状态是否匹配
      if (button.visibleStatus && button.visibleStatus.length > 0) {
        if (!button.visibleStatus.includes(document.status)) return false
      }
      
      // 检查角色是否匹配
      if (button.visibleRoles && button.visibleRoles.length > 0) {
        const hasRole = button.visibleRoles.some(role => userRoles.includes(role))
        if (!hasRole) return false
      }
      
      // 只显示footer位置的生成单据按钮
      if (button.position !== 'footer') return false
      if (button.actionType !== 'generate_doc') return false
      
      return true
    }).sort((a, b) => a.order - b.order)
  }

  const visibleActionButtons = getVisibleActionButtons()

  // 判断当前用户是否可以审批
  const canApprove = hasPermission('approve')
  const canReject = hasPermission('reject')
  const canReturn = hasPermission('return')
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

  const status = statusConfig[document.status] || statusConfig.draft

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
            {/* 动态操作按钮（如生成回货单） */}
            {visibleActionButtons.map(button => (
              <Button
                key={button.id}
                variant={button.type === 'primary' ? 'default' : 'outline'}
                onClick={() => handleGenerateDocument(button)}
                disabled={isSubmitting}
                className={button.type === 'primary' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {button.icon === 'PackageCheck' && <PackageCheck className="mr-2 h-4 w-4" />}
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {button.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 审批中状态时显示醒目的审核提示 */}
        {document.status === 'pending' && (canApprove || canReject || canReturn) && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800 font-medium">此单据正在等待您的审核</span>
              </div>
              <div className="flex items-center gap-2">
                {canReturn && (
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => setShowReturnDialog(true)}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    退回
                  </Button>
                )}
                {canReject && (
                  <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowRejectDialog(true)}>
                    <XCircle className="mr-1.5 h-4 w-4" />
                    驳回
                  </Button>
                )}
                {canApprove && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowApproveDialog(true)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    通过审核
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 非待审核状态时，如果有退回权限也显示退回按钮 */}
        {document.status !== 'pending' && document.status !== 'draft' && document.status !== 'rejected' && document.status !== 'closed' && document.status !== 'cancelled' && canReturn && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800 font-medium">您可以将此单据退回给创建人重新编辑</span>
              </div>
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => setShowReturnDialog(true)}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                退回单据
              </Button>
            </div>
          </div>
        )}

        {/* 内容区 - 左右两栏布局 */}
        <div className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* 左侧：单据详情 */}
            <div className="flex-1 overflow-auto p-6">
              {/* 基本信息 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-medium text-foreground">基本信息</h3>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
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

              <Separator className="my-6" />

              {/* 表单内容 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-medium text-foreground">表单内容</h3>
                </div>
                {(() => {
                  // 将字段按分割线分组
                  const groups: { divider?: typeof form.fields[0]; fields: typeof form.fields }[] = []
                  let currentGroup: typeof form.fields = []
                  
                  form.fields.forEach(field => {
                    if (field.hidden) return
                    
                    if (field.type === 'divider') {
                      if (currentGroup.length > 0) {
                        groups.push({ fields: currentGroup })
                      }
                      groups.push({ divider: field, fields: [] })
                      currentGroup = []
                    } else if (field.type === 'description') {
                      return
                    } else {
                      const fieldPerm = getFieldPermission(field.id)
                      if (fieldPerm.visible) {
                        const lastDividerGroup = groups.findLast(g => g.divider)
                        if (lastDividerGroup && lastDividerGroup.fields.length === 0 && groups[groups.length - 1] === lastDividerGroup) {
                          lastDividerGroup.fields.push(field)
                        } else {
                          currentGroup.push(field)
                        }
                      }
                    }
                  })
                  
                  if (currentGroup.length > 0) {
                    groups.push({ fields: currentGroup })
                  }
                  
                  return groups.map((group, groupIndex) => (
                    <div key={groupIndex} className={groupIndex > 0 ? 'mt-6' : ''}>
                      {group.divider && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-3 w-0.5 rounded-full bg-muted-foreground/50" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {group.divider.label}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      {group.fields.length > 0 && (
                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.fields.map((field) => {
                            const value = document.formData[field.name]
                            const fieldPerm = getFieldPermission(field.id)
                            
                            // 格式化显示值
                            let displayValue: React.ReactNode = '-'
                            if (value !== undefined && value !== null && value !== '') {
                              if (field.type === 'select' || field.type === 'radio') {
                                const option = field.options?.find(o => o.value === value)
                                displayValue = option?.label || String(value)
                              } else if (field.type === 'checkbox') {
                                const values = Array.isArray(value) ? value : [value]
                                displayValue = values.map(v => {
                                  const option = field.options?.find(o => o.value === v)
                                  return option?.label || String(v)
                                }).join(', ')
                              } else if (field.type === 'switch') {
                                displayValue = value ? '是' : '否'
                              } else if (field.type === 'date' || field.type === 'datetime') {
                                displayValue = new Date(String(value)).toLocaleString()
                              } else if (field.type === 'file') {
                                const files = Array.isArray(value) ? value : [value]
                                displayValue = files.map((f, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-primary">
                                    <FileText className="h-3 w-3" />
                                    {typeof f === 'string' ? f : (f as { name?: string }).name || '文件'}
                                  </span>
                                ))
                              } else {
                                displayValue = String(value)
                              }
                            }
                            
                            // 获取字段宽度
                            const getWidthClass = () => {
                              if (field.width === 'full') return 'sm:col-span-2 lg:col-span-3'
                              if (field.width === 'half') return 'lg:col-span-1'
                              return ''
                            }
                            
                            // 关联单据字段特殊处理
                            if (field.type === 'related_documents' && field.relatedDocConfig) {
                              // 获取源字段的值
                              const sourceFieldValue = document.formData[field.relatedDocConfig.linkSourceField]
                              return (
                                <div key={field.id} className="sm:col-span-2 lg:col-span-3 mt-2">
                                  <RelatedDocumentsList
                                    config={field.relatedDocConfig}
                                    sourceValue={String(sourceFieldValue || '')}
                                    documentId={document.id}
                                  />
                                </div>
                              )
                            }
                            
                            // 子表格字段特殊处理
                            if (field.type === 'subtable' && field.columns) {
                              const subtableValue = (value as unknown[]) || []
                              return (
                                <div key={field.id} className="sm:col-span-2 lg:col-span-3 mt-2">
                                  <div className="mb-2">
                                    <Label className="text-sm font-medium">{field.label}</Label>
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                  </div>
                                  <SubtableField
                                    field={field}
                                    value={subtableValue as { id: string; [key: string]: unknown }[]}
                                    readOnly={true}
                                  />
                                </div>
                              )
                            }
                            
                            // 检查是否正在编辑该字段
                            const isEditing = editingFieldId === field.id
                            
                            // 渲染编辑控件
                            const renderEditControl = () => {
                              switch (field.type) {
                                case 'text':
                                  return (
                                    <Input
                                      value={String(editingFieldValue || '')}
                                      onChange={(e) => setEditingFieldValue(e.target.value)}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                  )
                                case 'number':
                                  return (
                                    <Input
                                      type="number"
                                      value={editingFieldValue as number || ''}
                                      onChange={(e) => setEditingFieldValue(e.target.value ? Number(e.target.value) : '')}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                  )
                                case 'textarea':
                                case 'richtext':
                                  return (
                                    <Textarea
                                      value={String(editingFieldValue || '')}
                                      onChange={(e) => setEditingFieldValue(e.target.value)}
                                      className="text-sm min-h-[80px]"
                                      autoFocus
                                    />
                                  )
                                case 'select':
                                case 'radio':
                                  return (
                                    <Select
                                      value={String(editingFieldValue || '')}
                                      onValueChange={(v) => setEditingFieldValue(v)}
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="请选择" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map(opt => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )
                                case 'switch':
                                  return (
                                    <Switch
                                      checked={Boolean(editingFieldValue)}
                                      onCheckedChange={(checked) => setEditingFieldValue(checked)}
                                    />
                                  )
                                case 'date':
                                  return (
                                    <Input
                                      type="date"
                                      value={editingFieldValue ? String(editingFieldValue).split('T')[0] : ''}
                                      onChange={(e) => setEditingFieldValue(e.target.value)}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                  )
                                case 'datetime':
                                  return (
                                    <Input
                                      type="datetime-local"
                                      value={editingFieldValue ? String(editingFieldValue).slice(0, 16) : ''}
                                      onChange={(e) => setEditingFieldValue(e.target.value)}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                  )
                                default:
                                  return (
                                    <Input
                                      value={String(editingFieldValue || '')}
                                      onChange={(e) => setEditingFieldValue(e.target.value)}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                  )
                              }
                            }
                            
                            // 多行文本特殊处理
                            if (field.type === 'textarea' || field.type === 'richtext') {
                              return (
                                <div key={field.id} className={`${getWidthClass()}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">{field.label}</span>
                                    {fieldPerm.editable && !isEditing && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-primary hover:text-primary"
                                        onClick={() => startEditField(field.id, field.name)}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        编辑
                                      </Button>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      {renderEditControl()}
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => saveFieldEdit(field.name)}
                                          disabled={isSavingField}
                                        >
                                          {isSavingField ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          ) : (
                                            <Check className="h-3 w-3 mr-1" />
                                          )}
                                          保存
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={cancelEditField}
                                        >
                                          取消
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg bg-muted/30 p-3 text-sm min-h-[60px] whitespace-pre-wrap">
                                      {displayValue}
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            return (
                              <div key={field.id} className={`group ${getWidthClass()}`}>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">{field.label}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        {renderEditControl()}
                                      </div>
                                      <Button
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => saveFieldEdit(field.name)}
                                        disabled={isSavingField}
                                      >
                                        {isSavingField ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={cancelEditField}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-muted-foreground shrink-0">{field.label}</span>
                                    <span className="text-sm font-medium truncate flex-1">
                                      {displayValue}
                                    </span>
                                    {fieldPerm.editable && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                                        onClick={() => startEditField(field.id, field.name)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* 右侧：审批流程和评论 */}
            <div className="w-96 shrink-0 border-l border-border flex flex-col overflow-hidden">
              {/* 审批流程区块 - 蓝色主题 */}
              <div className="bg-gradient-to-b from-blue-50 to-white border-b-2 border-blue-200">
                {/* 审批流程标题 */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">审批流程</h3>
                    <p className="text-xs text-blue-100">Approval Process</p>
                  </div>
                  {approvals.length > 0 && (
                    <span className="text-xs text-white bg-white/20 px-2.5 py-1 rounded-full font-medium">
                      {approvals.length} 条
                    </span>
                  )}
                </div>
                
                {/* 审批记录列表 */}
                <div className="p-4 max-h-60 overflow-auto">
                  {approvals.length === 0 ? (
                    <div className="py-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-400" />
                      </div>
                      <p className="text-sm text-slate-600 font-medium">暂无审批记录</p>
                      <p className="text-xs text-slate-400 mt-1">提交后将显示审批进度</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* 时间线 */}
                      <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-400 via-blue-200 to-blue-100" />
                      <div className="space-y-4">
                        {approvals.map((approval, index) => (
                          <div key={approval.id} className="relative flex gap-3 pl-1">
                            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ring-4 ring-white ${
                              approval.action === 'approve' 
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                                : 'bg-gradient-to-br from-red-400 to-red-600'
                            }`}>
                              {approval.action === 'approve' ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : (
                                <XCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-700">{approval.approverName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  approval.action === 'approve'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {approval.action === 'approve' ? '已通过' : '已驳回'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(approval.createdAt).toLocaleString('zh-CN')}
                              </p>
                              {approval.comment && (
                                <div className="mt-2 text-sm bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm text-slate-600">
                                  {approval.comment}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 交流历史区块 - 绿色主题 */}
              {formEnableReply && (
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-emerald-50/50 to-slate-50">
                  {/* 交流历史标题 */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">交流历史</h3>
                      <p className="text-xs text-emerald-100">Communication</p>
                    </div>
                    {replies.length > 0 && (
                      <span className="text-xs text-white bg-orange-500 px-2.5 py-1 rounded-full font-medium min-w-[24px] text-center shadow-sm">
                        {replies.length}
                      </span>
                    )}
                  </div>

                  {/* 消息列表 */}
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {replies.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-emerald-400" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">暂无消息</p>
                        <p className="text-xs text-slate-400 mt-1">发送消息开始交流</p>
                      </div>
                    ) : (
                      <>
                        {/* 按时间排序所有消息 */}
                        {[...replies].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((reply, index, arr) => {
                          const isCurrentUser = reply.userId === getEffectiveUser()?.id
                          const showTime = index === 0 || (new Date(reply.createdAt).getTime() - new Date(arr[index - 1].createdAt).getTime()) > 5 * 60 * 1000
                          
                          return (
                            <div key={reply.id}>
                              {/* 时间戳 */}
                              {showTime && (
                                <div className="flex justify-center mb-3">
                                  <span className="text-xs text-slate-500 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-slate-100">
                                    {new Date(reply.createdAt).toLocaleString('zh-CN', { 
                                      month: '2-digit', 
                                      day: '2-digit', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              )}
                              
                              {/* 消息气泡 */}
                              <div className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                {/* 头像 */}
                                <Avatar className="h-10 w-10 shrink-0 rounded-lg shadow-sm">
                                  <AvatarFallback className={`rounded-lg text-sm font-medium ${
                                    isCurrentUser 
                                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                  }`}>
                                    {reply.userName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* 消息内容 */}
                                <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                  {/* 用户名 */}
                                  <span className="text-xs text-slate-500 mb-1 font-medium">{reply.userName}</span>
                                  
                                  {/* 气泡 */}
                                  <div 
                                    className={`relative px-3 py-2 rounded-2xl text-sm break-words shadow-sm ${
                                      isCurrentUser 
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm' 
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
                                    }`}
                                    style={{
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {/* 引用回复 */}
                                    {reply.parentId && (
                                      <div className={`text-xs mb-1 pb-1 border-b ${isCurrentUser ? 'border-white/30 text-white/80' : 'border-slate-200 text-slate-500'}`}>
                                        回复 {replies.find(r => r.id === reply.parentId)?.userName}
                                      </div>
                                    )}
                                    
                                    <p 
                                      className="leading-relaxed cursor-pointer" 
                                      onClick={() => setReplyingTo(reply.id)}
                                      title="点击回复"
                                    >
                                      {reply.content}
                                    </p>
                                    
                                    {/* 附件 */}
                                    {reply.attachments && reply.attachments.length > 0 && (
                                      <div className={`mt-2 pt-2 border-t space-y-1 ${isCurrentUser ? 'border-white/30' : 'border-slate-200'}`}>
                                        {reply.attachments.map((att, idx) => (
                                          <div 
                                            key={idx} 
                                            className={`flex items-center gap-1.5 text-xs cursor-pointer hover:underline ${isCurrentUser ? 'text-white/90' : 'text-slate-500'}`}
                                          >
                                            <Paperclip className="h-3 w-3" />
                                            <span className="truncate">{att}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                  
                  {/* 输入区 */}
                  {currentUser && canComment && (
                    <div className="bg-white border-t-2 border-emerald-200 p-3">
                      {/* 回复提示 */}
                      {replyingTo && (
                        <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 mb-2 text-xs text-emerald-700 border border-emerald-200">
                          <span>回复 {replies.find(r => r.id === replyingTo)?.userName}</span>
                          <button 
                            onClick={() => setReplyingTo(null)}
                            className="text-emerald-500 hover:text-emerald-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      {/* 附件预览 */}
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {attachments.map((file) => (
                            <div 
                              key={file.id} 
                              className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs border border-slate-200"
                            >
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <File className="h-3 w-3 text-emerald-600" />
                              )}
                              <span className="truncate max-w-[80px] text-slate-600">{file.name}</span>
                              <button 
                                onClick={() => handleRemoveAttachment(file.id)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 输入框和按钮 */}
                      <div className="flex items-end gap-2">
                        {/* 附件按钮 */}
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                        
                        {/* 输入框 */}
                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="输入消息..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            className="min-h-[40px] max-h-[120px] resize-none rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (newReply.trim()) {
                                  handleSubmitReply()
                                }
                              }
                            }}
                            rows={1}
                          />
                        </div>
                        
                        {/* 发送按钮 */}
                        <Button
                          onClick={handleSubmitReply}
                          disabled={!newReply.trim() || isSubmitting}
                          className={`shrink-0 h-9 px-5 rounded-xl font-medium transition-all ${
                            newReply.trim() 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            '发送'
                          )}
                        </Button>
                      </div>
                      
                      {/* 隐藏���文件输入 */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
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

      {/* 退回对话框 */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退回单据</DialogTitle>
            <DialogDescription>退回后单据将回到草稿状态，创建人可以重新编辑后提交</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入退回原因（可选）"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleReturnDocument} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认退回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
