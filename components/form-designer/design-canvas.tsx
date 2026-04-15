'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormField } from '@/lib/types'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2, Copy, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldPreview } from './field-preview'

interface DesignCanvasProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onDeleteField: (id: string) => void
  onDuplicateField: (id: string) => void
}

interface SortableFieldItemProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 根据字段宽度设置样式
  const getWidthClass = () => {
    // textarea, divider, description 类型默认整行
    if (field.type === 'textarea' || field.type === 'divider' || field.type === 'description') {
      return 'col-span-1 md:col-span-2 lg:col-span-3'
    }
    
    switch (field.width) {
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-3'
      case 'half':
        return 'col-span-1 md:col-span-1 lg:col-span-1'
      case 'third':
        return 'col-span-1'
      default:
        return 'col-span-1 md:col-span-2 lg:col-span-3' // 默认整行
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 bg-card p-4 transition-all',
        getWidthClass(),
        isSelected
          ? 'border-primary shadow-sm ring-2 ring-primary/20'
          : 'border-transparent hover:border-primary/50 hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* 操作按钮 */}
      <div
        className={cn(
          'absolute -top-3 right-2 flex items-center gap-1 rounded-md border border-border bg-card px-1 py-0.5 shadow-sm transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          className="p-1 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 字段预览 */}
      <FieldPreview field={field} />

      {/* 必填标记 */}
      {field.required && (
        <span className="absolute right-2 top-2 text-xs text-destructive">*必填</span>
      )}

      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute -left-1 bottom-2 top-2 w-1 rounded-full bg-primary" />
      )}
    </div>
  )
}

export function DesignCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
}: DesignCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'design-canvas',
  })

  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <div className="border-b border-border bg-card px-6 py-3">
        <h3 className="text-sm font-medium text-foreground">表单设计区</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {fields.length > 0 ? `已添加 ${fields.length} 个字段` : '拖拽左侧字段到此处'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div
          ref={setNodeRef}
          className={cn(
            'mx-auto min-h-[400px] max-w-5xl rounded-xl border-2 border-dashed bg-card p-6 transition-colors',
            isOver ? 'border-primary bg-primary/5' : 'border-border'
          )}
          onClick={() => onSelectField(null)}
        >
          {fields.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-muted-foreground">
              <Settings className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">开始设计您的表单</p>
              <p className="mt-2 text-sm">从左侧面板拖拽字段到这里</p>
            </div>
          ) : (
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => onSelectField(field.id)}
                    onDelete={() => onDeleteField(field.id)}
                    onDuplicate={() => onDuplicateField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  )
}
