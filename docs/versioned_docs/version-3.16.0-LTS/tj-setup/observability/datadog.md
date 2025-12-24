---
id: datadog
title: Datadog
---


ToolJet supports OpenTelemetry (OTel)–based observability. When using Datadog, ToolJet does not ship a Datadog Agent by default. You must run a Datadog Agent alongside ToolJet and configure ToolJet to export telemetry to it.

This guide walks through setting up observability using Datadog.

## Setting Up Obervability Using Datadog
### Overview
ToolJet doesn't automatically send telemetry to Datadog, instead we need a Datadog agent as a middleman to forward the data to datadog.
It is a 3 step process:
- ToolJet emits traces and metrics using OpenTelemetry
- The Datadog Agent receives OTLP data locally
- The agent forwards data securely to Datadog

<img src="https://datadog-docs.imgix.net/images/opentelemetry/setup/dd-agent-otlp-ingest.5c618e65990e9be5954c60e908ab5f09.png?auto=format" alt="Datadog observability setup" />

### Step 1: Running a Datadog Agent
:::info
For an in-depth guide on running the Datadog Agent, refer to the [official Datadog documentation](https://docs.datadoghq.com/containers/docker).
:::
ToolJet exports observability data using OpenTelemetry and requires a Datadog Agent to be running and accessible.
- If you are not using Docker Compose to run ToolJet, run the Datadog Agent using any supported method (Docker, systemd, Kubernetes) as described in the Datadog documentation.
- If you are running ToolJet using Docker Compose, you can add the Datadog Agent as a service in your **docker-compose.yml**.
```js
dd-agent:
  image: gcr.io/datadoghq/agent:7
  container_name: dd-agent
  restart: unless-stopped

  ports:
    - "4317:4317"   # OTLP gRPC
    - "4318:4318"   # OTLP HTTP
    - "8126:8126"   # Datadog APM (optional)

  environment:
    DD_SITE: us5.datadoghq.com
    DD_API_KEY: <your-datadog-api-key>

    # Enable OTLP receivers
    DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT: 0.0.0.0:4318
    DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_GRPC_ENDPOINT: 0.0.0.0:4317

    # Recommended
    DD_APM_ENABLED: "true"
    DD_LOG_LEVEL: info

  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /proc:/host/proc:ro
    - /sys/fs/cgroup:/host/sys/fs/cgroup:ro
```

### Step 2: Setting Up Environment Variables in ToolJet

Set up the following environment variables in the **.env** file while running ToolJet:
```js
# Enable OpenTelemetry in ToolJet
ENABLE_OTEL=true

# Service name as it appears in Datadog APM
OTEL_SERVICE_NAME=tooljet

# Datadog Agent OTLP endpoints
# Use the Datadog Agent hostname reachable from ToolJet
OTEL_EXPORTER_OTLP_TRACES=http://dd-agent:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS=http://dd-agent:4318/v1/metrics

# Optional: enable verbose OpenTelemetry logs for troubleshooting
OTEL_LOG_LEVEL=debug
```
**Datadog Agent Hostname**

| Deployment Setup                          | Agent Hostname to Use |
|-------------------------------------------|------------------------|
| ToolJet and Datadog Agent via Docker Compose | `dd-agent`             |
| Datadog Agent running on the same host      | `localhost`            |
| Datadog Agent running on a remote machine   | `<agent-hostname-or-ip>`|

:::note
Only the Datadog Agent hostname changes based on your deployment. All other environment variables remain the same.
:::

Your ToolJet instace will now start streaming Telemetry data to Datadog, which can be seen in APM.