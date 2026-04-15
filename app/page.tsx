'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  GitBranch,
  Plus,
  Settings,
  Bot,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  FileEdit,
  Bell,
  MessageSquare,
  FolderOpen,
} from 'lucide-react'
import Link from 'next/link'
import { documentStorage, documentTypeStorage, userStorage } from '@/lib/storage'
import { initializeSystemData } from '@/lib/init-data'
import { useAppStore } from '@/stores/app-store'
import type { Document, DocumentType, User } from '@/lib/types'

// 功能卡片数据 - 原有模块
const featureCards = [
  {
    category: '单据中心',
    title: '创建单据',
    description: '填写并提交新的业务单据',
    icon: Plus,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    href: '/runtime/documents/select-type',
  },
  {
    category: '单据中心',
    title: '我的单据',
    description: '查看和管理已提交的单据',
    icon: FileText,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    href: '/runtime/documents',
  },
  {
    category: '设计中心',
    title: '单据类型设计',
    description: '设计和配置单据类型字段',
    icon: FileEdit,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    href: '/designer/form',
  },
  {
    category: '设计中心',
    title: '流程设计',
    description: '配置单据审批流程',
    icon: GitBranch,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    href: '/designer/workflow',
  },
  {
    category: '系统管理',
    title: '系统设置',
    description: '管理用户、角色和权限',
    icon: Settings,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    href: '/admin/users',
  },
  {
    category: '系统管理',
    title: '资料管理',
    description: '管理知识库和技术资料',
    icon: FolderOpen,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    href: '/admin/knowledge',
  },
]

export default function DashboardPage() {
  const { initialize, openAiSidebar } = useAppStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('recent')

  useEffect(() => {
    initializeSystemData()
    initialize()
    setDocuments(documentStorage.getAll())
    setDocumentTypes(documentTypeStorage.getAll())
    const user = userStorage.getCurrentUser()
    setCurrentUser(user)
  }, [initialize])

  // 统计数据
  const stats = {
    pending: documents.filter(d => d.status === 'pending').length,
    processing: documents.filter(d => d.status === 'processing' || d.status === 'replied').length,
    completed: documents.filter(d => d.status === 'closed' || d.status === 'approved').length,
    total: documents.length,
  }

  const recentDocuments = documents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const pendingDocuments = documents
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .slice(0, 5)

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      pending: { label: '待处理', variant: 'default' },
      processing: { label: '处理中', variant: 'default' },
      replied: { label: '已回复', variant: 'outline' },
      approved: { label: '已通过', variant: 'outline' },
      closed: { label: '已关闭', variant: 'secondary' },
      cancelled: { label: '已取消', variant: 'destructive' },
    }
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getDocTypeName = (docTypeId: string) => {
    const docType = documentTypes.find(dt => dt.id === docTypeId)
    return docType?.name || '未知类型'
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="p-6 lg:p-8">
          {/* 欢迎区域 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">你好！</h1>
            <p className="mt-1 text-xl text-muted-foreground">
              欢迎来到AC问答平台
            </p>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* 左侧主内容区 */}
            <div className="flex-1 space-y-6">
              {/* AI 技术支持入口 - 突出显示 */}
              <button
                onClick={openAiSidebar}
                className="w-full text-left group"
              >
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 hover:border-primary/40 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                        <Bot className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">AI 问答助手</h3>
                          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <p className="text-muted-foreground">智能问答、故障诊断、资料查询，遇到问题先问AI</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-primary font-medium group-hover:translate-x-1 transition-transform">
                        开始对话
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* 统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">待处理</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.processing}</p>
                        <p className="text-xs text-muted-foreground">处理中</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">已完成</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">全部单据</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 功能卡片网格 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featureCards.map((card) => (
                  <Link key={card.title} href={card.href}>
                    <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer bg-white">
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-3">{card.category}</p>
                        <div className="flex justify-center mb-4">
                          <div className={`w-16 h-16 rounded-full ${card.iconBg} flex items-center justify-center`}>
                            <card.icon className={`h-8 w-8 ${card.iconColor}`} />
                          </div>
                        </div>
                        <h3 className="font-semibold text-center mb-1">{card.title}</h3>
                        <p className="text-xs text-muted-foreground text-center">{card.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* 右侧面板 */}
            <div className="w-full xl:w-80 2xl:w-96">
              <Card className="sticky top-6 leading-10">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <CardHeader className="pb-0">
                    <TabsList className="w-full">
                      <TabsTrigger value="recent" className="flex-1">
                        <Bell className="h-4 w-4 mr-2" />
                        最近动态
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        待办事项
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <TabsContent value="recent" className="mt-0">
                      {recentDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-slate-100">
                            <FileText className="h-10 w-10 text-slate-300" />
                          </div>
                          <p className="text-muted-foreground text-sm">暂无记录</p>
                          <Link
                            href="/runtime/documents/select-type"
                            className="mt-4 text-sm text-primary hover:underline"
                          >
                            创建第一个单据
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentDocuments.map((doc) => (
                            <Link key={doc.id} href={`/runtime/documents/${doc.id}`}>
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex-shrink-0 mt-0.5">
                                  {doc.status === 'pending' ? (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  ) : doc.status === 'closed' || doc.status === 'approved' ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.documentNumber}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {getDocTypeName(doc.documentTypeId || doc.formId || '')}
                                  </p>
                                </div>
                                {getStatusBadge(doc.status)}
                              </div>
                            </Link>
                          ))}
                          <Link
                            href="/runtime/documents"
                            className="block text-center text-sm text-primary hover:underline pt-2 border-t"
                          >
                            查看全部 →
                          </Link>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="pending" className="mt-0">
                      {pendingDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-slate-100">
                            <CheckCircle className="h-10 w-10 text-slate-300" />
                          </div>
                          <p className="text-muted-foreground text-sm">暂无待办事项</p>
                          <p className="text-xs text-muted-foreground mt-1">所有单据都已处理完成</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingDocuments.map((doc) => (
                            <Link key={doc.id} href={`/runtime/documents/${doc.id}`}>
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex-shrink-0 mt-0.5">
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.documentNumber}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {getDocTypeName(doc.documentTypeId || doc.formId || '')}
                                  </p>
                                </div>
                                {getStatusBadge(doc.status)}
                              </div>
                            </Link>
                          ))}
                          <Link
                            href="/runtime/documents?status=pending"
                            className="block text-center text-sm text-primary hover:underline pt-2 border-t"
                          >
                            查看全部待办 →
                          </Link>
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
