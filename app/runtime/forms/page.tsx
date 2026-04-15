'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Filter, Search, FolderOpen, Users, Wallet, Briefcase, Package, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/layout/page-header'
import { formStorage, categoryStorage, documentStorage, userStorage } from '@/lib/storage'
import type { FormConfig, FormCategory, Document } from '@/lib/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Wallet,
  Briefcase,
  Package,
  Settings,
  FolderOpen,
}

const IconComponent = ({ name }: { name?: string }) => {
  const Icon = iconMap[name || 'FolderOpen'] || FolderOpen
  return <Icon className="h-5 w-5" />
}

export default function RuntimeFormsPage() {
  const router = useRouter()
  const [forms, setForms] = useState<FormConfig[]>([])
  const [categories, setCategories] = useState<FormCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    // 只加载已发布的表单
    const allForms = formStorage.getAll()
    setForms(allForms.filter(f => f.status === 'published'))
    setCategories(categoryStorage.getAll())
    setDocuments(documentStorage.getAll())
  }, [])

  const filteredForms = forms.filter(form => {
    const matchesCategory = selectedCategory === 'all' || form.categoryId === selectedCategory
    const matchesSearch = !searchQuery || 
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDocumentCount = (formId: string) => {
    return documents.filter(d => d.formId === formId).length
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '未分类'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || '未分类'
  }

  const getCategoryIcon = (categoryId?: string) => {
    if (!categoryId) return 'FolderOpen'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.icon || 'FolderOpen'
  }

  const handleCreateDocument = (formId: string) => {
    router.push(`/runtime/documents/create?formId=${formId}`)
  }

  const handleViewDocuments = (formId: string) => {
    router.push(`/runtime/documents?formId=${formId}`)
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <PageHeader
            title="表单中心"
            description="选择表单创建新的业务单据或查看已有记录"
          />

          {/* 搜索和筛选 */}
          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索表单..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 分类标签 */}
          <div className="mt-6">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  全部
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <IconComponent name={cat.icon} />
                    <span className="ml-1.5">{cat.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* 表单列表 */}
          <div className="mt-6">
            {filteredForms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">暂无可用表单</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    请联系管理员在设计中心创建并发布表单
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredForms.map((form) => (
                  <Card key={form.id} className="group transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <IconComponent name={getCategoryIcon(form.categoryId)} />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryName(form.categoryId)}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-base">{form.name}</CardTitle>
                      {form.description && (
                        <CardDescription className="line-clamp-2">
                          {form.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{form.fields.length} 个字段</span>
                        <span>{getDocumentCount(form.id)} 条记录</span>
                      </div>
                      {form.numberRule?.prefix && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          单号: {form.numberRule.prefix}***
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCreateDocument(form.id)}
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          新建单据
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDocuments(form.id)}
                        >
                          查看
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
