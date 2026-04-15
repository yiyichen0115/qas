'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Bot,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Plus,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AIConversationHistoryDialog } from '@/components/ai-conversation-history-dialog'
import { useAiAssistantChat } from '@/hooks/use-ai-assistant-chat'
import { useAppStore } from '@/stores/app-store'
import { documentStorage, documentTypeStorage, knowledgeStorage, userStorage } from '@/lib/storage'
import type { Document, DocumentType, KnowledgeArticle, User as AppUser } from '@/lib/types'

interface AIAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuestion?: string
}

export function AIAssistantDialog({ open, onOpenChange, initialQuestion }: AIAssistantDialogProps) {
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([])
  const [historicalDocuments, setHistoricalDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [inputValue, setInputValue] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const storeCurrentUser = useAppStore((state) => state.currentUser)
  const currentUser: AppUser | null = storeCurrentUser ?? userStorage.getCurrentUser()

  const { currentConversationId, loadConversation, messages, sendMessage, startNewConversation, status } =
    useAiAssistantChat({
      currentUser: currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name,
          }
        : null,
      knowledgeArticles: knowledgeArticles.map((article) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
      })),
      historicalDocuments: historicalDocuments.slice(0, 10).map((document) => ({
        id: document.id,
        documentNumber: document.documentNumber,
        status: document.status,
        formData: document.formData,
      })),
      documentTypes: documentTypes.map((documentType) => ({
        id: documentType.id,
        name: documentType.name,
        description: documentType.description,
      })),
    })

  useEffect(() => {
    if (!open) {
      return
    }

    setKnowledgeArticles(knowledgeStorage.getPublished())
    setHistoricalDocuments(documentStorage.getAll())
    setDocumentTypes(documentTypeStorage.getPublished())

    if (initialQuestion && messages.length === 0) {
      const timer = window.setTimeout(() => {
        void sendMessage({ text: initialQuestion })
      }, 500)

      return () => window.clearTimeout(timer)
    }
  }, [initialQuestion, messages.length, open, sendMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || status === 'streaming') {
      return
    }

    void sendMessage({ text: inputValue })
    setInputValue('')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    startNewConversation()
    setInputValue('')
  }

  const parseSuggestedDocument = (content: string) => {
    const match = content.match(/\[DOC_SUGGEST:([^\]]+)\]/)

    if (!match) {
      return null
    }

    return documentTypes.find((documentType) => documentType.id === match[1].trim()) || null
  }

  const parseReferencedArticles = (content: string) => {
    const matches = content.matchAll(/\[KNOWLEDGE_ID:\s*([^\]]+)\]/g)
    const articleIds = [...matches].map((match) => match[1].trim())
    return knowledgeArticles.filter((article) => articleIds.includes(article.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-3xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              AI 技术支持助手
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                会话历史
              </Button>
              <Button variant="outline" size="sm" onClick={handleNewChat}>
                新对话
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">你好，我是 AI 技术支持助手</h3>
              <p className="mb-6 max-w-md text-muted-foreground">
                我可以结合知识库和历史单据，帮助你分析故障、整理思路，并在必要时建议创建工单。
              </p>

              <div className="grid max-w-md grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto justify-start px-4 py-3" onClick={() => setInputValue('车辆无法充电，如何排查？')}>
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-left text-sm">车辆无法充电，如何排查？</span>
                </Button>
                <Button variant="outline" className="h-auto justify-start px-4 py-3" onClick={() => setInputValue('故障码 P181900 是什么意思？')}>
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-left text-sm">故障码 P181900 是什么意思？</span>
                </Button>
                <Button variant="outline" className="h-auto justify-start px-4 py-3" onClick={() => setInputValue('如何填写求援反馈单？')}>
                  <BookOpen className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-left text-sm">如何填写求援反馈单？</span>
                </Button>
                <Button variant="outline" className="h-auto justify-start px-4 py-3" onClick={() => setInputValue('电池温度异常怎么处理？')}>
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-left text-sm">电池温度异常怎么处理？</span>
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const text = message.content
              const suggestedDocType = message.role === 'assistant' ? parseSuggestedDocument(text) : null
              const referencedArticles = message.role === 'assistant' ? parseReferencedArticles(text) : []
              const displayText = text
                .replace(/\[DOC_SUGGEST:[^\]]+\]/g, '')
                .replace(/\[KNOWLEDGE_ID:\s*[^\]]+\]/g, '')
                .trim()

              return (
                <div key={message.id || index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  <div className={`flex max-w-[80%] flex-col gap-2 ${message.role === 'user' ? 'items-end' : ''}`}>
                    <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">{displayText}</div>
                      </CardContent>
                    </Card>

                    {referencedArticles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {referencedArticles.map((article) => (
                          <Badge key={article.id} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                            <BookOpen className="mr-1 h-3 w-3" />
                            {article.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {suggestedDocType && (
                      <Link href={`/runtime/documents/create?documentTypeId=${suggestedDocType.id}`} onClick={() => onOpenChange(false)}>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          创建 {suggestedDocType.name}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {status === 'streaming' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在思考...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你遇到的问题..."
              disabled={status === 'streaming'}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || status === 'streaming'}>
              {status === 'streaming' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            AI 助手会自动保存当前账号的会话历史，方便你稍后继续查看和追问。
          </p>
        </div>

        <AIConversationHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          currentConversationId={currentConversationId}
          currentUserId={currentUser?.id}
          currentUserName={currentUser?.name}
          onSelectConversation={(conversationId) => {
            loadConversation(conversationId)
            setHistoryOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export function AIAssistantFloatingButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
        <Bot className="h-6 w-6" />
      </Button>
      <AIAssistantDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
