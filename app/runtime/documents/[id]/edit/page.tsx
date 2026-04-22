'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, CheckCircle2, Car, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
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
import { formStorage, documentStorage, workflowStorage, userStorage } from '@/lib/storage'
import { getVehicleByVin, getDealerByCode, type VehicleInfo, type Dealer } from '@/lib/base-data'
import type { FormConfig, FormField, Document, WorkflowConfig, WorkflowNode, NodePermission } from '@/lib/types'

// VIN联动字段映射
const VIN_FIELD_MAPPINGS: Record<string, keyof VehicleInfo> = {
  'vehicle_code': 'vehicleCode',
  'vehicleCode': 'vehicleCode',
  'vehicle_model': 'platformName', // 车型映射到平台名称
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

function isVinField(fieldName: string): boolean {
  const vinFieldNames = ['vin', 'vin_code', 'vinCode', 'vehicle_vin']
  return vinFieldNames.includes(fieldName.toLowerCase())
}

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
  fieldPermission?: { visible: boolean; editable: boolean }
}

function FieldRenderer({
  field,
  value,
  onChange,
  onVinChange,
  onDealerCodeChange,
  linkedInfo,
  fieldPermission = { visible: true, editable: false },
}: FieldRendererProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (isVinField(field.name) && onVinChange) {
      const vehicleInfo = newValue.length >= 17 ? getVehicleByVin(newValue) : undefined
      onVinChange(newValue, vehicleInfo)
    }
    
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
            disabled={field.disabled || !fieldPermission.editable}
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
          disabled={field.disabled || !fieldPermission.editable}
        />
      )
    
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled || !fieldPermission.editable}
          rows={4}
        />
      )
    
    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled || !fieldPermission.editable}
        />
      )
    
    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled || !fieldPermission.editable}
        />
      )
    
    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange} disabled={field.disabled || !fieldPermission.editable}>
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
          disabled={field.disabled || !fieldPermission.editable}
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
                disabled={field.disabled || !fieldPermission.editable}
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
          disabled={field.disabled || !fieldPermission.editable}
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
          disabled={field.disabled || !fieldPermission.editable}
        />
      )
  }
}

