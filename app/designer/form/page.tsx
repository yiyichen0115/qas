'use client'

/**
 * 单据表单设计页面
 * 基于单据类型配置具体的表单字段
 */

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { FormDesigner } from '@/components/form-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Settings, ChevronRight, Sparkles } from 'lucide-react'
import { documentTypeStorage } from '@/lib/storage'
import { AIConfigDialog } from '@/components/ai-config-dialog'
import type { DocumentType, DocumentNumberRule, FormField } from '@/lib/types'

export default function FormDesignerPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </MainLayout>
    }>
      <FormDesignerContent />
    </Suspense>
  )
}

function FormDesignerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentTypeId = searchParams.get('documentTypeId')

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [currentDocType, setCurrentDocType] = useState<DocumentType | null>(null)
  const [showTypeList, setShowTypeList] = useState(!documentTypeId)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [designerKey, setDesignerKey] = useState(0)

  const [currentFields, setCurrentFields] = useState<FormField[]>([])
  const [enableReply, setEnableReply] = useState(false)
  const [numberRule, setNumberRule] = useState<DocumentNumberRule>({
    prefix: '',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  })

  // 加载单据类型列表
  useEffect(() => {
    const types = documentTypeStorage.getAll()
    setDocumentTypes(types.sort((a, b) => a.order - b.order))
  }, [])

  // 根据URL参数加载单据类型
  useEffect(() => {
    if (documentTypeId) {
      const docType = documentTypeStorage.getById(documentTypeId)
      if (docType) {
        setCurrentDocType(docType)
        setCurrentFields(docType.fields || [])
        setEnableReply(docType.enableReply || false)
        if (docType.numberRule) {
          setNumberRule(docType.numberRule)
        }
        setShowTypeList(false)
      }
    }
  }, [documentTypeId])

  const handleSave = useCallback(() => {
    if (!currentDocType) return

    const updatedDocType: DocumentType = {
      ...currentDocType,
      fields: currentFields,
      numberRule: numberRule.prefix ? numberRule : undefined,
      enableReply,
      updatedAt: new Date().toISOString(),
    }

    documentTypeStorage.save(updatedDocType)
    setCurrentDocType(updatedDocType)
    setSaveDialogOpen(false)
  }, [currentDocType, currentFields, numberRule, enableReply])

  const handlePublish = useCallback(() => {
    if (!currentDocType) return

    const publishedDocType: DocumentType = {
      ...currentDocType,
      fields: currentFields,
      status: 'published',
      updatedAt: new Date().toISOString(),
    }

    documentTypeStorage.save(publishedDocType)
    setCurrentDocType(publishedDocType)
  }, [currentDocType, currentFields])

  const handleSelectDocType = useCallback((docType: DocumentType) => {
    setCurrentDocType(docType)
    setCurrentFields(docType.fields || [])
    setEnableReply(docType.enableReply || false)
    if (docType.numberRule) {
      setNumberRule(docType.numberRule)
    } else {
      setNumberRule({ prefix: '', dateFormat: 'YYYYMMDD', sequenceLength: 4, resetCycle: 'daily' })
    }
    setShowTypeList(false)
    setDesignerKey((k) => k + 1)
    router.push(`/designer/form?documentTypeId=${docType.id}`)
  }, [router])

  const handleAIGeneratedFields = useCallback((data: { fields?: FormField[]; summary?: string }) => {
    if (data.fields && data.fields.length > 0) {
      // 将AI生成的字段添加到现有字段后面
      setCurrentFields(prev => [...prev, ...data.fields!])
      setDesignerKey((k) => k + 1) // 刷新设计器
    }
  }, [])

  const handleBackToList = useCallback(() => {
    setShowTypeList(true)
    setCurrentDocType(null)
    router.push('/designer/form')
  }, [router])

  const handleFieldsChange = useCallback((fields: FormField[]) => {
    setCurrentFields(fields)
  }, [])

  // 单据类型选择列表
  if (showTypeList) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">单据表单设计</h1>
              <p className="mt-1 text-sm text-muted-foreground">选择一个单据类型，配置其表单字段</p>
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
                {documentTypes.map((docType) => (
                  <Card 
                    key={docType.id} 
                    className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => handleSelectDocType(docType)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{docType.name}</CardTitle>
                            <code className="text-xs text-muted-foreground">{docType.code}</code>
                          </div>
                        </div>
                        <Badge variant={docType.status === 'published' ? 'default' : 'secondary'}>
                          {docType.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {docType.description || '暂无描述'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {docType.fields?.length || 0} 个字段
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  // 表单设计器
  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="mr-1 h-4 w-4" />返回列表
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-base font-medium">
                {currentDocType ? currentDocType.name : '表单设计'}
              </h1>
              {currentDocType && (
                <p className="text-xs text-muted-foreground">
                  {currentDocType.status === 'published' ? '已发布' : '草稿'} · {currentFields.length} 个字段
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AIConfigDialog
              type="fields"
              documentTypeName={currentDocType?.name}
              existingFields={currentFields}
              onGenerated={handleAIGeneratedFields}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI 生成字段
                </Button>
              }
            />
            <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>保存</Button>
            {currentDocType && currentDocType.status !== 'published' && (
              <Button onClick={handlePublish}>发布</Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FormDesigner 
            key={designerKey} 
            initialConfig={currentDocType ? {
              id: currentDocType.id,
              name: currentDocType.name,
              description: currentDocType.description,
              fields: currentDocType.fields,
              layout: currentDocType.layout,
              numberRule: currentDocType.numberRule,
              enableReply: currentDocType.enableReply,
              status: currentDocType.status,
              createdAt: currentDocType.createdAt,
              updatedAt: currentDocType.updatedAt,
            } : undefined} 
            onFieldsChange={handleFieldsChange} 
          />
        </div>
      </div>

      {/* 保存对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>保存表单配置</DialogTitle>
            <DialogDescription>
              配置「{currentDocType?.name}」的单号规则和其他选项
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="number" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="number">单号规则</TabsTrigger>
              <TabsTrigger value="options">其他选项</TabsTrigger>
            </TabsList>

            <TabsContent value="number" className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="mb-3 font-medium">单号生成规则</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>前缀</Label>
                    <Input 
                      value={numberRule.prefix} 
                      onChange={(e) => setNumberRule({ ...numberRule, prefix: e.target.value })} 
                      placeholder="如：SF、QI" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>流水号位数</Label>
                    <Select 
                      value={String(numberRule.sequenceLength)} 
                      onValueChange={(v) => setNumberRule({ ...numberRule, sequenceLength: parseInt(v) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3位</SelectItem>
                        <SelectItem value="4">4位</SelectItem>
                        <SelectItem value="5">5位</SelectItem>
                        <SelectItem value="6">6位</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>日期格式</Label>
                    <Select 
                      value={numberRule.dateFormat || 'YYYYMMDD'} 
                      onValueChange={(v) => setNumberRule({ ...numberRule, dateFormat: v as DocumentNumberRule['dateFormat'] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYYMMDD">YYYYMMDD</SelectItem>
                        <SelectItem value="YYMMDD">YYMMDD</SelectItem>
                        <SelectItem value="YYYYMM">YYYYMM</SelectItem>
                        <SelectItem value="YYMM">YYMM</SelectItem>
                        <SelectItem value="YYYY">YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>重置周期</Label>
                    <Select 
                      value={numberRule.resetCycle || 'daily'} 
                      onValueChange={(v) => setNumberRule({ ...numberRule, resetCycle: v as DocumentNumberRule['resetCycle'] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">每天</SelectItem>
                        <SelectItem value="monthly">每月</SelectItem>
                        <SelectItem value="yearly">每年</SelectItem>
                        <SelectItem value="never">不重置</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {numberRule.prefix && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    预览: {numberRule.prefix}
                    {numberRule.dateFormat === 'YYYYMMDD' && '20260403'}
                    {numberRule.dateFormat === 'YYMMDD' && '260403'}
                    {numberRule.dateFormat === 'YYYYMM' && '202604'}
                    {numberRule.dateFormat === 'YYMM' && '2604'}
                    {numberRule.dateFormat === 'YYYY' && '2026'}
                    {'0'.repeat(numberRule.sequenceLength - 1)}1
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">启用回复功能</p>
                  <p className="text-sm text-muted-foreground">允许用户在单据下进行评论和讨论</p>
                </div>
                <Switch checked={enableReply} onCheckedChange={setEnableReply} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
