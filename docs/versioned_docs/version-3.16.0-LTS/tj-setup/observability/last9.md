---
id: last9
title: Last9
---

Last9 is an observability platform that provides analysis of metrics, traces, and logs. ToolJet integrates with Last9 using OpenTelemetry by exporting telemetry data directly to Last9’s OTLP endpoints.

## Setting Up Observability Using Last9
### Setup
To use OpenTelemetry with Last9, the required OTLP endpoint must be enabled at the organization level by the Last9 team. Navigate to Integrations > OpenTelemetry, click *Connect*, and submit a request via *Request OpenTelemetry Endpoint Setup*.

### Step 1: Get the Credentials From Last9
Navigate to Integrations > OpenTelemetry, click *Connect* and Copy the the following values:
- **Endpoint URL**
- **Auth Header**

### Step 2: Set the Environment Variables in ToolJet
Set the following environment variables in your ToolJet instance to enable OpenTelemetry.

Replace `<YOUR-LAST9-ENDPOINT>` and `<YOUR-LAST9-AUTH-HEADER>` with the endpoint URL and authentication header obtained in Step 1.
```js
ENABLE_OTEL=true
OTEL_SERVICE_NAME=tooljet

# Last9 Agent endpoints (container-to-container)
OTEL_EXPORTER_OTLP_TRACES=https://<YOUR-LAST9-ENDPOINT>/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://<YOUR-LAST9-ENDPOINT>/v1/metrics
OTEL_EXPORTER_OTLP_HEADERS=<YOUR-LAST9-AUTH-HEADER>

# Optional but useful while debugging
OTEL_LOG_LEVEL=debug
```

Your ToolJet instance will now begin streaming traces and metrics to Last9.