-- cypress-live-reporter — Postgres schema
--
-- One append-only event table; all dashboard state is computed by views that
-- pick the latest event per entity (DISTINCT ON ... ORDER BY seq DESC).
-- Idempotent inserts rely on UNIQUE (run_id, seq).

CREATE TABLE IF NOT EXISTS clr_events (
  id      bigserial   PRIMARY KEY,
  run_id  uuid        NOT NULL,
  seq     int         NOT NULL,
  type    text        NOT NULL,
  ts      timestamptz NOT NULL DEFAULT now(),
  payload jsonb       NOT NULL,
  UNIQUE (run_id, seq)
);

CREATE INDEX IF NOT EXISTS clr_events_run_type_idx ON clr_events (run_id, type);
CREATE INDEX IF NOT EXISTS clr_events_ts_idx       ON clr_events (ts DESC);

------------------------------------------------------------------------------
-- clr_runs — one row per run.
-- status: run:end status if present; otherwise 'stale' when the newest event
-- for the run is older than 3 minutes (killed runner / crash detection);
-- otherwise 'running'.
------------------------------------------------------------------------------
CREATE OR REPLACE VIEW clr_runs AS
SELECT
  s.run_id,
  s.ts                                     AS started_at,
  e.ts                                     AS ended_at,
  CASE
    WHEN e.run_id IS NOT NULL              THEN e.payload->>'status'
    WHEN l.last_ts < now() - interval '3 minutes' THEN 'stale'
    ELSE 'running'
  END                                      AS status,
  s.payload->'ci'->>'branch'               AS branch,
  s.payload->'ci'->>'commit'               AS commit,
  s.payload->'ci'->>'buildUrl'             AS build_url,
  s.payload->'ci'->>'machine'              AS machine,
  s.payload->'browser'->>'name'            AS browser,
  s.payload->'browser'->>'version'         AS browser_version,
  s.payload->>'cypressVersion'             AS cypress_version,
  (s.payload->>'totalSpecs')::int          AS total_specs,
  (e.payload->'totals'->>'tests')::int     AS total_tests,
  (e.payload->'totals'->>'passed')::int    AS passed,
  (e.payload->'totals'->>'failed')::int    AS failed,
  (e.payload->'totals'->>'pending')::int   AS pending,
  (e.payload->'totals'->>'skipped')::int   AS skipped,
  (e.payload->>'totalDuration')::bigint    AS duration_ms,
  l.last_ts                                AS last_event_at,
  s.payload->'ci'->>'pr'                   AS pr,
  s.payload->'ci'->>'triggeredBy'          AS triggered_by
FROM (
  SELECT DISTINCT ON (run_id) *
  FROM clr_events
  WHERE type = 'run:start'
  ORDER BY run_id, seq DESC
) s
LEFT JOIN (
  SELECT DISTINCT ON (run_id) *
  FROM clr_events
  WHERE type = 'run:end'
  ORDER BY run_id, seq DESC
) e ON e.run_id = s.run_id
LEFT JOIN (
  SELECT run_id, max(ts) AS last_ts
  FROM clr_events
  GROUP BY run_id
) l ON l.run_id = s.run_id;

------------------------------------------------------------------------------
-- clr_tests_live — current state of every test, one row per (run, testId).
-- state: 'running' (test:start is newest), 'retrying' (attempt ended with
-- willRetry=true), else the attempt's own state (passed / failed / pending).
------------------------------------------------------------------------------
CREATE OR REPLACE VIEW clr_tests_live AS
SELECT
  t.run_id,
  t.payload->>'testId'                     AS test_id,
  t.payload->>'title'                      AS title,
  t.payload->>'spec'                       AS spec,
  CASE
    WHEN t.type = 'test:start'                       THEN 'running'
    WHEN (t.payload->>'willRetry')::boolean IS TRUE  THEN 'retrying'
    ELSE COALESCE(t.payload->>'state', 'unknown')
  END                                      AS state,
  (t.payload->>'attempt')::int             AS attempt,
  (t.payload->>'duration')::bigint         AS duration_ms,
  t.payload->>'error'                      AS error,
  t.ts                                     AS updated_at
