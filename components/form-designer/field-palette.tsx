'use client'

import { useEffect, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { fieldTypeStorage, predefinedFieldStorage, fieldGroupStorage } from '@/lib/storage'
import type { FieldTypeConfig, PredefinedField, FieldGroup } from '@/lib/types'
import {
  Type,
  Hash,
  AlignLeft,
  Calendar,
  Clock,
  ChevronDown,
  Circle,
  CheckSquare,
  ToggleLeft,
  Upload,
  FileText,
  Table,
  PenTool,
  List,
  Calculator,
  Minus,
  Info,
  Box,
  Car,
  Building2,
  AlertTriangle,
  Settings,
  Layers,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="h-4 w-4" />,
  Hash: <Hash className="h-4 w-4" />,
  AlignLeft: <AlignLeft className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  ChevronDown: <ChevronDown className="h-4 w-4" />,
  Circle: <Circle className="h-4 w-4" />,
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  ToggleLeft: <ToggleLeft className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Table: <Table className="h-4 w-4" />,
  PenTool: <PenTool className="h-4 w-4" />,
  List: <List className="h-4 w-4" />,
  Calculator: <Calculator className="h-4 w-4" />,
  Minus: <Minus className="h-4 w-4" />,
  Info: <Info className="h-4 w-4" />,
  Box: <Box className="h-4 w-4" />,
}

// 预定义字段分类图标
const categoryIcons: Record<string, React.ReactNode> = {
  vehicle: <Car className="h-4 w-4" />,
  dealer: <Building2 className="h-4 w-4" />,
  fault: <AlertTriangle className="h-4 w-4" />,
  business: <Settings className="h-4 w-4" />,
  common: <Layers className="h-4 w-4" />,
}

const categoryLabels: Record<string, string> = {
  vehicle: '车辆信息',
  dealer: '经销商',
  fault: '故障信息',
  business: '业务配置',
  common: '通用字段',
}

export function getFieldIcon(iconName: string): React.ReactNode {
  return iconMap[iconName] || <Box className="h-4 w-4" />
}

interface DraggableFieldProps {
  config: FieldTypeConfig
}

function DraggableField({ config }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: {
      type: config.type,
      fromPalette: true,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <span className="text-muted-foreground">{getFieldIcon(config.icon)}</span>
      <span className="text-foreground">{config.label}</span>
    </div>
  )
}

interface DraggablePredefinedFieldProps {
  field: PredefinedField
}

function DraggablePredefinedField({ field }: DraggablePredefinedFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `predefined-${field.id}`,
    data: {
      predefinedFieldId: field.id,
      fromPredefined: true,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <span className="text-primary">{categoryIcons[field.category]}</span>
      <div className="flex-1 min-w-0">
        <span className="text-foreground block truncate">{field.name}</span>
        {field.fieldConfig.linkage && (
          <Badge variant="outline" className="mt-1 text-xs px-1 py-0">联动</Badge>
        )}
      </div>
    </div>
  )
}

export function FieldPalette() {
  const [fieldTypes, setFieldTypes] = useState<FieldTypeConfig[]>([])
  const [predefinedFields, setPredefinedFields] = useState<PredefinedField[]>([])
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([])
  const [activeTab, setActiveTab] = useState<'components' | 'fieldgroups' | 'basedata'>('components')

  useEffect(() => {
    const types = fieldTypeStorage.getEnabled()
    setFieldTypes(types)
    
    const preFields = predefinedFieldStorage.getEnabled()
    setPredefinedFields(preFields)

    // 初始化并加载字段组
    fieldGroupStorage.initSystemGroups()
    const groups = fieldGroupStorage.getAll()
    setFieldGroups(groups)
  }, [])

  const basicFields = fieldTypes.filter((f) => f.category === 'basic')
  const advancedFields = fieldTypes.filter((f) => f.category === 'advanced')
  const layoutFields = fieldTypes.filter((f) => f.category === 'layout')
  const customFields = fieldTypes.filter((f) => f.category === 'custom')

  // 按分类分组预定义字段
  const vehicleFields = predefinedFields.filter(f => f.category === 'vehicle')
  const dealerFields = predefinedFields.filter(f => f.category === 'dealer')
  const faultFields = predefinedFields.filter(f => f.category === 'fault')
  const businessFields = predefinedFields.filter(f => f.category === 'business')
  const commonFields = predefinedFields.filter(f => f.category === 'common')

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">添加字段</h3>
        <p className="mt-1 text-xs text-muted-foreground">拖拽添加到表单</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'components' | 'fieldgroups' | 'basedata')} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3 flex-shrink-0">
          <TabsTrigger value="components" className="text-xs">
            <Box className="h-3.5 w-3.5 mr-1" />
            组件
          </TabsTrigger>
          <TabsTrigger value="fieldgroups" className="text-xs">
            <Layers className="h-3.5 w-3.5 mr-1" />
            字段组
          </TabsTrigger>
          <TabsTrigger value="basedata" className="text-xs">
            <Database className="h-3.5 w-3.5 mr-1" />
            数据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full" type="always">
            <div className="p-4 space-y-6">
              {basicFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    基础字段
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {basicFields.map((config) => (
                      <DraggableField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}

              {advancedFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    高级字段
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {advancedFields.map((config) => (
                      <DraggableField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}

              {layoutFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    布局元素
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {layoutFields.map((config) => (
                      <DraggableField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}

              {customFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    自定义字段
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {customFields.map((config) => (
                      <DraggableField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
</TabsContent>
        
        <TabsContent value="fieldgroups" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full" type="always">
            <div className="p-4 space-y-6">
              {/* 基础信息字段组 */}
              {fieldGroups.filter(g => g.category === 'basic').length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    基础信息
                  </h4>
                  <div className="space-y-3">
                    {fieldGroups.filter(g => g.category === 'basic').map((group) => (
                      <div
                        key={group.id}
                        className="rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{group.name}</span>
                          {group.isSystem && (
                            <Badge variant="secondary" className="text-xs">系统</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                        <div className="text-xs text-muted-foreground">
                          包含 {group.fields.length} 个字段
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {group.fields.slice(0, 4).map((field) => (
                            <Badge key={field.id} variant="outline" className="text-xs">
                              {field.label}
                            </Badge>
                          ))}
                          {group.fields.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{group.fields.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 业务字段组 */}
              {fieldGroups.filter(g => g.category === 'business').length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    业务字段组
                  </h4>
                  <div className="space-y-3">
                    {fieldGroups.filter(g => g.category === 'business').map((group) => (
                      <div
                        key={group.id}
                        className="rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{group.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                        <div className="text-xs text-muted-foreground">
                          包含 {group.fields.length} 个字段
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 使用说明 */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                <h4 className="mb-2 text-xs font-medium text-blue-900 dark:text-blue-100">使用说明</h4>
                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>- 基础信息字段组自动应用于所有单据</li>
                  <li>- 字段值从 Document 结构自动读取</li>
                  <li>- 在单据类型配置中引用字段组</li>
                </ul>
              </div>

              {fieldGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无字段组</p>
                  <p className="text-xs mt-1">系统字段组将自动初始化</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
  
        <TabsContent value="basedata" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full" type="always">
            <div className="p-4 space-y-6">
              {vehicleFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {categoryIcons.vehicle}
                    {categoryLabels.vehicle}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicleFields.map((field) => (
                      <DraggablePredefinedField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              )}

              {dealerFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {categoryIcons.dealer}
                    {categoryLabels.dealer}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {dealerFields.map((field) => (
                      <DraggablePredefinedField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              )}

              {faultFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {categoryIcons.fault}
                    {categoryLabels.fault}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {faultFields.map((field) => (
                      <DraggablePredefinedField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              )}

              {businessFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {categoryIcons.business}
                    {categoryLabels.business}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {businessFields.map((field) => (
                      <DraggablePredefinedField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              )}

              {commonFields.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {categoryIcons.common}
                    {categoryLabels.common}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {commonFields.map((field) => (
                      <DraggablePredefinedField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              )}

              {predefinedFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无预定义字段</p>
                  <p className="text-xs mt-1">可在基础数据管理中添加</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 导出字段类型配置获取函数
export function useFieldTypes() {
  const [fieldTypes, setFieldTypes] = useState<FieldTypeConfig[]>([])

  useEffect(() => {
    const types = fieldTypeStorage.getEnabled()
    setFieldTypes(types)
  }, [])

  return fieldTypes
}

// 获取字段类型标签
export function getFieldTypeLabel(type: string): string {
  const fieldTypes = fieldTypeStorage.getEnabled()
  const fieldType = fieldTypes.find((f) => f.type === type)
  return fieldType?.label || type
}
