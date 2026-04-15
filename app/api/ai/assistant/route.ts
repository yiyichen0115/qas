import { requestQwen, type QwenMessage } from '@/lib/ai/qwen'

interface AIDocumentRule {
  id: string
  name: string
  enabled: boolean
  priority: number
  matchConditions: {
    type: string
    value: string
    matchMode: string
  }[]
  matchLogic: 'and' | 'or'
  action: {
    type: string
    documentTypeId?: string
    guideMessage?: string
    fieldMappings?: {
      sourceKey: string
      targetField: string
      extractPattern?: string
    }[]
    relatedArticleIds?: string[]
  }
}

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category?: string
  tags?: string[]
}

interface DocumentType {
  id: string
  name: string
  description?: string
}

interface HistoricalDocument {
  documentNumber: string
  status: string
  formData: {
    faultInfo?: string
    vin?: string
  }
}

interface IncomingMessage {
  role?: string
  content?: string
  parts?: Array<{ type?: string; text?: string }>
}

function getMessageText(message: IncomingMessage) {
  if (typeof message.content === 'string') {
    return message.content
  }

  if (!Array.isArray(message.parts)) {
    return ''
  }

  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
}

function matchRulesOnServer(userInput: string, rules: AIDocumentRule[]) {
  const enabledRules = rules.filter((rule) => rule.enabled).sort((a, b) => a.priority - b.priority)
  const matchedRules: AIDocumentRule[] = []

  for (const rule of enabledRules) {
    const conditionResults: boolean[] = []

    for (const condition of rule.matchConditions) {
      const values = condition.value.split(',').map((value) => value.trim().toLowerCase())
      const inputLower = userInput.toLowerCase()

      let conditionMatch = false

      for (const value of values) {
        switch (condition.matchMode) {
          case 'contains':
            conditionMatch = inputLower.includes(value)
            break
          case 'exact':
            conditionMatch = inputLower === value
            break
          case 'startsWith':
            conditionMatch = inputLower.startsWith(value)
            break
          case 'endsWith':
            conditionMatch = inputLower.endsWith(value)
            break
          case 'regex':
            try {
              conditionMatch = new RegExp(value, 'i').test(userInput)
            } catch {
              conditionMatch = false
            }
            break
          default:
            conditionMatch = false
        }

        if (conditionMatch) {
          break
        }
      }

      conditionResults.push(conditionMatch)
    }

    const isMatch =
      rule.matchLogic === 'and'
        ? conditionResults.every(Boolean)
        : conditionResults.some(Boolean)

    if (isMatch) {
      matchedRules.push(rule)
    }
  }

  return matchedRules
}

function extractInfoFromInput(
  userInput: string,
  fieldMappings?: AIDocumentRule['action']['fieldMappings'],
) {
  const extracted: Record<string, string> = {}

  if (!fieldMappings) {
    return extracted
  }

  for (const mapping of fieldMappings) {
    if (!mapping.extractPattern) {
      continue
    }

    try {
      const regex = new RegExp(mapping.extractPattern, 'i')
      const match = userInput.match(regex)

      if (match?.[0]) {
        extracted[mapping.sourceKey] = match[0]
      }
    } catch {
      // Ignore invalid regex patterns configured by users.
    }
  }

  return extracted
}

