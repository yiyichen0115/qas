'use client'

/**
 * 列表设计页面
 * 基于单据类型配置列表字段、查询字段和操作按钮
 */

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  FileText,
  Settings,
  ChevronRight,
  Columns,
  Search,
  MousePointerClick,
  GripVertical,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react'
import { documentTypeStorage } from '@/lib/storage'
import type { DocumentType, FormField, ListColumn, FilterConfig, ActionButton } from '@/lib/types'

// 列表配置接口
interface ListDesignConfig {
  documentTypeId: string
  columns: ListColumnConfig[]
  filters: ListFilterConfig[]
  actions: ListActionConfig[]
  updatedAt: string
}

interface ListColumnConfig extends ListColumn {
  id: string
  sourceFieldId?: string
  enabled: boolean
  order: number
}

interface ListFilterConfig extends FilterConfig {
  id: string
  sourceFieldId?: string
  enabled: boolean
  order: number
  defaultValue?: string
}

interface ListActionConfig {
  id: string
  name: string
  code: string
  type: 'primary' | 'secondary' | 'danger' | 'link'
  icon?: string
  position: 'toolbar' | 'row' | 'batch'
  enabled: boolean
  order: number
  confirmRequired?: boolean
  confirmMessage?: string
}

// 本地存储键
const STORAGE_KEY = 'qas_list_designs'

