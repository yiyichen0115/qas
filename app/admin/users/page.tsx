'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useAppStore } from '@/stores/app-store'
import { Plus, MoreHorizontal, Edit, Trash2, UserPlus, Search } from 'lucide-react'
import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function UsersPage() {
  const { users, roles, loadUsers, loadRoles, saveUser, deleteUser } = useAppStore()
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    department: '',
    roles: [] as string[],
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [loadUsers, loadRoles])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email || '',
        department: user.department || '',
        roles: user.roles,
        status: user.status,
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        name: '',
        email: '',
        department: '',
        roles: [],
        status: 'active',
      })
    }
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!formData.username.trim() || !formData.name.trim()) return

    const userData: User = {
      id: editingUser?.id || generateId(),
      username: formData.username,
      name: formData.name,
      email: formData.email || undefined,
      department: formData.department || undefined,
      roles: formData.roles,
      status: formData.status,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveUser(userData)
    setShowDialog(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此用户吗？')) {
      deleteUser(id)
    }
  }

  const getRoleNames = (roleIds: string[]) => {
    return roleIds
      .map((id) => roles.find((r) => r.id === id)?.name || id)
      .join(', ')
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">用户管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">管理系统用户账号</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <UserPlus className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((roleId) => {
                            const role = roles.find((r) => r.id === roleId)
                            return (
                              <Badge key={roleId} variant="secondary" className="text-xs">
                                {role?.name || roleId}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {user.status === 'active' ? '正常' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.id)}
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
          </div>
        </div>
      </div>

      {/* 用户表单对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '添加用户'}</DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息' : '创建新的系统用户'}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4 py-4">
            <Field>
              <FieldLabel>用户名</FieldLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </Field>
            <Field>
              <FieldLabel>姓名</FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </Field>
            <Field>
              <FieldLabel>邮箱</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </Field>
            <Field>
              <FieldLabel>部门</FieldLabel>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="请输入部门"
              />
            </Field>
            <Field>
              <FieldLabel>角色</FieldLabel>
              <Select
                value={formData.roles[0] || ''}
                onValueChange={(value) => setFormData({ ...formData, roles: [value] })}
              >
                <SelectTrigger>
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
            </Field>
            <Field>
              <FieldLabel>状态</FieldLabel>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as 'active' | 'inactive' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.username.trim() || !formData.name.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
