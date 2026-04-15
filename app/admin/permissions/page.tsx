'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore } from '@/stores/app-store'
import { Shield, FileText, Layout, Eye, Edit, Trash, Plus, Save, ChevronRight } from 'lucide-react'
import type { Role, Permission, PermissionAction, ResourceType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PermissionItem {
  id: string
  name: string
  type: ResourceType
  children?: PermissionItem[]
  actions: PermissionAction[]
}

export default function PermissionsPage() {
  const { roles, forms, pages, loadRoles, loadForms, loadPages, saveRole } = useAppStore()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [permissionState, setPermissionState] = useState<Record<string, PermissionAction[]>>({})

  useEffect(() => {
    loadRoles()
    loadForms()
    loadPages()
  }, [loadRoles, loadForms, loadPages])

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  // 初始化权限状态
  useEffect(() => {
    if (selectedRole) {
      const state: Record<string, PermissionAction[]> = {}
      selectedRole.permissions.forEach((perm) => {
        state[perm.resourceId] = perm.actions
      })
      setPermissionState(state)
    }
  }, [selectedRole])

  // 生成权限树
  const permissionTree: PermissionItem[] = [
    {
      id: 'designer',
      name: '设计中心',
      type: 'page',
      actions: ['view'],
      children: [
        { id: 'designer-form', name: '表单设计', type: 'page', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'designer-workflow', name: '流程设计', type: 'page', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'designer-page', name: '页面配置', type: 'page', actions: ['view', 'create', 'edit', 'delete'] },
      ],
    },
    {
      id: 'admin',
      name: '权限管理',
      type: 'page',
      actions: ['view'],
      children: [
        { id: 'admin-users', name: '用户管理', type: 'page', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'admin-roles', name: '角色管理', type: 'page', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'admin-permissions', name: '权限配置', type: 'page', actions: ['view', 'edit'] },
      ],
    },
    ...forms.map((form) => ({
      id: `form-${form.id}`,
      name: `表单: ${form.name}`,
      type: 'page' as ResourceType,
      actions: ['view', 'create', 'edit', 'delete'] as PermissionAction[],
      children: form.fields
        .filter((f) => !['divider', 'description'].includes(f.type))
        .map((field) => ({
          id: `field-${form.id}-${field.id}`,
          name: field.label,
          type: 'field' as ResourceType,
          actions: ['view', 'edit'] as PermissionAction[],
        })),
    })),
  ]

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const togglePermission = (resourceId: string, action: PermissionAction) => {
    setPermissionState((prev) => {
      const current = prev[resourceId] || []
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]
      return { ...prev, [resourceId]: updated }
    })
  }

  const hasPermission = (resourceId: string, action: PermissionAction) => {
    return permissionState[resourceId]?.includes(action) || false
  }

  const handleSave = () => {
    if (!selectedRole) return

    const permissions: Permission[] = Object.entries(permissionState)
      .filter(([_, actions]) => actions.length > 0)
      .map(([resourceId, actions]) => ({
        id: `perm_${resourceId}`,
        resourceId,
        resourceType: resourceId.startsWith('field-') ? 'field' : 'page',
        resourceName: resourceId,
        actions,
      }))

    saveRole({
      ...selectedRole,
      permissions,
    })

    alert('权限保存成功')
  }

  const actionLabels: Record<PermissionAction, { label: string; icon: React.ReactNode }> = {
    view: { label: '查看', icon: <Eye className="h-3 w-3" /> },
    create: { label: '新建', icon: <Plus className="h-3 w-3" /> },
    edit: { label: '编辑', icon: <Edit className="h-3 w-3" /> },
    delete: { label: '删除', icon: <Trash className="h-3 w-3" /> },
    export: { label: '导出', icon: <FileText className="h-3 w-3" /> },
    import: { label: '导入', icon: <FileText className="h-3 w-3" /> },
  }

  const renderPermissionRow = (item: PermissionItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)

    return (
      <>
        <TableRow key={item.id} className="hover:bg-muted/50">
          <TableCell className="py-2" style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              <span className="text-sm font-medium">{item.name}</span>
              <Badge variant="outline" className="text-xs">
                {item.type === 'page' ? '页面' : item.type === 'field' ? '字段' : '按钮'}
              </Badge>
            </div>
          </TableCell>
          {item.actions.map((action) => (
            <TableCell key={action} className="py-2 text-center">
              <Checkbox
                checked={hasPermission(item.id, action)}
                onCheckedChange={() => togglePermission(item.id, action)}
              />
            </TableCell>
          ))}
          {/* 补齐空列 */}
          {(['view', 'create', 'edit', 'delete'] as PermissionAction[])
            .filter((a) => !item.actions.includes(a))
            .map((action) => (
              <TableCell key={action} className="py-2 text-center">
                <span className="text-muted-foreground">-</span>
              </TableCell>
            ))}
        </TableRow>
        {hasChildren &&
          isExpanded &&
          item.children!.map((child) => renderPermissionRow(child, level + 1))}
      </>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">权限配置</h1>
            <p className="mt-1 text-sm text-muted-foreground">配置角色的页面、按钮、字段权限</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!selectedRole ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Shield className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-lg font-medium text-foreground">请选择角色</h2>
              <p className="mt-2 text-sm text-muted-foreground">选择一个角色来配置权限</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {selectedRole.name} - 权限配置
                </CardTitle>
                <CardDescription>{selectedRole.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-80">资源</TableHead>
                        <TableHead className="w-24 text-center">查看</TableHead>
                        <TableHead className="w-24 text-center">新建</TableHead>
                        <TableHead className="w-24 text-center">编辑</TableHead>
                        <TableHead className="w-24 text-center">删除</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionTree.map((item) => renderPermissionRow(item))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
