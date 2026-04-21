'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Loader2, CheckCircle2, X, Car, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MainLayout } from '@/components/layout/main-layout'
import { documentTypeStorage, documentStorage, sequenceStorage, userStorage, workflowStorage } from '@/lib/storage'
import { getVehicleByVin, getDealerByCode, type VehicleInfo, type Dealer } from '@/lib/base-data'
import type { DocumentType, FormField, Document, WorkflowConfig } from '@/lib/types'

function generateId() {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// VIN联动字段映射
const VIN_FIELD_MAPPINGS: Record<string, keyof VehicleInfo> = {
  'vehicle_code': 'vehicleCode',
  'vehicleCode': 'vehicleCode',
  'platform_code': 'platformCode',
  'platformCode': 'platformCode',
  'platform_name': 'platformName',
  'platformName': 'platformName',
  'config_code': 'configCode',
  'configCode': 'configCode',
  'config_name': 'configName',
  'configName': 'configName',
  'vsn_code': 'vsnCode',
  'vsnCode': 'vsnCode',
  'engine_batch_no': 'engineBatchNo',
  'engineBatchNo': 'engineBatchNo',
  'production_date': 'productionDate',
  'productionDate': 'productionDate',
  'sales_date': 'salesDate',
  'salesDate': 'salesDate',
  'mileage': 'mileage',
}

// 经销商联动字段映射
const DEALER_FIELD_MAPPINGS: Record<string, keyof Dealer> = {
  'dealer_name': 'name',
  'dealerName': 'name',
  'dealer_address': 'address',
  'dealerAddress': 'address',
  'contact_person': 'contactPerson',
  'contactPerson': 'contactPerson',
  'phone': 'phone',
  'landline': 'landline',
}

// 检测字段是否是VIN字段
function isVinField(fieldName: string): boolean {
  const vinFieldNames = ['vin', 'vin_code', 'vinCode', 'vehicle_vin']
  return vinFieldNames.includes(fieldName.toLowerCase())
}

// 检测字段是否是经销商编码字段
function isDealerCodeField(fieldName: string): boolean {
  const dealerCodeNames = ['dealer_code', 'dealerCode', 'dealer_id', 'dealerId']
  return dealerCodeNames.includes(fieldName.toLowerCase())
}

interface FieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  onVinChange?: (vin: string, vehicleInfo: VehicleInfo | undefined) => void
  onDealerCodeChange?: (code: string, dealer: Dealer | undefined) => void
  linkedInfo?: { type: 'vin' | 'dealer', found: boolean }
}

function FieldRenderer({ 
  field, 
  value, 
  onChange,
  onVinChange,
  onDealerCodeChange,
  linkedInfo,
}: FieldRendererProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // VIN联动
    if (isVinField(field.name) && onVinChange) {
      console.log('[v0] VIN输入:', newValue, '长度:', newValue.length)
      const vehicleInfo = newValue.length >= 17 ? getVehicleByVin(newValue) : undefined
      console.log('[v0] VIN查询结果:', vehicleInfo)
      onVinChange(newValue, vehicleInfo)
    }
    
    // 经销商编码联动
    if (isDealerCodeField(field.name) && onDealerCodeChange) {
      const dealer = newValue.length > 0 ? getDealerByCode(newValue) : undefined
      onDealerCodeChange(newValue, dealer)
    }
  }

  switch (field.type) {
    case 'text':
      return (
        <div className="relative">
          <Input
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={handleTextChange}
            disabled={field.disabled}
            className={linkedInfo?.found ? 'pr-10 border-emerald-500' : ''}
          />
          {linkedInfo?.found && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
          )}
          {linkedInfo && !linkedInfo.found && (value as string)?.length > 0 && (
            <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 border-amber-300">
              未找到
            </Badge>
          )}
        </div>
      )
    
    case 'number':
      return (
        <Input
          type="number"
          placeholder={field.placeholder}
          value={(value as number) || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          disabled={field.disabled}
        />
      )
    
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
          rows={4}
        />
      )
    
    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
        />
      )
    
    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
        />
      )
    
    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange} disabled={field.disabled}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || '请选择'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'radio':
      return (
        <RadioGroup
          value={(value as string) || ''}
          onValueChange={onChange}
          disabled={field.disabled}
        >
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
              <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    
    case 'checkbox':
      const checkboxValues = (value as string[]) || []
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={checkboxValues.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...checkboxValues, option.value])
                  } else {
                    onChange(checkboxValues.filter((v) => v !== option.value))
                  }
                }}
                disabled={field.disabled}
              />
              <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      )
    
    case 'switch':
      return (
        <Switch
          checked={(value as boolean) || false}
          onCheckedChange={onChange}
          disabled={field.disabled}
        />
      )
    
    case 'divider':
      return (
        <div className="relative pt-5 my-4">
          <span className="absolute left-0 top-0 text-sm font-medium text-muted-foreground">
            {field.label || '分割线'}
          </span>
          <div className="h-px w-full bg-border" />
        </div>
      )
    
    case 'description':
      return (
        <p className="text-sm text-muted-foreground">
          {field.description || field.label}
        </p>
      )
    
    default:
      return (
        <Input
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={handleTextChange}
          disabled={field.disabled}
        />
      )
  }
}

function CreateDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentTypeId = searchParams.get('documentTypeId') || searchParams.get('formId') // 兼容旧参数
  
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentNumber, setDocumentNumber] = useState('')
  const [vinInfo, setVinInfo] = useState<VehicleInfo | undefined>()
  const [dealerInfo, setDealerInfo] = useState<Dealer | undefined>()
  const [showVinDialog, setShowVinDialog] = useState(false)
  const [showDealerDialog, setShowDealerDialog] = useState(false)

  useEffect(() => {
    if (documentTypeId) {
      const loadedDocType = documentTypeStorage.getById(documentTypeId)
      if (loadedDocType) {
        setDocumentType(loadedDocType)
        
        if (loadedDocType.numberRule?.prefix) {
          const previewNumber = `${loadedDocType.numberRule.prefix}...`
          setDocumentNumber(previewNumber)
        }
        
        // 查找关联的工作流
        const workflows = workflowStorage.getAll()
        const relatedWorkflow = workflows.find(w => w.categoryId === documentTypeId || w.formId === documentTypeId)
        if (relatedWorkflow) {
          setWorkflow(relatedWorkflow)
        }
        
        // 初始化默认值
        const initialData: Record<string, unknown> = {}
        loadedDocType.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            initialData[field.name] = field.defaultValue
          }
        })
        setFormData(initialData)
      }
    }
  }, [documentTypeId])

  // VIN联动处理
  const handleVinChange = useCallback((vin: string, vehicleInfo: VehicleInfo | undefined) => {
    const previousVinInfo = vinInfo
    setVinInfo(vehicleInfo)
    
    if (vehicleInfo && documentType) {
      const updates: Record<string, unknown> = {}
      
      // 直接使用字段名精确匹配
      documentType.fields.forEach(field => {
        // 检查字段名是否在映射中
        if (VIN_FIELD_MAPPINGS[field.name]) {
          const vehicleProp = VIN_FIELD_MAPPINGS[field.name]
          const value = vehicleInfo[vehicleProp]
          if (value !== undefined) {
            updates[field.name] = value
            console.log('[v0] VIN联动: 字段', field.name, '=', value)
          }
        }
      })
      
      console.log('[v0] VIN联动更新字段:', updates)
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
      }
      
      // 首次识别到车辆信息时弹窗提示
      if (!previousVinInfo) {
        setShowVinDialog(true)
      }
    }
  }, [documentType, vinInfo])

  // 经销商编码联动处理
  const handleDealerCodeChange = useCallback((code: string, dealer: Dealer | undefined) => {
    const previousDealerInfo = dealerInfo
    setDealerInfo(dealer)
    
    if (dealer && documentType) {
      const updates: Record<string, unknown> = {}
      
      // 直接使用字段名精确匹配
      documentType.fields.forEach(field => {
        if (DEALER_FIELD_MAPPINGS[field.name]) {
          const dealerProp = DEALER_FIELD_MAPPINGS[field.name]
          const value = dealer[dealerProp]
          if (value !== undefined) {
            updates[field.name] = value
            console.log('[v0] 经销商联动: 字段', field.name, '=', value)
          }
        }
      })
      
      console.log('[v0] 经销商联动更新字段:', updates)
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
      }
      
      // 首次识别到经销商信息时弹窗提示
      if (!previousDealerInfo) {
        setShowDealerDialog(true)
      }
    }
  }, [documentType, dealerInfo])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    documentType?.fields.forEach(field => {
      if (field.required && !field.hidden) {
        const value = formData[field.name]
        if (value === undefined || value === '' || value === null) {
          newErrors[field.name] = `${field.label}不能为空`
        }
        if (field.type === 'checkbox' && Array.isArray(value) && value.length === 0) {
          newErrors[field.name] = `请至少选择一个${field.label}`
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    
    try {
      const currentUser = userStorage.getCurrentUser()
      
      let docNumber = ''
      if (documentType?.numberRule?.prefix) {
        docNumber = sequenceStorage.generateNumber(documentType.id, documentType.numberRule)
      } else {
        docNumber = `DOC${Date.now()}`
      }
      
      const document: Document = {
        id: generateId(),
        documentNumber: docNumber,
        documentTypeId: documentType!.id,
        formId: documentType!.id, // 保持兼容
        formData,
        status: 'draft',
        createdBy: currentUser?.id || 'anonymous',
        createdByName: currentUser?.name || '匿名用户',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      documentStorage.save(document)
      console.log('草稿文档已保存:', document)
      router.push(`/runtime/documents/${document.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const currentUser = userStorage.getCurrentUser()
      
      let docNumber = ''
      if (documentType?.numberRule?.prefix) {
        docNumber = sequenceStorage.generateNumber(documentType.id, documentType.numberRule)
      } else {
        docNumber = `DOC${Date.now()}`
      }
      
      const document: Document = {
        id: generateId(),
        documentNumber: docNumber,
        documentTypeId: documentType!.id,
        formId: documentType!.id, // 保持兼容
        workflowId: workflow?.id,
        formData,
        status: workflow ? 'pending' : 'closed',
        currentNodeId: workflow?.nodes.find(n => n.type === 'start')?.id,
        createdBy: currentUser?.id || 'anonymous',
        createdByName: currentUser?.name || '匿名用户',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      documentStorage.save(document)
      console.log('提交的文档已保存:', document)
      router.push(`/runtime/documents/${document.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取字段的联动信息
  const getLinkedInfo = (field: FormField): { type: 'vin' | 'dealer', found: boolean } | undefined => {
    if (isVinField(field.name)) {
      return { type: 'vin', found: !!vinInfo }
    }
    if (isDealerCodeField(field.name)) {
      return { type: 'dealer', found: !!dealerInfo }
    }
    return undefined
  }

  if (!documentType) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold">{documentType.name}</h1>
              {documentNumber && (
                <p className="text-sm text-muted-foreground">单号将自动生成</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存草稿
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {workflow ? '提交审批' : '提交'}
            </Button>
          </div>
        </div>

        {/* VIN识别弹窗 */}
        <Dialog open={showVinDialog} onOpenChange={setShowVinDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-700">
                <Car className="h-5 w-5" />
                已识别车辆信息
              </DialogTitle>
            </DialogHeader>
            {vinInfo && (
              <div className="space-y-3">
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">车型平台</span>
                      <p className="font-medium text-emerald-700">{vinInfo.platformName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">配置</span>
                      <p className="font-medium text-emerald-700">{vinInfo.configName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">车辆代码</span>
                      <p className="font-medium text-emerald-700">{vinInfo.vehicleCode}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">配置代码</span>
                      <p className="font-medium text-emerald-700">{vinInfo.configCode}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">相关字段已自动填充</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 经销商识别弹窗 */}
        <Dialog open={showDealerDialog} onOpenChange={setShowDealerDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-700">
                <Building2 className="h-5 w-5" />
                已识别经销商
              </DialogTitle>
            </DialogHeader>
            {dealerInfo && (
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">经销商名称</span>
                      <p className="font-medium text-blue-700">{dealerInfo.name}</p>
                    </div>
                    {dealerInfo.address && (
                      <div>
                        <span className="text-muted-foreground">地址</span>
                        <p className="font-medium text-blue-700">{dealerInfo.address}</p>
                      </div>
                    )}
                    {dealerInfo.contactPerson && (
                      <div>
                        <span className="text-muted-foreground">联系人</span>
                        <p className="font-medium text-blue-700">{dealerInfo.contactPerson}</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">相关字段已自动填充</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 表单内容 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* 基本信息卡片 */}
            <div className="mb-6 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-1 rounded-full bg-primary" />
                <h3 className="text-base font-semibold text-foreground">基本信息</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">单据类型</span>
                  <p className="text-sm font-medium">{documentType.name}</p>
                </div>
                {documentType.description && (
                  <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                    <span className="text-xs text-muted-foreground">说明</span>
                    <p className="text-sm">{documentType.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 表单内容卡片 */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-5 w-1 rounded-full bg-primary" />
                <h3 className="text-base font-semibold text-foreground">填写表单</h3>
              </div>
              {documentType.fields.length === 0 && (
                <p className="text-center text-muted-foreground py-8">此单据类型暂无字段，请在单据类型设计中添加字段</p>
              )}
                {(() => {
                  // 将字段按分割线分组
                  const visibleFields = documentType.fields.filter(field => !field.hidden)
                  const groups: { divider?: FormField; fields: FormField[] }[] = []
                  let currentGroup: FormField[] = []
                  
                  visibleFields.forEach(field => {
                    if (field.type === 'divider') {
                      if (currentGroup.length > 0) {
                        groups.push({ fields: currentGroup })
                      }
                      groups.push({ divider: field, fields: [] })
                      currentGroup = []
                    } else if (field.type === 'description') {
                      // description 跳过，不参与分组
                      return
                    } else {
                      const lastDividerGroup = groups.findLast(g => g.divider)
                      if (lastDividerGroup && lastDividerGroup.fields.length === 0 && groups[groups.length - 1] === lastDividerGroup) {
                        lastDividerGroup.fields.push(field)
                      } else {
                        currentGroup.push(field)
                      }
                    }
                  })
                  
                  if (currentGroup.length > 0) {
                    groups.push({ fields: currentGroup })
                  }
                  
                  return groups.map((group, groupIndex) => (
                    <div key={groupIndex} className={groupIndex > 0 ? 'mt-6' : ''}>
                      {/* 分割线标题 */}
                      {group.divider && (
                        <div className="relative pt-5 mb-4">
                          <span className="absolute left-0 top-0 text-sm font-medium text-muted-foreground">
                            {group.divider.label || '分割线'}
                          </span>
                          <div className="h-px w-full bg-border" />
                        </div>
                      )}
                      
                      {/* 字段网格 */}
                      {group.fields.length > 0 && (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {group.fields.map((field) => {
                            const widthClass = field.width === 'full' 
                              ? 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4' 
                              : field.width === 'half' 
                                ? 'col-span-1 lg:col-span-2 xl:col-span-2'
                                : field.width === 'third'
                                  ? 'col-span-1'
                                  : 'col-span-1'
                            
                            const isFullWidth = field.type === 'textarea'
                            const finalWidthClass = isFullWidth ? 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4' : widthClass

                            return (
                              <div key={field.id} className={`space-y-2 ${finalWidthClass}`}>
                                <Label className="flex items-center gap-1">
                                  {field.label}
                                  {field.required && <span className="text-destructive">*</span>}
                                  {isVinField(field.name) && (
                                    <Badge variant="outline" className="ml-2 text-xs">自动联动</Badge>
                                  )}
                                  {isDealerCodeField(field.name) && (
                                    <Badge variant="outline" className="ml-2 text-xs">自动联动</Badge>
                                  )}
                                </Label>
                                <FieldRenderer
                                  field={field}
                                  value={formData[field.name]}
                                  onChange={(value) => handleFieldChange(field.name, value)}
                                  onVinChange={handleVinChange}
                                  onDealerCodeChange={handleDealerCodeChange}
                                  linkedInfo={getLinkedInfo(field)}
                                />
                                {field.description && (
                                  <p className="text-xs text-muted-foreground">{field.description}</p>
                                )}
                                {errors[field.name] && (
                                  <p className="text-sm text-destructive">{errors[field.name]}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))
                })()}

              {workflow && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    提交后将进入「{workflow.name}」审批流程
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    }>
      <CreateDocumentContent />
    </Suspense>
  )
}
