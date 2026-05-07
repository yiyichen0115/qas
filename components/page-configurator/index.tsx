'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PageConfig, PageType, ListColumn, PageAction, FilterConfig, FormField } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Edit,
  Trash,
  Download,
  Upload,
  Settings,
  List,
  LayoutGrid,
  FileText,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

interface PageConfiguratorProps {
  initialConfig?: PageConfig
  onSave?: (config: PageConfig) => void
  onConfigChange?: (config: Partial<PageConfig>) => void
}

const pageTypes: { value: PageType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'list',
    label: '列表页',
    icon: <List className="h-5 w-5" />,
    description: '数据表格展示，支持筛选、排序',
  },
  {
    value: 'form',
    label: '表单页',
    icon: <FileText className="h-5 w-5" />,
    description: '新建或编辑数据',
  },
  {
    value: 'detail',
    label: '详情页',
    icon: <Eye className="h-5 w-5" />,
    description: '查看单条数据详情',
  },
  {
    value: 'kanban',
    label: '看板页',
    icon: <LayoutGrid className="h-5 w-5" />,
    description: '卡片式数据展示',
  },
  {
    value: 'dashboard',
    label: '仪表盘',
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: '数据统计和图表展示',
  },
]

const defaultActions: PageAction[] = [
  { id: 'create', type: 'create', label: '新建', position: 'toolbar' },
  { id: 'edit', type: 'edit', label: '编辑', position: 'row' },
  { id: 'delete', type: 'delete', label: '删除', position: 'row', confirm: true, confirmMessage: '确定要删除吗？' },
  { id: 'export', type: 'export', label: '导出', position: 'toolbar' },
]

