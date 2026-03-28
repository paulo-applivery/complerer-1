import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { complianceTools } from '../lib/tools.js'
import { executeTool } from '../lib/tool-executor.js'
import { workspaceMiddleware } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'

/**
 * Chat routes — mounted at /api/workspaces/:workspaceId/chat
 * AI-powered compliance assistant using Claude with tool_use.
 */
const chatRoutes = new Hono<AppType>()

// All routes require authentication + workspace membership
chatRoutes.use('*', authMiddleware)
chatRoutes.use('*', workspaceMiddleware)

// ─── Types ────────────────────────────────────────────────────────────

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContentBlock[]
}

interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

interface ClaudeResponse {
  id: string
  content: ClaudeContentBlock[]
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// ─── Settings Keys ────────────────────────────────────────────────────

const SETTING_KEYS = {
  AI_MODEL: 'ai.model',
  AI_MAX_TOKENS: 'ai.max_tokens',
  AI_SYSTEM_PROMPT: 'ai.system_prompt',
  AI_TEMPERATURE: 'ai.temperature',
} as const

const DEFAULTS = {
  [SETTING_KEYS.AI_MODEL]: 'claude-sonnet-4-20250514',
  [SETTING_KEYS.AI_MAX_TOKENS]: '4096',
  [SETTING_KEYS.AI_SYSTEM_PROMPT]: '',
  [SETTING_KEYS.AI_TEMPERATURE]: '0.3',
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function getWorkspaceSetting(
  db: D1Database,
  workspaceId: string,
  key: string,
  fallback: string
): Promise<string> {
  const row = await db
    .prepare('SELECT value FROM workspace_settings WHERE workspace_id = ? AND key = ?')
    .bind(workspaceId, key)
    .first<{ value: string }>()
  return row?.value ?? fallback
}

async function buildSystemPrompt(
  db: D1Database,
  workspaceId: string
): Promise<string> {
  // Check for custom system prompt first
  const customPrompt = await getWorkspaceSetting(
    db, workspaceId, SETTING_KEYS.AI_SYSTEM_PROMPT, ''
  )

  // Get workspace name
  const workspace = await db
    .prepare('SELECT name FROM workspaces WHERE id = ?')
    .bind(workspaceId)
    .first<{ name: string }>()
  const workspaceName = workspace?.name ?? 'Unknown'

  // Get adopted frameworks
  const { results: adoptions } = await db
    .prepare(
      `SELECT f.name, fv.total_controls
       FROM workspace_adoptions wa
       JOIN framework_versions fv ON wa.framework_version_id = fv.id
       JOIN frameworks f ON fv.framework_id = f.id
       WHERE wa.workspace_id = ? AND wa.superseded_by IS NULL`
    )
    .bind(workspaceId)
    .all<{ name: string; total_controls: number }>()

  const frameworks = adoptions.map((a) => a.name)
  const totalControls = adoptions.reduce((sum, a) => sum + a.total_controls, 0)

  // Controls with evidence
  const evidenceRow = await db
    .prepare(
      `SELECT COUNT(DISTINCT el.control_id) AS covered
       FROM evidence_links el
       JOIN workspace_adoptions wa ON el.framework_version_id = wa.framework_version_id
       WHERE el.workspace_id = ? AND wa.workspace_id = ? AND wa.superseded_by IS NULL`
    )
    .bind(workspaceId, workspaceId)
    .first<{ covered: number }>()
  const coveredControls = evidenceRow?.covered ?? 0

  // Active access records
  const accessRow = await db
    .prepare(
      'SELECT COUNT(*) AS cnt FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL'
    )
    .bind(workspaceId)
    .first<{ cnt: number }>()
  const accessCount = accessRow?.cnt ?? 0

  // Open violations
  const violationRow = await db
    .prepare(
      "SELECT COUNT(*) AS cnt FROM baseline_violations WHERE workspace_id = ? AND status = 'open'"
    )
    .bind(workspaceId)
    .first<{ cnt: number }>()
  const violationCount = violationRow?.cnt ?? 0

  // Build workspace context block (always included)
  const contextBlock = `
Workspace: "${workspaceName}"
Compliance state:
- Adopted frameworks: ${frameworks.length > 0 ? frameworks.join(', ') : 'None yet'}
- Total controls: ${totalControls}
- Controls with evidence: ${coveredControls}
- Active access records: ${accessCount}
- Open violations: ${violationCount}`

  // If admin set a custom prompt, use it with context appended
  if (customPrompt) {
    return `${customPrompt}\n\n--- Workspace Context ---\n${contextBlock}`
  }

  // Default prompt
  return `You are the Complerer AI assistant, helping with compliance management.

${contextBlock}

You can help with:
- Searching compliance controls and requirements
- Checking compliance posture and gaps
- Registering access changes
- Reviewing access records
- Identifying evidence gaps
- Explaining baseline violations

Be concise, factual, and reference specific control IDs when possible. Use the available tools to query real workspace data.`
}

async function loadConversationHistory(
  db: D1Database,
  conversationId: string
): Promise<ClaudeMessage[]> {
  const { results } = await db
    .prepare(
      `SELECT role, content, tool_calls, tool_results
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT 20`
    )
    .bind(conversationId)
    .all<{
      role: string
      content: string
      tool_calls: string | null
      tool_results: string | null
    }>()

  const messages: ClaudeMessage[] = []

  for (const row of results) {
    if (row.role === 'user') {
      messages.push({ role: 'user', content: row.content })
    } else if (row.role === 'assistant') {
      // If the assistant message had tool calls, reconstruct the content blocks
      if (row.tool_calls) {
        const toolCalls = JSON.parse(row.tool_calls) as ClaudeContentBlock[]
        const contentBlocks: ClaudeContentBlock[] = []
        if (row.content) {
          contentBlocks.push({ type: 'text', text: row.content })
        }
        contentBlocks.push(...toolCalls)
        messages.push({ role: 'assistant', content: contentBlocks })

        // Add tool results as a separate user message (Claude API format)
        if (row.tool_results) {
          const toolResults = JSON.parse(row.tool_results) as ClaudeContentBlock[]
          messages.push({ role: 'user', content: toolResults })
        }
      } else {
        messages.push({ role: 'assistant', content: row.content })
      }
    }
  }

  return messages
}

interface AIConfig {
  model: string
  maxTokens: number
  temperature: number
  apiKey: string
  providerSlug: string
}

/** Map model IDs to their provider slug */
function getProviderForModel(model: string): string {
  if (model.startsWith('claude-')) return 'anthropic'
  if (model.startsWith('gemini-')) return 'google-gemini'
  if (model.startsWith('gpt-')) return 'openai'
  return 'anthropic' // default
}

/** Common key names admins might use when storing an API key */
const API_KEY_NAMES = ['api_key', 'apiKey', 'X-Api-Key', 'x-api-key', 'key', 'API_KEY']

/** Get the admin-configured API key for a provider (checking common key names) */
async function getAdminApiKey(db: D1Database, providerSlug: string): Promise<string | null> {
  const placeholders = API_KEY_NAMES.map(() => '?').join(', ')
  const row = await db
    .prepare(
      `SELECT pc.value
       FROM platform_provider_configs pc
       JOIN platform_providers p ON pc.provider_id = p.id
       WHERE p.slug = ? AND p.category = 'ai'
         AND pc.key IN (${placeholders})
         AND pc.value != ''
       LIMIT 1`
    )
    .bind(providerSlug, ...API_KEY_NAMES)
    .first<{ value: string }>()
  return row?.value ?? null
}

/** Resolve the API key: check workspace setting for key source, then resolve accordingly */
async function resolveApiKey(
  db: D1Database,
  workspaceId: string,
  providerSlug: string,
  env: { ANTHROPIC_API_KEY?: string; GEMINI_API_KEY?: string }
): Promise<string | null> {
  // Check workspace-level setting: should we use the platform key or require user key?
  const keySource = await getWorkspaceSetting(
    db, workspaceId, `ai.key_source.${providerSlug}`, 'platform'
  )

  if (keySource === 'platform') {
    // 1. Check admin-configured key from platform_provider_configs
    const adminKey = await getAdminApiKey(db, providerSlug)
    if (adminKey) return adminKey

    // 2. Fallback to environment variable (legacy support)
    if (providerSlug === 'anthropic' && env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY
    if (providerSlug === 'google-gemini' && env.GEMINI_API_KEY) return env.GEMINI_API_KEY
  }

  // 3. Check user-configured key from workspace_settings
  const userKey = await getWorkspaceSetting(
    db, workspaceId, `ai.provider_key.${providerSlug}`, ''
  )
  if (userKey) return userKey

  return null
}

async function getAIConfig(
  db: D1Database,
  workspaceId: string,
  env: { ANTHROPIC_API_KEY?: string; GEMINI_API_KEY?: string }
): Promise<AIConfig> {
  const model = await getWorkspaceSetting(db, workspaceId, SETTING_KEYS.AI_MODEL, DEFAULTS[SETTING_KEYS.AI_MODEL])
  const maxTokens = parseInt(await getWorkspaceSetting(db, workspaceId, SETTING_KEYS.AI_MAX_TOKENS, DEFAULTS[SETTING_KEYS.AI_MAX_TOKENS]), 10)
  const temperature = parseFloat(await getWorkspaceSetting(db, workspaceId, SETTING_KEYS.AI_TEMPERATURE, DEFAULTS[SETTING_KEYS.AI_TEMPERATURE]))

  const providerSlug = getProviderForModel(model)
  const apiKey = await resolveApiKey(db, workspaceId, providerSlug, env)

  if (!apiKey) {
    throw new Error(
      `No API key configured for provider "${providerSlug}". ` +
      `Ask a super admin to set the key in Admin > Providers, or add your own key in Settings > AI Configuration.`
    )
  }

  return { model, maxTokens, temperature, apiKey, providerSlug }
}

async function callAI(
  systemPrompt: string,
  messages: ClaudeMessage[],
  config: AIConfig
): Promise<ClaudeResponse> {
  // Route to the correct provider API
  if (config.providerSlug === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        tools: complianceTools,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
    }

    return response.json() as Promise<ClaudeResponse>
  }

  if (config.providerSlug === 'google-gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: typeof m.content === 'string' ? m.content : m.content.map((b) => b.text ?? '').join('\n') }],
          })),
          generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }

    const geminiResp = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
    }

    // Normalize Gemini response to our ClaudeResponse shape
    const text = geminiResp.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
    return {
      id: 'gemini-' + Date.now(),
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
      usage: {
        input_tokens: geminiResp.usageMetadata?.promptTokenCount ?? 0,
        output_tokens: geminiResp.usageMetadata?.candidatesTokenCount ?? 0,
      },
    }
  }

  if (config.providerSlug === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : m.content.map((b) => b.text ?? '').join('\n'),
          })),
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
    }

    const openaiResp = await response.json() as {
      id: string
      choices: Array<{ message: { content: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }

    return {
      id: openaiResp.id,
      content: [{ type: 'text', text: openaiResp.choices?.[0]?.message?.content ?? '' }],
      stop_reason: 'end_turn',
      usage: {
        input_tokens: openaiResp.usage?.prompt_tokens ?? 0,
        output_tokens: openaiResp.usage?.completion_tokens ?? 0,
      },
    }
  }

  throw new Error(`Unsupported AI provider: ${config.providerSlug}`)
}

