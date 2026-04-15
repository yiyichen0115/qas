'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useAppStore } from '@/stores/app-store'
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react'
import type { Role } from '@/lib/types'

function generateId() {
  return `role_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function RolesPage() {
  const { roles, users, loadRoles, loadUsers, saveRole, deleteRole } = useAppStore()
  const [showDialog, setShowDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    loadRoles()
    loadUsers()
  }, [loadRoles, loadUsers])

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description || '',
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        code: '',
        description: '',
      })
    }
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) return

    const roleData: Role = {
      id: editingRole?.id || generateId(),
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      permissions: editingRole?.permissions || [],
      createdAt: editingRole?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveRole(roleData)
    setShowDialog(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此角色吗？')) {
      deleteRole(id)
    }
  }

  const getUserCountByRole = (roleId: string) => {
    return users.filter((u) => u.roles.includes(roleId)).length
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">角色管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">管理系统角色和权限分配</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            添加角色
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {roles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Shield className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-lg font-medium text-foreground">暂无角色</h2>
              <p className="mt-2 text-sm text-muted-foreground">点击上方按钮创建第一个角色</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const userCount = getUserCountByRole(role.id)
                return (
                  <Card key={role.id} className="group relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="mt-3 text-base">{role.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-1">
                          {role.code}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {role.description && (
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {role.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{userCount} 个用户</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span>{role.permissions.length} 项权限</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 角色表单对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '添加角色'}</DialogTitle>
            <DialogDescription>
              {editingRole ? '修改角色信息' : '创建新的系统角色'}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4 py-4">
            <Field>
              <FieldLabel>角色名称</FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：系统管理员"
              />
            </Field>
            <Field>
              <FieldLabel>角色编码</FieldLabel>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：admin"
              />
            </Field>
            <Field>
              <FieldLabel>描述</FieldLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="角色描述（可选）"
                className="min-h-[80px]"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.code.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
