'use client'

/**
 * Form Designer Component
 * Version: 4.0 - Complete Rebuild
 * Last updated: Force cache refresh
 */

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

// Type imports
import type { FormField, FormConfig, FieldType, FieldTypeConfig } from '@/lib/types'

// Storage import for dynamic field types
import { fieldTypeStorage, predefinedFieldStorage } from '@/lib/storage'

// Component imports - NO fieldConfigs import
import { FieldPalette } from './field-palette'
import { DesignCanvas } from './design-canvas'
import { FieldProperties } from './field-properties'
import { FieldPreview } from './field-preview'

// Helper function to generate unique field IDs
function createFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Helper function to create a new field from a field type
function buildNewField(type: FieldType, typeConfigs: FieldTypeConfig[]): FormField {
  const config = typeConfigs.find((c) => c.type === type)
  
  const field: FormField = {
    id: createFieldId(),
    type: type,
    label: config?.label ?? type,
    name: `field_${type}_${Date.now()}`,
    required: false,
  }

  // Add default options for select/radio/checkbox fields
  if (type === 'select' || type === 'radio' || type === 'checkbox') {
    field.options = [
      { label: '选项1', value: 'opt1' },
      { label: '选项2', value: 'opt2' },
    ]
  }

  return field
}

// Helper function to create a new field from a predefined field
function buildFromPredefinedField(predefinedFieldId: string): FormField | null {
  const predefinedField = predefinedFieldStorage.getById(predefinedFieldId)
  if (!predefinedField) return null

  return {
    id: createFieldId(),
    ...predefinedField.fieldConfig,
  } as FormField
}

// Helper function to create a new field from a field group field
function buildFromFieldGroupField(sourceField: FormField): FormField {
  return {
    ...sourceField,
    id: createFieldId(),
    name: `${sourceField.name}_${Date.now()}`,
  }
}

// Props interface
interface FormDesignerProps {
  initialConfig?: FormConfig
  onSave?: (config: FormConfig) => void
  onFieldsChange?: (fields: FormField[]) => void
}

// Main component
export function FormDesigner({ initialConfig, onFieldsChange }: FormDesignerProps) {
  // State
  const [fields, setFields] = useState<FormField[]>(initialConfig?.fields ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const [dragActiveType, setDragActiveType] = useState<FieldType | null>(null)
  const [dragActiveFieldGroupField, setDragActiveFieldGroupField] = useState<FormField | null>(null)
  const [fieldTypes, setFieldTypes] = useState<FieldTypeConfig[]>([])

  // Load field types from storage on mount
  useEffect(() => {
    const types = fieldTypeStorage.getEnabled()
    setFieldTypes(types)
  }, [])

  // Notify parent when fields change
  useEffect(() => {
    onFieldsChange?.(fields)
  }, [fields, onFieldsChange])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Get the currently selected field
  const selectedField = fields.find((f) => f.id === selectedId) ?? null

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    const data = event.active.data.current

    // Reset all drag states
    setDragActiveId(null)
    setDragActiveType(null)
    setDragActiveFieldGroupField(null)

    if (id.startsWith('fieldgroup-') && data?.fromFieldGroup && data?.fieldGroupField) {
      // Dragging from field group
      setDragActiveFieldGroupField(data.fieldGroupField as FormField)
    } else if (id.startsWith('palette-')) {
      // Dragging from palette
      setDragActiveType(id.replace('palette-', '') as FieldType)
    } else {
      // Dragging existing field
      setDragActiveId(id)
    }
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setDragActiveId(null)
      setDragActiveType(null)
      setDragActiveFieldGroupField(null)

      if (!over) return

      const activeIdStr = String(active.id)
      const activeData = active.data.current

      // Adding new field from field group
      if (activeIdStr.startsWith('fieldgroup-') && activeData?.fromFieldGroup && activeData?.fieldGroupField) {
        const sourceField = activeData.fieldGroupField as FormField
        const newField = buildFromFieldGroupField(sourceField)

        if (over.id === 'design-canvas') {
          setFields((prev) => [...prev, newField])
        } else {
          const idx = fields.findIndex((f) => f.id === over.id)
          if (idx >= 0) {
            setFields((prev) => {
              const copy = [...prev]
              copy.splice(idx, 0, newField)
              return copy
            })
          } else {
            setFields((prev) => [...prev, newField])
          }
        }
        setSelectedId(newField.id)
        return
      }

      // Adding new field from predefined fields
      if (activeIdStr.startsWith('predefined-')) {
        const predefinedId = activeIdStr.replace('predefined-', '')
        const newField = buildFromPredefinedField(predefinedId)
        
        if (!newField) return

        if (over.id === 'design-canvas') {
          setFields((prev) => [...prev, newField])
        } else {
          const idx = fields.findIndex((f) => f.id === over.id)
          if (idx >= 0) {
            setFields((prev) => {
              const copy = [...prev]
              copy.splice(idx, 0, newField)
              return copy
            })
          } else {
            setFields((prev) => [...prev, newField])
          }
        }
        setSelectedId(newField.id)
        return
      }

      // Adding new field from palette
      if (activeIdStr.startsWith('palette-')) {
        const type = activeIdStr.replace('palette-', '') as FieldType
        const newField = buildNewField(type, fieldTypes)

        if (over.id === 'design-canvas') {
          setFields((prev) => [...prev, newField])
        } else {
          const idx = fields.findIndex((f) => f.id === over.id)
          if (idx >= 0) {
            setFields((prev) => {
              const copy = [...prev]
              copy.splice(idx, 0, newField)
              return copy
            })
          } else {
            setFields((prev) => [...prev, newField])
          }
        }
        setSelectedId(newField.id)
        return
      }

      // Reordering existing fields
      if (active.id !== over.id && over.id !== 'design-canvas') {
        setFields((items) => {
          const oldIdx = items.findIndex((f) => f.id === active.id)
          const newIdx = items.findIndex((f) => f.id === over.id)
          return arrayMove(items, oldIdx, newIdx)
        })
      }
    },
    [fields, fieldTypes]
  )

  // Update a field
  const handleUpdateField = useCallback((updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
  }, [])

  // Delete a field
  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [])

  // Duplicate a field
  const handleDuplicateField = useCallback(
    (id: string) => {
      const original = fields.find((f) => f.id === id)
      if (!original) return

      const copy: FormField = {
        ...original,
        id: createFieldId(),
        name: `${original.name}_copy`,
      }
      const idx = fields.findIndex((f) => f.id === id)
      setFields((prev) => {
        const updated = [...prev]
        updated.splice(idx + 1, 0, copy)
        return updated
      })
      setSelectedId(copy.id)
    },
    [fields]
  )

  // Build overlay field for drag preview
  const overlayField: FormField | null = dragActiveFieldGroupField
    ? dragActiveFieldGroupField
    : dragActiveType
      ? buildNewField(dragActiveType, fieldTypes)
      : dragActiveId
        ? fields.find((f) => f.id === dragActiveId) ?? null
        : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        <FieldPalette />
        <DesignCanvas
          fields={fields}
          selectedFieldId={selectedId}
          onSelectField={setSelectedId}
          onDeleteField={handleDeleteField}
          onDuplicateField={handleDuplicateField}
        />
        <FieldProperties field={selectedField} onUpdateField={handleUpdateField} />
      </div>

      <DragOverlay>
        {overlayField && (
          <div className="w-80 rounded-lg border border-primary bg-card p-4 shadow-lg">
            <FieldPreview field={overlayField} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export type { FormDesignerProps }
