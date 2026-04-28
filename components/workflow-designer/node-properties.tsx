'use client'

import { useState, useEffect } from 'react'
import type { Node } from '@xyflow/react'
import type { WorkflowNodeData, ApproverType, NodeType, FormField, FormConfig, WorkflowConfig, DocumentType } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Settings, Plus, Info, Users, Shield, List, Edit3, Eye, Pencil, Check, X, Search } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { documentTypeStorage } from '@/lib/storage'

interface NodePropertiesProps {
  node: Node<WorkflowNodeData> | null
  onUpdateNode: (id: string, data: Partial<WorkflowNodeData>) => void
  workflowId?: string
}

const nodeTypeLabels: Record<NodeType, string> = {
  start: '开始节点',
  end: '结束节点',
  create: '创建单据',
  fill: '填写信息',
  submit: '提交',
  approve: '审批',
  review: '审核',
  condition: '条件分支',
  parallel: '并行',
  countersign: '会签',
  notify: '通知',
  subprocess: '子流程',
  transfer: '转单',
  convert: '转换单据',
  action: '自定义动作',
}

export function NodeProperties({ node, onUpdateNode, workflowId }: NodePropertiesProps) {
  const { users, roles, loadUsers, loadRoles, forms, workflows, loadForms, loadWorkflows } = useAppStore()
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowConfig | null>(null)
  const [localData, setLocalData] = useState<WorkflowNodeData | null>(null)
  const [currentForm, setCurrentForm] = useState<FormConfig | null>(null)
  const [expandedFieldConfigs, setExpandedFieldConfigs] = useState<Record<string, boolean>>({})
  const [selectedFields, setSelectedFields] = useState<Record<string, FormField[]>>({})
  // 字段权限配置弹窗状态
  const [fieldPermissionDialogOpen, setFieldPermissionDialogOpen] = useState(false)
  const [currentEditingRoleId, setCurrentEditingRoleId] = useState<string | null>(null)
  const [fieldSearchKeyword, setFieldSearchKeyword] = useState('')
  // 临时存储弹窗内的字段权限配置（点击保存后才真正应用）
  const [tempFieldPermissions, setTempFieldPermissions] = useState<Record<string, { visible: boolean; editable: boolean }>>({})

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadForms()
    loadWorkflows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (node) {
      setLocalData(node.data)
    } else {
      setLocalData(null)
    }
  }, [node])

  // 根据 workflowId 获取当前工作流
  useEffect(() => {
    if (workflowId && workflows.length > 0) {
      const workflow = workflows.find(w => w.id === workflowId)
      if (workflow) {
        setCurrentWorkflow(workflow)
      }
    }
  }, [workflowId, workflows])

  // 获取当前流程关联的表单（支持formId和categoryId两种关联方式，同时支持formStorage和documentTypeStorage）
  useEffect(() => {
    if (!currentWorkflow) {
      setCurrentForm(null)
      return
    }
    
    // 优先通过formId查找（在formStorage中）
    let foundForm: FormConfig | null = currentWorkflow.formId 
      ? forms.find(f => f.id === currentWorkflow.formId) || null
      : null
    
    // 如果没有找到，尝试通过categoryId查找（在formStorage中）
    if (!foundForm && currentWorkflow.categoryId) {
      foundForm = forms.find(f => f.id === currentWorkflow.categoryId) || null
    }
    
    // 如果还没有找到，尝试从documentTypeStorage中查找
    if (!foundForm && currentWorkflow.categoryId) {
      const documentTypes = documentTypeStorage.getAll()
      const docType = documentTypes.find(dt => dt.id === currentWorkflow.categoryId)
      if (docType) {
        // 将DocumentType转换为FormConfig格式
        foundForm = {
          id: docType.id,
          name: docType.name,
          description: docType.description,
          fields: docType.fields,
          layout: docType.layout || 'vertical',
          status: 'published',
          createdAt: docType.createdAt || new Date().toISOString(),
          updatedAt: docType.updatedAt || new Date().toISOString(),
        }
      }
    }
    
    setCurrentForm(foundForm)
  }, [currentWorkflow, forms])

  if (!node || !localData) {
    return (
      <div className="flex h-full w-72 flex-col border-l border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">节点属性</h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="rounded-full bg-muted p-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">选择节点</p>
          <p className="mt-1 text-xs text-muted-foreground">点击画布中的节点编辑属性</p>
        </div>
      </div>
    )
  }

  const updateData = (updates: Partial<WorkflowNodeData>) => {
    // 确保permissions字段存在
    if (updates.permissions) {
      updates.permissions = updates.permissions.map(p => ({
        roleId: p.roleId,
        canView: p.canView ?? false,
        canEdit: p.canEdit ?? false,
        canApprove: p.canApprove ?? false,
        canReject: p.canReject ?? false,
        canTransfer: p.canTransfer ?? false,
        canComment: p.canComment ?? false,
        fieldPermissions: p.fieldPermissions || {}
      }))
    }

    const updated = { ...localData, ...updates }
    setLocalData(updated)
    onUpdateNode(node.id, updates)
  }

  // 更新指定角色的字段权限
  const updatePermissionField = (roleId: string, fieldPermissions: Record<string, { visible: boolean; editable: boolean }>) => {
    const updatedPermissions = localData.permissions?.map(p =>
      p.roleId === roleId
        ? { ...p, fieldPermissions }
        : p
    ) || []

    if (!updatedPermissions.find(p => p.roleId === roleId)) {
      updatedPermissions.push({
        roleId,
        canView: true,
        canEdit: true,
                        canApprove: false,
                        canReject: false,
                        canReturn: false,
                        canTransfer: false,
                        canComment: false,
                        fieldPermissions
                      })
                    }

                    updateData({ permissions: updatedPermissions })
                  }

                  // 打开字段权限配置弹窗
  const openFieldPermissionDialog = (roleId: string) => {
    const permission = localData.permissions?.find(p => p.roleId === roleId)
    setCurrentEditingRoleId(roleId)
    setTempFieldPermissions(permission?.fieldPermissions || {})
    setFieldSearchKeyword('')
    setFieldPermissionDialogOpen(true)
  }

  // 保存弹窗中的字段权限配置
  const saveFieldPermissions = () => {
    if (currentEditingRoleId) {
      updatePermissionField(currentEditingRoleId, tempFieldPermissions)
    }
    setFieldPermissionDialogOpen(false)
    setCurrentEditingRoleId(null)
  }

  // 切换单个字段的权限
  const toggleFieldPermission = (fieldId: string, permType: 'visible' | 'editable') => {
    setTempFieldPermissions(prev => {
      const current = prev[fieldId] || { visible: true, editable: false }
      if (permType === 'editable') {
        // 如果设置为可编辑，则自动设置为可见
        return { ...prev, [fieldId]: { ...current, editable: !current.editable, visible: !current.editable ? true : current.visible } }
      }
      // 如果取消可见，则也取消可编辑
      return { ...prev, [fieldId]: { ...current, visible: !current.visible, editable: !current.visible ? false : current.editable } }
    })
  }

  // 批量设置字段权限
  const batchSetFieldPermissions = (action: 'all_visible' | 'all_editable' | 'clear_editable' | 'clear_all') => {
    if (!currentForm) return
    const fields = currentForm.fields.filter(f => !f.hidden && f.type !== 'divider' && f.type !== 'description')
    const newPermissions: Record<string, { visible: boolean; editable: boolean }> = {}
    
    fields.forEach(field => {
      switch (action) {
        case 'all_visible':
          newPermissions[field.id] = { visible: true, editable: tempFieldPermissions[field.id]?.editable || false }
          break
        case 'all_editable':
          newPermissions[field.id] = { visible: true, editable: true }
          break
        case 'clear_editable':
          newPermissions[field.id] = { visible: tempFieldPermissions[field.id]?.visible || true, editable: false }
          break
        case 'clear_all':
          newPermissions[field.id] = { visible: false, editable: false }
          break
      }
    })
    
    setTempFieldPermissions(newPermissions)
  }

  // 获取当前角色的字段权限统计
  const getFieldPermissionStats = () => {
    if (!currentForm) return { total: 0, visible: 0, editable: 0 }
    const fields = currentForm.fields.filter(f => !f.hidden && f.type !== 'divider' && f.type !== 'description')
    const visible = fields.filter(f => tempFieldPermissions[f.id]?.visible).length
    const editable = fields.filter(f => tempFieldPermissions[f.id]?.editable).length
    return { total: fields.length, visible, editable }
  }

  // 按分组显示字段（根据 divider 分组）
  const getGroupedFields = () => {
    if (!currentForm) return []
    const groups: { name: string; fields: FormField[] }[] = []
    let currentGroup: { name: string; fields: FormField[] } = { name: '基础信息', fields: [] }
    
    currentForm.fields.forEach(field => {
      if (field.type === 'divider') {
        if (currentGroup.fields.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = { name: field.label, fields: [] }
      } else if (!field.hidden && field.type !== 'description') {
        currentGroup.fields.push(field)
      }
    })
    
    if (currentGroup.fields.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }

  // 过滤字段
  const filterFields = (fields: FormField[]) => {
    if (!fieldSearchKeyword) return fields
    return fields.filter(f => 
      f.label.toLowerCase().includes(fieldSearchKeyword.toLowerCase()) ||
      f.name.toLowerCase().includes(fieldSearchKeyword.toLowerCase())
    )
  }

  const nodeType = node.type as NodeType

  // 需要配置处理人的节点类型
  const needsAssignee = ['create', 'fill', 'submit', 'approve', 'review', 'countersign', 'transfer'].includes(nodeType)
  const isConditionNode = nodeType === 'condition'
  const isNotifyNode = nodeType === 'notify'
  const isConvertNode = nodeType === 'convert'
  const isSubprocessNode = nodeType === 'subprocess'

  const approverTypes: { value: ApproverType; label: string; description: string }[] = [
    { value: 'user', label: '指定用户', description: '选择具体的用户' },
    { value: 'role', label: '指定角色', description: '该角色下的所有用户' },
    { value: 'department', label: '部门负责人', description: '部门负责人处理' },
    { value: 'initiator', label: '��起人', description: '单据创建者' },
    { value: 'superior', label: '直属上级', description: '发起人的上级' },
  ]

  const getAssigneeLabel = () => {
    switch (nodeType) {
      case 'create': return '创建人'
      case 'fill': return '填写人'
      case 'submit': return '提交人'
      case 'approve': return '审批人'
      case 'review': return '审核人'
      case 'countersign': return '会签人'
      case 'transfer': return '接收人'
      default: return '处理人'
    }
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {nodeTypeLabels[nodeType]}
          </Badge>
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-foreground">{localData.label}</p>
      </div>

      <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 grid w-auto grid-cols-3">
          <TabsTrigger value="basic" className="text-xs">基础配置</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">高级设置</TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs">权限配置</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="flex-1 overflow-y-auto p-3">
          <FieldGroup className="space-y-3">
            <Field>
              <FieldLabel className="text-xs">节点�����称</FieldLabel>
              <Input
                value={localData.label}
                onChange={(e) => updateData({ label: e.target.value })}
                className="h-8 text-sm"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs">节点说明</FieldLabel>
              <Textarea
                value={localData.description || ''}
                onChange={(e) => updateData({ description: e.target.value })}
                placeholder="可选"
                className="min-h-[50px] text-sm"
              />
            </Field>

            {needsAssignee && (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">{getAssigneeLabel()}配置</p>
                  
                  <Field className="mb-2">
                    <FieldLabel className="text-xs">类型</FieldLabel>
                    <Select
                      value={localData.approvers?.type || 'role'}
                      onValueChange={(value) =>
                        updateData({
                          approvers: {
                            type: value as ApproverType,
                            value: [],
                            multiApprove: localData.approvers?.multiApprove,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {approverTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {localData.approvers?.type === 'user' && (
                    <Field>
                      <FieldLabel className="text-xs">选择用户</FieldLabel>
                      <Select
                        value={localData.approvers?.value?.[0] || 'none'}
                        onValueChange={(value) =>
                          updateData({
                            approvers: {
                              ...localData.approvers!,
                              value: value === 'none' ? [] : [value],
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="选择用户" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">请选择</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}

                  {localData.approvers?.type === 'role' && (
                    <Field>
                      <FieldLabel className="text-xs">选择角色</FieldLabel>
                      <Select
                        value={localData.approvers?.value?.[0] || 'none'}
                        onValueChange={(value) =>
                          updateData({
                            approvers: {
                              ...localData.approvers!,
                              value: value === 'none' ? [] : [value],
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">请选择</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>

                {nodeType === 'countersign' && (
                  <Field>
                    <FieldLabel className="text-xs">会签方式</FieldLabel>
                    <Select
                      value={localData.approvers?.multiApprove || 'all'}
                      onValueChange={(value) =>
                        updateData({
                          approvers: {
                            ...localData.approvers!,
                            multiApprove: value as 'any' | 'all' | 'sequence',
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部同意才通过</SelectItem>
                        <SelectItem value="any">任一同意即通过</SelectItem>
                        <SelectItem value="sequence">按顺序依次审批</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </>
            )}

            {isConditionNode && (
              <div className="rounded-lg border border-dashed border-border p-3 text-center">
                <Info className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  条件分支可连接多个出口
                </p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  添加条件
                </Button>
              </div>
            )}

            {isNotifyNode && (
              <>
                <Field>
                  <FieldLabel className="text-xs">通知方式</FieldLabel>
                  <Select
                    value={localData.notifications?.type || 'system'}
                    onValueChange={(value) =>
                      updateData({
                        notifications: {
                          type: value as 'email' | 'sms' | 'system',
                          recipients: localData.notifications?.recipients || {
                            type: 'initiator',
                            value: [],
                          },
                          template: localData.notifications?.template || '',
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">站内通知</SelectItem>
                      <SelectItem value="email">邮件通知</SelectItem>
                      <SelectItem value="sms">短信通知</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-xs">通知内容</FieldLabel>
                  <Textarea
                    value={localData.notifications?.template || ''}
                    onChange={(e) =>
                      updateData({
                        notifications: {
                          ...localData.notifications!,
                          template: e.target.value,
                        },
                      })
                    }
                    placeholder="输入通知内容"
                    className="min-h-[60px] text-sm"
                  />
                </Field>
              </>
            )}

            {isConvertNode && (
              <Field>
                <FieldLabel className="text-xs">目标表单类型</FieldLabel>
                <Select
                  value="none"
                  onValueChange={() => {}}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="选择目标表单" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择</SelectItem>
                    {forms.filter(f => f.status === 'published').map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  将当前单据转换为其他类型的单据
                </p>
              </Field>
            )}

            {isSubprocessNode && (
              <Field>
                <FieldLabel className="text-xs">子流程</FieldLabel>
                <Select
                  value="none"
                  onValueChange={() => {}}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="选择子流程" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  调用其他已发布的流程
                </p>
              </Field>
            )}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-3">
          <FieldGroup className="space-y-3">
            {(nodeType === 'approve' || nodeType === 'review' || nodeType === 'countersign') && (
              <>
                <Field>
                  <FieldLabel className="text-xs">超时时间（小时）</FieldLabel>
                  <Input
                    type="number"
                    value={localData.timeout || ''}
                    onChange={(e) =>
                      updateData({ timeout: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="不限制"
                    className="h-8 text-sm"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-xs">超时后操作</FieldLabel>
                  <Select
                    value={localData.timeoutAction || 'notify'}
                    onValueChange={(value) =>
                      updateData({ timeoutAction: value as 'approve' | 'reject' | 'notify' })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notify">发送提醒</SelectItem>
                      <SelectItem value="approve">自动通过</SelectItem>
                      <SelectItem value="reject">自动驳回</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <Field className="flex items-center justify-between">
                    <FieldLabel className="mb-0 text-xs">允许转交</FieldLabel>
                    <Switch className="scale-90" />
                  </Field>

                  <Field className="flex items-center justify-between">
                    <FieldLabel className="mb-0 text-xs">允许加签</FieldLabel>
                    <Switch className="scale-90" />
                  </Field>

                  <Field className="flex items-center justify-between">
                    <FieldLabel className="mb-0 text-xs">允许退回</FieldLabel>
                    <Switch className="scale-90" defaultChecked />
                  </Field>
                </div>
              </>
            )}

            {nodeType === 'transfer' && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  转单后，单据将转给指定的接收人处理，原处理人将无法继续操作。
                </p>
              </div>
            )}

            {nodeType === 'convert' && (
              <div className="space-y-2">
                <Field className="flex items-center justify-between">
                  <FieldLabel className="mb-0 text-xs">保留原单据</FieldLabel>
                  <Switch className="scale-90" defaultChecked />
                </Field>
                <Field className="flex items-center justify-between">
                  <FieldLabel className="mb-0 text-xs">复制附件</FieldLabel>
                  <Switch className="scale-90" defaultChecked />
                </Field>
              </div>
            )}

            {(nodeType === 'start' || nodeType === 'end') && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {nodeType === 'start' ? '流程起点，无需额外配置' : '流程终点，无需额外配置'}
                </p>
              </div>
            )}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="permissions" className="flex-1 overflow-y-auto p-3">
          <FieldGroup className="space-y-4">
            {/* 分组标题 - 参考图片样式 */}
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className="h-4 w-1 rounded-full bg-primary" />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">节点权限配置</span>
              </div>
            </div>

            {roles.length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-6 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">暂无用户组，请先创建用户组</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => {
                  const permission = localData.permissions?.find(p => p.roleId === role.id) || {
                    roleId: role.id,
                    canView: false,
                    canEdit: false,
                    canApprove: false,
                    canReject: false,
                    canReturn: false,
                    canTransfer: false,
                    canComment: false,
                    fieldPermissions: {}
                  }
                  return (
                    <div key={role.id} className="rounded-lg border border-border bg-card overflow-hidden">
                      {/* 角色标题 */}
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{role.name}</span>
                      </div>

                      <div className="p-3 space-y-3">
                        {/* 基础权限 - 两列布局 */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">可查看</span>
                            <Switch
                              className="scale-90"
                              checked={permission?.canView !== false}
                              onCheckedChange={(checked) => {
                                const updatedPermissions = localData.permissions?.map(p =>
                                  p.roleId === role.id
                                    ? { ...p, canView: checked }
                                    : p
                                ) || []

                                if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                  updatedPermissions.push({
                                    roleId: role.id,
                                    canView: checked,
                                    canEdit: false,
                                    canApprove: false,
                                    canReject: false,
                                    canReturn: false,
                                    canTransfer: false,
                                    canComment: false,
                                    fieldPermissions: {}
                                  })
                                }

                                updateData({ permissions: updatedPermissions })
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">可编辑</span>
                            <Switch
                              className="scale-90"
                              checked={permission?.canEdit !== false}
                              onCheckedChange={(checked) => {
                                const updatedPermissions = localData.permissions?.map(p =>
                                  p.roleId === role.id
                                    ? { ...p, canEdit: checked }
                                    : p
                                ) || []

                                if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                  updatedPermissions.push({
                                    roleId: role.id,
                                    canView: false,
                                    canEdit: checked,
                                    canApprove: false,
                                    canReject: false,
                                    canReturn: false,
                                    canTransfer: false,
                                    canComment: false,
                                    fieldPermissions: {}
                                  })
                                }

                                updateData({ permissions: updatedPermissions })
                              }}
                            />
                          </div>

                          {/* 审批相关权限 */}
                          {(nodeType === 'approve' || nodeType === 'review' || nodeType === 'countersign') && (
                            <>
                              <div className="flex items-center justify-between py-1">
                                <span className="text-xs text-muted-foreground">可审批</span>
                                <Switch
                                  className="scale-90"
                                  checked={permission?.canApprove !== false}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = localData.permissions?.map(p =>
                                      p.roleId === role.id
                                        ? { ...p, canApprove: checked }
                                        : p
                                    ) || []

                                    if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                      updatedPermissions.push({
                                        roleId: role.id,
                                        canView: false,
                                        canEdit: false,
                                        canApprove: checked,
                                        canReject: false,
                                        canReturn: false,
                                        canTransfer: false,
                                        canComment: false,
                                        fieldPermissions: {}
                                      })
                                    }

                                    updateData({ permissions: updatedPermissions })
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between py-1">
                                <span className="text-xs text-muted-foreground">可驳回</span>
                                <Switch
                                  className="scale-90"
                                  checked={permission?.canReject !== false}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = localData.permissions?.map(p =>
                                      p.roleId === role.id
                                        ? { ...p, canReject: checked }
                                        : p
                                    ) || []

                                    if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                      updatedPermissions.push({
                                        roleId: role.id,
                                        canView: false,
                                        canEdit: false,
                                        canApprove: false,
                                        canReject: checked,
                                        canReturn: false,
                                        canTransfer: false,
                                        canComment: false,
                                        fieldPermissions: {}
                                      })
                                    }

                                    updateData({ permissions: updatedPermissions })
                                  }}
                                />
                              </div>
                            </>
                          )}

                          {/* 转单权限 */}
                          {nodeType === 'transfer' && (
                            <div className="flex items-center justify-between py-1">
                              <span className="text-xs text-muted-foreground">可转单</span>
                              <Switch
                                className="scale-90"
                                checked={permission?.canTransfer !== false}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = localData.permissions?.map(p =>
                                    p.roleId === role.id
                                      ? { ...p, canTransfer: checked }
                                      : p
                                  ) || []

                                  if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                    updatedPermissions.push({
                                      roleId: role.id,
                                      canView: false,
                                      canEdit: false,
                                      canApprove: false,
                                      canReject: false,
                                      canReturn: false,
                                      canTransfer: checked,
                                      canComment: false,
                                      fieldPermissions: {}
                                    })
                                  }

                                  updateData({ permissions: updatedPermissions })
                                }}
                              />
                            </div>
                          )}

                          {/* 退回权限 */}
                          <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">可退回</span>
                            <Switch
                              className="scale-90"
                              checked={permission?.canReturn === true}
                              onCheckedChange={(checked) => {
                                const updatedPermissions = localData.permissions?.map(p =>
                                  p.roleId === role.id
                                    ? { ...p, canReturn: checked }
                                    : p
                                ) || []

                                if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                  updatedPermissions.push({
                                    roleId: role.id,
                                    canView: false,
                                    canEdit: false,
                                    canApprove: false,
                                    canReject: false,
                                    canReturn: checked,
                                    canTransfer: false,
                                    canComment: false,
                                    fieldPermissions: {}
                                  })
                                }

                                updateData({ permissions: updatedPermissions })
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">可评论</span>
                            <Switch
                              className="scale-90"
                              checked={permission?.canComment !== false}
                              onCheckedChange={(checked) => {
                                const updatedPermissions = localData.permissions?.map(p =>
                                  p.roleId === role.id
                                    ? { ...p, canComment: checked }
                                    : p
                                ) || []

                                if (!updatedPermissions.find(p => p.roleId === role.id)) {
                                  updatedPermissions.push({
                                    roleId: role.id,
                                    canView: false,
                                    canEdit: false,
                                    canApprove: false,
                                    canReject: false,
                                    canReturn: false,
                                    canTransfer: false,
                                    canComment: checked,
                                    fieldPermissions: {}
                                  })
                                }

                                updateData({ permissions: updatedPermissions })
                              }}
                            />
                          </div>
                        </div>

                        {/* 字段权限配置按钮 - 打开弹窗，始终显示（只要有表单关联） */}
                        <div className="pt-2 border-t border-border">
                          {currentForm ? (
                            <button
                              className="flex w-full items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => openFieldPermissionDialog(role.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Pencil className="h-3.5 w-3.5" />
                                <span>配置字段编辑权限</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {Object.values(permission?.fieldPermissions || {}).filter(p => p.editable).length > 0 && (
                                  <Badge variant="secondary" className="h-5 text-[10px]">
                                    {Object.values(permission?.fieldPermissions || {}).filter(p => p.editable).length} 个可编辑
                                  </Badge>
                                )}
                                <Edit3 className="h-3.5 w-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="py-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Pencil className="h-3.5 w-3.5" />
                                <span>请先关联单据类型后再配置字段权限</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </FieldGroup>
        </TabsContent>
      </Tabs>

      {/* 字段权限配置弹窗 */}
      <Dialog open={fieldPermissionDialogOpen} onOpenChange={setFieldPermissionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              字段编辑权限配置
            </DialogTitle>
            <DialogDescription>
              为「{roles.find(r => r.id === currentEditingRoleId)?.name}」配置在该节点可编辑的字段
            </DialogDescription>
          </DialogHeader>
          
          {/* 工具栏 */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索字段..."
                  value={fieldSearchKeyword}
                  onChange={(e) => setFieldSearchKeyword(e.target.value)}
                  className="pl-9 h-8 w-56"
                />
              </div>
              
              {/* 统计信息 */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
                <span>共 {getFieldPermissionStats().total} 个字段</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {getFieldPermissionStats().visible} 可见
                </span>
                <span className="flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  {getFieldPermissionStats().editable} 可编辑
                </span>
              </div>
            </div>
            
            {/* 批量操作按钮 */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => batchSetFieldPermissions('all_editable')}
              >
                全部可编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => batchSetFieldPermissions('clear_editable')}
              >
                清除编辑权限
              </Button>
            </div>
          </div>
          
          {/* 字段列表 */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              {getGroupedFields().map((group, groupIndex) => {
                const filteredFields = filterFields(group.fields)
                if (filteredFields.length === 0) return null
                
                return (
                  <div key={groupIndex} className="space-y-2">
                    {/* 分组标题 */}
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                      <div className="h-4 w-1 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">({filteredFields.length})</span>
                    </div>
                    
                    {/* 字段表格 */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-[200px] text-xs">字段名称</TableHead>
                            <TableHead className="w-[150px] text-xs">字段代码</TableHead>
                            <TableHead className="w-[100px] text-xs">字段类型</TableHead>
                            <TableHead className="w-[80px] text-xs text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Eye className="h-3 w-3" />
                                可见
                              </div>
                            </TableHead>
                            <TableHead className="w-[80px] text-xs text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Pencil className="h-3 w-3" />
                                可编辑
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFields.map((field) => {
                            const fieldPerm = tempFieldPermissions[field.id] || { visible: true, editable: false }
                            return (
                              <TableRow key={field.id} className="hover:bg-muted/30">
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{field.label}</span>
                                    {field.required && (
                                      <span className="text-destructive text-xs">*</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {field.name}
                                  </code>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {field.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2 text-center">
                                  <Checkbox
                                    checked={fieldPerm.visible}
                                    onCheckedChange={() => toggleFieldPermission(field.id, 'visible')}
                                    className="mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="py-2 text-center">
                                  <Checkbox
                                    checked={fieldPerm.editable}
                                    onCheckedChange={() => toggleFieldPermission(field.id, 'editable')}
                                    disabled={!fieldPerm.visible}
                                    className="mx-auto"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })}
              
              {/* 无搜索结果提示 */}
              {fieldSearchKeyword && getGroupedFields().every(g => filterFields(g.fields).length === 0) && (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>未找到匹配「{fieldSearchKeyword}」的字段</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setFieldPermissionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveFieldPermissions}>
              <Check className="h-4 w-4 mr-1" />
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
