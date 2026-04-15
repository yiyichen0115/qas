'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { documentTypeStorage } from '@/lib/storage'
import type { DocumentType } from '@/lib/types'

export default function SelectDocumentTypePage() {
  const router = useRouter()
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const types = documentTypeStorage.getPublished()
    setDocumentTypes(types)
    setLoading(false)
    
    // 如果只有一个单据类型，直接跳转
    if (types.length === 1) {
      router.replace(`/runtime/documents/create?documentTypeId=${types[0].id}`)
    }
  }, [router])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  if (documentTypes.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">暂无可用的单据类型</h2>
          <p className="mt-2 text-muted-foreground">请先在设计中心创建并发布单据类型</p>
          <Button className="mt-6" onClick={() => router.push('/designer/document-types')}>
            <Plus className="mr-2 h-4 w-4" />
            创建单据类型
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-border bg-card px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">选择单据类型</h1>
            <p className="text-sm text-muted-foreground">请选择要创建的单据类型</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {documentTypes.map((docType) => (
                <Card 
                  key={docType.id} 
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => router.push(`/runtime/documents/create?documentTypeId=${docType.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{docType.name}</CardTitle>
                        {docType.code && (
                          <p className="text-xs text-muted-foreground font-mono">{docType.code}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {docType.description && (
                    <CardContent>
                      <CardDescription>{docType.description}</CardDescription>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
