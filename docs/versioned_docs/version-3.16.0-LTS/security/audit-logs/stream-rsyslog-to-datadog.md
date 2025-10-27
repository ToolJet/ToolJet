---
id: stream-audit-to-datadog
title: Stream Audit Logs to Datadog
---

<br/>

This guide demonstrates how to configure ToolJet to stream audit logs from Rsyslog to Datadog for **centralized log management**, **monitoring**, and **analysis**. This integration enables real-time visibility into user activities, resource changes, and system events, helping you maintain security, compliance, and operational awareness across your infrastructure.

When to stream ToolJet audit logs to Datadog:
- **Multi-server deployments**: Centralize logs from production, staging, and development environments
- **Security monitoring**: Correlate user actions with infrastructure metrics to detect anomalies
- **Compliance requirements**: Maintain tamper-proof audit trails with long-term retention
- **Incident response**: Quickly search and analyze logs during security or operational incidents

## Prerequisites

Before setting up the Datadog integration, ensure you have:

1. **ToolJet with rsyslog enabled** - Follow the **[Setup Rsyslog guide](/docs/how-to/setup-rsyslog)** to enable log file generation
2. **Datadog account** - Sign up at [https://www.datadoghq.com/](https://www.datadoghq.com/)
3. **Datadog API key** - Obtain from [Datadog Organization Settings](https://app.datadoghq.com/organization-settings/api-keys)
4. **Docker Compose setup** - This guide uses Docker Compose for deployment

## Architecture Overview

1. **ToolJet** writes audit logs to `/home/appuser/rsyslog/` inside the container
2. **Docker volume** shares the rsyslog directory between ToolJet and Datadog Agent containers
3. **Datadog Agent** monitors the log files and streams them to Datadog's cloud platform
4. **Datadog** parses, indexes, and displays the logs in the Logs Explorer

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   ToolJet   │─────>│ Docker Volume│<─────│   Datadog   │
│  Container  │      │ (rsyslog/)   │      │    Agent    │
└─────────────┘      └──────────────┘      └──────┬──────┘
                                                  │
                                                  ▼
                                            ┌─────────────┐
                                            │  Datadog    │
                                            │   Cloud     │
                                            └─────────────┘
```

## Configuration Steps

### Step 1: Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Enable rsyslog (if not already enabled)
LOG_FILE_PATH='rsyslog'

# Datadog Configuration
DD_API_KEY=your_datadog_api_key_here
DD_SITE=datadoghq.com
```

:::info
Replace `your_datadog_api_key_here` with your actual Datadog API key from [https://app.datadoghq.com/organization-settings/api-keys](https://app.datadoghq.com/organization-settings/api-keys)
:::

:::tip Datadog Site
The `DD_SITE` value depends on your Datadog region:
- US1: `datadoghq.com` (default)
- US3: `us3.datadoghq.com`
- US5: `us5.datadoghq.com`
- EU: `datadoghq.eu`
- AP1: `ap1.datadoghq.com`
:::

### Step 2: Create Datadog Agent Configuration

Create a file named `datadog-agent-config.yml` in your ToolJet deployment directory:

```yaml
logs_enabled: true
logs_config:
  container_collect_all: false

# ToolJet audit log configuration
log_processing_rules:
  - type: multi_line
    name: json_logs
    pattern: ^\{
```

This configuration:
- Enables log collection in the Datadog Agent
- Disables automatic collection from all containers (we'll target specific logs)
- Sets up multiline processing for JSON-formatted logs

### Step 3: Create ToolJet Log Collection Configuration

Create a file named `datadog-tooljet-logs.yaml` in your ToolJet deployment directory:

```yaml
logs:
  - type: file
    path: /var/log/tooljet/rsyslog/tooljet_log/*/audit.log
    service: tooljet
    source: tooljet-audit
    sourcecategory: audit
    tags:
      - env:production
      - application:tooljet
      - log_type:audit
    # Parse JSON logs
    log_processing_rules:
      - type: exclude_at_match
        name: exclude_empty_logs
        pattern: "^\\s*$"
```

This configuration:
- **path**: Monitors all audit.log files using a wildcard pattern to match daily rotated logs
- **service**: Tags logs with `service:tooljet` for filtering in Datadog
- **source**: Identifies logs as `tooljet-audit` for parsing pipelines
- **tags**: Adds custom tags for organization and filtering
- **log_processing_rules**: Excludes empty log lines

**Customize Tags**

Modify the `tags` section to match your environment:
```yaml
tags:
  - env:staging  # or development, production
  - application:tooljet
  - team:platform
  - region:us-east-1
```

### Step 4: Update Docker Compose Configuration

Update your `docker-compose.yml` file to include the Datadog Agent and shared volume:

#### Add Shared Volume to ToolJet Service

```yaml
services:
  tooljet:
    # ... existing configuration ...
    volumes:
      - tooljet-logs:/home/appuser/rsyslog
```

#### Add Datadog Agent Service

```yaml
  datadog-agent:
    container_name: datadog-agent
    image: gcr.io/datadoghq/agent:7
    restart: always
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=false
      - DD_PROCESS_AGENT_ENABLED=true
      - DD_DOCKER_LABELS_AS_TAGS={"*":"%%label%%"}
      - DD_TAGS=env:production application:tooljet
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
      - tooljet-logs:/var/log/tooljet/rsyslog:ro
      - ./datadog-agent-config.yml:/etc/datadog-agent/datadog.yaml:ro
      - ./datadog-tooljet-logs.yaml:/etc/datadog-agent/conf.d/tooljet.d/conf.yaml:ro
```

#### Define the Shared Volume

```yaml
volumes:
  tooljet-logs:
  # ... other volumes ...
```


Complete docker-compose.yml Example

```bash
name: ToolJet

services:
  tooljet:
    container_name: Tooljet-app
    image: tooljet/tooljet:latest
    restart: always
    env_file: .env
    ports:
      - 80:80
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod
    volumes:
      - tooljet-logs:/home/appuser/rsyslog

  datadog-agent:
    container_name: datadog-agent
    image: gcr.io/datadoghq/agent:7
    restart: always
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=false
      - DD_PROCESS_AGENT_ENABLED=true
      - DD_DOCKER_LABELS_AS_TAGS={"*":"%%label%%"}
      - DD_TAGS=env:production application:tooljet
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
      - tooljet-logs:/var/log/tooljet/rsyslog:ro
      - ./datadog-agent-config.yml:/etc/datadog-agent/datadog.yaml:ro
      - ./datadog-tooljet-logs.yaml:/etc/datadog-agent/conf.d/tooljet.d/conf.yaml:ro

  postgres:
    container_name: postgres
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - 5432:5432

volumes:
  tooljet-logs:
```

### Step 5: Deploy the Configuration

1. **Stop existing containers**:
   ```bash
   docker-compose down
   ```
2. **Start the updated stack**:
   ```bash
   docker-compose up -d
   ```
3. **Verify containers are running**:
   ```bash
   docker ps
   ```
   You should see both `Tooljet-app` and `datadog-agent` containers running.

### Step 6: Verify the Integration

#### Check Datadog Agent Status

Run the following command to verify the agent is collecting logs:

```bash
docker exec datadog-agent agent status
```

Look for the **Logs Agent** section in the output:

```
Logs Agent
==========
  ...
  Integrations
  ============

  tooljet
  -------
    - Type: file
      Path: /var/log/tooljet/rsyslog/tooljet_log/*/audit.log
      Service: tooljet
      Source: tooljet-audit
      Status: OK
        1 files tailed out of 1 files matching
```

:::info
If the status shows "OK" and files are being tailed, the integration is working correctly.
:::

#### Check Datadog Agent Logs

View the Datadog Agent logs to troubleshoot any issues:

```bash
docker logs datadog-agent --tail 50
```

#### Generate Test Audit Logs

Perform actions in ToolJet to generate audit logs:
- Create or delete an application
- Modify data sources
- Update user permissions
- Change organization settings

### Step 7: View Logs in Datadog

1. Navigate to the **[Datadog Logs Explorer](https://app.datadoghq.com/logs)**

2. Use the following filters to find your ToolJet logs:
   - `service:tooljet`
   - `source:tooljet-audit`
   - `env:production`

## Log Structure and Fields

ToolJet audit logs contain the following structured fields:

| Field | Description | Example |
|-------|-------------|---------|
| `level` | Log severity level | `info`, `warn`, `error` |
| `message` | Human-readable log message | `PERFORM APP_CREATE OF MyApp` |
| `timestamp` | When the event occurred | `2025-10-21 11:27:44` |
| `auditLog.userId` | User who performed the action | `a59e1ec7-d015-47b9-8ef8-e5d3f4e5f8d4` |
| `auditLog.resourceId` | ID of the affected resource | `95031c39-9d19-425d-b70c-3436c2805773` |
| `auditLog.resourceType` | Type of resource | `APP`, `DATA_SOURCE`, `USER` |
| `auditLog.actionType` | Action performed | `APP_CREATE`, `APP_DELETE`, `APP_UPDATE` |
| `auditLog.resourceName` | Name of the resource | `MyApplication` |
| `auditLog.ipAddress` | Client IP address | `::ffff:192.168.65.1` |
| `auditLog.organizationId` | Organization ID | `e9de636b-e611-4b90-95f0-0fe20b540924` |
| `auditLog.metadata.userAgent` | Browser/client information | `Mozilla/5.0...` |
| `auditLog.metadata.tooljetVersion` | ToolJet version | `3.16.33-ee-lts` |
| `auditLog.metadata.transactionId` | Unique transaction identifier | `732440597788045` |
| `auditLog.metadata.route` | API endpoint called | `[POST] /api/apps` |

**Example Audit Log Entry**

```json
{
  "level": "info",
  "message": "PERFORM APP_CREATE OF MyApp APP FOR ORGANIZATION e9de636b-e611-4b90-95f0-0fe20b540924",
  "timestamp": "2025-10-21 11:27:44",
  "auditLog": {
    "userId": "a59e1ec7-d015-47b9-8ef8-e5d3f4e5f8d4",
    "resourceId": "95031c39-9d19-425d-b70c-3436c2805773",
    "resourceType": "APP",
    "actionType": "APP_CREATE",
    "resourceName": "MyApp",
    "ipAddress": "::ffff:192.168.65.1",
    "metadata": {
      "instance_level": false,
      "workspace_level": true,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
      "tooljetVersion": "3.16.33-ee-lts",
      "transactionId": "732440597788045",
      "totalDuration": 150,
      "route": "[POST] /api/apps"
    },
    "resourceData": {},
    "organizationId": "e9de636b-e611-4b90-95f0-0fe20b540924"
  },
  "label": "APP"
}
```

## Related Resources

- **[Setup Rsyslog](/docs/how-to/setup-rsyslog)** - Configure audit log generation
- **[Datadog Documentation](https://docs.datadoghq.com/)** - Official Datadog guides
- **[Datadog Agent Configuration](https://docs.datadoghq.com/agent/guide/agent-configuration-files/)** - Detailed Agent setup
- **[Log Collection](https://docs.datadoghq.com/logs/log_collection/)** - Datadog log collection guide
