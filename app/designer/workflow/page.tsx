'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { WorkflowDesigner } from '@/components/workflow-designer'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import { categoryStorage } from '@/lib/storage'
import { 
  Save, ArrowLeft, Plus, GitBranch, Trash2, Edit, Send,
  Play, FileCheck, RotateCcw, ArrowRightLeft, XCircle, Bell, CheckCircle,
  GripVertical, Circle, Sparkles
} from 'lucide-react'
import { AIConfigDialog } from '@/components/ai-config-dialog'
import type { WorkflowConfig, FormCategory, FlowEvent, FlowEventType, DocumentStatusConfig } from '@/lib/types'

function generateId() {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// 默认单据状态
const defaultStatuses: DocumentStatusConfig[] = [
  { id: 'st_draft', code: 'draft', name: '草稿', color: '#6b7280', isInitial: true, isFinal: false, order: 1 },
  { id: 'st_pending', code: 'pending', name: '审批中', color: '#f59e0b', isInitial: false, isFinal: false, order: 2 },
  { id: 'st_approved', code: 'approved', name: '已通过', color: '#10b981', isInitial: false, isFinal: true, order: 3 },
  { id: 'st_rejected', code: 'rejected', name: '已驳回', color: '#ef4444', isInitial: false, isFinal: false, order: 4 },
  { id: 'st_cancelled', code: 'cancelled', name: '已取消', color: '#9ca3af', isInitial: false, isFinal: true, order: 5 },
]

// 默认流程事件（包含状态转换）
const createDefaultFlowEvents = (statuses: DocumentStatusConfig[]): FlowEvent[] => [
  { 
    id: 'evt_create', 
    type: 'create', 
    name: '创建单据', 
    description: '用户创建新单据时触发',
    toStatus: statuses.find(s => s.isInitial)?.code || 'draft',
    enabled: true
  },
  { 
    id: 'evt_submit', 
    type: 'submit', 
    name: '提交审批', 
    description: '用户提交单据进入审批流程',
    fromStatus: ['draft', 'rejected'],
    toStatus: 'pending',
    enabled: true
  },
  { 
    id: 'evt_approve', 
    type: 'approve', 
    name: '审批通过', 
    description: '审批人通过单据',
    fromStatus: ['pending'],
    toStatus: 'approved',
    enabled: true
  },
  { 
    id: 'evt_reject', 
    type: 'reject', 
    name: '审批驳回', 
    description: '审批人驳回单据',
    fromStatus: ['pending'],
    toStatus: 'rejected',
    enabled: true
  },
  { 
    id: 'evt_transfer', 
    type: 'transfer', 
    name: '转单', 
    description: '将单据转给其他人处理',
    fromStatus: ['pending'],
    enabled: true
  },
  { 
    id: 'evt_revoke', 
    type: 'revoke', 
    name: '撤回', 
    description: '提交人撤回已提交的单据',
    fromStatus: ['pending'],
    toStatus: 'draft',
    enabled: true
  },
  { 
    id: 'evt_resubmit', 
    type: 'resubmit', 
    name: '重新提交', 
    description: '被驳回后重新提交',
    fromStatus: ['rejected'],
    toStatus: 'pending',
    enabled: true
  },
  { 
    id: 'evt_cancel', 
    type: 'cancel', 
    name: '取消', 
    description: '取消单据',
    fromStatus: ['draft', 'rejected'],
    toStatus: 'cancelled',
    enabled: true
  },
  { 
    id: 'evt_complete', 
    type: 'complete', 
    name: '完成', 
    description: '流程结束，单据完成',
    fromStatus: ['approved'],
    enabled: false
  },
  { 
    id: 'evt_notify', 
    type: 'notify', 
    name: '通知', 
    description: '发送通知消息',
    enabled: true
  },
]

const eventIcons: Record<FlowEventType, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  submit: <Send className="h-4 w-4" />,
  approve: <CheckCircle className="h-4 w-4" />,
  reject: <XCircle className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  revoke: <RotateCcw className="h-4 w-4" />,
  resubmit: <FileCheck className="h-4 w-4" />,
  cancel: <XCircle className="h-4 w-4" />,
  complete: <CheckCircle className="h-4 w-4" />,
  notify: <Bell className="h-4 w-4" />,
}

