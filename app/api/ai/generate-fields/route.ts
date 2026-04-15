import { z } from 'zod'
import { requestQwenJson } from '@/lib/ai/qwen'

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'number',
    'select',
    'radio',
    'checkbox',
    'date',
    'datetime',
    'textarea',
    'divider',
  ]),
  label: z.string(),
  name: z.string(),
  required: z.boolean(),
  placeholder: z.string().nullable(),
  description: z.string().nullable(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .nullable(),
  width: z.enum(['full', 'half', 'third']).nullable(),
  defaultValue: z.any().nullable(),
})

const generateFieldsSchema = z.object({
  fields: z.array(fieldSchema).describe('Generated form field definitions'),
  summary: z.string().describe('Short explanation of the generated fields'),
})

export async function POST(req: Request) {
  try {
    const { prompt, documentTypeName, existingFields } = await req.json()

    const output = await requestQwenJson({
      schema: generateFieldsSchema,
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are a professional form designer.
Return JSON only. Do not use Markdown.

Rules:
1. The top-level object must contain fields and summary.
2. Use field ids like f_xxx and names in snake_case.
3. type must be one of text, number, select, radio, checkbox, date, datetime, textarea, divider.
4. select, radio, and checkbox fields must include options.
5. width must be full, half, third, or null.
6. Set required, placeholder, description, and defaultValue reasonably.
7. Do not add properties outside the schema.
8. Keep summary in the same language as the user's request.`,
        },
        {
          role: 'user',
          content: `Document type: ${documentTypeName || 'Not specified'}
Existing fields: ${
            existingFields?.length
              ? existingFields.map((field: { label: string }) => field.label).join(', ')
              : 'None'
          }

User request:
${prompt}`,
        },
      ],
    })

    return Response.json({ success: true, data: output })
  } catch (error) {
    console.error('AI field generation failed:', error)

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed. Please try again.',
      },
      { status: 500 },
    )
  }
}
