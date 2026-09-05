# cypress-live-reporter

[![test](https://github.com/emidhun/cypress-live-reporter/actions/workflows/test.yml/badge.svg)](https://github.com/emidhun/cypress-live-reporter/actions/workflows/test.yml)

> **This is the package reference** (install, config, event & dashboard details). For the project overview and the concept guides, start at the [root README](../../README.md) and [docs/](../../docs/): [Architecture](../../docs/ARCHITECTURE.md) · [Events](../../docs/EVENTS.md) · [CI](../../docs/CI.md) · [Dashboard](../../docs/DASHBOARD.md).

Self-hosted live reporting for Cypress. Streams run/spec/test lifecycle events and failure evidence (screenshots + a serialized DOM snapshot) to **Postgres** or a **webhook**, so you can build a real-time dashboard (e.g. in ToolJet) on a free stack — a replacement for Cypress Cloud's live status and failure artifacts.

- **Zero-config**: two `require` lines + one env var. Every feature defaults to **ON**.
- **Zero required dependencies**: `pg`, `dotenv`, `@aws-sdk/client-s3` are all lazy and optional. Node 18+.
- **Can never break your run**: every handler is wrapped; errors degrade to dropped events. No handler awaits network I/O (except one bounded flush at the very end of the run).

---

## Install (3 steps)

**1. `cypress.config.js`**

```js
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('./tools/cypress-live-reporter/plugin').livePlugin(on, config);
    },
  },
});
```

**2. `cypress/support/e2e.js`**

```js
require('../../tools/cypress-live-reporter/support');
```

**3. `.env`** (or real env vars — `.env` is loaded via optional `dotenv`)

```bash
# EITHER: postgres mode (auto-selected)
CLR_PG_URL=postgres://user:pass@host:5432/db
# → npm i -D pg   and apply schema.sql once:  psql "$CLR_PG_URL" -f tools/cypress-live-reporter/schema.sql

# OR: webhook mode (auto-selected)
CLR_WEBHOOK_URL=https://your-endpoint.example.com/hook
CLR_WEBHOOK_TOKEN=optional-bearer-token
```

If **neither** env var is set, the plugin prints one warning and self-disables — it never throws and never breaks the run.

**4. Postgres only — create the schema (required).** The plugin does not create tables. Sink errors are swallowed, so a missing table means every insert is silently dropped (empty dashboard, no error). Run this once before your first run:

```bash
psql "$CLR_PG_URL" -f tools/cypress-live-reporter/schema.sql
```

It creates the append-only `clr_events` table + indexes and the four dashboard views. The core table, if you prefer to run the DDL by hand:

```sql
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
```

The dashboard views live in [`schema.sql`](./schema.sql) — running that file is the simplest path. (Webhook mode needs no schema.)

---

## Configuration (`clr.config.json`, optional)

Everything is **ON by default**. Create `clr.config.json` in your project root only to turn things off or change storage — it is deep-merged over the defaults. See [`clr.config.example.json`](./clr.config.example.json) for every key documented.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Master switch. |
| `debug` | `false` | Log sends + swallowed errors (`CLR_DEBUG=1` env works too). |
| `events.runLifecycle` | `true` | `run:start` / `spec:start` / `spec:end` / `run:end` (Node side). |
| `events.liveTests` | `true` | `test:start` / `test:attempt:end` (browser side, live per it-block). |
| `screenshots.enabled` | `true` | Ship failure screenshots. |
| `screenshots.storage` | `"db"` | `"db"` = base64 in payload · `"s3"` = upload, payload carries `url`. |
| `commands.enabled` | `true` | On failure, ship the last N commands (name + args + state + ms) — a command log like Cypress Cloud. Cheap (no DOM). |
| `commands.depth` | `20` | How many commands to keep before failure (1–50). |
| `console.enabled` | `true` | On failure, ship the last N browser console lines (the app's `console.*`) as `artifact:console`. |
| `console.depth` | `8` | How many console lines to keep before failure (1–200). Default 8 = the sweet spot. |
| `stdout.enabled` | `true` | For failing specs, ship node/task terminal output (plugin-process stdout) as `artifact:stdout`. Not the Cypress reporter block (separate process). |
| `stdout.maxBytes` | `65536` | Cap on captured stdout per spec (keeps the tail). |
| `dom.enabled` | `true` | Serialize the DOM at the moment of failure. |
| `dom.storage` | `"db"` | Independent of `screenshots.storage`. |
| `dom.backtrackDepth` | `0` | 1–5: also keep DOM snapshots of the last N commands before failure. **Keep 0 in CI gates** (see Performance). |
| `s3.bucket` | `null` | Required for any `"s3"` mode. Missing → warn once, fall back to db. |
| `s3.region` | `"ap-south-1"` | |
| `s3.prefix` | `"clr/"` | Key layout: `{prefix}{runId}/{sanitized testId}/attempt-N/{name}`. |
| `s3.endpoint` | `null` | Set for R2/MinIO (enables `forcePathStyle`). Creds from standard AWS env. |
| `s3.publicBaseUrl` | `null` | Optional CDN base for artifact links. |
| `performance.maxParallelUploads` | `3` | Concurrency gate; overflow queues FIFO. |
| `performance.timeoutMs` | `4000` | Per-send timeout (webhook abort / pg statement timeout). |
| `performance.finalFlushMs` | `10000` | Hard cap on the single end-of-run drain. |

The Node plugin injects the browser-relevant slice into `Cypress.env('clr')` automatically — `support.js` needs no configuration of its own.

---

## The image / DOM flow: `db` vs `s3`

```
                         ┌──────────────────────────────────────────────┐
  browser (support.js)   │  Node (plugin.js)          async send path   │
  ─────────────────────  │  ───────────────────────   ────────────────  │
  fail → serialize DOM ──┼─▶ cy.task batch                              │
                         │   gzip html →              storage: "db"     │
  Cypress screenshot ────┼─▶ htmlGzipBase64   ──▶  ┌──────────────────┐ │
  (after:screenshot,     │   read file →            │ base64 stays in  │ │
   read + base64)        │   base64                 │ payload → lands  │ │
                         │        │                 │ in Postgres /    │ │
                         │        ▼                 │ webhook body     │ │
                         │   FIFO queue,            └──────────────────┘ │
                         │   ≤ maxParallelUploads   storage: "s3"        │
                         │   in flight          ──▶ ┌──────────────────┐ │
                         │                          │ upload blob to   │ │
                         │                          │ S3/R2/MinIO,     │ │
                         │                          │ payload gets     │ │
                         │                          │ `url`, base64    │ │
                         │                          │ deleted          │ │
                         │                          └──────────────────┘ │
                         └──────────────────────────────────────────────┘
```

- `"db"` (default): the dashboard renders screenshots as `data:image/png;base64,...` straight from the `clr_artifacts` view. Simplest; grows your DB.
- `"s3"`: the blob is offloaded on the async path; the event carries `url` instead. DOM snapshots are uploaded as `.html.gz` with `ContentEncoding: gzip`, so browsers auto-decompress when you open the link. Screenshots and DOM can use different modes.
- A DOM event's page address is always in `pageUrl`; `url` is exclusively the artifact link — they never collide.

---

## Event reference

Every event carries `runId` (uuid), a **monotonic per-run `seq`** (assigned on the Node side, so browser and Node events share one ordering), an ISO `ts`, and `type`.

| Event | Origin | Fired on | Payload highlights |
| --- | --- | --- | --- |
| `run:start` | Node | `before:run` | `specs[]`, `totalSpecs`, `browser{name,version}`, `cypressVersion`, `ci{branch,commit,pr,triggeredBy,buildUrl,provider,machine}` |
| `spec:start` | Node | `before:spec` | `spec` (relative path) |
| `spec:tests` | browser | root `before()` | `spec`, `totalTests`, `tests[]` (`{ testId, title }` for every it-block) — the roster announced up front, before any test runs, so a dashboard can show "0 / N done" immediately. Surfaced as `clr_specs.planned_tests` / `planned_test_ids`. |
| `spec:end` | Node | `after:spec` | `stats{duration,tests,passes,failures,pending,skipped}`, `tests[]{testId,state,duration,attempts,displayError}`, `video` |
| `run:end` | Node | `after:run` | `status` passed/failed, `totalDuration`, `totals{specs,tests,passed,failed,pending,skipped}` |
| `test:start` | browser | global `beforeEach` | `testId` (full title chain, `" > "`-joined), `title`, `attempt`, `state:"running"`, `spec`. Flushed immediately — this is the live per-it-block signal. |
| `test:attempt:end` | browser | global `afterEach` | `state`, `attempt`, `willRetry`, `duration`, `error`, `spec` |
| `artifact:screenshot` | Node | `after:screenshot` | `testId` (from the running test — reliable even when Cypress sends empty titles), `name`, `attempt`, `width`, `height`, `takenAt`, `base64` **or** `url` |
| `artifact:dom` | browser | `Cypress.on('fail')` | `testId`, `attempt`, `error`, `pageUrl`, `viewportWidth/Height`, `htmlGzipBase64` **or** `url`. The failure is always rethrown — never swallowed. |
| `artifact:dom-backtrack` | browser | on fail, if `backtrackDepth > 0` | One event per ring snapshot: `command`, `stepsBeforeFailure` (1 = last command before failure), plus the DOM fields above |
| `artifact:commands` | browser | `Cypress.on('fail')` | `testId`, `attempt`, `error`, `totalCommands`, and `commands[]` — the last N commands, each `{ i, name, args, state, ms, stepsBeforeFailure }`. The in-flight command at failure is the final entry with `state: "failed"`. |
| `artifact:console` | browser | `Cypress.on('fail')` | `testId`, `attempt`, `totalLogs`, and `logs[]` — the last N browser console lines, each `{ i, level, text }`. |
| `artifact:stdout` | Node | `after:spec` (failing specs) | `spec`, `failures`, `bytes`, `stdout` — node/plugin-process terminal output during the spec. |

CI metadata is read from GitHub Actions (`GITHUB_REF_NAME`, `GITHUB_SHA`, `GITHUB_ACTOR`, PR number from `GITHUB_REF` = `refs/pull/<n>/merge`, run URL) and GitLab CI (`CI_COMMIT_REF_NAME`, `CI_COMMIT_SHA`, `GITLAB_USER_LOGIN`, `CI_MERGE_REQUEST_IID`, `CI_JOB_URL`) env vars, plus the machine hostname. Surfaced on `clr_runs` as `pr` / `triggered_by`.

### Parallel CI machines

`runId` defaults to a fresh UUID per Cypress process. To make several parallel machines report into **one** dashboard run, set the same id on all of them:

```yaml
env:
  CLR_RUN_ID: ${{ github.run_id }}-${{ github.run_attempt }}   # any stable uuid-ish string per pipeline
```

Note: `CLR_RUN_ID` must be a valid UUID in postgres mode (the `run_id` column is `uuid`) — e.g. derive one with `uuidgen` or hash your build id into UUID form.

### Already have an `on('task')`? (`registerTask`)

Cypress allows only **one** `on('task')` listener. By default the plugin registers its own. If you already register tasks, opt out and spread the exposed map into yours:

```js
setupNodeEvents(on, config) {
  config = require('./tools/cypress-live-reporter/plugin')
    .livePlugin(on, config, { registerTask: false });

  on('task', {
    ...config.__clrTasks,        // the reporter's 'clr:events' task
    myOwnTask() { /* ... */ },
  });
  return config;
}
```

---

## Performance notes

- The live per-test feed costs **~2 `cy.task` round-trips per test ≈ 10–30 ms** — negligible for most suites; set `events.liveTests: false` if you're counting milliseconds.
- **The command log is cheap** (`commands.enabled`): capturing command name + args on `command:start`/`command:end` is microseconds — no DOM work — so it stays on in CI. It's the low-cost alternative to backtracking when you just want "what ran before it broke".
- **DOM backtracking is the expensive feature**: serializing the DOM on every command costs **10–50 ms per command** depending on page size. Keep `backtrackDepth: 0` in CI gates; turn it on (max 5) when actively debugging a flaky test.
- All delivery is fire-and-forget behind a concurrency gate (`maxParallelUploads`, FIFO overflow). The only wait in the whole plugin is the end-of-run drain, hard-capped at `finalFlushMs`.
- An unreachable sink cannot hang the run: webhook sends abort at `timeoutMs`; the pg pool uses `connectionTimeoutMillis: 3000` + statement timeouts.

## Honest limitations

- **Tests skipped by a hook failure** don't emit `test:start`/`test:attempt:end` (Cypress never runs them). They still appear up front in the `spec:tests` roster (so the dashboard can show them as never-started) and in the `spec:end` per-test array as skipped.
- **The DOM snapshot is static HTML.** Selectors are queryable and styles mostly render, but there's no JavaScript state, no shadow DOM contents, and no cross-origin iframe contents.
- **A killed runner** (OOM, cancelled job) never sends `run:end`. The `clr_runs` view marks such runs `stale` once no event has arrived for 3 minutes.
- Webhook mode has no ordering/dedup guarantees on your receiver — use `(runId, seq)` yourself; postgres mode is idempotent via `ON CONFLICT (run_id, seq) DO NOTHING`.
- Base64 screenshots in db mode grow the table quickly; use the commented 30-day cleanup in `schema.sql` or switch to s3 storage.

---

## ToolJet dashboard guide

Apply [`schema.sql`](./schema.sql), add your Postgres as a ToolJet datasource, and build one page with four queries — set each to **auto-refresh every 2–3 s**.

**Query 1 — runs list** (bind to a Table; `{{ }}` are ToolJet bindings):

```sql
SELECT run_id, status, branch, commit, machine, browser,
       passed, failed, total_specs, duration_ms, started_at
FROM clr_runs
ORDER BY started_at DESC
LIMIT 25;
```

**Query 2 — live tests for the selected run** (Table with row highlighting on `state`):

```sql
SELECT test_id, state, attempt, duration_ms, error, updated_at
FROM clr_tests_live
WHERE run_id = {{ components.runsTable.selectedRow.run_id }}::uuid
ORDER BY updated_at DESC;
```

**Query 3 — spec progress for the selected run**:

```sql
SELECT spec, status, passes, failures, duration_ms, video
FROM clr_specs
WHERE run_id = {{ components.runsTable.selectedRow.run_id }}::uuid
ORDER BY spec;
```

**Query 4 — artifacts for the selected test**:

```sql
SELECT type, attempt, screenshot_base64, dom_gzip_base64, artifact_url,
       page_url, steps_before_failure, command, ts
FROM clr_artifacts
WHERE run_id = {{ components.runsTable.selectedRow.run_id }}::uuid
  AND test_id = {{ components.testsTable.selectedRow.test_id }}
ORDER BY seq;
```

**Screenshot viewer** — an Image widget with its URL bound to either storage mode:

```
{{ queries.artifacts.data[0].artifact_url ?? 'data:image/png;base64,' + queries.artifacts.data[0].screenshot_base64 }}
```

**DOM viewer + selector tester** — a Custom Component that gunzips the snapshot with `pako`, renders it in a sandboxed iframe, and lets you test selectors against the failure DOM. Pass `data` as:

```
{{ { domGzipBase64: queries.artifacts.data.find(a => a.type === 'artifact:dom')?.dom_gzip_base64 } }}
```

```jsx
import React, { useMemo, useRef, useState } from 'https://esm.sh/react@18';
import pako from 'https://esm.sh/pako@2';

export default function DomViewer({ data }) {
  const frame = useRef(null);
  const [selector, setSelector] = useState('');
  const [matches, setMatches] = useState(null);

  const html = useMemo(() => {
    try {
      if (!data?.domGzipBase64) return null;
      const bytes = Uint8Array.from(atob(data.domGzipBase64), (c) => c.charCodeAt(0));
      return pako.ungzip(bytes, { to: 'string' });
    } catch { return null; }
  }, [data?.domGzipBase64]);

  const test = () => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('[data-clr-hit]').forEach((el) => {
        el.style.outline = ''; el.removeAttribute('data-clr-hit');
      });
      const hits = doc.querySelectorAll(selector);
      hits.forEach((el) => {
        el.style.outline = '2px solid #e5484d'; el.setAttribute('data-clr-hit', '1');
      });
      setMatches(hits.length);
    } catch { setMatches(-1); }
  };

  if (!html) return <div>No DOM snapshot for this test.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: 6 }}
          placeholder="Test a selector, e.g. [data-cy=submit]"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && test()}
        />
        <button onClick={test}>Query</button>
        <span>{matches === null ? '' : matches === -1 ? 'invalid selector' : `${matches} match(es)`}</span>
      </div>
      <iframe
        ref={frame}
        sandbox="allow-same-origin"
        srcDoc={html}
        style={{ flex: 1, width: '100%', border: '1px solid #ddd', background: '#fff' }}
        title="failure DOM"
      />
    </div>
  );
}
```

`sandbox="allow-same-origin"` (without `allow-scripts`) keeps the snapshot inert — no JS runs — while still letting the component query and highlight nodes inside it. If your DOM artifacts use s3 storage, fetch `artifact_url` instead (the `.html.gz` is served with `Content-Encoding: gzip`, so `fetch(...).then(r => r.text())` gives you plain HTML).

---

## Verifying the install

```bash
node tools/cypress-live-reporter/test/smoke.js
```

Runs the full lifecycle against a local capture server (asserts payload shape, seq ordering, DOM gzip round-trip), then against an unreachable webhook (asserts the run can't crash or hang), then the no-sink self-disable path.

## License

[MIT](../../LICENSE)