// ─── POST /chat ───────────────────────────────────────────────────────

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
})

chatRoutes.post('/', zValidator('json', chatSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const { conversationId: inputConvId, message } = c.req.valid('json')

  const now = new Date().toISOString()
  const db = c.env.DB

  // Create or reuse conversation
  let conversationId = inputConvId
  if (!conversationId) {
    conversationId = generateId()
    // Auto-generate title from first message (truncated)
    const title = message.length > 60 ? message.slice(0, 57) + '...' : message
    await db
      .prepare(
        `INSERT INTO conversations (id, workspace_id, user_id, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(conversationId, workspaceId, userId, title, now, now)
      .run()
  } else {
    // Verify conversation belongs to this workspace/user
    const conv = await db
      .prepare(
        'SELECT id FROM conversations WHERE id = ? AND workspace_id = ? AND user_id = ?'
      )
      .bind(conversationId, workspaceId, userId)
      .first()
    if (!conv) {
      return c.json({ error: 'Conversation not found' }, 404)
    }
    // Update timestamp
    await db
      .prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
      .bind(now, conversationId)
      .run()
  }

  // Save user message
  const userMsgId = generateId()
  await db
    .prepare(
      `INSERT INTO messages (id, conversation_id, workspace_id, role, content, tokens_used, created_at)
       VALUES (?, ?, ?, 'user', ?, 0, ?)`
    )
    .bind(userMsgId, conversationId, workspaceId, message, now)
    .run()

  // Load conversation history
  const history = await loadConversationHistory(db, conversationId)

  // Build system prompt + load AI config from workspace settings
  const systemPrompt = await buildSystemPrompt(db, workspaceId)

  let aiConfig: AIConfig
  try {
    aiConfig = await getAIConfig(db, workspaceId, c.env)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI not configured'
    return c.json({ error: msg }, 503)
  }

  // Prepare messages for Claude (history already includes the user message we just saved)
  const claudeMessages: ClaudeMessage[] = [...history]

  // Call Claude in a loop to handle tool calls
  let totalTokens = 0
  let finalText = ''
  let allToolCalls: ClaudeContentBlock[] = []
  let allToolResults: ClaudeContentBlock[] = []
  let iterations = 0
  const maxIterations = 5

  try {
    while (iterations < maxIterations) {
      iterations++
      const claudeResponse = await callAI(
        systemPrompt,
        claudeMessages,
        aiConfig
      )
      totalTokens +=
        claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens

      if (claudeResponse.stop_reason === 'end_turn' || claudeResponse.stop_reason === 'max_tokens') {
        // Extract final text
        for (const block of claudeResponse.content) {
          if (block.type === 'text') {
            finalText += block.text
          }
        }
        break
      }

      if (claudeResponse.stop_reason === 'tool_use') {
        // Extract text and tool calls from response
        const textBlocks: string[] = []
        const toolUseBlocks: ClaudeContentBlock[] = []

        for (const block of claudeResponse.content) {
          if (block.type === 'text' && block.text) {
            textBlocks.push(block.text)
          }
          if (block.type === 'tool_use') {
            toolUseBlocks.push(block)
          }
        }

        // Add assistant message with tool calls to conversation
        claudeMessages.push({
          role: 'assistant',
          content: claudeResponse.content,
        })

        allToolCalls.push(...toolUseBlocks)

        // Execute each tool and build results
        const toolResultBlocks: ClaudeContentBlock[] = []
        for (const toolBlock of toolUseBlocks) {
          const result = await executeTool(
            db,
            workspaceId,
            userId,
            toolBlock.name!,
            (toolBlock.input as Record<string, unknown>) ?? {}
          )
          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id!,
            content: result,
          })
        }

        allToolResults.push(...toolResultBlocks)

        // Add tool results as user message (Claude API format)
        claudeMessages.push({
          role: 'user',
          content: toolResultBlocks,
        })

        // Continue loop to get Claude's final response
        continue
      }

      // Unknown stop reason — break
      break
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error calling AI'
    return c.json({ error: errorMessage }, 422)
  }

  // Save assistant message with tool metadata
  const assistantMsgId = generateId()
  const msgNow = new Date().toISOString()
  await db
    .prepare(
      `INSERT INTO messages (id, conversation_id, workspace_id, role, content, tool_calls, tool_results, tokens_used, created_at)
       VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?, ?)`
    )
    .bind(
      assistantMsgId,
      conversationId,
      workspaceId,
      finalText,
      allToolCalls.length > 0 ? JSON.stringify(allToolCalls) : null,
      allToolResults.length > 0 ? JSON.stringify(allToolResults) : null,
      totalTokens,
      msgNow
    )
    .run()

  return c.json({
    conversationId,
    message: {
      id: assistantMsgId,
      role: 'assistant',
      content: finalText,
      toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      toolResults: allToolResults.length > 0 ? allToolResults : undefined,
      tokensUsed: totalTokens,
      createdAt: msgNow,
    },
  })
})

// ─── GET /conversations ───────────────────────────────────────────────

chatRoutes.get('/conversations', async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')

  const { results } = await c.env.DB.prepare(
    `SELECT id, title, created_at, updated_at
     FROM conversations
     WHERE workspace_id = ? AND user_id = ?
     ORDER BY updated_at DESC
     LIMIT 50`
  )
    .bind(workspaceId, userId)
    .all<{
      id: string
      title: string | null
      created_at: string
      updated_at: string
    }>()

  return c.json({
    conversations: results.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  })
})

// ─── GET /conversations/:conversationId/messages ──────────────────────

chatRoutes.get('/conversations/:conversationId/messages', async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')

  // Verify ownership
  const conv = await c.env.DB.prepare(
    'SELECT id FROM conversations WHERE id = ? AND workspace_id = ? AND user_id = ?'
  )
    .bind(conversationId, workspaceId, userId)
    .first()

  if (!conv) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const { results } = await c.env.DB.prepare(
    `SELECT id, role, content, tool_calls, tool_results, tokens_used, created_at
     FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`
  )
    .bind(conversationId)
    .all<{
      id: string
      role: string
      content: string
      tool_calls: string | null
      tool_results: string | null
      tokens_used: number
      created_at: string
    }>()

  return c.json({
    messages: results.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      toolCalls: r.tool_calls ? JSON.parse(r.tool_calls) : undefined,
      toolResults: r.tool_results ? JSON.parse(r.tool_results) : undefined,
      tokensUsed: r.tokens_used,
      createdAt: r.created_at,
    })),
  })
})

// ─── DELETE /conversations/:conversationId ────────────────────────────

chatRoutes.delete('/conversations/:conversationId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')

  // Verify ownership
  const conv = await c.env.DB.prepare(
    'SELECT id FROM conversations WHERE id = ? AND workspace_id = ? AND user_id = ?'
  )
    .bind(conversationId, workspaceId, userId)
    .first()

  if (!conv) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  // Delete messages first (FK constraint), then conversation
  await c.env.DB.prepare('DELETE FROM messages WHERE conversation_id = ?')
    .bind(conversationId)
    .run()
  await c.env.DB.prepare('DELETE FROM conversations WHERE id = ?')
    .bind(conversationId)
    .run()

  return c.json({ success: true })
})

export { chatRoutes }
