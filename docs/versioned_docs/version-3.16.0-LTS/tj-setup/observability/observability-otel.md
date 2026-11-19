---
id: observability-otel
title: Observability Overview
sidebar_label: Overview
---

<PlanBadge type="enterprise" />

ToolJet supports OpenTelemetry (OTEL) for observability. You can monitor application performance, track query executions, analyze the health of ToolJet services and infrastructure through metrics and traces, and stream server logs and browser errors to a logs backend. OpenTelemetry provides a standardized, vendor-agnostic way to collect observability data, so ToolJet integrates with any OTEL-compatible monitoring tool such as [Datadog](/docs/tj-setup/observability/datadog), [New Relic](/docs/tj-setup/observability/new-relic), and [Grafana](/docs/tj-setup/observability/grafana).

:::info Edition availability
OpenTelemetry traces and metrics are available on the self-hosted Enterprise edition and on ToolJet Cloud. On the Community edition, ToolJet does not start the OpenTelemetry SDK, even when `ENABLE_OTEL=true`.
:::

Once your metrics are flowing, see [Recommended Production Alerts](/docs/tj-setup/observability/production-alerts) for the alert rules and thresholds we recommend for a production deployment.

**Categories of Metrics**

1. **App-Based Metrics** - Monitor the performance and reliability of individual ToolJet applications. Query metrics carry labels such as `tooljet.app.name`, `tooljet.app.version`, `tooljet.app.mode` (`edit` or `view`), `tooljet.query.name`, `tooljet.query.type`, `tooljet.data_source.type`, `tooljet.environment.name`, `tooljet.organization.name`, and `tooljet.query.text` (empty unless enabled) for fine-grained analysis.
      - **Query Executions** (`tooljet.query.executions`): Total query executions per application.
      - **Query Duration** (`tooljet.query.duration`): Query execution time in seconds, as a histogram.
      - **Query Failures:** Failed executions carry an `error.type` label (for example `timeout`, `connection_error`, `syntax_error`, `permission_error`, `not_found`). Successful executions have no `error.type` label, so you calculate failure and success rates from `tooljet.query.executions`.
      - **Active Users** (`tooljet.app.active_users`): Active users per app and role, based on app requests within the activity window.
      - **Workspace Seats** (`tooljet.organization.seats`): Registered users per workspace and role. <br/> <br/>
    <img className="screenshot-full img-full" src="/img/tooljet-setup/observability/setup/app-based-metrics.png" alt="App Based Metrics"/>

2. **Platform-Based Metrics** - Monitor the overall health and performance of your ToolJet instance:
      - **HTTP Server Metrics:** Request rates, response times, status codes
      - **API Performance:** Endpoint-specific latency and throughput
      - **Database Operations:** Query execution times and connection health
      - **Node.js Runtime:** Event loop delays, garbage collection, memory usage
      - **V8 Memory:** Heap usage and external memory tracking <br/> <br/>
    <img className="screenshot-full img-full" src="/img/tooljet-setup/observability/setup/platform-metrics.png" alt="Platform Metrics"/>

3. **Frontend Metrics** - Errors, web vitals, and app load times reported by your users' browsers. See [Frontend Metrics](#frontend-metrics).

ToolJet emits metric and label names in OpenTelemetry's dotted format. Backends that store metrics in Prometheus format replace the dots with underscores and can add unit and `_total` suffixes. For example, `tooljet.query.executions` typically appears as `tooljet_query_executions_total`.

:::warning Metric names changed
In v3.20.214-lts, ToolJet renamed every metric and label it emits to follow OpenTelemetry semantic conventions, for example `tooljet.query.executions` and `tooljet.app.name`. The separate `query.failures.total` counter was removed, because failures are now `tooljet.query.executions` series with an `error.type` label. Query duration is now reported in seconds instead of milliseconds. Series stored under the old names stop receiving data after you upgrade, so update any dashboards and alert rules that query the old metric or label names.
:::

## Configuration

Enable OpenTelemetry by setting the following environment variables in your ToolJet deployment:

#### Required Variables

```bash
# Enable OpenTelemetry traces and metrics
ENABLE_OTEL=true

# OTLP endpoint configuration
OTEL_EXPORTER_OTLP_TRACES=http://localhost:4318/v1/traces    # default: http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://localhost:4318/v1/metrics  # default: http://localhost:4318/v1/metrics
```

#### Optional Variables

