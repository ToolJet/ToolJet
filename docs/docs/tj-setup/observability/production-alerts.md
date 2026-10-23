---
id: production-alerts
title: Recommended Production Alerts
---

This page lists the alerts we recommend enabling for a self-hosted ToolJet deployment running in production, grouped by layer from the infrastructure up to external availability checks.

ToolJet does not evaluate alert rules or send notifications itself. It exposes the signals, and you define the rules in the monitoring platform you already run, such as Datadog, New Relic, Grafana, Amazon CloudWatch, or Prometheus and Alertmanager.

:::info
The thresholds below are starting points. Run them for a week, compare against your own baseline, and tune them so that an alert always means something is actually wrong.
:::

## Infrastructure Alerts

These cover the hosts, containers, or pods that run the ToolJet server.

| Alert | Recommended Threshold | What It Catches |
|:---|:---|:---|
| CPU utilization | Above 80% for 5 minutes | Sustained load that adds latency to every query |
| Memory usage | Above 85% | Memory pressure, which on a Node.js process usually ends in an out of memory kill rather than a graceful slowdown |
| Disk usage | Above 80% | A full disk on the application or database host, which stops PostgreSQL from accepting writes |
| Instance or pod health check failures | Any target removed from rotation | Silently reduced capacity, a bad deployment, or an unreachable PostgreSQL or Redis |

:::warning
ToolJet runs database migrations at container boot, which can take several minutes on large deployments. Set a health check grace period of at least 900 seconds so that an upgrade does not trigger health check alerts or get the container killed mid-migration.
:::

## Application Alerts

These cover the ToolJet server itself.

| Alert | Recommended Threshold | What It Catches |
|:---|:---|:---|
| HTTP 5xx error rate | Above 1% of requests over 5 minutes | Backend crashes, lost database or Redis connectivity, and plugin execution failures |
| API response latency (p95) | Above 2 seconds over 5 minutes | Application stress or a slow downstream datasource |
| Application process down or restarting | More than 3 restarts in 10 minutes | Crash loops from out of memory kills, an unreachable PostgreSQL at startup, or invalid environment variables |

:::info
ToolJet executes queries against your connected datasources on the server, so API response time includes the time your datasource takes to reply. A latency breach is often a slow datasource rather than a problem with ToolJet itself.
:::

Monitor all incoming requests to the ToolJet server rather than a specific route. Both HTTP alerts can be captured at the load balancer or reverse proxy layer, or from ToolJet's [OpenTelemetry metrics](/docs/tj-setup/observability/observability-otel) where you have them enabled.

## Database And Cache Alerts

### PostgreSQL

ToolJet stores application definitions, encrypted datasource credentials, and user data in PostgreSQL.

| Alert | Recommended Threshold | What It Catches |
|:---|:---|:---|
| Connection pool exhaustion | Active connections above 80% of `max_connections` | Requests failing because no connection is available |
| Replication lag | Above 30 seconds | Stale reads from replicas and a growing gap in your failover recovery point |
| Long-running queries | Above 30 seconds | A slow or blocking query holding locks and consuming a connection |
| Database disk usage | Above 75% | A full database disk, which stops all writes and takes ToolJet down |
| Failed connections or authentication errors | More than 10 in 5 minutes | Rotated credentials, an exhausted connection limit, or a broken network path |

Each ToolJet server instance opens a connection pool of up to 25 connections to the ToolJet metadata database, and a second pool of up to 25 more if you use ToolJet Database. Size `max_connections` to cover every instance before setting the threshold above.

### Redis

Redis is used for caching and session management, and is required for multiplayer editing and background jobs.

| Alert | Recommended Threshold | What It Catches |
|:---|:---|:---|
| Redis connection failures | Sustained for more than 1 minute | Background jobs, multiplayer editing, and session handling degrading |
| Memory usage | Above 80% of `maxmemory` | Eviction of session and cache data, which surfaces to users as unexpected logouts |

## Availability And Uptime

Run these from outside your infrastructure so they catch failures internal monitoring cannot see.

| Alert | Recommended Threshold | What It Catches |
|:---|:---|:---|
| `/api/health` returning a non-200 response | Two consecutive failures | The ToolJet server is not serving HTTP, or traffic is not reaching it |
| SSL certificate expiry | Less than 14 days remaining | A certificate that will lock every user out the moment it lapses |
| DNS resolution failures | Any failed resolution | A DNS or registrar problem on your ToolJet domain or custom domains, which makes ToolJet unreachable even though it is running |

:::warning
`/api/health` is a liveness check. It confirms that the ToolJet server is answering HTTP requests, but it does not verify PostgreSQL or Redis connectivity. A healthy response does not mean ToolJet is fully functional, so always pair it with the database and Redis alerts above.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