const statusColors = [
  '#6b7280', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
]

export default function WorkflowDesignerPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </MainLayout>
    }>
      <WorkflowDesignerContent />
    </Suspense>
  )
}

function WorkflowDesignerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('id')

  const {
    workflows,
    forms,
    loadWorkflows,
    loadForms,
    saveWorkflow,
    deleteWorkflow,
    currentWorkflow,
    setCurrentWorkflow,
  } = useAppStore()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedFormId, setSelectedFormId] = useState('')
  const [statuses, setStatuses] = useState<DocumentStatusConfig[]>(defaultStatuses)
  const [flowEvents, setFlowEvents] = useState<FlowEvent[]>(createDefaultFlowEvents(defaultStatuses))
  const [showList, setShowList] = useState(!workflowId)
  const [designerKey, setDesignerKey] = useState(0)
  const workflowDesignerRef = useRef<{ updateFromAI: (data: unknown) => void } | null>(null)
  const [categories, setCategories] = useState<FormCategory[]>([])
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusCode, setNewStatusCode] = useState('')

  useEffect(() => {
    loadWorkflows()
    loadForms()
    setCategories(categoryStorage.getAll())
  }, [loadWorkflows, loadForms])

  useEffect(() => {
    if (workflowId) {
      const workflow = workflows.find((w) => w.id === workflowId)
      if (workflow) {
        setCurrentWorkflow(workflow)
        setWorkflowName(workflow.name)
        setWorkflowDescription(workflow.description || '')
        setSelectedCategoryId(workflow.categoryId || '')
        setSelectedFormId(workflow.formId || '')
        setStatuses(workflow.statuses?.length ? workflow.statuses : defaultStatuses)
        setFlowEvents(workflow.events?.length ? workflow.events : createDefaultFlowEvents(workflow.statuses || defaultStatuses))
        setShowList(false)
      }
    }
  }, [workflowId, workflows, setCurrentWorkflow])

  const handleSave = useCallback(() => {
    if (!workflowName.trim() || !selectedCategoryId) return

    const workflowConfig: WorkflowConfig = {
      id: currentWorkflow?.id || generateId(),
      name: workflowName,
      description: workflowDescription,
      categoryId: selectedCategoryId,
      formId: selectedFormId || undefined,
      nodes: currentWorkflow?.nodes || [],
      edges: currentWorkflow?.edges || [],
      events: flowEvents,
      statuses: statuses,
      status: currentWorkflow?.status || 'draft',
      createdAt: currentWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveWorkflow(workflowConfig)
    setCurrentWorkflow(workflowConfig)
    setShowSaveDialog(false)

    if (!workflowId) {
      router.push(`/designer/workflow?id=${workflowConfig.id}`)
    }
  }, [workflowName, workflowDescription, selectedCategoryId, selectedFormId, currentWorkflow, flowEvents, statuses, saveWorkflow, setCurrentWorkflow, workflowId, router])

  const handlePublish = (workflow: WorkflowConfig) => {
    const updatedWorkflow = { ...workflow, status: 'published' as const }
    saveWorkflow(updatedWorkflow)
    if (currentWorkflow?.id === workflow.id) {
      setCurrentWorkflow(updatedWorkflow)
    }
  }

  const handleNewWorkflow = () => {
    setCurrentWorkflow(null)
    setWorkflowName('')
    setWorkflowDescription('')
    setSelectedCategoryId('')
    setSelectedFormId('')
    setStatuses(defaultStatuses)
    setFlowEvents(createDefaultFlowEvents(defaultStatuses))
    setShowList(false)
    setDesignerKey((k) => k + 1)
    router.push('/designer/workflow')
  }

  const handleEditWorkflow = (workflow: WorkflowConfig) => {
    setCurrentWorkflow(workflow)
    setWorkflowName(workflow.name)
    setWorkflowDescription(workflow.description || '')
    setSelectedCategoryId(workflow.categoryId || '')
    setSelectedFormId(workflow.formId || '')
    setStatuses(workflow.statuses?.length ? workflow.statuses : defaultStatuses)
    setFlowEvents(workflow.events?.length ? workflow.events : createDefaultFlowEvents(workflow.statuses || defaultStatuses))
    setShowList(false)
    router.push(`/designer/workflow?id=${workflow.id}`)
  }

  const handleDeleteWorkflow = (id: string) => {
    if (confirm('确定要删除此流程吗？')) {
      deleteWorkflow(id)
      if (currentWorkflow?.id === id) {
        setCurrentWorkflow(null)
        setShowList(true)
        router.push('/designer/workflow')
      }
    }
  }

  const toggleEventEnabled = (eventId: string) => {
    setFlowEvents(prev => prev.map(evt => 
      evt.id === eventId ? { ...evt, enabled: evt.enabled === false ? true : false } : evt
    ))
  }

  const updateEventStatus = (eventId: string, field: 'fromStatus' | 'toStatus', value: string | string[]) => {
    setFlowEvents(prev => prev.map(evt => 
      evt.id === eventId ? { ...evt, [field]: value } : evt
    ))
  }

  const addStatus = () => {
    if (!newStatusName.trim() || !newStatusCode.trim()) return
    const newStatus: DocumentStatusConfig = {
      id: `st_${Date.now()}`,
      code: newStatusCode.toLowerCase().replace(/\s+/g, '_'),
      name: newStatusName,
      color: statusColors[statuses.length % statusColors.length],
      isInitial: false,
      isFinal: false,
      order: statuses.length + 1,
    }
    setStatuses([...statuses, newStatus])
    setNewStatusName('')
    setNewStatusCode('')
  }

  const removeStatus = (id: string) => {
    const status = statuses.find(s => s.id === id)
    if (status?.isInitial || status?.isFinal) {
      alert('不能删除初始状态或终态')
      return
    }
    setStatuses(statuses.filter(s => s.id !== id))
  }

  const updateStatus = (id: string, updates: Partial<DocumentStatusConfig>) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const setInitialStatus = (id: string) => {
    setStatuses(prev => prev.map(s => ({ ...s, isInitial: s.id === id })))
  }

  const toggleFinalStatus = (id: string) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, isFinal: !s.isFinal } : s))
  }

  const getFormsInCategory = (categoryId: string) => {
    return forms.filter(f => f.categoryId === categoryId && f.status === 'published')
  }

  // 处理AI生成的流程配置
  const handleAIGeneratedWorkflow = useCallback((data: {
    nodes?: Array<{ id: string; type: string; position: { x: number; y: number }; data: { label: string } }>;
    edges?: Array<{ id: string; source: string; target: string; label?: string }>;
    statuses?: DocumentStatusConfig[];
    events?: FlowEvent[];
    summary?: string;
  }) => {
    // 更新状态
    if (data.statuses && data.statuses.length > 0) {
      setStatuses(data.statuses)
    }
    // 更新事件
    if (data.events && data.events.length > 0) {
      setFlowEvents(data.events)
    }
    // 更新流程设计器的节点和边
    if (data.nodes && data.edges) {
      // 通过ref调用设计器的更新方法
      if (workflowDesignerRef.current) {
        workflowDesignerRef.current.updateFromAI({ nodes: data.nodes, edges: data.edges })
      }
      setDesignerKey(k => k + 1)
    }
  }, [])

  if (showList) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">流程设计</h1>
              <p className="mt-1 text-sm text-muted-foreground">为每个表单分类配置独立的业务流程和单据状态</p>
            </div>
            <Button onClick={handleNewWorkflow}>
              <Plus className="mr-2 h-4 w-4" />
              新建流程
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {workflows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <GitBranch className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-lg font-medium text-foreground">暂无流程</h2>
                <p className="mt-2 text-sm text-muted-foreground">点击上方按钮创建第一个流程</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {workflows.map((workflow) => {
                  const category = categories.find(c => c.id === workflow.categoryId)
                  return (
                    <div
                      key={workflow.id}
                      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                      onClick={() => handleEditWorkflow(workflow)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <GitBranch className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={workflow.status === 'published' ? 'default' : 'secondary'}>
                            {workflow.status === 'published' ? '已发布' : '草稿'}
                          </Badge>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {workflow.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePublish(workflow)
                                }}
                                title="发布流程"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditWorkflow(workflow)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteWorkflow(workflow.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <h3 className="mt-3 font-medium text-foreground">{workflow.name}</h3>
                      {workflow.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5">
                          分类: {category?.name || '未分类'}
                        </span>
                        <span>{workflow.statuses?.length || 0} 个状态</span>
                        <span>��</span>
                        <span>{workflow.events?.filter(e => e.enabled !== false).length || 0} 个事件</span>
                      </div>
                      {/* 显示状态标签 */}
                      {workflow.statuses && workflow.statuses.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {workflow.statuses.slice(0, 4).map(st => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                              style={{ backgroundColor: `${st.color}20`, color: st.color }}
                            >
                              <Circle className="h-2 w-2 fill-current" />
                              {st.name}
                            </span>
                          ))}
                          {workflow.statuses.length > 4 && (
                            <span className="text-xs text-muted-foreground">+{workflow.statuses.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 工具栏 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowList(true)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-foreground">
              {currentWorkflow?.name || '未命名流程'}
            </span>
            {currentWorkflow?.status && (
              <Badge variant={currentWorkflow.status === 'published' ? 'default' : 'secondary'}>
                {currentWorkflow.status === 'published' ? '已发布' : '草稿'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AIConfigDialog
              type="workflow"
              documentTypeName={currentWorkflow?.name}
              onGenerated={handleAIGeneratedWorkflow}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI 生成流程
                </Button>
              }
            />
            <Button size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>

        {/* 设计器 */}
        <div className="flex-1 overflow-hidden">
          <WorkflowDesigner
            key={designerKey}
            initialConfig={currentWorkflow || undefined}
            onSave={handleSave}
            workflowId={currentWorkflow?.id}
            ref={workflowDesignerRef}
          />
        </div>
      </div>

      {/* 保存对话框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>保存流程配置</DialogTitle>
            <DialogDescription>配置流程基本信息、单据状态和流程事件</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="statuses">单据状态</TabsTrigger>
              <TabsTrigger value="events">流程事件</TabsTrigger>
            </TabsList>
            
            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>流程名称 *</Label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="如：请假审批流程、费用报销流程"
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="描述此流程的用途"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>所属表单分类 *</Label>
                <Select value={selectedCategoryId || "none"} onValueChange={(v) => {
                  setSelectedCategoryId(v === "none" ? "" : v)
                  setSelectedFormId('')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择表单分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择分类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">流程将应用于此分类下的所有表单</p>
              </div>
              {selectedCategoryId && getFormsInCategory(selectedCategoryId).length > 0 && (
                <div className="space-y-2">
                  <Label>指定表单（可选）</Label>
                  <Select value={selectedFormId || "all"} onValueChange={(v) => setSelectedFormId(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="适用于分类下所有表单" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">适用于分类下所有表单</SelectItem>
                      {getFormsInCategory(selectedCategoryId).map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
            
            {/* 单据状态配置 */}
            <TabsContent value="statuses" className="py-4">
              <div className="mb-4">
                <h4 className="font-medium">单据状态配置</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  定义单据在流程中可能的状态，并设置初始状态和终态
                </p>
              </div>
              
              {/* 状态列表 */}
              <div className="space-y-2 mb-4">
                {statuses.map((status, index) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <Input
                      value={status.name}
                      onChange={(e) => updateStatus(status.id, { name: e.target.value })}
                      className="w-32"
                    />
                    <code className="rounded bg-muted px-2 py-1 text-xs">{status.code}</code>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="initialStatus"
                          checked={status.isInitial}
                          onChange={() => setInitialStatus(status.id)}
                          className="accent-primary"
                        />
                        <span className="text-muted-foreground">初始</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={status.isFinal}
                          onChange={() => toggleFinalStatus(status.id)}
                          className="accent-primary"
                        />
                        <span className="text-muted-foreground">终态</span>
                      </label>
                    </div>
                    <Select 
                      value={status.color} 
                      onValueChange={(v) => updateStatus(status.id, { color: v })}
                    >
                      <SelectTrigger className="w-20">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: status.color }} />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStatus(status.id)}
                      disabled={status.isInitial}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* 添加新状态 */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3">
                <Input
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="状态名称"
                  className="w-32"
                />
                <Input
                  value={newStatusCode}
                  onChange={(e) => setNewStatusCode(e.target.value)}
                  placeholder="状态代码"
                  className="w-32"
                />
                <Button size="sm" onClick={addStatus} disabled={!newStatusName.trim() || !newStatusCode.trim()}>
                  <Plus className="mr-1 h-4 w-4" />
                  添加状态
                </Button>
              </div>
            </TabsContent>
            
            {/* 流程事件配置 */}
            <TabsContent value="events" className="py-4">
              <div className="mb-4">
                <h4 className="font-medium">流程事件配置</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  配置单据在不同阶段可以执行的操作，以及操作后的状态转换
                </p>
              </div>
              <div className="space-y-3">
                {flowEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                          {eventIcons[event.type]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={event.enabled !== false}
                        onCheckedChange={() => toggleEventEnabled(event.id)}
                      />
                    </div>
                    
                    {event.enabled !== false && (
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border">
                        {/* 来源状态（多选） */}
                        <div className="space-y-1">
                          <Label className="text-xs">允许的来源状态</Label>
                          <div className="flex flex-wrap gap-1">
                            {statuses.map(st => (
                              <label 
                                key={st.id} 
                                className="flex items-center gap-1 cursor-pointer rounded px-2 py-1 text-xs border"
                                style={{ 
                                  borderColor: event.fromStatus?.includes(st.code) ? st.color : 'transparent',
                                  backgroundColor: event.fromStatus?.includes(st.code) ? `${st.color}20` : 'transparent'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={event.fromStatus?.includes(st.code) || false}
                                  onChange={(e) => {
                                    const current = event.fromStatus || []
                                    if (e.target.checked) {
                                      updateEventStatus(event.id, 'fromStatus', [...current, st.code])
                                    } else {
                                      updateEventStatus(event.id, 'fromStatus', current.filter(s => s !== st.code))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <Circle className="h-2 w-2" style={{ color: st.color, fill: st.color }} />
                                {st.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        {/* 目标状态（单选） */}
                        <div className="space-y-1">
                          <Label className="text-xs">转换到状态</Label>
                          <Select 
                            value={event.toStatus || "none"} 
                            onValueChange={(v) => updateEventStatus(event.id, 'toStatus', v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="选择目标状态" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">不改变状态</SelectItem>
                              {statuses.map(st => (
                                <SelectItem key={st.id} value={st.code}>
                                  <div className="flex items-center gap-2">
                                    <Circle className="h-2 w-2" style={{ color: st.color, fill: st.color }} />
                                    {st.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!workflowName.trim() || !selectedCategoryId}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
