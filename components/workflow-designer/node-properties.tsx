'use client'

import { useState, useEffect } from 'react'
import type { Node } from '@xyflow/react'
import type { WorkflowNodeData, ApproverType, NodeType, FormField, DocumentType, WorkflowConfig } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Settings, Plus, Info, Users, Shield, List, Edit3 } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

interface NodePropertiesProps {
  node: Node<WorkflowNodeData> | null
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void
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

export function NodeProperties({ node, onUpdateNode }: NodePropertiesProps) {
  const { users, roles, loadUsers, loadRoles, forms, workflows } = useAppStore()
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowConfig | null>(null)
  const [localData, setLocalData] = useState<WorkflowNodeData | null>(null)
  const [currentForm, setCurrentForm] = useState<DocumentType | null>(null)
  const [expandedFieldConfigs, setExpandedFieldConfigs] = useState<Record<string, boolean>>({})
  const [selectedFields, setSelectedFields] = useState<Record<string, FormField[]>>({})

  // 从父组件获取当前流程
  const parentWorkflowId = typeof window !== 'undefined' ? (window as any).currentWorkflowId : null

  useEffect(() => {
    loadUsers()
    loadRoles()
    if (workflows.length > 0 && currentWorkflow?.id) {
      const workflow = workflows.find(w => w.id === currentWorkflow.id)
      if (workflow) {
        setCurrentWorkflow(workflow)
      }
    }
  }, [loadUsers, loadRoles, workflows, currentWorkflow])

  useEffect(() => {
    if (node) {
      setLocalData(node.data)
    } else {
      setLocalData(null)
    }
  }, [node])

  // 从父组件获取当前流程
  useEffect(() => {
    if (parentWorkflowId) {
      const workflow = workflows.find(w => w.id === parentWorkflowId)
      if (workflow) {
        setCurrentWorkflow(workflow)
      }
    }
  }, [parentWorkflowId, workflows])

  // 获取当前流程关联的表单
  const form = currentWorkflow?.formId ? forms.find(f => f.id === currentWorkflow.formId) : null

  // 加载表单数据
  useEffect(() => {
    if (form) {
      setCurrentForm(form)
    }
  }, [form])

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
        canTransfer: false,
        canComment: false,
        fieldPermissions
      })
    }

    updateData({ permissions: updatedPermissions })
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
    { value: 'initiator', label: '发起人', description: '单据创建者' },
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
              <FieldLabel className="text-xs">节点���称</FieldLabel>
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

                        {/* 字段权限配置按钮 */}
                        {permission?.canEdit && (
                          <div className="pt-2 border-t border-border">
                            <button
                              className="flex w-full items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => {
                                setExpandedFieldConfigs(prev => ({
                                  ...prev,
                                  [role.id]: !prev[role.id]
                                }))
                                if (!expandedFieldConfigs[role.id]) {
                                  const roleSelectedFields = currentForm?.fields.filter(field =>
                                    permission?.fieldPermissions?.[field.id]?.editable
                                  ) || []
                                  setSelectedFields(prev => ({
                                    ...prev,
                                    [role.id]: roleSelectedFields
                                  }))
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <List className="h-3.5 w-3.5" />
                                <span>字段编辑权限</span>
                              </div>
                              <Edit3 className={`h-3.5 w-3.5 transition-transform ${expandedFieldConfigs[role.id] ? 'rotate-45' : ''}`} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 字段权限配置面板 - 参考图片复型表单样式 */}
                      {expandedFieldConfigs[role.id] && currentForm && (
                        <div className="border-t border-border bg-muted/20 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium">选择可编辑字段</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const allFields = currentForm.fields.filter(f => !f.hidden)
                                  const newPermissions = { ...permission?.fieldPermissions || {} }
                                  allFields.forEach(field => {
                                    newPermissions[field.id] = { visible: true, editable: true }
                                  })
                                  updatePermissionField(role.id, newPermissions)
                                  setSelectedFields(prev => ({
                                    ...prev,
                                    [role.id]: allFields
                                  }))
                                }}
                              >
                                全选
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const newPermissions = { ...permission?.fieldPermissions || {} }
                                  Object.keys(newPermissions).forEach(key => {
                                    newPermissions[key] = { visible: true, editable: false }
                                  })
                                  updatePermissionField(role.id, newPermissions)
                                  setSelectedFields(prev => ({
                                    ...prev,
                                    [role.id]: []
                                  }))
                                }}
                              >
                                清空
                              </Button>
                            </div>
                          </div>

                          {/* 字段列表 - 三列网格布局 */}
                          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                            {currentForm.fields
                              .filter(field => !field.hidden && field.type !== 'divider' && field.type !== 'description')
                              .map((field) => {
                                const roleSelectedFields = selectedFields[role.id] || []
                                const isSelected = roleSelectedFields.some(f => f.id === field.id)

                                return (
                                  <label
                                    key={field.id}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                                      isSelected 
                                        ? 'bg-primary/10 text-primary border border-primary/20' 
                                        : 'bg-card border border-border hover:bg-muted/50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          const newSelected = [...roleSelectedFields, field]
                                          setSelectedFields(prev => ({
                                            ...prev,
                                            [role.id]: newSelected
                                          }))
                                          const newPermissions = { ...permission?.fieldPermissions || {} }
                                          newPermissions[field.id] = { visible: true, editable: true }
                                          updatePermissionField(role.id, newPermissions)
                                        } else {
                                          const newSelected = roleSelectedFields.filter(f => f.id !== field.id)
                                          setSelectedFields(prev => ({
                                            ...prev,
                                            [role.id]: newSelected
                                          }))
                                          const newPermissions = { ...permission?.fieldPermissions || {} }
                                          delete newPermissions[field.id]
                                          updatePermissionField(role.id, newPermissions)
                                        }
                                      }}
                                      className="accent-primary h-3.5 w-3.5"
                                    />
                                    <span className="truncate">{field.label}</span>
                                  </label>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </FieldGroup>
        </TabsContent>
      </Tabs>
    </div>
  )
}
