---
id: observability-otel
title: Observability Overview
---

ToolJet supports OpenTelemetry (OTEL) for comprehensive observability, enabling you to monitor application performance, track query executions, and analyze system health through metrics.

**Categories of Metrics**

1. **App-Based Metrics** - Monitor the performance and reliability of individual ToolJet applications. These metrics include detailed labels such as `app_name`, `query_name`, `environment`, `query_text`, and `query_mode` (SQL/GUI) for fine-grained analysis.
      - **Query Executions:** Track total query executions per application
      - **Query Duration:** Measure query execution times with histogram buckets
      - **Query Failures:** Monitor failed queries with error categorization
      - **Success Rates:** Application-level success rate percentages
      - **App Usage:** Track application access and interaction events <br/> <br/>
2. **Platform-Based Metrics** - Monitor the overall health and performance of your ToolJet instance:
      - **HTTP Server Metrics:** Request rates, response times, status codes
      - **API Performance:** Endpoint-specific latency and throughput
      - **Database Operations:** Query execution times and connection health
      - **Node.js Runtime:** Event loop delays, garbage collection, memory usage
      - **V8 Memory:** Heap usage and external memory tracking

## Configuration

Enable OpenTelemetry by setting the following environment variables in your ToolJet deployment:

#### Required Variables

```js
# Enable OpenTelemetry metrics collection
ENABLE_OTEL=true
```

#### Optional Variables

```js
# OTLP Endpoint Configuration
OTEL_EXPORTER_OTLP_TRACES=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://localhost:4318/v1/metrics

# Service Identification
OTEL_SERVICE_NAME=tooljet

# Authentication (if required by your OTEL collector)
OTEL_EXPORTER_OTLP_HEADERS=api-key=your-api-key

# Advanced Configuration
OTEL_LOG_LEVEL=debug                          # Enable debug logging for OTEL
OTEL_ACTIVE_USER_WINDOW_MINUTES=5             # Activity window for concurrent user tracking (default: 5)
OTEL_MAX_TRACKED_USERS=10000                  # Maximum tracked users/sessions (default: 10000)

# WARNING: High Cardinality - Only enable for debugging
OTEL_INCLUDE_QUERY_TEXT=false                 # Include actual query text in metrics (default: false)
                                              # Creates HIGH CARDINALITY - use OTEL Collector to drop in production
```

For a complete list of OpenTelemetry environment variables, refer to the [OpenTelemetry documentation](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/).

## Setup Examples

### Local OTEL Collector

Deploy an OpenTelemetry Collector alongside ToolJet to receive and forward metrics:

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

### Grafana Cloud

Configure ToolJet to send metrics directly to Grafana Cloud:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/metrics
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded-credentials>
OTEL_SERVICE_NAME=tooljet-production
```

### Datadog

Send metrics to Datadog using the OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://api.datadoghq.com/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://api.datadoghq.com/v1/metrics
OTEL_EXPORTER_OTLP_HEADERS=dd-api-key=<your-datadog-api-key>
OTEL_SERVICE_NAME=tooljet
```

### New Relic

Configure for New Relic OTLP endpoint:

```bash
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_TRACES=https://otlp.nr-data.net:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=https://otlp.nr-data.net:4318/v1/metrics
OTEL_EXPORTER_OTLP_HEADERS=api-key=<your-newrelic-license-key>
OTEL_SERVICE_NAME=tooljet
```

## Grafana Dashboards

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

The dashboards will be immediately available with real-time data from your ToolJet instance.

## Production Considerations

### High Cardinality Warning

The app-based metrics can optionally include a `query_text` label that contains the actual SQL or query content. **By default, this is disabled** to prevent high cardinality issues.

#### Enabling Query Text (For Debugging Only)

To enable query text in metrics for debugging purposes:

```bash
OTEL_INCLUDE_QUERY_TEXT=true
```

:::warning
Enabling `query_text` creates **high cardinality time series** that can significantly impact Prometheus storage and query performance. Only enable this temporarily for debugging specific query issues.
:::

#### Production Best Practices

If you must enable `query_text` in production:

1. **Use an OTEL Collector** to drop the label before metrics reach Prometheus:

```yaml
# otel-collector-config.yaml
processors:
  attributes:
    actions:
      - key: query_text
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
          - set(attributes["query_text"], SHA256(attributes["query_text"]))
```

### Performance Impact

OpenTelemetry metrics collection has minimal performance impact:

- Metric collection is asynchronous and non-blocking
- Histogram buckets are pre-configured for optimal performance
- Observable gauges (like success rates) are updated on a 15-minute interval

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

### High Memory Usage

If you experience high memory usage:

1. Remove high-cardinality labels like `query_text` using OTEL Collector processors
2. Reduce histogram bucket counts if needed
3. Implement metric filtering at the collector level
4. Consider using remote write to offload storage

### Missing Labels or Metrics

Ensure you're using ToolJet version 3.16.0-LTS or higher, which includes the full OTEL implementation with both app-based and platform-based metrics.

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Grafana OTLP Integration](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/otlp/)
- [Prometheus OTLP Receiver](https://prometheus.io/docs/prometheus/latest/feature_flags/#otlp-receiver)
