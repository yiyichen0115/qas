'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageConfigurator } from '@/components/page-configurator'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore } from '@/stores/app-store'
import { Save, ArrowLeft, Plus, Layout, Trash2, Edit } from 'lucide-react'
import type { PageConfig } from '@/lib/types'

function generateId() {
  return `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function PageConfigPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </MainLayout>
    }>
      <PageConfigContent />
    </Suspense>
  )
}

function PageConfigContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageId = searchParams.get('id')

  const { pages, loadPages, savePage, deletePage, currentPage, setCurrentPage, loadForms } =
    useAppStore()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pageName, setPageName] = useState('')
  const [showList, setShowList] = useState(!pageId)
  const [configuratorKey, setConfiguratorKey] = useState(0)

  useEffect(() => {
    loadPages()
    loadForms()
  }, [loadPages, loadForms])

  useEffect(() => {
    if (pageId) {
      const page = pages.find((p) => p.id === pageId)
      if (page) {
        setCurrentPage(page)
        setPageName(page.name)
        setShowList(false)
      }
    }
  }, [pageId, pages, setCurrentPage])

  const handleSave = () => {
    if (!pageName.trim()) return

    const pageConfig: PageConfig = {
      id: currentPage?.id || generateId(),
      name: pageName,
      type: currentPage?.type || 'list',
      formId: currentPage?.formId,
      columns: currentPage?.columns,
      filters: currentPage?.filters,
      actions: currentPage?.actions,
      createdAt: currentPage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    savePage(pageConfig)
    setCurrentPage(pageConfig)
    setShowSaveDialog(false)

    if (!pageId) {
      router.push(`/designer/page-config?id=${pageConfig.id}`)
    }
  }

  const handleNewPage = () => {
    setCurrentPage(null)
    setPageName('')
    setShowList(false)
    setConfiguratorKey((k) => k + 1)
    router.push('/designer/page-config')
  }

  const handleEditPage = (page: PageConfig) => {
    setCurrentPage(page)
    setPageName(page.name)
    setShowList(false)
    router.push(`/designer/page-config?id=${page.id}`)
  }

  const handleDeletePage = (id: string) => {
    if (confirm('确定要删除此页面配置吗？')) {
      deletePage(id)
      if (currentPage?.id === id) {
        setCurrentPage(null)
        setShowList(true)
        router.push('/designer/page-config')
      }
    }
  }

  const pageTypeLabels: Record<string, string> = {
    list: '列表页',
    form: '表单页',
    detail: '详情页',
    kanban: '看板页',
    dashboard: '仪表盘',
  }

  if (showList) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">页面配置</h1>
              <p className="mt-1 text-sm text-muted-foreground">配置页面布局和功能</p>
            </div>
            <Button onClick={handleNewPage}>
              <Plus className="mr-2 h-4 w-4" />
              新建页面
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {pages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <Layout className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-lg font-medium text-foreground">暂无页面配置</h2>
                <p className="mt-2 text-sm text-muted-foreground">点击上方按钮创建第一个页面</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                    onClick={() => handleEditPage(page)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Layout className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPage(page)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePage(page.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="mt-3 font-medium text-foreground">{page.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      类型: {pageTypeLabels[page.type] || page.type}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{page.columns?.length || 0} 列</span>
                      <span>·</span>
                      <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 工具栏 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowList(true)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-foreground">
              {currentPage?.name || '未命名页面'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>

        {/* 配置器 */}
        <div className="flex-1 overflow-hidden">
          <PageConfigurator key={configuratorKey} initialConfig={currentPage || undefined} />
        </div>
      </div>

      {/* 保存对话框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存页面配置</DialogTitle>
            <DialogDescription>为您的页面配置设置名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">页面名称</label>
              <Input
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="请输入页面名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!pageName.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
