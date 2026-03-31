import { generateId } from './id.js'

interface EmitEventParams {
  workspaceId: string
  eventType: string
  entityType: string
  entityId: string
  data?: Record<string, unknown>
  actorId?: string
  actorType?: string
}

/**
 * Inserts a compliance event into the compliance_events table.
 */
export async function emitEvent(
  db: D1Database,
  params: EmitEventParams
): Promise<void> {
  const id = generateId()
  const now = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO compliance_events (id, workspace_id, event_type, entity_type, entity_id, data, actor_id, actor_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      params.workspaceId,
      params.eventType,
      params.entityType,
      params.entityId,
      params.data ? JSON.stringify(params.data) : '{}',
      params.actorId ?? null,
      params.actorType ?? 'user',
      now
    )
    .run()
}
