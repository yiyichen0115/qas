'use client'

import { useState, useEffect } from 'react'
import type { FormField, SelectOption } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Settings, GripVertical } from 'lucide-react'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface FieldPropertiesProps {
  field: FormField | null
  onUpdateField: (field: FormField) => void
}

export function FieldProperties({ field, onUpdateField }: FieldPropertiesProps) {
  const [localField, setLocalField] = useState<FormField | null>(field)

  useEffect(() => {
    setLocalField(field)
  }, [field])

  if (!localField) {
    return (
      <div className="flex h-full w-80 flex-col border-l border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">属性配置</h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium text-foreground">选择字段</p>
          <p className="mt-2 text-sm text-muted-foreground">
            点击表单设计区中的字段
          </p>
          <p className="text-sm text-muted-foreground">
            即可在此编辑其属性
          </p>
        </div>
      </div>
    )
  }

  const updateField = (updates: Partial<FormField>) => {
    const updated = { ...localField, ...updates }
    setLocalField(updated)
    onUpdateField(updated)
  }

  const updateOptions = (options: SelectOption[]) => {
    updateField({ options })
  }

  const addOption = () => {
    const options = localField.options || []
    updateOptions([...options, { label: `选项${options.length + 1}`, value: `option_${options.length + 1}` }])
  }

  const removeOption = (index: number) => {
    const options = localField.options || []
    updateOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    const options = [...(localField.options || [])]
    options[index] = { ...options[index], [key]: value }
    updateOptions(options)
  }

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const options = [...(localField.options || [])]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= options.length) return
    const temp = options[index]
    options[index] = options[newIndex]
    options[newIndex] = temp
    updateOptions(options)
  }

  const hasOptions = ['select', 'radio', 'checkbox'].includes(localField.type)
  const isTextField = ['text', 'textarea'].includes(localField.type)
  const isNumberField = localField.type === 'number'

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="border-b border-border bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h3 className="text-sm font-medium text-foreground">属性配置</h3>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-primary">{localField.label}</p>
      </div>

      <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 shrink-0">
          <TabsTrigger value="basic">基础</TabsTrigger>
          <TabsTrigger value="advanced">高级</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="flex-1 overflow-y-auto p-4 mt-0">
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>字段标签 *</FieldLabel>
              <Input
                value={localField.label}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="显示给用户的标签"
              />
            </Field>

            <Field>
              <FieldLabel>字段名称 *</FieldLabel>
              <Input
                value={localField.name}
                onChange={(e) => updateField({ name: e.target.value })}
                placeholder="用于数据提交的字段名"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                建议使用英文，如: username, email
              </p>
            </Field>

            {(isTextField || localField.type === 'select' || isNumberField) && (
              <Field>
                <FieldLabel>占位符</FieldLabel>
                <Input
                  value={localField.placeholder || ''}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                  placeholder="输入框内的提示文字"
                />
              </Field>
            )}

            <Field>
              <FieldLabel>说明文字</FieldLabel>
              <Textarea
                value={localField.description || ''}
                onChange={(e) => updateField({ description: e.target.value })}
                placeholder="帮助用户理解此字段的说明"
                className="min-h-[60px]"
              />
            </Field>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <Field className="flex items-center justify-between">
                <FieldLabel className="mb-0">必填</FieldLabel>
                <Switch
                  checked={localField.required}
                  onCheckedChange={(checked) => updateField({ required: checked })}
                />
              </Field>

              <Field className="flex items-center justify-between">
                <FieldLabel className="mb-0">禁用</FieldLabel>
                <Switch
                  checked={localField.disabled || false}
                  onCheckedChange={(checked) => updateField({ disabled: checked })}
                />
              </Field>

              <Field className="flex items-center justify-between">
                <FieldLabel className="mb-0">隐藏</FieldLabel>
                <Switch
                  checked={localField.hidden || false}
                  onCheckedChange={(checked) => updateField({ hidden: checked })}
                />
              </Field>
            </div>

            {hasOptions && (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>选项列表</FieldLabel>
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-1 h-4 w-4" />
                    添加选项
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {(localField.options || []).length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      暂无选项，请点击上方按钮添加
                    </p>
                  ) : (
                    (localField.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-2">
                        <div className="flex flex-col">
                          <button
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            onClick={() => moveOption(index, 'up')}
                            disabled={index === 0}
                          >
                            <GripVertical className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-1">
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                            placeholder="显示文本"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={option.value}
                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                            placeholder="提交值"
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Field>
            )}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 mt-0">
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>字段宽度</FieldLabel>
              <Select
                value={localField.width || 'full'}
                onValueChange={(value) => updateField({ width: value as 'full' | 'half' | 'third' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">整行 (100%)</SelectItem>
                  <SelectItem value="half">半行 (50%)</SelectItem>
                  <SelectItem value="third">三分之一 (33%)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>默认值</FieldLabel>
              <Input
                value={String(localField.defaultValue || '')}
                onChange={(e) => updateField({ defaultValue: e.target.value })}
                placeholder="字段的默认值"
              />
            </Field>

            {isTextField && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>最小长度</FieldLabel>
                    <Input 
                      type="number" 
                      placeholder="不限制"
                      value={localField.minLength || ''}
                      onChange={(e) => updateField({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>最大长度</FieldLabel>
                    <Input 
                      type="number" 
                      placeholder="不限制"
                      value={localField.maxLength || ''}
                      onChange={(e) => updateField({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>正则校验</FieldLabel>
                  <Input 
                    placeholder="如: ^[a-zA-Z]+$"
                    value={localField.pattern || ''}
                    onChange={(e) => updateField({ pattern: e.target.value || undefined })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    用于验证输入格式的正则表达式
                  </p>
                </Field>
              </>
            )}

            {isNumberField && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>最小值</FieldLabel>
                    <Input 
                      type="number" 
                      placeholder="不限制"
                      value={localField.min ?? ''}
                      onChange={(e) => updateField({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>最大值</FieldLabel>
                    <Input 
                      type="number" 
                      placeholder="不限制"
                      value={localField.max ?? ''}
                      onChange={(e) => updateField({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>小数位数</FieldLabel>
                  <Input 
                    type="number" 
                    placeholder="0"
                    min={0}
                    max={10}
                    value={localField.precision ?? ''}
                    onChange={(e) => updateField({ precision: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </Field>
                <Field>
                  <FieldLabel>步长</FieldLabel>
                  <Input 
                    type="number" 
                    placeholder="1"
                    value={localField.step ?? ''}
                    onChange={(e) => updateField({ step: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </Field>
              </>
            )}

            {localField.type === 'textarea' && (
              <Field>
                <FieldLabel>行数</FieldLabel>
                <Input 
                  type="number" 
                  placeholder="3"
                  min={1}
                  max={20}
                  value={localField.rows ?? ''}
                  onChange={(e) => updateField({ rows: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </Field>
            )}

            {localField.type === 'formula' && (
              <Field>
                <FieldLabel>计算公式</FieldLabel>
                <Textarea
                  value={localField.formulaConfig?.expression || ''}
                  onChange={(e) =>
                    updateField({
                      formulaConfig: {
                        expression: e.target.value,
                        dependencies: [],
                      },
                    })
                  }
                  placeholder="如: {数量} * {单价}"
                  className="min-h-[80px] font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  使用 {'{字段名}'} 引用其他字段，支持 +, -, *, / 运算
                </p>
              </Field>
            )}

            {localField.type === 'file' && (
              <>
                <Field>
                  <FieldLabel>允许的文件类型</FieldLabel>
                  <Input 
                    placeholder=".pdf,.doc,.docx,.xls,.xlsx"
                    value={localField.accept || ''}
                    onChange={(e) => updateField({ accept: e.target.value || undefined })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    多个类型用逗号分隔
                  </p>
                </Field>
                <Field>
                  <FieldLabel>最大文件大小 (MB)</FieldLabel>
                  <Input 
                    type="number" 
                    placeholder="10"
                    min={1}
                    value={localField.maxSize ?? ''}
                    onChange={(e) => updateField({ maxSize: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </Field>
                <Field className="flex items-center justify-between">
                  <FieldLabel className="mb-0">允许多文件上传</FieldLabel>
                  <Switch
                    checked={localField.multiple || false}
                    onCheckedChange={(checked) => updateField({ multiple: checked })}
                  />
                </Field>
              </>
            )}

            {localField.type === 'date' && (
              <>
                <Field>
                  <FieldLabel>日期格式</FieldLabel>
                  <Select
                    value={localField.dateFormat || 'YYYY-MM-DD'}
                    onValueChange={(value) => updateField({ dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
          </FieldGroup>
        </TabsContent>
      </Tabs>
    </div>
  )
}
