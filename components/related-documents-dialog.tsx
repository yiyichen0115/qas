'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Link2, FileText, Package, Search } from 'lucide-react'
import { RelatedDocumentsList } from '@/components/related-documents-list'
import { SimilarDocuments } from '@/components/similar-documents'
import { LACRelatedDocuments } from '@/components/lac-related-documents'
import type { Document, DocumentType, RelatedDocumentConfig, FormField } from '@/lib/types'

interface RelatedDocumentsDialogProps {
  document: Document
  form: DocumentType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RelatedDocumentsDialog({
  document,
  form,
  open,
  onOpenChange,
}: RelatedDocumentsDialogProps) {
  // 获取所有关联单据字段配置
  const getRelatedDocConfigs = (): { field: FormField; config: RelatedDocumentConfig }[] => {
    if (!form.fields) return []

    return form.fields
      .filter(field => field.type === 'related_documents' && field.relatedDocConfig)
      .map(field => ({
        field,
        config: field.relatedDocConfig!,
      }))
  }

  const relatedConfigs = getRelatedDocConfigs()
  const hasRelatedDocs = relatedConfigs.length > 0
  const isLACDocument = document.documentTypeId === 'doctype_lac'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">关联单据</DialogTitle>
              <DialogDescription className="text-xs">
                单号：{document.documentNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs defaultValue={hasRelatedDocs ? 'related' : 'similar'} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
              {/* 直接关联的单据 */}
              {hasRelatedDocs && (
                <TabsTrigger value="related" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>直接关联</span>
                  <Badge variant="secondary" className="ml-auto">
                    {relatedConfigs.length}
                  </Badge>
                </TabsTrigger>
              )}

              {/* LAC专用关联 */}
              {isLACDocument && (
                <TabsTrigger value="lac-related" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>LAC关联</span>
                  <Badge variant="secondary" className="ml-auto">
                    2
                  </Badge>
                </TabsTrigger>
              )}

              {/* 相似单据 */}
              <TabsTrigger value="similar" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>相似单据</span>
              </TabsTrigger>

              {/* 单据信息 */}
              <TabsTrigger value="info" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>单据信息</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              {/* 直接关联的单据 */}
              {hasRelatedDocs && (
                <TabsContent value="related" className="space-y-4 mt-0">
                  {relatedConfigs.map(({ field, config }) => {
                    const sourceValue = String(document.formData[config.linkSourceField || ''] || '')
                    return (
                      <div key={field.id}>
                        <RelatedDocumentsList
                          config={config}
                          sourceValue={sourceValue}
                          documentId={document.id}
                        />
                      </div>
                    )
                  })}
                </TabsContent>
              )}

              {/* LAC专用关联 */}
              {isLACDocument && (
                <TabsContent value="lac-related" className="mt-0">
                  <LACRelatedDocuments lacDocument={document} />
                </TabsContent>
              )}

              {/* 相似单据 */}
              <TabsContent value="similar" className="mt-0">
                <SimilarDocuments document={document} documentTypeName={form.name} />
              </TabsContent>

              {/* 单据基本信息 */}
              <TabsContent value="info" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">基本信息</h4>
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">单号：</span>
                          <span className="font-medium">{document.documentNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">状态：</span>
                          <span className="font-medium">{document.status}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">创建人：</span>
                          <span className="font-medium">{document.createdByName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">创建时间：</span>
                          <span className="font-medium">{new Date(document.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">表单数据</h4>
                    <div className="rounded-lg border border-border p-4">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {Object.entries(document.formData).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="text-muted-foreground w-32 shrink-0">{key}:</span>
                            <span className="font-medium truncate">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                      {Object.keys(document.formData).length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          还有 {Object.keys(document.formData).length - 10} 个字段...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}