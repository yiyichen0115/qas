'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Bot,
  Sparkles,
  GripVertical,
  FileText,
  MessageSquare,
  ArrowRight,
  Copy,
  Play,
} from 'lucide-react'
import { aiDocumentRuleStorage, documentTypeStorage } from '@/lib/storage'
import type { AIDocumentRule, AIMatchCondition, DocumentType } from '@/lib/types'

export default function AIRulesPage() {
  const [rules, setRules] = useState<AIDocumentRule[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [editingRule, setEditingRule] = useState<AIDocumentRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testResults, setTestResults] = useState<AIDocumentRule[]>([])
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setRules(aiDocumentRuleStorage.getAll())
    setDocumentTypes(documentTypeStorage.getPublished())
  }

  const handleCreate = () => {
    const newRule: AIDocumentRule = {
      id: `rule_${Date.now()}`,
      name: '',
      description: '',
      enabled: true,
      priority: rules.length + 1,
      matchConditions: [
        {
          id: `cond_${Date.now()}`,
          type: 'keyword',
          value: '',
          matchMode: 'contains',
        },
      ],
      matchLogic: 'or',
      action: {
        type: 'suggest_document',
        documentTypeId: '',
        guideMessage: '',
        fieldMappings: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditingRule(newRule)
    setIsDialogOpen(true)
  }

  const handleEdit = (rule: AIDocumentRule) => {
    setEditingRule({ ...rule })
    setIsDialogOpen(true)
  }

  const handleDuplicate = (rule: AIDocumentRule) => {
    const duplicated: AIDocumentRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (副本)`,
      priority: rules.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    aiDocumentRuleStorage.save(duplicated)
    loadData()
  }

  const handleSave = () => {
    if (!editingRule || !editingRule.name) return
    aiDocumentRuleStorage.save(editingRule)
    setIsDialogOpen(false)
    setEditingRule(null)
    loadData()
  }

  const handleDelete = () => {
    if (deleteId) {
      aiDocumentRuleStorage.delete(deleteId)
      setDeleteId(null)
      loadData()
    }
  }

  const handleToggleEnabled = (rule: AIDocumentRule) => {
    aiDocumentRuleStorage.save({ ...rule, enabled: !rule.enabled })
    loadData()
  }

  const addCondition = () => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      matchConditions: [
        ...editingRule.matchConditions,
        {
          id: `cond_${Date.now()}`,
          type: 'keyword',
          value: '',
          matchMode: 'contains',
        },
      ],
    })
  }

  const updateCondition = (index: number, updates: Partial<AIMatchCondition>) => {
    if (!editingRule) return
    const conditions = [...editingRule.matchConditions]
    conditions[index] = { ...conditions[index], ...updates }
    setEditingRule({ ...editingRule, matchConditions: conditions })
  }

  const removeCondition = (index: number) => {
    if (!editingRule || editingRule.matchConditions.length <= 1) return
    const conditions = editingRule.matchConditions.filter((_, i) => i !== index)
    setEditingRule({ ...editingRule, matchConditions: conditions })
  }

  const handleTest = () => {
    if (!testInput.trim()) return
    const matched = aiDocumentRuleStorage.matchRules(testInput)
    setTestResults(matched)
    setIsTestDialogOpen(true)
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'suggest_document':
        return '建议创建单据'
      case 'auto_fill':
        return '自动填充'
      case 'show_guide':
        return '显示引导'
      case 'escalate':
        return '升级处理'
      default:
        return type
    }
  }

  const getConditionTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword':
        return '关键词'
      case 'intent':
        return '意图'
      case 'category':
        return '分类'
      case 'entity':
        return '实体'
      default:
        return type
    }
  }

  const getMatchModeLabel = (mode: string) => {
    switch (mode) {
      case 'contains':
        return '包含'
      case 'exact':
        return '精确匹配'
      case 'regex':
        return '正则表达式'
      case 'startsWith':
        return '以...开头'
      case 'endsWith':
        return '以...结尾'
      default:
        return mode
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          title="AI问答规则配置"
          description="配置AI助手根据用户对话内容自动推荐创建相应单据的规则"
          actions={
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="输入测试内容..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" onClick={handleTest}>
                  <Play className="h-4 w-4 mr-2" />
                  测试规则
                </Button>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                新建规则
              </Button>
            </div>
          }
        />

        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                规则列表
              </CardTitle>
              <CardDescription>
                规则按优先级顺序匹配，匹配成功后将触发相应的动作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">优先级</TableHead>
                    <TableHead>规则名称</TableHead>
                    <TableHead>匹配条件</TableHead>
                    <TableHead>触发动作</TableHead>
                    <TableHead>关联单据</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-32 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无规则，点击"新建规则"创建第一条规则
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules
                      .sort((a, b) => a.priority - b.priority)
                      .map((rule) => {
                        const docType = documentTypes.find(
                          (dt) => dt.id === rule.action.documentTypeId
                        )
                        return (
                          <TableRow key={rule.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{rule.priority}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{rule.name}</p>
                                {rule.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {rule.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.matchConditions.slice(0, 2).map((cond, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {getConditionTypeLabel(cond.type)}: {cond.value.slice(0, 20)}
                                    {cond.value.length > 20 ? '...' : ''}
                                  </Badge>
                                ))}
                                {rule.matchConditions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{rule.matchConditions.length - 2}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                逻辑: {rule.matchLogic === 'and' ? '全部满足' : '任一满足'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  rule.action.type === 'suggest_document'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {getActionTypeLabel(rule.action.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {docType ? (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-sm">{docType.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={() => handleToggleEnabled(rule)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDuplicate(rule)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(rule)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setDeleteId(rule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {editingRule?.id.startsWith('rule_') && !rules.find((r) => r.id === editingRule?.id)
                ? '新建规则'
                : '编辑规则'}
            </DialogTitle>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>规则名称 *</Label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, name: e.target.value })
                    }
                    placeholder="如：技术求援规则"
                  />
                </div>
                <div className="space-y-2">
                  <Label>优先级</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRule.priority}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>规则描述</Label>
                <Textarea
                  value={editingRule.description || ''}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, description: e.target.value })
                  }
                  placeholder="描述规则的用途和触发场景"
                  rows={2}
                />
              </div>

              {/* 匹配条件 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">匹配条件</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">条件逻辑:</span>
                    <Select
                      value={editingRule.matchLogic}
                      onValueChange={(value: 'and' | 'or') =>
                        setEditingRule({ ...editingRule, matchLogic: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="or">任一满足</SelectItem>
                        <SelectItem value="and">全部满足</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingRule.matchConditions.map((condition, index) => (
                  <Card key={condition.id} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">条件类型</Label>
                        <Select
                          value={condition.type}
                          onValueChange={(value) =>
                            updateCondition(index, {
                              type: value as AIMatchCondition['type'],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keyword">关键词</SelectItem>
                            <SelectItem value="intent">意图</SelectItem>
                            <SelectItem value="category">分类</SelectItem>
                            <SelectItem value="entity">实体</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">匹配模式</Label>
                        <Select
                          value={condition.matchMode}
                          onValueChange={(value) =>
                            updateCondition(index, {
                              matchMode: value as AIMatchCondition['matchMode'],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">包含</SelectItem>
                            <SelectItem value="exact">精确匹配</SelectItem>
                            <SelectItem value="startsWith">以...开头</SelectItem>
                            <SelectItem value="endsWith">以...结尾</SelectItem>
                            <SelectItem value="regex">正则表达式</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">匹配值（多个用逗号分隔）</Label>
                        <Input
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(index, { value: e.target.value })
                          }
                          placeholder="故障,报错,无法,异常"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removeCondition(index)}
                          disabled={editingRule.matchConditions.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加条件
                </Button>
              </div>

              {/* 触发动作 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">触发动作</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>动作类型</Label>
                    <Select
                      value={editingRule.action.type}
                      onValueChange={(value) =>
                        setEditingRule({
                          ...editingRule,
                          action: {
                            ...editingRule.action,
                            type: value as AIDocumentRule['action']['type'],
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggest_document">建议创建单据</SelectItem>
                        <SelectItem value="show_guide">显示引导信息</SelectItem>
                        <SelectItem value="auto_fill">自动填充字段</SelectItem>
                        <SelectItem value="escalate">升级处理</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(editingRule.action.type === 'suggest_document' ||
                    editingRule.action.type === 'show_guide') && (
                    <div className="space-y-2">
                      <Label>关联单据类型</Label>
                      <Select
                        value={editingRule.action.documentTypeId || ''}
                        onValueChange={(value) =>
                          setEditingRule({
                            ...editingRule,
                            action: {
                              ...editingRule.action,
                              documentTypeId: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择单据类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id}>
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>引导信息</Label>
                  <Textarea
                    value={editingRule.action.guideMessage || ''}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        action: {
                          ...editingRule.action,
                          guideMessage: e.target.value,
                        },
                      })
                    }
                    placeholder="当规则匹配时，AI助手显示的引导信息"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!editingRule?.name}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 测试结果对话框 */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              规则测试结果
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">测试输入:</p>
              <p className="font-medium">{testInput}</p>
            </div>
            {testResults.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                没有匹配的规则
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  匹配到 {testResults.length} 条规则:
                </p>
                {testResults.map((rule) => {
                  const docType = documentTypes.find(
                    (dt) => dt.id === rule.action.documentTypeId
                  )
                  return (
                    <Card key={rule.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getActionTypeLabel(rule.action.type)}
                            {docType && ` - ${docType.name}`}
                          </p>
                        </div>
                        <Badge>优先级 {rule.priority}</Badge>
                      </div>
                      {rule.action.guideMessage && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          {rule.action.guideMessage}
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTestDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条规则吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