```bash
# Service identification
SERVICE_NAME=tooljet                          # service.name on every trace, metric, and log record (default: tooljet)
SERVICE_VERSION=<release-tag>                 # service.version on every trace, metric, and log record (default: unknown)

# Authentication (if required by your OTEL collector)
OTEL_HEADER=Bearer <your-token>               # Sent as the full value of the Authorization header

# Log streaming and frontend metrics
OTEL_EXPORTER_OTLP_LOGS=http://localhost:4318/v1/logs   # See Log Streaming
ENABLE_OTEL_FRONTEND=true                     # See Frontend Metrics

# Advanced Configuration
OTEL_LOG_LEVEL=debug                          # Print OTEL SDK diagnostics to the console. Does not change the application log level
OTEL_ACTIVE_USER_WINDOW_MINUTES=5             # Activity window for concurrent user tracking (default: 5)
OTEL_MAX_TRACKED_USERS=10000                  # Maximum tracked users/sessions (default: 10000)

# WARNING: High Cardinality - Only enable for debugging
OTEL_INCLUDE_QUERY_TEXT=false                 # Include actual query text in metrics (default: false)
                                              # Creates HIGH CARDINALITY - use OTEL Collector to drop in production
```

`OTEL_HEADER` is sent as-is in the `Authorization` header to the traces and metrics endpoints. Set it to the complete header value your collector expects, for example `Bearer <token>` or `Basic <base64-credentials>`.

For the full list of ToolJet's observability variables with defaults, see [Environment Variables](/docs/setup/env-vars#observability).

## Log Streaming

ToolJet can stream its server logs to an OTLP logs endpoint, such as an OpenTelemetry Collector that forwards to Loki. Log streaming turns on only when both variables are set:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_LOGS=http://<collector-host>:4318/v1/logs
```

If either variable is unset, ToolJet writes logs only to stdout.

When log streaming is on:

- The same records go to stdout (`docker logs`) and to the logs endpoint. HTTP request logs, startup logs, and application logs are all included.
- `LOG_LEVEL` controls the verbosity of both destinations. There is no separate level for the logs endpoint. To send less to your logs backend, filter in the collector. See [Logging](/docs/setup/env-vars#logging) for `LOG_LEVEL` and its default.
- Each record carries an OpenTelemetry severity, with `severityText` set to the uppercase level name, such as `INFO`, `WARN`, or `ERROR`. The log message becomes the record body, and the other log fields become attributes. Records written during a traced request carry that request's trace context.
- Server logs use the logger name `tooljet-server`. Browser errors collected by [Frontend Metrics](#frontend-metrics) are sent to the same endpoint with the logger name `tooljet-frontend-errors`.
- Records carry the same `service.name`, `service.version`, and `deployment.environment.name` (from `NODE_ENV`) resource attributes as traces and metrics.
- ToolJet sends records in batches and drops records instead of retrying when the queue is full or the endpoint is unreachable. On shutdown, ToolJet waits up to 3 seconds to send the remaining records.

`OTEL_EXPORTER_OTLP_LOGS` is a ToolJet variable that takes the full logs URL. Setting only the standard `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` does not turn on log streaming.

:::note
ToolJet does not send `OTEL_HEADER` to the logs endpoint. <!-- TODO verify: whether an authenticated logs endpoint can use the standard OTEL_EXPORTER_OTLP_LOGS_HEADERS or OTEL_EXPORTER_OTLP_HEADERS variables, which the OTLP log exporter may read natively. --> If your logs backend requires authentication, send logs to a collector on your network and add the credentials in the collector's exporter.
:::

Add a `logs` pipeline to your collector configuration to receive the records and forward them to your logs backend:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  otlphttp/logs:
    endpoint: http://loki:3100/otlp    # Replace with your logs backend's OTLP endpoint

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/logs]
```

## Frontend Metrics

ToolJet can collect errors and performance data from your users' browsers and report them as OpenTelemetry metrics. Frontend metrics need both variables:

```bash
ENABLE_OTEL=true
ENABLE_OTEL_FRONTEND=true
```

`ENABLE_OTEL_FRONTEND` turns on reporting in every user's browser, so you can switch it off separately while backend telemetry keeps flowing. It requires `ENABLE_OTEL=true`, because the server only accepts frontend metrics when OpenTelemetry is on.

The browser collects:

- **JavaScript errors:** Uncaught errors and unhandled promise rejections. Errors from scripts loaded from other origins are ignored.
- **Component errors:** Errors caught by ToolJet's component error boundaries, labeled with the component type.
- **Web vitals:** LCP, FCP, CLS, INP, and TTFB.
- **App load time:** Time from when an app starts loading to when it has loaded.
- **App load failures:** App loads that don't finish before the user closes the tab or navigates away.

