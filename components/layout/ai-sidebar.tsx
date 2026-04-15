'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIConversationHistoryDialog } from '@/components/ai-conversation-history-dialog'
import { useAiAssistantChat } from '@/hooks/use-ai-assistant-chat'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { aiDocumentRuleStorage, documentStorage, documentTypeStorage, knowledgeStorage, userStorage } from '@/lib/storage'
import type { AIDocumentRule, Document, DocumentType, KnowledgeArticle, User as AppUser } from '@/lib/types'

interface AISidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISidebar({ open, onOpenChange }: AISidebarProps) {
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([])
  const [historicalDocuments, setHistoricalDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [aiRules, setAiRules] = useState<AIDocumentRule[]>([])
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
      aiRules: aiRules.filter((rule) => rule.enabled).map((rule) => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        priority: rule.priority,
        matchConditions: rule.matchConditions,
        matchLogic: rule.matchLogic,
        action: rule.action,
      })),
    })

  useEffect(() => {
    setKnowledgeArticles(knowledgeStorage.getPublished())
    setHistoricalDocuments(documentStorage.getAll())
    setDocumentTypes(documentTypeStorage.getPublished())
    setAiRules(aiDocumentRuleStorage.getEnabled())
  }, [])

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
    <>
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-lg bg-primary px-3 py-4 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          <Bot className="h-5 w-5" />
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen flex-col border-l bg-background shadow-xl transition-all duration-300',
          open ? 'w-[600px] translate-x-0' : 'w-0 translate-x-full',
        )}
      >
        {open && (
          <>
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/5 to-purple-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-purple-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI 问答助手</h3>
                  <p className="text-xs text-muted-foreground">支持当前账号会话历史查看</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewChat}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-1 font-medium">你好，有什么可以帮你？</h4>
                  <p className="mb-4 text-xs text-muted-foreground">
                    你可以直接提问，也可以从会话历史中继续之前的聊天。
                  </p>

                  <div className="grid w-full gap-2">
                    <Button variant="outline" size="sm" className="h-auto justify-start px-3 py-2 text-xs" onClick={() => setInputValue('车辆无法充电，如何排查？')}>
                      <FileText className="mr-2 h-3 w-3 shrink-0" />
                      车辆无法充电，如何排查？
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto justify-start px-3 py-2 text-xs" onClick={() => setInputValue('故障码 P181900 是什么意思？')}>
                      <FileText className="mr-2 h-3 w-3 shrink-0" />
                      故障码 P181900 是什么意思？
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto justify-start px-3 py-2 text-xs" onClick={() => setInputValue('如何填写求援反馈单？')}>
                      <BookOpen className="mr-2 h-3 w-3 shrink-0" />
                      如何填写求援反馈单？
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
                    <div key={message.id || index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}

                      <div className={`flex max-w-[85%] flex-col gap-1.5 ${message.role === 'user' ? 'items-end' : ''}`}>
                        <Card className={cn('shadow-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
                          <CardContent className="p-2.5">
                            <div className="whitespace-pre-wrap text-xs leading-relaxed">{displayText}</div>
                          </CardContent>
                        </Card>

                        {referencedArticles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {referencedArticles.map((article) => (
                              <Badge key={article.id} variant="secondary" className="cursor-pointer text-xs hover:bg-secondary/80">
                                <BookOpen className="mr-1 h-2.5 w-2.5" />
                                {article.title}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {suggestedDocType && (
                          <Link href={`/runtime/documents/create?documentTypeId=${suggestedDocType.id}`}>
                            <Button size="sm" className="h-7 gap-1.5 text-xs">
                              <Plus className="h-3 w-3" />
                              创建 {suggestedDocType.name}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Button>
                          </Link>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {status === 'streaming' && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <Card className="bg-muted/50 shadow-sm">
                    <CardContent className="p-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        正在思考...
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-muted/30 p-3">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="描述你遇到的问题..."
                  disabled={status === 'streaming'}
                  className="h-9 flex-1 text-sm"
                />
                <Button onClick={handleSend} disabled={!inputValue.trim() || status === 'streaming'} size="sm" className="h-9 w-9 p-0">
                  {status === 'streaming' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                当前账号的 AI 会话会自动保存，可随时从历史会话继续追问。
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
          </>
        )}
      </aside>
    </>
  )
}
