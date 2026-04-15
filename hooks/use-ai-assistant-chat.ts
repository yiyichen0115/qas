'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { aiConversationStorage } from '@/lib/storage'
import type { AIConversation, AIMessage } from '@/lib/types'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AssistantRequestContext {
  knowledgeArticles?: unknown[]
  historicalDocuments?: unknown[]
  documentTypes?: unknown[]
  aiRules?: unknown[]
}

interface AssistantChatUser {
  id: string
  name: string
}

interface UseAiAssistantChatOptions extends AssistantRequestContext {
  currentUser?: AssistantChatUser | null
}

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createTimestamp() {
  return new Date().toISOString()
}

function toConversationMessages(messages: AssistantMessage[]): AIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }))
}

function fromConversation(conversation: AIConversation): AssistantMessage[] {
  return conversation.messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }))
}

export function useAiAssistantChat(options: UseAiAssistantChatOptions) {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [status, setStatus] = useState<'ready' | 'streaming'>('ready')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const messagesRef = useRef(messages)
  const optionsRef = useRef(options)
  const conversationIdRef = useRef<string | null>(currentConversationId)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  const persistConversation = useCallback((conversationId: string, nextMessages: AssistantMessage[]) => {
    if (nextMessages.length === 0) {
      return
    }

    const currentUser = optionsRef.current.currentUser
    const userId = currentUser?.id || 'anonymous'
    const userName = currentUser?.name || 'Anonymous'
    const existingConversation = aiConversationStorage.getById(conversationId)

    aiConversationStorage.save({
      id: conversationId,
      userId,
      userName,
      messages: toConversationMessages(nextMessages),
      resolved: existingConversation?.resolved ?? false,
      createdDocumentId: existingConversation?.createdDocumentId,
      createdAt: existingConversation?.createdAt || nextMessages[0]?.timestamp || createTimestamp(),
      updatedAt: nextMessages[nextMessages.length - 1]?.timestamp || createTimestamp(),
    })
  }, [])

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null)
    setMessages([])
  }, [])

  const loadConversation = useCallback((conversationId: string) => {
    const conversation = aiConversationStorage.getById(conversationId)

    if (!conversation) {
      return
    }

    const currentUser = optionsRef.current.currentUser
    const activeUserId = currentUser?.id || 'anonymous'

    if (conversation.userId !== activeUserId) {
      return
    }

    setCurrentConversationId(conversation.id)
    setMessages(fromConversation(conversation))
  }, [])

  const sendMessage = useCallback(
    async ({ text }: { text: string }) => {
      const trimmed = text.trim()

      if (!trimmed || status === 'streaming') {
        return
      }

      const activeConversationId = conversationIdRef.current || createMessageId()
      const userMessage: AssistantMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmed,
        timestamp: createTimestamp(),
      }

      const nextMessages = [...messagesRef.current, userMessage]

      setCurrentConversationId(activeConversationId)
      setMessages(nextMessages)
      setStatus('streaming')
      persistConversation(activeConversationId, nextMessages)

      try {
        const response = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            knowledgeArticles: optionsRef.current.knowledgeArticles,
            historicalDocuments: optionsRef.current.historicalDocuments,
            documentTypes: optionsRef.current.documentTypes,
            aiRules: optionsRef.current.aiRules,
            messages: nextMessages,
          }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || 'AI assistant request failed.')
        }

        const assistantMessage: AssistantMessage = {
          id: createMessageId(),
          role: 'assistant',
          content:
            typeof data?.message === 'string' && data.message.trim()
              ? data.message.trim()
              : 'The assistant returned an empty response. Please try again.',
          timestamp: createTimestamp(),
        }

        const updatedMessages = [...nextMessages, assistantMessage]
        setMessages(updatedMessages)
        persistConversation(activeConversationId, updatedMessages)
      } catch (error) {
        const assistantMessage: AssistantMessage = {
          id: createMessageId(),
          role: 'assistant',
          content: `Request failed: ${error instanceof Error ? error.message : 'Please try again.'}`,
          timestamp: createTimestamp(),
        }

        const updatedMessages = [...nextMessages, assistantMessage]
        setMessages(updatedMessages)
        persistConversation(activeConversationId, updatedMessages)
      } finally {
        setStatus('ready')
      }
    },
    [persistConversation, status],
  )

  return {
    currentConversationId,
    loadConversation,
    messages,
    sendMessage,
    startNewConversation,
    status,
  }
}
