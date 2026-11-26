---
id: execution-limitations
title: Execution Limitations
---

Workflows have limits on how long a run can take, how many runs execute at the same time, how often webhooks can be called and how much time and memory code nodes can use. Most of these limits can be set through environment variables on the ToolJet server.

## Execution Timeout

A workflow run fails if it takes longer than the execution timeout. The default timeout is **60 seconds**.

To change the timeout, set the following environment variable:

| Environment Variable | Default | Description |
|:---------------------|:--------|:------------|
| `WORKFLOW_TIMEOUT_SECONDS` | `60` | Maximum duration of a workflow run, in seconds. |

## Concurrency

Each worker instance runs up to **5** workflows at the same time. Additional runs wait until a running workflow finishes.

To run more workflows in parallel, add worker instances or set the following environment variable. Higher values use more CPU, memory and database connections on each worker.

| Environment Variable | Default | Description |
|:---------------------|:--------|:------------|
| `TOOLJET_WORKFLOW_CONCURRENCY` | `5` | Number of workflow runs each worker instance processes at the same time. |

To understand how to set up worker instances, see [Workflow Scheduling](/docs/setup/env-vars#workflow-scheduling).

## Webhook Rate Limit

Webhook triggers accept up to **100** requests in every **60-second** window. Requests over the limit are rejected with HTTP status `429`.

To change the rate limit, set the following environment variables:

| Environment Variable | Default | Description |
|:---------------------|:--------|:------------|
| `WEBHOOK_THROTTLE_LIMIT` | `100` | Maximum number of webhook requests allowed in each window. |
| `WEBHOOK_THROTTLE_TTL` | `60000` | Length of the window, in milliseconds. |

## Request Payload Size

Requests that trigger a workflow, such as webhook calls, can have a body of up to **50 MB**. Larger requests are rejected with HTTP status `413`.

To accept larger payloads, set the following environment variable. It applies to every request the ToolJet instance receives, not only workflow triggers, so increase it only when workflows need to receive payloads larger than 50 MB.

| Environment Variable | Default | Description |
|:---------------------|:--------|:------------|
| `MAX_JSON_SIZE` | `50mb` | Maximum size of a request body, for example `100mb`. |

## License Quotas

The ToolJet license sets the maximum number of workflow runs per day and per month, for each workspace and for the whole instance. Runs of child workflows started by a [Workflow node](/docs/workflows/nodes/wf) also count. When a quota is reached, new runs are rejected until the next day or month.

The license also sets the maximum number of workflows that can be created in each workspace and in the instance.

These quotas come from the license and can't be changed through environment variables.

## Code Node Limits

[JavaScript](/docs/workflows/nodes/logic/js) and [Python](/docs/workflows/nodes/logic/py) nodes run with the following time and memory limits:

| Limit | JavaScript | Python |
|:------|:-----------|:-------|
| Execution time | 100 milliseconds | 10 seconds |
| Memory | 20 MB | 512 MB |

The JavaScript limits also apply to [Loop](/docs/workflows/nodes/logic/loop) nodes. The Python limits are fixed. To change the JavaScript limits, set the following environment variables:

| Environment Variable | Default | Description |
|:---------------------|:--------|:------------|
| `WORKFLOW_JS_TIMEOUT_MS` | `100` | Maximum execution time of JavaScript code, in milliseconds. |
| `WORKFLOW_JS_MEMORY_LIMIT_MB` | `20` | Maximum memory available to JavaScript code, in MB. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
