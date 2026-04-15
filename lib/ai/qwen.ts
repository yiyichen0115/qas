import { z } from 'zod'

export type QwenMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface RequestQwenOptions {
  messages: QwenMessage[]
  temperature?: number
  maxTokens?: number
  responseFormat?: { type: 'json_object' }
}

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen-plus'

function getBaseUrl() {
  return (process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function getApiKey() {
  const apiKey = process.env.DASHSCOPE_API_KEY

  if (!apiKey) {
    throw new Error('Missing DASHSCOPE_API_KEY. Add it to .env.local before starting the app.')
  }

  return apiKey
}

function readContent(content: unknown) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'text' &&
          'text' in item &&
          typeof item.text === 'string'
        ) {
          return item.text
        }

        return ''
      })
      .join('\n')
  }

  return ''
}

function stripMarkdownCodeFence(value: string) {
  const trimmed = value.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

export async function requestQwen(options: RequestQwenOptions) {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: process.env.QWEN_MODEL || DEFAULT_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens,
      response_format: options.responseFormat,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Qwen request failed with status ${response.status}.`

    throw new Error(message)
  }

  const content = readContent(data?.choices?.[0]?.message?.content)

  if (!content) {
    throw new Error('Qwen returned an empty response.')
  }

  return content
}

export async function requestQwenJson<T>(options: RequestQwenOptions & { schema: z.ZodType<T> }) {
  const content = await requestQwen(options)
  const parsed = JSON.parse(stripMarkdownCodeFence(content))
  return options.schema.parse(parsed)
}
