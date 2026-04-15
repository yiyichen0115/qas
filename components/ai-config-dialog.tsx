'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react'

interface AIConfigDialogProps {
  type: 'fields' | 'workflow'
  documentTypeName?: string
  existingFields?: Array<{ label: string }>
  onGenerated: (data: unknown) => void
  trigger?: React.ReactNode
}

export function AIConfigDialog({ 
  type, 
  documentTypeName, 
  existingFields,
  onGenerated,
  trigger 
}: AIConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const placeholders = {
    fields: `例如：
- 添加车辆基本信息字段，包括VIN码、车型、颜色、购买日期
- 添加一个故障描述区域，包含故障类型下拉选择、故障等级、详细描述
- 增加客户联系信息：姓名、电话、地址`,
    workflow: `例如：
- 创建一个简单的审批流程：提交 -> 主管审批 -> 完成
- 设计一个求援反馈流程：服务站创建 -> 提交反馈 -> 工程师回复 -> 服务站确认关闭
- 添加一个带条件判断的流程：如果金额超过1万需要经理审批`
  }

  const titles = {
    fields: 'AI 生成表单字段',
    workflow: 'AI 生成流程配置'
  }

  const descriptions = {
    fields: '描述您需要的表单字段，AI将为您生成配置',
    workflow: '描述您需要的流程，AI将为您生成节点、连线和状态配置'
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    setResult(null)

    try {
      const endpoint = type === 'fields' 
        ? '/api/ai/generate-fields' 
        : '/api/ai/generate-workflow'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          documentTypeName,
          existingFields,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: data.data.summary || '生成成功！' })
        onGenerated(data.data)
        // 延迟关闭对话框，让用户看到成功消息
        setTimeout(() => {
          setOpen(false)
          setPrompt('')
          setResult(null)
        }, 1500)
      } else {
        setResult({ success: false, message: data.error || '生成失败，请重试' })
      }
    } catch (error) {
      console.error('AI生成失败:', error)
      setResult({ success: false, message: '网络错误，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI 配置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {titles[type]}
          </DialogTitle>
          <DialogDescription>
            {descriptions[type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {documentTypeName && (
            <div className="text-sm text-muted-foreground">
              当前单据类型：<span className="font-medium text-foreground">{documentTypeName}</span>
            </div>
          )}

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholders[type]}
            className="min-h-[150px] resize-none"
            disabled={loading}
          />

          {result && (
            <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
              result.success 
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' 
                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
            }`}>
              {result.success ? (
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成配置
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
