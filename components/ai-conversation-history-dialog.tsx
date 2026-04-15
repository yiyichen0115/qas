'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, Clock3, GripVertical, History, MessageSquare, User } from 'lucide-react'
import { aiConversationStorage } from '@/lib/storage'
import type { AIConversation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface AIConversationHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConversationId?: string | null
  currentUserId?: string
  currentUserName?: string
  onSelectConversation: (conversationId: string) => void
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFullTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getConversationTitle(conversation: AIConversation) {
  const firstUserMessage = conversation.messages.find((message) => message.role === 'user' && message.content.trim())
  return firstUserMessage?.content.slice(0, 30) || 'New conversation'
}

function getConversationPreview(conversation: AIConversation) {
  const lastMessage = conversation.messages[conversation.messages.length - 1]
  return lastMessage?.content.slice(0, 120) || 'No messages yet.'
}

export function AIConversationHistoryDialog({
  open,
  onOpenChange,
  currentConversationId,
  currentUserId,
  currentUserName,
  onSelectConversation,
}: AIConversationHistoryDialogProps) {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(currentConversationId || null)
  const [dialogWidth, setDialogWidth] = useState(2000)

  useEffect(() => {
    if (!open) {
      return
    }

    const userId = currentUserId || 'anonymous'
    const nextConversations = aiConversationStorage
      .getByUserId(userId)
      .filter((conversation) => conversation.messages.length > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    setConversations(nextConversations)
    setSelectedConversationId(currentConversationId || nextConversations[0]?.id || null)
  }, [currentConversationId, currentUserId, open])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setDialogWidth((currentWidth) => currentWidth)
  }, [open])

  const handleResumeConversation = (conversationId: string) => {
    onSelectConversation(conversationId)
    onOpenChange(false)
  }

  const handleResizeStart = (event: React.PointerEvent<HTMLElement>) => {
    if (typeof window === 'undefined') {
      return
    }

    event.preventDefault()

    const pointerId = event.pointerId
    const startX = event.clientX
    const startWidth = dialogWidth
    const minWidth = 1280

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      const deltaX = moveEvent.clientX - startX
      const nextWidth = Math.max(startWidth + deltaX, minWidth)
      setDialogWidth(nextWidth)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return
      }

      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[94vh] flex-col overflow-hidden p-0"
        style={{ width: dialogWidth, maxWidth: 'none' }}
      >
        <DialogHeader className="border-b px-6 py-4 pr-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Session History
              </DialogTitle>
              <DialogDescription>
                History for {currentUserName || 'the current account'}.
              </DialogDescription>
            </div>
            <button
              type="button"
              onPointerDown={handleResizeStart}
              className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              title="Drag to resize"
            >
              <GripVertical className="h-3.5 w-3.5" />
              Drag to resize
            </button>
          </div>
        </DialogHeader>

        <button
          type="button"
          aria-label="Resize dialog"
          onPointerDown={handleResizeStart}
          className="absolute right-0 top-0 z-20 h-full w-3 cursor-ew-resize touch-none bg-transparent"
        />

        {conversations.length === 0 ? (
          <div className="px-6 py-10">
            <Empty className="border-none p-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquare />
                </EmptyMedia>
                <EmptyTitle>No saved conversations yet</EmptyTitle>
                <EmptyDescription>
                  After this account starts chatting with the AI assistant, the sessions will appear here automatically.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-r">
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-medium">Conversation list</p>
                    <p className="text-xs text-muted-foreground">Sorted by latest activity</p>
                  </div>
                  <Badge variant="outline">{conversations.length}</Badge>
                </div>
              </div>

              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                        selectedConversationId === conversation.id && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium leading-6">{getConversationTitle(conversation)}</p>
                          <p className="mt-1 line-clamp-3 text-[13px] leading-6 text-muted-foreground">
                            {getConversationPreview(conversation)}
                          </p>
                        </div>
                        {currentConversationId === conversation.id && (
                          <Badge variant="secondary" className="shrink-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{conversation.messages.length} messages</span>
                        <span>{formatTime(conversation.updatedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex min-h-0 flex-col">
              {selectedConversation ? (
                <>
                  <div className="border-b bg-background px-6 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold leading-7">{getConversationTitle(selectedConversation)}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{selectedConversation.messages.length} messages</Badge>
                          {currentConversationId === selectedConversation.id && (
                            <Badge variant="outline">Current conversation</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5" />
                            Updated {formatFullTime(selectedConversation.updatedAt)}
                          </p>
                          <p>Created {formatFullTime(selectedConversation.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" onClick={() => handleResumeConversation(selectedConversation.id)}>
                          Resume
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-4 p-6 xl:p-8">
                      {selectedConversation.messages.map((message) => (
                        <div key={message.id} className={cn('flex gap-3', message.role === 'user' && 'justify-end')}>
                          {message.role === 'assistant' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}
                          <div className={cn('max-w-[96%]', message.role === 'user' && 'order-first')}>
                            <Card className={cn(message.role === 'user' && 'bg-primary text-primary-foreground')}>
                              <CardContent className="p-3 xl:p-4">
                                <p className="whitespace-pre-wrap break-words text-[15px] leading-7">{message.content}</p>
                              </CardContent>
                            </Card>
                            <p className="mt-1 text-xs text-muted-foreground">{formatTime(message.timestamp)}</p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-6">
                  <Empty className="border-none p-0">
                    <EmptyContent>
                      <EmptyMedia variant="icon">
                        <History />
                      </EmptyMedia>
                      <EmptyTitle>Select a conversation</EmptyTitle>
                    </EmptyContent>
                  </Empty>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
