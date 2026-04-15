import { z } from 'zod'
import { requestQwenJson } from '@/lib/ai/qwen'

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'end', 'create', 'fill', 'submit', 'approve', 'condition', 'notify', 'cc']),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    assignee: z.string().nullable(),
    assigneeRole: z.string().nullable(),
  }),
})

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().nullable(),
})

const statusSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  color: z.string(),
  isInitial: z.boolean(),
  isFinal: z.boolean(),
  order: z.number(),
})

const eventSchema = z.object({
  id: z.string(),
  type: z.enum(['create', 'submit', 'approve', 'reject', 'resubmit', 'revoke', 'cancel', 'complete']),
  name: z.string(),
  enabled: z.boolean(),
  fromStatus: z.array(z.string()).nullable(),
  toStatus: z.string(),
  permissions: z.array(z.string()),
})

const generateWorkflowSchema = z.object({
  nodes: z.array(nodeSchema).describe('Generated workflow nodes'),
  edges: z.array(edgeSchema).describe('Generated workflow edges'),
  statuses: z.array(statusSchema).describe('Generated document statuses'),
  events: z.array(eventSchema).describe('Generated workflow events'),
  summary: z.string().describe('Short explanation of the generated workflow'),
})

export async function POST(req: Request) {
  try {
    const { prompt, documentTypeName } = await req.json()

    const output = await requestQwenJson({
      schema: generateWorkflowSchema,
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are a professional workflow designer.
Return JSON only. Do not use Markdown.

Rules:
1. The top-level object must contain nodes, edges, statuses, events, and summary.
2. Node type must be one of start, end, create, fill, submit, approve, condition, notify, cc.
3. Lay nodes out from top to bottom. x is usually near 400, y should increase gradually.
4. Use ids like node_xxx and edge_xxx.
5. Prefer assigneeRole values Dealer, Engineer, Admin, Manager.
6. status.color must be a hex color string.
7. Do not add properties outside the schema.
8. Keep summary in the same language as the user's request.`,
        },
        {
          role: 'user',
          content: `Document type: ${documentTypeName || 'Not specified'}

User request:
${prompt}`,
        },
      ],
    })

    return Response.json({ success: true, data: output })
  } catch (error) {
    console.error('AI workflow generation failed:', error)

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed. Please try again.',
      },
      { status: 500 },
    )
  }
}