export function PageConfigurator({ initialConfig, onSave, onConfigChange }: PageConfiguratorProps) {
  const { forms } = useAppStore()
  const [pageType, setPageType] = useState<PageType>(initialConfig?.type || 'list')
  const [selectedFormId, setSelectedFormId] = useState(initialConfig?.formId || '')
  const [columns, setColumns] = useState<ListColumn[]>(initialConfig?.columns || [])
  const [actions, setActions] = useState<PageAction[]>(initialConfig?.actions || defaultActions)
  const [filters, setFilters] = useState<FilterConfig[]>(initialConfig?.filters || [])
  
  // 字段选择对话框状态
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [fieldSearchQuery, setFieldSearchQuery] = useState('')

  const selectedForm = forms.find((f) => f.id === selectedFormId)

  // 当配置变更时通知父组件
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        type: pageType,
        formId: selectedFormId || undefined,
        columns,
        actions,
        filters,
      })
    }
  }, [pageType, selectedFormId, columns, actions, filters, onConfigChange])

  // 获取可用于添加列的字段（排除布局类型字段）
  const availableFields = selectedForm?.fields.filter(
    (f) => !['divider', 'description', 'subtable', 'signature'].includes(f.type)
  ) || []

  // 获取已添加的字段名称
  const addedFieldNames = columns.map((col) => col.field)

  // 过滤后的可选字段（排除已添加的，并支持搜索）
  const filteredAvailableFields = availableFields.filter((f) => {
    const isNotAdded = !addedFieldNames.includes(f.name)
    const matchesSearch = fieldSearchQuery
      ? f.label.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
        f.name.toLowerCase().includes(fieldSearchQuery.toLowerCase())
      : true
    return isNotAdded && matchesSearch
  })

  // 字段类型显示名称映射
  const fieldTypeLabels: Record<string, string> = {
    text: '文本',
    number: '数字',
    textarea: '多行文本',
    date: '日期',
    datetime: '日期时间',
    select: '下拉选择',
    radio: '单选',
    checkbox: '多选',
    switch: '开关',
    file: '文件',
    richtext: '富文本',
    cascade: '级联选择',
    formula: '公式',
    related_documents: '关联单据',
  }

  // 打开字段选择对话框
  const openFieldSelector = () => {
    setSelectedFields([])
    setFieldSearchQuery('')
    setShowFieldSelector(true)
  }

  // 切换字段选择
  const toggleFieldSelection = (fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFields.length === filteredAvailableFields.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(filteredAvailableFields.map((f) => f.name))
    }
  }

  // 确认添加选中的字段
  const confirmAddFields = () => {
    const newColumns: ListColumn[] = selectedFields
      .map((fieldName) => {
        const field = availableFields.find((f) => f.name === fieldName)
        if (!field) return null
        return {
          field: field.name,
          label: field.label,
          sortable: ['text', 'number', 'date', 'datetime'].includes(field.type),
          filterable: ['text', 'select', 'radio', 'checkbox'].includes(field.type),
          hidden: false,
          format: field.type === 'date' || field.type === 'datetime' ? 'date' : 'text',
        } as ListColumn
      })
      .filter(Boolean) as ListColumn[]

    setColumns([...columns, ...newColumns])
    setShowFieldSelector(false)
    setSelectedFields([])
    setFieldSearchQuery('')
  }

  // 根据表单字段生成列配置
  const generateColumnsFromForm = () => {
    if (!selectedForm) return
    const newColumns: ListColumn[] = selectedForm.fields
      .filter((f) => !['divider', 'description', 'subtable', 'signature'].includes(f.type))
      .map((field) => ({
        field: field.name,
        label: field.label,
        sortable: ['text', 'number', 'date', 'datetime'].includes(field.type),
        filterable: ['text', 'select', 'radio', 'checkbox'].includes(field.type),
        hidden: false,
        format: field.type === 'date' || field.type === 'datetime' ? 'date' : 'text',
      }))
    setColumns(newColumns)
  }

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        field: `field_${columns.length + 1}`,
        label: `列 ${columns.length + 1}`,
        sortable: false,
        filterable: false,
        hidden: false,
      },
    ])
  }

  const updateColumn = (index: number, updates: Partial<ListColumn>) => {
    setColumns(columns.map((col, i) => (i === index ? { ...col, ...updates } : col)))
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `action_${Date.now()}`,
        type: 'custom',
        label: '自定义操作',
        position: 'toolbar',
      },
    ])
  }

  const updateAction = (index: number, updates: Partial<PageAction>) => {
    setActions(actions.map((action, i) => (i === index ? { ...action, ...updates } : action)))
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-full">
      {/* 左侧配置面板 */}
      <div className="flex w-80 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">页面配置</h3>
          <p className="mt-1 text-xs text-muted-foreground">设置页面类型和数据源</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>页面类型</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {pageTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setPageType(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                      pageType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-muted-foreground',
                        pageType === type.value && 'text-primary'
                      )}
                    >
                      {type.icon}
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>关联表单</FieldLabel>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择数据源表单" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFormId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={generateColumnsFromForm}
                >
                  从表单生成列配置
                </Button>
              )}
            </Field>
          </FieldGroup>
        </div>
      </div>

      {/* 中间预览区 */}
      <div className="flex flex-1 flex-col bg-muted/30">
        <div className="border-b border-border bg-card px-6 py-3">
          <h3 className="text-sm font-medium text-foreground">页面预览</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {pageTypes.find((t) => t.value === pageType)?.description}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Card className="mx-auto max-w-5xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">数据列表</CardTitle>
              <div className="flex gap-2">
                {actions
                  .filter((a) => a.position === 'toolbar')
                  .map((action) => (
                    <Button key={action.id} variant="outline" size="sm">
                      {action.type === 'create' && <Plus className="mr-1 h-4 w-4" />}
                      {action.type === 'export' && <Download className="mr-1 h-4 w-4" />}
                      {action.type === 'import' && <Upload className="mr-1 h-4 w-4" />}
                      {action.label}
                    </Button>
                  ))}
              </div>
            </CardHeader>
            <CardContent>
              {columns.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  请添加列配置或从表单生成
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns
                        .filter((col) => !col.hidden)
                        .map((col) => (
                          <TableHead key={col.field}>{col.label}</TableHead>
                        ))}
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {columns
                        .filter((col) => !col.hidden)
                        .map((col) => (
                          <TableCell key={col.field} className="text-muted-foreground">
                            示例数据
                          </TableCell>
                        ))}
                      <TableCell>
                        <div className="flex gap-1">
                          {actions
                            .filter((a) => a.position === 'row')
                            .map((action) => (
                              <Button key={action.id} variant="ghost" size="sm">
                                {action.type === 'edit' && <Edit className="h-4 w-4" />}
                                {action.type === 'delete' && <Trash className="h-4 w-4" />}
                                {action.type === 'custom' && action.label}
                              </Button>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右侧属性面板 */}
      <div className="flex w-80 flex-col border-l border-border bg-card">
        <Tabs defaultValue="columns" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3">
            <TabsTrigger value="columns">列配置</TabsTrigger>
            <TabsTrigger value="actions">操作</TabsTrigger>
            <TabsTrigger value="filters">筛选</TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">列配置</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedFormId ? openFieldSelector : addColumn}
                title={selectedFormId ? '从单据字段中选择' : '手动添加列'}
              >
                <Plus className="mr-1 h-4 w-4" />
                {selectedFormId ? '选择字段' : '添加'}
              </Button>
            </div>
            <div className="space-y-2">
              {columns.map((col, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={col.label}
                      onChange={(e) => updateColumn(index, { label: e.target.value })}
                      placeholder="列标题"
                      className="h-8"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 text-xs">
                        <Switch
                          checked={col.sortable}
                          onCheckedChange={(checked) => updateColumn(index, { sortable: checked })}
                        />
                        排序
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <Switch
                          checked={col.hidden}
                          onCheckedChange={(checked) => updateColumn(index, { hidden: checked })}
                        />
                        隐藏
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeColumn(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">操作配置</span>
              <Button variant="ghost" size="sm" onClick={addAction}>
                <Plus className="mr-1 h-4 w-4" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={action.label}
                      onChange={(e) => updateAction(index, { label: e.target.value })}
                      placeholder="操作名称"
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={action.position}
                      onValueChange={(value) =>
                        updateAction(index, { position: value as 'toolbar' | 'row' | 'batch' })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toolbar">工具栏</SelectItem>
                        <SelectItem value="row">行操作</SelectItem>
                        <SelectItem value="batch">批量操作</SelectItem>
                      </SelectContent>
                    </Select>
                    {action.position === 'row' && (
                      <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                        <Switch
                          checked={action.confirm}
                          onCheckedChange={(checked) => updateAction(index, { confirm: checked })}
                        />
                        确认
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="filters" className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">筛选配置</span>
              <Button variant="ghost" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                添加
              </Button>
            </div>
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              点击添加筛选条件
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 字段选择对话框 */}
      <Dialog open={showFieldSelector} onOpenChange={setShowFieldSelector}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>选择单据字段</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={fieldSearchQuery}
                onChange={(e) => setFieldSearchQuery(e.target.value)}
                placeholder="搜索字段..."
                className="pl-9"
              />
            </div>

            {/* 全选/已选统计 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={
                    filteredAvailableFields.length > 0 &&
                    selectedFields.length === filteredAvailableFields.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-muted-foreground">全选</span>
              </label>
              <span className="text-muted-foreground">
                已选择 {selectedFields.length} / {filteredAvailableFields.length} 个字段
              </span>
            </div>

            {/* 字段列表 */}
            <ScrollArea className="h-[300px] rounded-md border border-border">
              {filteredAvailableFields.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                  {availableFields.length === 0
                    ? '该表单暂无可用字段'
                    : addedFieldNames.length === availableFields.length
                    ? '所有字段已添加'
                    : '没有匹配的字段'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredAvailableFields.map((field) => (
                    <div
                      key={field.id}
                      onClick={() => toggleFieldSelection(field.name)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors',
                        selectedFields.includes(field.name)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted border border-transparent'
                      )}
                    >
                      <Checkbox
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleFieldSelection(field.name)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{field.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {field.name}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                        {fieldTypeLabels[field.type] || field.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldSelector(false)}>
              取消
            </Button>
            <Button onClick={confirmAddFields} disabled={selectedFields.length === 0}>
              添加 {selectedFields.length > 0 ? `(${selectedFields.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { type PageConfiguratorProps }
