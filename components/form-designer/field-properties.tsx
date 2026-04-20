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
      {/* 标题栏 - 参考图片样式 */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground">属性配置</h3>
            <p className="mt-0.5 truncate text-xs text-primary">{localField.label}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 shrink-0">
          <TabsTrigger value="basic">基础</TabsTrigger>
          <TabsTrigger value="advanced">高级</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="flex-1 overflow-y-auto p-4 mt-0">
          <FieldGroup className="space-y-4">
            {/* 基本信息分组 */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                <span className="text-xs font-medium">基本信息</span>
              </div>
              <div className="p-3 space-y-3">
                <Field>
                  <FieldLabel className="text-xs">字段标签 *</FieldLabel>
                  <Input
                    value={localField.label}
                    onChange={(e) => updateField({ label: e.target.value })}
                    placeholder="显示给用户的标签"
                    className="h-8 text-sm"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-xs">字段名称 *</FieldLabel>
                  <Input
                    value={localField.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                    placeholder="用于数据提交的字段名"
                    className="h-8 text-sm font-mono"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    建议使用英文，如: username, email
                  </p>
                </Field>

                {(isTextField || localField.type === 'select' || isNumberField) && (
                  <Field>
                    <FieldLabel className="text-xs">占位符</FieldLabel>
                    <Input
                      value={localField.placeholder || ''}
                      onChange={(e) => updateField({ placeholder: e.target.value })}
                      placeholder="输入框内的提示文字"
                      className="h-8 text-sm"
                    />
                  </Field>
                )}

                <Field>
                  <FieldLabel className="text-xs">说明文字</FieldLabel>
                  <Textarea
                    value={localField.description || ''}
                    onChange={(e) => updateField({ description: e.target.value })}
                    placeholder="帮助用户理解此字段的说明"
                    className="min-h-[50px] text-sm"
                  />
                </Field>
              </div>
            </div>

            {/* 状态设置分组 - 使用两列布局 */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                <span className="text-xs font-medium">状态设置</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors">
                    <Switch
                      checked={localField.required}
                      onCheckedChange={(checked) => updateField({ required: checked })}
                      className="scale-90"
                    />
                    <span className="text-xs text-muted-foreground">必填</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors">
                    <Switch
                      checked={localField.disabled || false}
                      onCheckedChange={(checked) => updateField({ disabled: checked })}
                      className="scale-90"
                    />
                    <span className="text-xs text-muted-foreground">禁用</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors">
                    <Switch
                      checked={localField.hidden || false}
                      onCheckedChange={(checked) => updateField({ hidden: checked })}
                      className="scale-90"
                    />
                    <span className="text-xs text-muted-foreground">隐藏</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 选项列表分组 - 参考图片复型表单样式 */}
            {hasOptions && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">选项列表</span>
                  <Button variant="ghost" size="sm" onClick={addOption} className="h-6 px-2 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    添加
                  </Button>
                </div>
                <div className="p-3">
                  {(localField.options || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-xs">暂无选项</p>
                      <p className="text-xs mt-1">点击上方按钮添加</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(localField.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2 rounded border border-border bg-muted/20 p-2">
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                            onClick={() => moveOption(index, 'up')}
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </button>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => updateOption(index, 'label', e.target.value)}
                              placeholder="显示文本"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => updateOption(index, 'value', e.target.value)}
                              placeholder="提交值"
                              className="h-7 text-xs font-mono"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 mt-0">
          <FieldGroup className="space-y-4">
            {/* 布局设置分组 */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                <span className="text-xs font-medium">布局设置</span>
              </div>
              <div className="p-3 space-y-3">
                <Field>
                  <FieldLabel className="text-xs">字段宽度</FieldLabel>
                  <Select
                    value={localField.width || 'full'}
                    onValueChange={(value) => updateField({ width: value as 'full' | 'half' | 'third' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
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
                  <FieldLabel className="text-xs">默认值</FieldLabel>
                  <Input
                    value={String(localField.defaultValue || '')}
                    onChange={(e) => updateField({ defaultValue: e.target.value })}
                    placeholder="字段的默认值"
                    className="h-8 text-sm"
                  />
                </Field>
              </div>
            </div>

            {/* 文本字段验证 */}
            {isTextField && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">文本验证</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs">最小长度</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="不限"
                        value={localField.minLength || ''}
                        onChange={(e) => updateField({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">最大长度</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="不限"
                        value={localField.maxLength || ''}
                        onChange={(e) => updateField({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel className="text-xs">正则校验</FieldLabel>
                    <Input 
                      placeholder="如: ^[a-zA-Z]+$"
                      value={localField.pattern || ''}
                      onChange={(e) => updateField({ pattern: e.target.value || undefined })}
                      className="h-8 text-sm font-mono"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      用于验证输入格式的正则表达式
                    </p>
                  </Field>
                </div>
              </div>
            )}

            {/* 数字字段验证 */}
            {isNumberField && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">数字设置</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs">最小值</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="不限"
                        value={localField.min ?? ''}
                        onChange={(e) => updateField({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">最大值</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="不限"
                        value={localField.max ?? ''}
                        onChange={(e) => updateField({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs">小数位数</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="0"
                        min={0}
                        max={10}
                        value={localField.precision ?? ''}
                        onChange={(e) => updateField({ precision: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">步长</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="1"
                        value={localField.step ?? ''}
                        onChange={(e) => updateField({ step: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* 多行文本设置 */}
            {localField.type === 'textarea' && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">多行文本设置</span>
                </div>
                <div className="p-3">
                  <Field>
                    <FieldLabel className="text-xs">显示行数</FieldLabel>
                    <Input 
                      type="number" 
                      placeholder="3"
                      min={1}
                      max={20}
                      value={localField.rows ?? ''}
                      onChange={(e) => updateField({ rows: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="h-8 text-sm"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* 公式设置 */}
            {localField.type === 'formula' && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">公式配置</span>
                </div>
                <div className="p-3">
                  <Field>
                    <FieldLabel className="text-xs">计算公式</FieldLabel>
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
                      className="min-h-[60px] font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      使用 {'{字段名}'} 引用其他字段，支持 +, -, *, / 运算
                    </p>
                  </Field>
                </div>
              </div>
            )}

            {/* 文件上传设置 */}
            {localField.type === 'file' && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">文件上传设置</span>
                </div>
                <div className="p-3 space-y-3">
                  <Field>
                    <FieldLabel className="text-xs">允许的文件类型</FieldLabel>
                    <Input 
                      placeholder=".pdf,.doc,.docx,.xls,.xlsx"
                      value={localField.accept || ''}
                      onChange={(e) => updateField({ accept: e.target.value || undefined })}
                      className="h-8 text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      多个类型用逗号分隔
                    </p>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs">最大大小 (MB)</FieldLabel>
                      <Input 
                        type="number" 
                        placeholder="10"
                        min={1}
                        value={localField.maxSize ?? ''}
                        onChange={(e) => updateField({ maxSize: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="h-8 text-sm"
                      />
                    </Field>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-muted-foreground">多文件</span>
                      <Switch
                        checked={localField.multiple || false}
                        onCheckedChange={(checked) => updateField({ multiple: checked })}
                        className="scale-90"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 日期设置 */}
            {localField.type === 'date' && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium">日期设置</span>
                </div>
                <div className="p-3">
                  <Field>
                    <FieldLabel className="text-xs">日期格式</FieldLabel>
                    <Select
                      value={localField.dateFormat || 'YYYY-MM-DD'}
                      onValueChange={(value) => updateField({ dateFormat: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
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
                </div>
              </div>
            )}
          </FieldGroup>
        </TabsContent>
      </Tabs>
    </div>
  )
}