The browser groups repeated errors, keeps up to 50 distinct entries, and sends them to the ToolJet server (`POST /api/otel/frontend-metrics`) on a fixed interval and when the tab is hidden or closed. Only signed-in users report metrics. The server adds the workspace from the user's session, accepts only a fixed set of attributes, and then records the metrics.

| Metric | Type | Description |
|--------|------|-------------|
| `tooljet.frontend.errors` | Counter | Browser errors. The `error.type` label is `js_error` or `widget_error`. |
| `tooljet.frontend.web_vital.duration` | Histogram (seconds) | LCP, FCP, INP, and TTFB, labeled with `tooljet.web_vital.name`. |
| `tooljet.frontend.web_vital.score` | Histogram | CLS score. |
| `tooljet.frontend.app_load.duration` | Histogram (seconds) | Time to load an app. |
| `tooljet.frontend.app_load.failures` | Counter | App loads that didn't complete. |

Frontend metrics carry labels such as `tooljet.app.name`, `tooljet.app.context` (`edit`, `preview`, `released_app`, or `platform`), `tooljet.environment.name`, `tooljet.widget.type`, and `tooljet.organization.id`. Released apps also carry `tooljet.app.version`.

Error messages are not metric labels. When [Log Streaming](#log-streaming) is configured, ToolJet sends each distinct JavaScript and component error as a `WARN` log record with the logger name `tooljet-frontend-errors`. The record includes the error message (up to 200 characters), the source location reported by the browser, the workspace, and the user ID. ToolJet sends up to 100 of these records per workspace per minute.

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS` | How often each browser sends its collected data. Values are clamped between `5` and `600`. | `30` |
| `FRONTEND_METRICS_THROTTLE_LIMIT` | Maximum requests per user to the frontend metrics endpoint in each throttle window. Requests over the limit receive HTTP `429`. | `60` |
| `FRONTEND_METRICS_THROTTLE_TTL` | Length of the throttle window, in milliseconds. | `60000` |

## Setup Local OTEL Collector

Some observability platforms require an OpenTelemetry Collector as an intermediary. In such cases, you can deploy the Collector alongside ToolJet. ToolJet sends telemetry data to the Collector, which then forwards it to your observability platform based on its configuration.  
This Docker Compose configuration can be used to deploy an OpenTelemetry Collector alongside ToolJet.

```yaml
# docker-compose.yml excerpt
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
  ports:
    - "4318:4318"     # OTLP HTTP receiver
    - "8889:8889"     # Prometheus exporter
```

<!-- ### Grafana Cloud

Configure ToolJet to send metrics directly to Grafana Cloud:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/metrics
OTEL_HEADER=Authorization=Basic <base64-encoded-credentials>
OTEL_SERVICE_NAME=tooljet-production
```

### Datadog

Send metrics to Datadog using the OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://api.datadoghq.com/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://api.datadoghq.com/v1/metrics
OTEL_HEADER=dd-api-key=<your-datadog-api-key>
OTEL_SERVICE_NAME=tooljet
```

### New Relic

Configure for New Relic OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp.nr-data.net:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp.nr-data.net:4318/v1/metrics
OTEL_HEADER=api-key=<your-newrelic-license-key>
OTEL_SERVICE_NAME=tooljet
``` -->

<!-- ## Grafana Dashboards

ToolJet provides two pre-built Grafana dashboards for visualizing metrics:

### Per-App Metrics Dashboard

Download the dashboard:
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json
```

This dashboard focuses on application-specific metrics and includes:

- **App Overview:** Total query executions, success rate gauge, p95 latency, failure counts
- **Query Performance:** Execution rates by query, latency percentiles, data source breakdown
- **Top Queries:** Most executed queries, slowest queries (p95), most failed queries
- **Environment Filtering:** Filter by app name, environment (production/staging/development), and mode (view/edit)

The dashboard automatically extracts query text and environment names for immediate debugging without consulting logs.

### Platform Metrics Dashboard

Download the dashboard:
```bash
curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
```

This dashboard provides comprehensive platform monitoring:

- **System Health:** P95 response time, request rate, error rate, total requests
- **API Analytics:** Traffic distribution, top endpoints by hits, slowest endpoints
- **Performance Trends:** Multi-percentile response time analysis (P50, P95, P99)
- **Status Codes:** Success/error distribution over time
- **Database Performance:** Query execution times, connection health
- **Runtime Metrics:** Node.js event loop, GC performance, V8 memory usage
- **Distributed Tracing:** Integration with Jaeger for trace viewing

### Importing Dashboards

To import the Grafana dashboards:

1. Download the dashboard JSON files:
   ```bash
   # Download App-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-app-dashboard.json

   # Download Platform-Based Metrics Dashboard
   curl -O https://tooljet-deployments.s3.us-west-1.amazonaws.com/tooljet-platform-dashboard.json
   ```
2. Open Grafana and navigate to **Dashboards** → **Import**
3. Click **Upload JSON file** and select the downloaded dashboard JSON file
4. Select your Prometheus data source
5. Click **Import**

The dashboards will be immediately available with real-time data from your ToolJet instance. -->

## Production Considerations

### High Cardinality Warning

The app-based metrics can optionally include a `tooljet.query.text` label that contains the actual SQL or query content. **By default, this is disabled** to prevent high cardinality issues.

#### Enabling Query Text (For Debugging Only)

To enable query text in metrics for debugging purposes:

```bash
OTEL_INCLUDE_QUERY_TEXT=true
```

:::warning
Enabling `tooljet.query.text` creates **high cardinality time series** that can significantly impact Prometheus storage and query performance. Only enable this temporarily for debugging specific query issues.
:::

#### Production Best Practices

If you must enable `tooljet.query.text` in production:

1. **Use an OTEL Collector** to drop the label before metrics reach Prometheus:

```yaml
# otel-collector-config.yaml
processors:
  attributes:
    actions:
      - key: tooljet.query.text
        action: delete

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [attributes]
      exporters: [prometheus]
```

2. **Alternative: Hash the query text** to reduce cardinality:

```yaml
processors:
  transform:
    metric_statements:
      - context: datapoint
        statements:
          - set(attributes["tooljet.query.text"], SHA256(attributes["tooljet.query.text"]))
```

### Performance Impact

OpenTelemetry metrics collection has minimal performance impact:

- Metric collection is asynchronous and non-blocking
- Histogram buckets are pre-configured for optimal performance
- Metrics are exported in batches every 60 seconds, and the workspace seats gauge is refreshed every 5 minutes
- Browsers send frontend metrics in batches, every 30 seconds by default (`OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS`). An interval shorter than the 60-second export adds load without making metrics fresher

### Sampling and Filtering

For high-volume deployments, consider:

- **Filtering environments:** Only collect metrics from production environments
- **Sampling queries:** Use OTEL Collector sampling for high-frequency queries
- **Aggregation:** Pre-aggregate metrics at the collector level before storage

## Troubleshooting

### Metrics Not Appearing

1. Verify `ENABLE_OTEL=true` is set
2. Check OTEL collector endpoint is reachable:
   ```bash
   curl http://localhost:4318/v1/metrics
   curl http://localhost:4318/v1/traces
   ```
3. Review ToolJet server logs for OTEL connection errors
4. Verify OTEL collector configuration and Prometheus scrape targets
5. Confirm you are running the Enterprise edition or ToolJet Cloud. The Community edition doesn't start the OpenTelemetry SDK
6. For frontend metrics, verify that both `ENABLE_OTEL=true` and `ENABLE_OTEL_FRONTEND=true` are set, then reload the browser. If browsers receive HTTP `429` from `/api/otel/frontend-metrics`, raise `FRONTEND_METRICS_THROTTLE_LIMIT`

### Logs Not Appearing

1. Verify that both `ENABLE_OTEL=true` and `OTEL_EXPORTER_OTLP_LOGS` are set. Log streaming stays off if either is missing
2. Verify that `OTEL_EXPORTER_OTLP_LOGS` is the full logs URL, for example `http://<collector-host>:4318/v1/logs`
3. Check `LOG_LEVEL`. In production the default level is `warn`, so successful HTTP requests and other `info` records aren't logged. Set `LOG_LEVEL=info` to include them
4. Verify that your collector configuration has a `logs` pipeline

### High Memory Usage

If you experience high memory usage:

1. Remove high-cardinality labels like `tooljet.query.text` using OTEL Collector processors
2. Reduce histogram bucket counts if needed
3. Implement metric filtering at the collector level
4. Consider using remote write to offload storage

### Missing Labels or Metrics

Ensure you're using ToolJet version 3.16.0-LTS or higher, which includes the full OTEL implementation with both app-based and platform-based metrics.

If a dashboard stopped showing data after an upgrade, check whether it queries the old metric or label names. ToolJet now emits OpenTelemetry semantic convention names such as `tooljet.query.executions` and `tooljet.app.name`. See **Categories of Metrics** at the top of this page for the current names.

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Grafana OTLP Integration](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/otlp/)
- [Prometheus OTLP Receiver](https://prometheus.io/docs/prometheus/latest/feature_flags/#otlp-receiver)
