import type { Document, FormField } from '@/lib/types'

/**
 * 获取字段值
 * 支持虚拟字段和普通字段两种类型
 * @param document - 单据对象
 * @param field - 字段配置
 * @returns 字段值
 */
export function getFieldValue(document: Document, field: FormField): unknown {
  // 检查是否是虚拟字段
  if (field.virtualField) {
    const { sourceField } = field.virtualField
    // 从Document对象读取虚拟字段值
    return document[sourceField as keyof Document]
  }

  // 从formData读取普通字段值
  return document.formData?.[field.name]
}

/**
 * 设置字段值
 * 虚拟字段只读不能设置，普通字段设置到formData中
 * @param document - 单据对象
 * @param field - 字段配置
 * @param value - 字段值
 * @returns 更新后的单据对象
 */
export function setFieldValue(document: Document, field: FormField, value: unknown): Document {
  // 虚拟字段只读，不能设置
  if (field.virtualField?.readOnly) {
    return document
  }

  // 设置普通字段值到formData
  return {
    ...document,
    formData: {
      ...document.formData,
      [field.name]: value,
    },
  }
}

/**
 * 批量获取字段值
 * @param document - 单据对象
 * @param fields - 字段配置数组
 * @returns 字段名到值的映射
 */
export function getFieldValues(document: Document, fields: FormField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const field of fields) {
    values[field.name] = getFieldValue(document, field)
  }

  return values
}

/**
 * 批量设置字段值
 * @param document - 单据对象
 * @param fieldValues - 字段名到值的映射
 * @param fields - 字段配置数组（用于识别虚拟字段）
 * @returns 更新后的单据对象
 */
export function setFieldValues(
  document: Document,
  fieldValues: Record<string, unknown>,
  fields: FormField[]
): Document {
  let updatedDoc = { ...document }

  for (const field of fields) {
    const fieldName = field.name
    if (fieldName in fieldValues) {
      updatedDoc = setFieldValue(updatedDoc, field, fieldValues[fieldName])
    }
  }

  return updatedDoc
}

/**
 * 检查字段是否为虚拟字段
 * @param field - 字段配置
 * @returns 是否为虚拟字段
 */
export function isVirtualField(field: FormField): boolean {
  return !!field.virtualField
}

/**
 * 检查字段是否只读
 * @param field - 字段配置
 * @returns 是否只读
 */
export function isReadOnly(field: FormField): boolean {
  if (field.virtualField) {
    return field.virtualField.readOnly || field.disabled || false
  }
  return field.disabled || false
}

/**
 * 格式化字段值用于显示
 * @param value - 字段值
 * @param field - 字段配置
 * @returns 格式化后的值
 */
export function formatFieldValue(value: unknown, field: FormField): string {
  if (value === null || value === undefined) {
    return ''
  }

  // 根据虚拟字段的格式类型进行格式化
  if (field.virtualField?.formatType) {
    switch (field.virtualField.formatType) {
      case 'date':
        return formatDate(value as string)
      case 'datetime':
        return formatDateTime(value as string)
      case 'status':
        return String(value)
      case 'text':
      default:
        return String(value)
    }
  }

  // 根据字段类型进行格式化
  switch (field.type) {
    case 'date':
      return formatDate(value as string)
    case 'datetime':
      return formatDateTime(value as string)
    case 'number':
      return formatNumber(value as number)
    default:
      return String(value)
  }
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

/**
 * 格式化数字
 */
function formatNumber(num: number): string {
  if (typeof num !== 'number') return String(num)
  return num.toLocaleString('zh-CN')
}