// Sends a two-service trace and a log through the collector, then checks each backend. Run after `tj obs up`.
import { randomBytes } from 'node:crypto';

const OTLP = process.env.OTLP_HTTP ?? 'http://localhost:4318';
const TEMPO = 'http://localhost:3200';
const LOKI = 'http://localhost:3100';
const PROM = 'http://localhost:9090';

const hex = (n) => randomBytes(n).toString('hex');
const nowNs = () => BigInt(Date.now()) * 1_000_000n;
const traceId = hex(16);
const rootId = hex(8);
const attr = (key, value) => ({ key, value: { stringValue: value } });
const resource = (name) => ({ attributes: [attr('service.name', name), attr('deployment.environment.name', 'development')] });

async function post(path, body) {
  const r = await fetch(`${OTLP}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text()}`);
}

function span(spanId, parentSpanId, name, kind, extra = []) {
  const start = nowNs();
  return {
    traceId, spanId, parentSpanId, name, kind,
    startTimeUnixNano: String(start), endTimeUnixNano: String(start + 50_000_000n),
    attributes: [attr('tooljet.origin', 'ai'), ...extra],
    status: { code: 2, message: 'smoke failure' },
  };
}

async function eventually(label, check, ms = 60_000) {
  const end = Date.now() + ms;
  for (;;) {
    try { if (await check()) return console.log(`ok   ${label}`); } catch {}
    if (Date.now() > end) throw new Error(`timeout: ${label}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

await post('/v1/traces', {
  resourceSpans: [
    { resource: resource('smoke-agent'), scopeSpans: [{ spans: [span(rootId, '', 'invoke_agent tooljet-app-builder', 3)] }] },
    { resource: resource('smoke-server'), scopeSpans: [{ spans: [span(hex(8), rootId, 'POST /api/apps', 2, [attr('http.route', '/api/apps')])] }] },
  ],
});
await post('/v1/logs', {
  resourceLogs: [{ resource: resource('smoke-server'), scopeLogs: [{ logRecords: [{
    timeUnixNano: String(nowNs()), severityText: 'ERROR', body: { stringValue: 'smoke log' }, traceId, spanId: rootId,
  }] }] }],
});

await eventually('tempo has both services in one trace', async () => {
  const t = await (await fetch(`${TEMPO}/api/traces/${traceId}`)).json();
  const services = new Set(t.batches.map((b) => b.resource.attributes.find((a) => a.key === 'service.name').value.stringValue));
  return services.has('smoke-agent') && services.has('smoke-server');
});
await eventually('loki has the log with trace_id metadata', async () => {
  const q = encodeURIComponent(`{service_name="smoke-server"} | trace_id="${traceId}"`);
  const r = await (await fetch(`${LOKI}/loki/api/v1/query_range?query=${q}&limit=5`)).json();
  return r.data.result.length > 0;
});
await eventually('span metrics carry tooljet_origin', async () => {
  const q = encodeURIComponent('traces_span_metrics_calls_total{service_name="smoke-server",tooljet_origin="ai"}');
  return (await (await fetch(`${PROM}/api/v1/query?query=${q}`)).json()).data.result.length > 0;
});
await eventually('service graph has smoke-agent -> smoke-server', async () => {
  const q = encodeURIComponent('traces_service_graph_request_total{client="smoke-agent",server="smoke-server"}');
  return (await (await fetch(`${PROM}/api/v1/query?query=${q}`)).json()).data.result.length > 0;
});
console.log('smoke passed');
