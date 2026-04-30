-- ============================================================
-- Backfill control_reinforcements + control_evaluated_aspects from
-- the JSON columns on versioned_controls. Idempotent via INSERT OR
-- REPLACE on deterministic composite IDs.
-- ============================================================

-- Reinforcements
INSERT OR REPLACE INTO control_reinforcements (
  id, control_id, reinforcement_code, description, required_at, mode, created_at
)
SELECT
  vc.id || ':' || json_extract(r.value, '$.id') AS id,
  vc.id AS control_id,
  json_extract(r.value, '$.id') AS reinforcement_code,
  json_extract(r.value, '$.description') AS description,
  COALESCE(json_extract(r.value, '$.required_at'), '[]') AS required_at,
  COALESCE(json_extract(r.value, '$.mode'), 'ADDITIVE') AS mode,
  datetime('now') AS created_at
FROM versioned_controls vc, json_each(vc.reinforcements_json) r
WHERE vc.reinforcements_json IS NOT NULL
  AND vc.reinforcements_json != '[]';

-- Evaluated aspects
INSERT OR REPLACE INTO control_evaluated_aspects (
  id, control_id, aspect_id, question, reinforcement_ref, sort_order, created_at
)
SELECT
  vc.id || ':' || json_extract(a.value, '$.id') AS id,
  vc.id AS control_id,
  json_extract(a.value, '$.id') AS aspect_id,
  json_extract(a.value, '$.question') AS question,
  json_extract(a.value, '$.reinforcement_ref') AS reinforcement_ref,
  a.key AS sort_order,
  datetime('now') AS created_at
FROM versioned_controls vc, json_each(vc.evaluated_aspects_json) a
WHERE vc.evaluated_aspects_json IS NOT NULL
  AND vc.evaluated_aspects_json != '[]';