FROM (
  SELECT DISTINCT ON (run_id, payload->>'testId') *
  FROM clr_events
  WHERE type IN ('test:start', 'test:attempt:end')
  ORDER BY run_id, payload->>'testId', seq DESC
) t;

------------------------------------------------------------------------------
-- clr_specs — progress per spec file, one row per (run, spec).
------------------------------------------------------------------------------
CREATE OR REPLACE VIEW clr_specs AS
SELECT
  s.run_id,
  s.payload->>'spec'                       AS spec,
  CASE
    WHEN s.type = 'spec:start'                                  THEN 'running'
    WHEN COALESCE((s.payload->'stats'->>'failures')::int, 0) > 0 THEN 'failed'
    ELSE 'passed'
  END                                      AS status,
  (s.payload->'stats'->>'duration')::bigint AS duration_ms,
  (s.payload->'stats'->>'passes')::int     AS passes,
  (s.payload->'stats'->>'failures')::int   AS failures,
  (s.payload->'stats'->>'pending')::int    AS pending,
  (s.payload->'stats'->>'skipped')::int    AS skipped,
  s.payload->>'video'                      AS video,
  s.ts                                     AS updated_at,
  -- roster announced up front by spec:tests (browser, once Mocha parses the file)
  (m.payload->>'totalTests')::int          AS planned_tests,
  m.payload->'tests'                       AS planned_test_ids
FROM (
  SELECT DISTINCT ON (run_id, payload->>'spec') *
  FROM clr_events
  WHERE type IN ('spec:start', 'spec:end')
  ORDER BY run_id, payload->>'spec', seq DESC
) s
LEFT JOIN (
  SELECT DISTINCT ON (run_id, payload->>'spec') run_id, payload
  FROM clr_events
  WHERE type = 'spec:tests'
  ORDER BY run_id, payload->>'spec', seq DESC
) m ON m.run_id = s.run_id AND m.payload->>'spec' = s.payload->>'spec';

------------------------------------------------------------------------------
-- clr_artifacts — every artifact event (screenshots, DOM snapshots,
-- backtrack snapshots). Exactly one of screenshot_base64 / dom_gzip_base64 /
-- artifact_url is populated depending on artifact type and storage mode.
------------------------------------------------------------------------------
CREATE OR REPLACE VIEW clr_artifacts AS
SELECT
  run_id,
  seq,
  type,
  ts,
  payload->>'testId'                       AS test_id,
  (payload->>'attempt')::int               AS attempt,
  payload->>'name'                         AS name,
  payload->>'base64'                       AS screenshot_base64,
  payload->>'htmlGzipBase64'               AS dom_gzip_base64,
  payload->>'url'                          AS artifact_url,
  payload->>'pageUrl'                      AS page_url,
  (payload->>'stepsBeforeFailure')::int    AS steps_before_failure,
  payload->>'command'                      AS command,
  (payload->>'width')::int                 AS width,
  (payload->>'height')::int                AS height,
  payload->'commands'                      AS commands,   -- jsonb array (artifact:commands)
  (payload->>'totalCommands')::int         AS total_commands,
  payload->'asserts'                       AS asserts,     -- jsonb array of assertions
  payload->'logs'                          AS console_logs, -- jsonb array (artifact:console)
  (payload->>'totalLogs')::int             AS total_logs,
  payload->>'stdout'                       AS stdout,      -- text (artifact:stdout, failing specs)
  payload->>'error'                        AS error,
  payload->>'spec'                         AS spec
FROM clr_events
WHERE type LIKE 'artifact:%';

------------------------------------------------------------------------------
-- Retention — run periodically (cron / pg_cron) to keep the table lean:
--
--   DELETE FROM clr_events WHERE ts < now() - interval '30 days';
------------------------------------------------------------------------------