function EditDocumentContent() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [form, setForm] = useState<FormConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vinInfo, setVinInfo] = useState<VehicleInfo | undefined>()
  const [dealerInfo, setDealerInfo] = useState<Dealer | undefined>()
  const [showVinDialog, setShowVinDialog] = useState(false)
  const [showDealerDialog, setShowDealerDialog] = useState(false)
  const [workflow, setWorkflow] = useState<WorkflowConfig | null>(null)
  const [currentNode, setCurrentNode] = useState<WorkflowNode | null>(null)
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof userStorage.getCurrentUser>>(null)

  useEffect(() => {
    setCurrentUser(userStorage.getCurrentUser())
    if (documentId) {
      const loadedDoc = documentStorage.getById(documentId)
      if (loadedDoc) {
        setDocument(loadedDoc)
        setFormData(loadedDoc.formData || {})
        
        const loadedForm = formStorage.getById(loadedDoc.formId)
        if (loadedForm) {
          setForm(loadedForm)
        }

        // 加载工作流配置
        if (loadedDoc.workflowId) {
          const workflows = workflowStorage.getAll()
          const foundWorkflow = workflows.find(w => w.id === loadedDoc.workflowId)
          if (foundWorkflow) {
            setWorkflow(foundWorkflow)
            // 找到当前节点
            const currentNode = foundWorkflow.nodes.find(n => n.id === loadedDoc.currentNodeId)
            setCurrentNode(currentNode || null)
          }
        }

        // 初始化VIN和经销商联动状态
        if (loadedDoc.formData) {
          const vinValue = Object.entries(loadedDoc.formData).find(([key]) => isVinField(key))?.[1] as string
          if (vinValue && vinValue.length >= 17) {
            setVinInfo(getVehicleByVin(vinValue))
          }
          
          const dealerCodeValue = Object.entries(loadedDoc.formData).find(([key]) => isDealerCodeField(key))?.[1] as string
          if (dealerCodeValue) {
            setDealerInfo(getDealerByCode(dealerCodeValue))
          }
        }
      }
    }
  }, [documentId])

  const handleVinChange = useCallback((vin: string, vehicleInfo: VehicleInfo | undefined) => {
    const previousVinInfo = vinInfo
    setVinInfo(vehicleInfo)
    
    if (vehicleInfo && form) {
      const updates: Record<string, unknown> = {}
      
      form.fields.forEach(field => {
        const mappingKey = Object.keys(VIN_FIELD_MAPPINGS).find(key => 
          field.name.toLowerCase().includes(key.toLowerCase())
        )
        if (mappingKey) {
          const vehicleProp = VIN_FIELD_MAPPINGS[mappingKey]
          const value = vehicleInfo[vehicleProp]
          if (value !== undefined) {
            updates[field.name] = value
          }
        }
      })
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
      }
      
      // 首次识别到车辆信息时弹窗提示
      if (!previousVinInfo) {
        setShowVinDialog(true)
      }
    }
  }, [form, vinInfo])

  const handleDealerCodeChange = useCallback((code: string, dealer: Dealer | undefined) => {
    const previousDealerInfo = dealerInfo
    setDealerInfo(dealer)
    
    if (dealer && form) {
      const updates: Record<string, unknown> = {}
      
      form.fields.forEach(field => {
        const mappingKey = Object.keys(DEALER_FIELD_MAPPINGS).find(key => 
          field.name.toLowerCase().includes(key.toLowerCase())
        )
        if (mappingKey) {
          const dealerProp = DEALER_FIELD_MAPPINGS[mappingKey]
          const value = dealer[dealerProp]
          if (value !== undefined) {
            updates[field.name] = value
          }
        }
      })
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
      }
      
      // 首次识别到经销商信息时弹窗提示
      if (!previousDealerInfo) {
        setShowDealerDialog(true)
      }
    }
  }, [form, dealerInfo])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    form?.fields.forEach(field => {
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

  const handleSave = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      if (document) {
        const updatedDoc: Document = {
          ...document,
          formData,
          updatedAt: new Date().toISOString(),
        }
        
        documentStorage.save(updatedDoc)
        router.push(`/runtime/documents/${document.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

    // 检查用户是否有指定字段编辑权限
  const hasFieldEditPermission = (fieldId: string): boolean => {
    if (!currentUser || !currentNode || !workflow) return false

    // 获取用户的角色
    const userRoles = currentUser.roles

    // 查找当前节点的权限配置
    const nodePermissions = currentNode.data.permissions || []

    // 检查用户所属角色的字段编辑权限
    for (const roleId of userRoles) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission && permission.fieldPermissions[fieldId]?.editable) {
        return true
      }
    }

    return false
  }

  // 检查用户是否有指定字段查看权限
  const hasFieldViewPermission = (fieldId: string): boolean => {
    if (!currentUser || !currentNode || !workflow) return true

    // 获取用户的角色
    const userRoles = currentUser.roles

    // 查找当前节点的权限配置
    const nodePermissions = currentNode.data.permissions || []

    // 检查用户所属角色的字段查看权限
    for (const roleId of userRoles) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission && permission.fieldPermissions[fieldId]?.visible !== false) {
        return true
      }
    }

    return true
  }

  // 获取用户对指定字段的���限
  const getFieldPermission = (fieldId: string): { visible: boolean; editable: boolean } => {
    if (!currentUser || !currentNode || !workflow) {
      return { visible: true, editable: false }
    }

    const userRoles = currentUser.roles
    const nodePermissions = currentNode.data.permissions || []

    for (const roleId of userRoles) {
      const permission = nodePermissions.find(p => p.roleId === roleId)
      if (permission && permission.fieldPermissions[fieldId]) {
        return permission.fieldPermissions[fieldId]
      }
    }

    return { visible: true, editable: false }
  }

  const getLinkedInfo = (field: FormField): { type: 'vin' | 'dealer', found: boolean } | undefined => {
    if (isVinField(field.name)) {
      return { type: 'vin', found: !!vinInfo }
    }
    if (isDealerCodeField(field.name)) {
      return { type: 'dealer', found: !!dealerInfo }
    }
    return undefined
  }

  if (!document || !form) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  // 检查单据状态是否允许编辑
  const canEdit = document.status === 'draft' || document.status === 'rejected'

  if (!canEdit) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">当前单据状态不允许编辑</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
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
              <h1 className="text-lg font-semibold">编辑: {form.name}</h1>
              <p className="text-sm text-muted-foreground">单号: {document.documentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存
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
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* 基本信息 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-medium text-foreground">基本信息</h3>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">单号</span>
                  <span className="font-mono text-sm font-medium">{document?.documentNumber}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">单据类型</span>
                  <span className="text-sm font-medium">{form.name}</span>
                </div>
                {form.description && (
                  <div className="flex items-baseline gap-2 sm:col-span-2">
                    <span className="text-sm text-muted-foreground shrink-0">说明</span>
                    <span className="text-sm">{form.description}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />
            
            {/* 表单内容 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-medium text-foreground">表单内容</h3>
              </div>
              {(() => {
                  // 将字段按分割线分组
                  const visibleFields = form.fields.filter(field => {
                    if (field.hidden) return false
                    const fieldPerm = getFieldPermission(field.id)
                    return fieldPerm.visible
                  })
                  const groups: { divider?: typeof form.fields[0]; fields: typeof form.fields }[] = []
                  let currentGroup: typeof form.fields = []
                  
                  visibleFields.forEach(field => {
                    if (field.type === 'divider') {
                      if (currentGroup.length > 0) {
                        groups.push({ fields: currentGroup })
                      }
                      groups.push({ divider: field, fields: [] })
                      currentGroup = []
                    } else if (field.type === 'description') {
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
                        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                          {group.fields.map((field) => {
                            const widthClass = field.width === 'full' 
                              ? 'col-span-1 md:col-span-2 lg:col-span-3' 
                              : field.width === 'half' 
                                ? 'col-span-1 md:col-span-1 lg:col-span-1'
                                : field.width === 'third'
                                  ? 'col-span-1'
                                  : 'col-span-1 md:col-span-2 lg:col-span-3'
                            
                            const isFullWidth = field.type === 'textarea'
                            const finalWidthClass = isFullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : widthClass

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
                                  fieldPermission={getFieldPermission(field.id)}
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
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function EditDocumentPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </MainLayout>
    }>
      <EditDocumentContent />
    </Suspense>
  )
}
