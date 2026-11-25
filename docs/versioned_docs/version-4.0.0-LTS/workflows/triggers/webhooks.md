---
id: webhook
title: Trigger Using Webhook
---

A webhook lets an external system, such as a CRM, a payment provider or an internal script, run a workflow by sending an HTTP `POST` request to the workflow's endpoint URL. The request carries the workflow's API token for authentication and a JSON body with the data the workflow needs.

## Step 1: Enable the Webhook

The webhook is disabled for every new workflow, so requests to its URL are rejected until it's turned on.

1. Open the workflow and click **Webhooks** in the left sidebar.
2. Turn on the toggle next to the **Webhooks** title.

The rest of the **Webhooks** panel becomes editable once the toggle is on.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/webhook/webhook-panel.png" alt="Webhooks panel with the webhook turned on" />

:::info
The webhook toggle can be changed only on a draft version in the development environment. On a released or published version, or in another environment, it's locked.
:::

## Step 2: Choose What the URL Runs

The **Environment** and **Version** fields decide which version of the workflow the endpoint URL runs. The URL in **Endpoint** updates as these fields change.

- **Released**: Select **Released** in **Environment** to run the released version of the workflow. The URL has no environment or version in it, so it keeps working when a newer version is released. Use this for integrations in production.
- **A specific environment and version**: Select an environment, such as **Development** or **Staging**, and then a **Version** from that environment. The URL includes both, so it always runs that exact version. Use this to test a version before releasing it.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/webhook/webhook-environment.png" alt="Environment options in the Webhooks panel, including Released" />

The two URL formats look like this:

```
# Released version
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger

# Specific environment and version
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger?environment=staging&version=v2
```

## Step 3: Copy the Endpoint URL and API Token

- **Endpoint**: Click the copy icon to copy the URL.
- **API token**: Click the eye icon to show the token, or the copy icon to copy it.

Every request must send the token as a bearer token in the `Authorization` header:

```
Authorization: Bearer <api_token>
```

The token gives anyone who has it the ability to run the workflow, so store it as a secret in the calling system.

## Step 4: Define the Request Body

The request body is a JSON object. Its keys are the workflow inputs, which are declared in the **Workflow inputs** panel in the left sidebar. Each input has a name, a type, an optional default value and a **Required** setting.

For example, a workflow that adds an employee could declare two inputs:

| Name | Type | Required | Default value |
| ---- | ---- | -------- | ------------- |
| `name` | string | Yes | |
| `emp_id` | number | No | `0` |

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/webhook/workflow-inputs.png" alt="Workflow inputs panel with the name and emp_id inputs" />

Once inputs are declared, the **Request body** field in the **Webhooks** panel shows a JSON body generated from them. Inputs with a default value use it, and the others get an empty value of their type:

```json
{
  "name": "",
  "emp_id": 0
}
```

Edit the values to build a sample request, then click the copy icon to copy the JSON. Click the reset icon to go back to the generated body.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/webhook/webhook-request-body.png" alt="Request body and cURL request blocks in the Webhooks panel" />

Inside the workflow, read the values with `startTrigger.params.name` and `startTrigger.params.emp_id`. If a request leaves out an input, the input's default value is used.

ToolJet checks the body against the inputs when the workflow starts. A request returns a `400` error if a required input is missing or a value has the wrong type, for example `Parameter "name" is required`.

## Step 5: Send a Request

The **cURL request** block at the bottom of the panel builds a complete command from the selected URL, the API token and the request body. Click **Copy cURL** and run the command in a terminal to test the webhook:

```bash
curl --request POST \
  --url "http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger" \
  --header "Authorization: Bearer <api_token>" \
  --header "Content-Type: application/json" \
  --data '{ "name": "John Doe", "emp_id": 33 }'
```

The request stays open while the workflow runs. When the workflow finishes, the response body is the data returned by the workflow's [Response node](/docs/workflows/nodes/response). For example, if the Response node returns `{ "message": "Employee added" }`, the response is:

```json
{
  "message": "Employee added"
}
```

