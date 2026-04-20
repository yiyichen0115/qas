'use client'

import type { FormField } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Upload, Table, PenTool, ChevronRight, Calculator, Box } from 'lucide-react'
import { getFieldTypeLabel } from './field-palette'

interface FieldPreviewProps {
  field: FormField
}

export function FieldPreview({ field }: FieldPreviewProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return <Input placeholder={field.placeholder || '请输入...'} disabled className="bg-muted/50" />

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || '请输入数字...'}
            disabled
            className="bg-muted/50"
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || '请输入...'}
            disabled
            className="min-h-[80px] bg-muted/50"
          />
        )

      case 'date':
        return (
          <div className="flex items-center gap-2">
            <Input placeholder="请选择日期" disabled className="flex-1 bg-muted/50" />
            <Button variant="outline" size="icon" disabled>
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        )

      case 'datetime':
        return (
          <div className="flex items-center gap-2">
            <Input placeholder="请选择日期时间" disabled className="flex-1 bg-muted/50" />
            <Button variant="outline" size="icon" disabled>
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        )

      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-muted/50">
              <SelectValue placeholder={field.placeholder || '请选择...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup disabled className="flex flex-wrap gap-4">
            {(field.options || [{ label: '选项1', value: '1' }, { label: '选项2', value: '2' }]).map(
              (opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
                  <Label htmlFor={`${field.id}-${opt.value}`} className="text-sm text-muted-foreground">
                    {opt.label}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-4">
            {(field.options || [{ label: '选项1', value: '1' }, { label: '选项2', value: '2' }]).map(
              (opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox id={`${field.id}-${opt.value}`} disabled />
                  <Label htmlFor={`${field.id}-${opt.value}`} className="text-sm text-muted-foreground">
                    {opt.label}
                  </Label>
                </div>
              )
            )}
          </div>
        )

      case 'switch':
        return (
          <div className="flex items-center gap-2">
            <Switch disabled />
            <span className="text-sm text-muted-foreground">{field.description || '开启/关闭'}</span>
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">点击或拖拽上传文件</p>
              <p className="text-xs text-muted-foreground">支持常见文件格式</p>
            </div>
          </div>
        )

      case 'richtext':
        return (
          <div className="min-h-[120px] rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex gap-1 border-b border-border pb-2">
              <div className="h-6 w-6 rounded bg-muted"></div>
              <div className="h-6 w-6 rounded bg-muted"></div>
              <div className="h-6 w-6 rounded bg-muted"></div>
              <div className="h-6 w-6 rounded bg-muted"></div>
            </div>
            <p className="text-sm text-muted-foreground">富文本编辑区域</p>
          </div>
        )

      case 'subtable':
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Table className="h-5 w-5" />
              <span className="text-sm">子表格 - {field.columns?.length || 0} 列</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" disabled>
                添加行
              </Button>
            </div>
          </div>
        )

      case 'signature':
        return (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="flex flex-col items-center text-muted-foreground">
              <PenTool className="mb-2 h-8 w-8" />
              <span className="text-sm">点击签名</span>
            </div>
          </div>
        )

      case 'cascade':
        return (
          <div className="flex items-center gap-2">
            <Select disabled>
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue placeholder="请选择..." />
              </SelectTrigger>
            </Select>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Select disabled>
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue placeholder="请选择..." />
              </SelectTrigger>
            </Select>
          </div>
        )

      case 'formula':
        return (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              公式: {field.formulaConfig?.expression || '未配置'}
            </span>
          </div>
        )

      case 'divider':
        return (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground px-2">
              {field.label || '分割线'}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )

      case 'description':
        return (
          <p className="text-sm text-muted-foreground">{field.description || '说明文字内容'}</p>
        )

      default:
        // 对于自定义字段类型，显示通用的文本输入框预览
        return (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
            <Box className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              自定义字段: {getFieldTypeLabel(field.type)}
            </span>
          </div>
        )
    }
  }

  if (field.type === 'divider') {
    return <div className="py-2">{renderField()}</div>
  }

  if (field.type === 'description') {
    return <div className="py-1">{renderField()}</div>
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {renderField()}
      {field.description && field.type !== 'switch' && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
