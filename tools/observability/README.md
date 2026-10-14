# Local observability stack

OTel Collector, Tempo (traces), Loki (logs), Prometheus (metrics) and Grafana, for local development.

## Start

    tools/tj/bin/tj obs up --wire     # starts the stack, writes OTEL_* keys into .env
    tools/tj/bin/tj start             # server now exports traces, metrics and logs

`--wire` needs an existing `.env` (`tj setup --app` creates it). Without `--wire`, `tj obs up` only starts the stack.

Grafana: http://localhost:3900 (anonymous admin, local only). Dashboards, folder ToolJet: ToolJet Monitoring, ToolJet Agent.
OTLP: `localhost:4317` (gRPC), `localhost:4318` (HTTP). All ports bind to 127.0.0.1.

Other commands: `tj obs status`, `tj obs down` (`--purge` deletes stored data).

OTel export needs `ENABLE_OTEL=true` and an EE or Cloud edition. CE ignores it.

## AI stack

`OBSERVABILITY=1 ai-stack up` (tooljet-agent repo, `ai-stack/`) starts this stack and points the server, agent, tooljet-mcp and the gateway at it.

## Follow one AI generation

1. Build an app with ToolJet AI.
2. Grafana: ToolJet Agent, row "AI generation (traces)".
3. Open a trace from "Failed generations", or Explore, Tempo: `{ name = "invoke_agent tooljet-app-builder" }`.
4. The waterfall shows server, agent, LLM gateway, tooljet-mcp and server calls in one trace.
5. On any span, "Logs for this span" opens its Loki logs. In Loki, the `trace_id` field links back to the trace.

## Debug a failed generation

- Find the turn: `{ span.gen_ai.conversation.id = "<conversation id>" }`.
- The agent's root span carries `tooljet.ai.stop_reason`, `tooljet.ai.failure_category` and `error.type`.
- Server requests made for the AI carry `tooljet.origin = "ai"`: `{ span.tooljet.origin = "ai" && span.http.response.status_code >= 400 }`.
- ToolJet Monitoring has an `origin` variable to split server panels by origin.

## What the server records

- Span names come from route templates (`GET /api/apps/:id`), never literal paths.
- Request bodies are never recorded. Secret-like params and query values are redacted on incoming and outgoing spans.
- Outbound `fetch` is traced (undici instrumentation).
- Baggage is extracted, never forwarded. Only `tooljet.origin` and `gen_ai.conversation.id` are copied to span attributes, capped at 128 characters.

## Pipeline

    services --OTLP--> collector --> spanmetrics + servicegraph --> Prometheus
                                 \-> tail sampling --> Tempo
                                 \-> logs --> Loki

Span metrics are computed before sampling, so rates and latencies count every request. Tail sampling keeps errors, AI traffic, the agent and requests over 5s. Locally it keeps everything.

## Check it works

    node tools/observability/smoke.mjs