function buildSystemPrompt({
  knowledgeArticles,
  historicalDocuments,
  documentTypes,
  matchedRules,
  suggestedDocTypeId,
  extractedInfo,
}: {
  knowledgeArticles: KnowledgeArticle[]
  historicalDocuments: HistoricalDocument[]
  documentTypes: DocumentType[]
  matchedRules: AIDocumentRule[]
  suggestedDocTypeId: string
  extractedInfo: Record<string, string>
}) {
  const topRule = matchedRules[0]

  const knowledgeContext =
    knowledgeArticles.length > 0
      ? `\n\n## Knowledge Base\n${knowledgeArticles
          .map(
            (article) =>
              `### ${article.title}\n${article.content.slice(0, 1000)}${
                article.content.length > 1000 ? '...' : ''
              }\n[KNOWLEDGE_ID:${article.id}]`,
          )
          .join('\n\n')}`
      : ''

  const historyContext =
    historicalDocuments.length > 0
      ? `\n\n## Historical Documents\n${historicalDocuments
          .map(
            (document) =>
              `- Document No: ${document.documentNumber}, Status: ${document.status}, Fault: ${
                document.formData?.faultInfo || 'N/A'
              }, VIN: ${document.formData?.vin || 'N/A'}`,
          )
          .join('\n')}`
      : ''

  const documentTypeContext =
    documentTypes.length > 0
      ? `\n\n## Available Document Types\n${documentTypes
          .map(
            (documentType) =>
              `- ${documentType.name} (ID: ${documentType.id})${
                documentType.description ? `: ${documentType.description}` : ''
              }`,
          )
          .join('\n')}`
      : ''

  const ruleContext = topRule
    ? `\n\n## Rule Match Result\nMatched rule: ${topRule.name}
Action type: ${topRule.action.type}
${topRule.action.guideMessage ? `Guide message: ${topRule.action.guideMessage}` : ''}
${topRule.action.documentTypeId ? `Suggested document type ID: ${topRule.action.documentTypeId}` : ''}
${Object.keys(extractedInfo).length > 0 ? `Extracted info: ${JSON.stringify(extractedInfo)}` : ''}`
    : ''

  return `You are the AC platform support assistant for vehicle service teams.
Reply in Chinese.

Responsibilities:
1. Understand the issue precisely.
2. Prefer answers grounded in the provided knowledge base and historical documents.
3. Offer practical troubleshooting steps and clear next actions.
4. If a rule suggests creating a document, recommend that document.

Rules:
- When you cite knowledge, keep the marker [KNOWLEDGE_ID:id] in the related sentence.
- If the issue cannot be solved directly, explain the next troubleshooting step.
- If a document should be created, append [DOC_SUGGEST:${suggestedDocTypeId || 'document_type_id'}] at the end.
- Do not invent documents, rules, or knowledge that are not provided.

${knowledgeContext}
${historyContext}
${documentTypeContext}
${ruleContext}`
}

export async function POST(req: Request) {
  try {
    const {
      messages = [],
      knowledgeArticles = [],
      historicalDocuments = [],
      documentTypes = [],
      aiRules = [],
    } = await req.json()

    const normalizedMessages = (messages as IncomingMessage[])
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: getMessageText(message).trim(),
      }))
      .filter((message) => message.content) as Array<{ role: 'user' | 'assistant'; content: string }>

    const lastUserMessage = [...normalizedMessages].reverse().find((message) => message.role === 'user')
    const userInput = lastUserMessage?.content || ''
    const matchedRules = matchRulesOnServer(userInput, aiRules as AIDocumentRule[])
    const suggestedDocTypeId =
      matchedRules[0]?.action.type === 'suggest_document' && matchedRules[0]?.action.documentTypeId
        ? matchedRules[0].action.documentTypeId
        : ''
    const extractedInfo = matchedRules[0]
      ? extractInfoFromInput(userInput, matchedRules[0].action.fieldMappings)
      : {}

    const qwenMessages: QwenMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt({
          knowledgeArticles: knowledgeArticles as KnowledgeArticle[],
          historicalDocuments: historicalDocuments as HistoricalDocument[],
          documentTypes: documentTypes as DocumentType[],
          matchedRules,
          suggestedDocTypeId,
          extractedInfo,
        }),
      },
      ...normalizedMessages,
    ]

    const message = await requestQwen({
      messages: qwenMessages,
      temperature: 0.2,
      maxTokens: 1400,
    })

    return Response.json({ message })
  } catch (error) {
    console.error('AI assistant request failed:', error)

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'AI assistant request failed.',
      },
      { status: 500 },
    )
  }
}