If the workflow has no Response node, the response is an empty object, `{}`.

The same request can be sent from any system that can make HTTP requests. Use the URL, headers and body from the command above.

For workflows that take longer to finish, use the [async endpoint](#async-workflow-execution) instead.

## Async Workflow Execution

A request to `/trigger` stays open until the workflow finishes, so a long-running workflow can time out. The `/trigger-async` endpoint starts the workflow in the background and responds immediately with an execution ID. Use that ID to track the execution until it finishes.

### Start the Execution

Copy the URL from the **Endpoint** field and replace `/trigger` with `/trigger-async`. The API token and request body are the same as for `/trigger`.

```bash
curl -X POST 'http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger-async?environment=production' \
  -H 'Authorization: Bearer <api_token>' \
  -H 'Content-Type: application/json' \
  -d '{ "name": "John Doe", "emp_id": 33 }'
```

The response contains the execution ID:

```json
{
  "workflow_execution_id": "3f0e5c8a-6d2b-4c1e-9a7f-1b2c3d4e5f60",
  "timestamp": "2026-11-26T10:30:45.123Z"
}
```

The endpoint accepts the same query parameters as `/trigger`:

| Parameter | Description |
| --------- | ----------- |
| `environment` | Environment to run the workflow in. |
| `version` | Name of the version to run. Defaults to the released version. |

:::info
Unlike `/trigger`, the async endpoint doesn't return a `400` error for missing or mistyped parameters. An invalid workflow input fails the execution instead, and the error appears when tracking it.
:::

### Track the Execution

Use the `workflow_execution_id` from the response to either stream live updates or poll the status. Both endpoints need the same `Authorization` header.

#### Stream Live Updates

Open a [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) connection to receive a message each time the execution status changes:

```bash
curl -N 'http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/execution/:execution_id/stream' \
  -H 'Authorization: Bearer <api_token>'
```

The stream closes when the execution ends. The last status message has one of these types:

| <div style={{ width:"260px"}}> Type </div> | Description |
| ---- | ----------- |
| `workflow_execution_completed` | The workflow finished. `result.data` holds the data returned by the [Response node](/docs/workflows/nodes/response). |
| `workflow_execution_error` | The workflow failed. `error` holds the failure details. |
| `workflow_execution_terminated` | The execution was terminated. |

Example of a completed message:

```json
{
  "type": "workflow_execution_completed",
  "executionId": "3f0e5c8a-6d2b-4c1e-9a7f-1b2c3d4e5f60",
  "timestamp": "2026-11-26T10:30:47.950Z",
  "result": {
    "metadata": { "response": { "statusCode": 200 } },
    "data": { "message": "Employee added" }
  }
}
```

#### Poll the Status

Request the status at regular intervals:

```bash
curl 'http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/status/:execution_id' \
  -H 'Authorization: Bearer <api_token>'
```

`status` is `false` while the workflow is running and `true` once it has finished, whether it succeeded or failed. `nodes` holds the result of each node, and `logs` holds the execution logs.

```json
{
  "status": true,
  "logs": [ ... ],
  "nodes": [
    { "id": "b7d1e2f3-...", "id_on_definition": "a1b2c3d4-...", "executed": true, "result": { ... } }
  ]
}
```

## Usage Limits

Daily and monthly execution limits can apply to a workspace or to the whole instance. When a limit is reached, webhook requests return a `451` error.

Webhook requests are also rate limited. Requests over the limit return a `429` error. Configure the limit with these environment variables:

| <div style={{ width:"200px"}}> Environment Variable </div> | <div style={{ width:"100px"}}> Default </div> | Description |
| -------------------- | ----- | ----------- |
| `WEBHOOK_THROTTLE_TTL` | `60000` | Length of the rate limit window, in milliseconds. |
| `WEBHOOK_THROTTLE_LIMIT` | `100` | Maximum number of webhook requests allowed in each window. |

:::tip Whitelisting Webhook Endpoints
In a Virtual Private Cloud (VPC), allow access to the `{TOOLJET_HOST}/api/v2/webhooks/workflows/*` endpoints only.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