// 列表设计存储函数
function getListDesigns(): Record<string, ListDesignConfig> {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

function saveListDesign(config: ListDesignConfig) {
  const designs = getListDesigns()
  designs[config.documentTypeId] = config
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
}

function getListDesignByDocTypeId(documentTypeId: string): ListDesignConfig | null {
  const designs = getListDesigns()
  return designs[documentTypeId] || null
}

// 生成唯一ID
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// 可排序列配置项组件
function SortableColumnItem({
  column,
  onToggle,
  onUpdate,
  onRemove,
}: {
  column: ListColumnConfig
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: Partial<ListColumnConfig>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="w-10">
        <Checkbox
          checked={column.enabled}
          onCheckedChange={() => onToggle(column.id)}
        />
      </TableCell>
      <TableCell className="font-medium">{column.label}</TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">{column.field}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={column.width || ''}
          onChange={(e) => onUpdate(column.id, { width: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="自动"
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Select
          value={column.format || 'text'}
          onValueChange={(v) => onUpdate(column.id, { format: v as ListColumn['format'] })}
        >
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">文本</SelectItem>
            <SelectItem value="number">数字</SelectItem>
            <SelectItem value="date">日期</SelectItem>
            <SelectItem value="status">状态</SelectItem>
            <SelectItem value="link">链接</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={column.sortable || false}
            onCheckedChange={(v) => onUpdate(column.id, { sortable: v })}
          />
          <span className="text-xs text-muted-foreground">排序</span>
        </div>
      </TableCell>
      <TableCell>
        {!column.sourceFieldId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(column.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

// 可排序筛选项组件
function SortableFilterItem({
  filter,
  onToggle,
  onUpdate,
  onRemove,
}: {
  filter: ListFilterConfig
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: Partial<ListFilterConfig>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: filter.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="w-10">
        <Checkbox
          checked={filter.enabled}
          onCheckedChange={() => onToggle(filter.id)}
        />
      </TableCell>
      <TableCell className="font-medium">{filter.label}</TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">{filter.field}</TableCell>
      <TableCell>
        <Select
          value={filter.type}
          onValueChange={(v) => onUpdate(filter.id, { type: v as FilterConfig['type'] })}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">文本</SelectItem>
            <SelectItem value="select">下拉选择</SelectItem>
            <SelectItem value="date">日期</SelectItem>
            <SelectItem value="dateRange">日期范围</SelectItem>
            <SelectItem value="number">数字</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={filter.defaultValue || ''}
          onChange={(e) => onUpdate(filter.id, { defaultValue: e.target.value })}
          placeholder="默认值"
          className="h-8 w-24"
        />
      </TableCell>
      <TableCell>
        {!filter.sourceFieldId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(filter.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function ListDesignerPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </MainLayout>
    }>
      <ListDesignerContent />
    </Suspense>
  )
}

function ListDesignerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentTypeId = searchParams.get('documentTypeId')

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [currentDocType, setCurrentDocType] = useState<DocumentType | null>(null)
  const [showTypeList, setShowTypeList] = useState(!documentTypeId)
  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'actions'>('columns')

  // 列表配置状态
  const [columns, setColumns] = useState<ListColumnConfig[]>([])
  const [filters, setFilters] = useState<ListFilterConfig[]>([])
  const [actions, setActions] = useState<ListActionConfig[]>([])

  // 添加字段对话框
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false)
  const [addFilterDialogOpen, setAddFilterDialogOpen] = useState(false)
  const [addActionDialogOpen, setAddActionDialogOpen] = useState(false)

  // 新增字段表单
  const [newColumn, setNewColumn] = useState({ label: '', field: '' })
  const [newFilter, setNewFilter] = useState({ label: '', field: '', type: 'text' as FilterConfig['type'] })
  const [newAction, setNewAction] = useState({
    name: '',
    code: '',
    type: 'primary' as ListActionConfig['type'],
    position: 'toolbar' as ListActionConfig['position'],
  })

  // DnD 传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 加载单据类型列表
  useEffect(() => {
    const types = documentTypeStorage.getAll()
    setDocumentTypes(types.sort((a, b) => a.order - b.order))
  }, [])

  // 根据URL参数加载单据类型和列表配置
  useEffect(() => {
    if (documentTypeId) {
      const docType = documentTypeStorage.getById(documentTypeId)
      if (docType) {
        setCurrentDocType(docType)
        loadListConfig(docType)
        setShowTypeList(false)
      }
    }
  }, [documentTypeId])

  // 从表单字段生成默认列表配置
  const loadListConfig = useCallback((docType: DocumentType) => {
    const savedConfig = getListDesignByDocTypeId(docType.id)
    
    if (savedConfig) {
      setColumns(savedConfig.columns)
      setFilters(savedConfig.filters)
      setActions(savedConfig.actions)
    } else {
      // 从表单字段生成默认配置
      const defaultColumns: ListColumnConfig[] = docType.fields
        .filter(f => !['divider', 'description', 'richtext', 'subtable', 'signature', 'file'].includes(f.type))
        .map((field, index) => ({
          id: generateId(),
          field: field.name,
          label: field.label,
          sourceFieldId: field.id,
          enabled: index < 6, // 默认显示前6个字段
          order: index,
          sortable: ['date', 'datetime', 'number'].includes(field.type),
          format: getFieldFormat(field.type),
        }))

      const defaultFilters: ListFilterConfig[] = docType.fields
        .filter(f => ['text', 'select', 'date', 'datetime', 'number'].includes(f.type))
        .slice(0, 4)
        .map((field, index) => ({
          id: generateId(),
          field: field.name,
          label: field.label,
          type: getFilterType(field.type),
          sourceFieldId: field.id,
          enabled: true,
          order: index,
        }))

      const defaultActions: ListActionConfig[] = [
        { id: generateId(), name: '新建', code: 'create', type: 'primary', position: 'toolbar', enabled: true, order: 0 },
        { id: generateId(), name: '导出', code: 'export', type: 'secondary', position: 'toolbar', enabled: true, order: 1 },
        { id: generateId(), name: '查看', code: 'view', type: 'link', position: 'row', enabled: true, order: 2 },
        { id: generateId(), name: '编辑', code: 'edit', type: 'link', position: 'row', enabled: true, order: 3 },
        { id: generateId(), name: '删除', code: 'delete', type: 'danger', position: 'row', enabled: true, order: 4, confirmRequired: true, confirmMessage: '确定要删除此记录吗？' },
      ]

      setColumns(defaultColumns)
      setFilters(defaultFilters)
      setActions(defaultActions)
    }
  }, [])

  // 获取字段对应的列格式
  const getFieldFormat = (fieldType: string): ListColumn['format'] => {
    switch (fieldType) {
      case 'date':
      case 'datetime':
        return 'date'
      case 'number':
        return 'number'
      case 'select':
      case 'radio':
        return 'status'
      default:
        return 'text'
    }
  }

  // 获取字段对应的筛选类型
  const getFilterType = (fieldType: string): FilterConfig['type'] => {
    switch (fieldType) {
      case 'date':
        return 'date'
      case 'datetime':
        return 'dateRange'
      case 'number':
        return 'number'
      case 'select':
      case 'radio':
        return 'select'
      default:
        return 'text'
    }
  }

  // 保存配置
  const handleSave = useCallback(() => {
    if (!currentDocType) return

    const config: ListDesignConfig = {
      documentTypeId: currentDocType.id,
      columns,
      filters,
      actions,
      updatedAt: new Date().toISOString(),
    }

    saveListDesign(config)
    alert('保存成功')
  }, [currentDocType, columns, filters, actions])

  // 选择单据类型
  const handleSelectDocType = useCallback((docType: DocumentType) => {
    setCurrentDocType(docType)
    loadListConfig(docType)
    setShowTypeList(false)
    router.push(`/designer/list?documentTypeId=${docType.id}`)
  }, [router, loadListConfig])

  // 返回列表
  const handleBackToList = useCallback(() => {
    setShowTypeList(true)
    setCurrentDocType(null)
    router.push('/designer/list')
  }, [router])

  // 列拖拽排序
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
    }
  }

  // 筛选项拖拽排序
  const handleFilterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFilters((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
    }
  }

  // 切换列启用状态
  const toggleColumn = (id: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)))
  }

  // 更新列配置
  const updateColumn = (id: string, updates: Partial<ListColumnConfig>) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  // 删除列
  const removeColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  // 切换筛选项启用状态
  const toggleFilter = (id: string) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)))
  }

  // 更新筛选项配置
  const updateFilter = (id: string, updates: Partial<ListFilterConfig>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  // 删除筛选项
  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  // 切换按钮启用状态
  const toggleAction = (id: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }

  // 更新按钮配置
  const updateAction = (id: string, updates: Partial<ListActionConfig>) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  // 删除按钮
  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id))
  }

  // 添加自定义列
  const handleAddColumn = () => {
    if (!newColumn.label || !newColumn.field) return
    const col: ListColumnConfig = {
      id: generateId(),
      field: newColumn.field,
      label: newColumn.label,
      enabled: true,
      order: columns.length,
      format: 'text',
    }
    setColumns((prev) => [...prev, col])
    setNewColumn({ label: '', field: '' })
    setAddColumnDialogOpen(false)
  }

  // 添加自定义筛选项
  const handleAddFilter = () => {
    if (!newFilter.label || !newFilter.field) return
    const filter: ListFilterConfig = {
      id: generateId(),
      field: newFilter.field,
      label: newFilter.label,
      type: newFilter.type,
      enabled: true,
      order: filters.length,
    }
    setFilters((prev) => [...prev, filter])
    setNewFilter({ label: '', field: '', type: 'text' })
    setAddFilterDialogOpen(false)
  }

  // 添加自定义按钮
  const handleAddAction = () => {
    if (!newAction.name || !newAction.code) return
    const action: ListActionConfig = {
      id: generateId(),
      name: newAction.name,
      code: newAction.code,
      type: newAction.type,
      position: newAction.position,
      enabled: true,
      order: actions.length,
    }
    setActions((prev) => [...prev, action])
    setNewAction({ name: '', code: '', type: 'primary', position: 'toolbar' })
    setAddActionDialogOpen(false)
  }

  // 获取可用的表单字段（用于添加列/筛选项）
  const getAvailableFields = (usedFields: string[]) => {
    if (!currentDocType) return []
    return currentDocType.fields.filter(
      (f) => !usedFields.includes(f.name) && !['divider', 'description'].includes(f.type)
    )
  }

  // 单据类型选择列表
  if (showTypeList) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">列表设计</h1>
              <p className="mt-1 text-sm text-muted-foreground">选择一个单据类型，配置其列表显示字段、查询条件和操作按钮</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/designer/document-types')}>
              <Settings className="mr-2 h-4 w-4" />
              管理单据类型
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {documentTypes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-lg font-medium text-foreground">暂无单据类型</h2>
                <p className="mt-2 text-sm text-muted-foreground">请先在「单据类型管理」中创建单据类型</p>
                <Button className="mt-4" onClick={() => router.push('/designer/document-types')}>
                  前往创建
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentTypes.map((docType) => {
                  const savedConfig = getListDesignByDocTypeId(docType.id)
                  return (
                    <Card 
                      key={docType.id} 
                      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                      onClick={() => handleSelectDocType(docType)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Columns className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{docType.name}</CardTitle>
                              <code className="text-xs text-muted-foreground">{docType.code}</code>
                            </div>
                          </div>
                          {savedConfig && (
                            <Badge variant="secondary">已配置</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {docType.description || '暂无描述'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {docType.fields?.length || 0} 个表单字段
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  // 列表设计器
  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="mr-1 h-4 w-4" />返回列表
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-base font-medium">
                {currentDocType?.name} - 列表设计
              </h1>
              <p className="text-xs text-muted-foreground">
                配置列表字段、查询条件和操作按钮
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </Button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex h-full flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="columns" className="gap-2">
                <Columns className="h-4 w-4" />
                列表字段
                <Badge variant="secondary" className="ml-1">{columns.filter(c => c.enabled).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="filters" className="gap-2">
                <Search className="h-4 w-4" />
                查询字段
                <Badge variant="secondary" className="ml-1">{filters.filter(f => f.enabled).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <MousePointerClick className="h-4 w-4" />
                操作按钮
                <Badge variant="secondary" className="ml-1">{actions.filter(a => a.enabled).length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* 列表字段配置 */}
            <TabsContent value="columns" className="mt-4 flex-1 min-h-0">
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-shrink-0 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">列表字段配置</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        选择要在列表中显示的字段，拖拽调整显示顺序
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setAddColumnDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      添加自定义列
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleColumnDragEnd}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="w-10">显示</TableHead>
                            <TableHead>列名称</TableHead>
                            <TableHead>字段名</TableHead>
                            <TableHead className="w-24">宽度</TableHead>
                            <TableHead className="w-28">格式</TableHead>
                            <TableHead className="w-24">可排序</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext
                            items={columns.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {columns.map((column) => (
                              <SortableColumnItem
                                key={column.id}
                                column={column}
                                onToggle={toggleColumn}
                                onUpdate={updateColumn}
                                onRemove={removeColumn}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </DndContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 查询字段配置 */}
            <TabsContent value="filters" className="mt-4 flex-1 min-h-0">
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-shrink-0 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">查询字段配置</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        选择要在列表筛选区域显示的字段，拖拽调整显示顺序
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setAddFilterDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      添加查询字段
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleFilterDragEnd}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="w-10">启用</TableHead>
                            <TableHead>字段名称</TableHead>
                            <TableHead>字段名</TableHead>
                            <TableHead className="w-32">查询类型</TableHead>
                            <TableHead className="w-28">默认值</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext
                            items={filters.map((f) => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {filters.map((filter) => (
                              <SortableFilterItem
                                key={filter.id}
                                filter={filter}
                                onToggle={toggleFilter}
                                onUpdate={updateFilter}
                                onRemove={removeFilter}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </DndContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 操作按钮配置 */}
            <TabsContent value="actions" className="mt-4 flex-1 min-h-0">
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-shrink-0 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">操作按钮配置</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        配置列表页面的操作按钮，包括工具栏按钮和行操作按钮
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setAddActionDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      添加按钮
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">启用</TableHead>
                          <TableHead>按钮名称</TableHead>
                          <TableHead>按钮代码</TableHead>
                          <TableHead className="w-28">按钮类型</TableHead>
                          <TableHead className="w-28">位置</TableHead>
                          <TableHead className="w-24">需确认</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actions.map((action) => (
                          <TableRow key={action.id}>
                            <TableCell>
                              <Checkbox
                                checked={action.enabled}
                                onCheckedChange={() => toggleAction(action.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{action.name}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">{action.code}</TableCell>
                            <TableCell>
                              <Select
                                value={action.type}
                                onValueChange={(v) => updateAction(action.id, { type: v as ListActionConfig['type'] })}
                              >
                                <SelectTrigger className="h-8 w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="primary">主要</SelectItem>
                                  <SelectItem value="secondary">次要</SelectItem>
                                  <SelectItem value="danger">危险</SelectItem>
                                  <SelectItem value="link">链接</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={action.position}
                                onValueChange={(v) => updateAction(action.id, { position: v as ListActionConfig['position'] })}
                              >
                                <SelectTrigger className="h-8 w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="toolbar">工具栏</SelectItem>
                                  <SelectItem value="row">行操作</SelectItem>
                                  <SelectItem value="batch">批量操作</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={action.confirmRequired || false}
                                onCheckedChange={(v) => updateAction(action.id, { confirmRequired: v })}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeAction(action.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 添加列对话框 */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加列表列</DialogTitle>
            <DialogDescription>从表单字段中选择或添加自定义列</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择表单字段</Label>
              <Select
                value=""
                onValueChange={(fieldName) => {
                  const field = currentDocType?.fields.find((f) => f.name === fieldName)
                  if (field) {
                    setNewColumn({ label: field.label, field: field.name })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个字段" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableFields(columns.map((c) => c.field)).map((field) => (
                    <SelectItem key={field.id} value={field.name}>
                      {field.label} ({field.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或手动输入</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>列名称</Label>
                <Input
                  value={newColumn.label}
                  onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                  placeholder="显示名称"
                />
              </div>
              <div className="space-y-2">
                <Label>字段名</Label>
                <Input
                  value={newColumn.field}
                  onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
                  placeholder="字段标识"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddColumn} disabled={!newColumn.label || !newColumn.field}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加筛选项对话框 */}
      <Dialog open={addFilterDialogOpen} onOpenChange={setAddFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加查询字段</DialogTitle>
            <DialogDescription>从表单字段中选择或添加自定义查询字段</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择表单字段</Label>
              <Select
                value=""
                onValueChange={(fieldName) => {
                  const field = currentDocType?.fields.find((f) => f.name === fieldName)
                  if (field) {
                    setNewFilter({
                      label: field.label,
                      field: field.name,
                      type: getFilterType(field.type),
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个字段" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableFields(filters.map((f) => f.field)).map((field) => (
                    <SelectItem key={field.id} value={field.name}>
                      {field.label} ({field.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或手动输入</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>字段名称</Label>
                <Input
                  value={newFilter.label}
                  onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })}
                  placeholder="显示名称"
                />
              </div>
              <div className="space-y-2">
                <Label>字段名</Label>
                <Input
                  value={newFilter.field}
                  onChange={(e) => setNewFilter({ ...newFilter, field: e.target.value })}
                  placeholder="字段标识"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>查询类型</Label>
              <Select
                value={newFilter.type}
                onValueChange={(v) => setNewFilter({ ...newFilter, type: v as FilterConfig['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文本</SelectItem>
                  <SelectItem value="select">下拉选择</SelectItem>
                  <SelectItem value="date">日期</SelectItem>
                  <SelectItem value="dateRange">日期范围</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFilterDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddFilter} disabled={!newFilter.label || !newFilter.field}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加按钮对话框 */}
      <Dialog open={addActionDialogOpen} onOpenChange={setAddActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加操作按钮</DialogTitle>
            <DialogDescription>配置新的操作按钮</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>按钮名称</Label>
                <Input
                  value={newAction.name}
                  onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                  placeholder="如：审批"
                />
              </div>
              <div className="space-y-2">
                <Label>按钮代码</Label>
                <Input
                  value={newAction.code}
                  onChange={(e) => setNewAction({ ...newAction, code: e.target.value })}
                  placeholder="如：approve"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>按钮类型</Label>
                <Select
                  value={newAction.type}
                  onValueChange={(v) => setNewAction({ ...newAction, type: v as ListActionConfig['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">主要</SelectItem>
                    <SelectItem value="secondary">次要</SelectItem>
                    <SelectItem value="danger">危险</SelectItem>
                    <SelectItem value="link">链接</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>按钮位置</Label>
                <Select
                  value={newAction.position}
                  onValueChange={(v) => setNewAction({ ...newAction, position: v as ListActionConfig['position'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toolbar">工具栏</SelectItem>
                    <SelectItem value="row">行操作</SelectItem>
                    <SelectItem value="batch">批量操作</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddActionDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddAction} disabled={!newAction.name || !newAction.code}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
