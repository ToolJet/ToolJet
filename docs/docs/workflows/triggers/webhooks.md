---
id: webhook
title: Trigger Using Webhook
---

<br/>

The Webhook trigger allows you to start a workflow execution when an external service sends an HTTP request to a unique webhook URL. This enables workflows to run automatically based on external events.

## Creating a Workflow with Webhook Trigger

1. Navigate to the Workflows Section from the navigation bar on the dashboard.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/workflow-section.png" alt="Navigate to Workflow Section" />
2. Click on **Create new workflow**, enter a unique name for your workflow, and click on **+Create workflow** to create the workflow. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/new-wf.png" alt="Create a new workflow" />
3. Configure your workflow. You can refer to the **[workflow overview documentation](/docs/workflows/overview/)** to learn how you can configure a workflow.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />
4. Navigate to the Triggers section and click on **Webhooks**. By default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/enable-modal.png" alt="Webhook option on the left panel" /> <br/>
    Once enabled, you can choose the **Environment** to modify the webhook endpoint URL for that specific environment. For example, if you choose the **Production** environment, you can **Copy URL** or **Copy as cURL** which can then be used to trigger for **Production** environment accordingly. Select **Released** to copy a URL without an environment, which runs the released version. When you select an environment, you can also pick a **Version** from the saved versions in that environment. See [Environment and Version](#environment-and-version). <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/env.png" alt="Webhook option on the left panel" />
5. Parameters can be passed to the workflow. Under **Parameter**, click **Add parameter**, enter the **Key** and select its type: `string`, `number`, `object`, `array`, `boolean` or `null`. The webhook checks incoming requests against these parameters. See [Parameter Validation](#parameter-validation). For example, if you want to pass the `name` and `emp_id` parameters to the workflow using the webhook triggers, you can set the parameters as follows:
    ```json
    "name": "string",
    "emp_id": "number"
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/params.png" alt="Webhook option on the left panel" /> <br/>
    The **Test JSON parameters** field can be used to test the webhook trigger. You can enter the parameter values in the **Test JSON parameters** field and click on the **Run** button to test the webhook trigger. The workflow will be executed with the parameter values specified in the **Test JSON parameters** field. These values also act as defaults: when a webhook request leaves out a declared parameter, the value from **Test JSON parameters** is used.
    ```json
    {
        "name": "John Doe",
        "emp_id": 33
    }
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/test-json.png" alt="Webhook option on the left panel" />
6. Find the API endpoint URL in the **Endpoint** field. You can use this URL to send a POST request to trigger the workflow. You can also click on the **Copy** button to copy the URL to the clipboard. You can either select **Copy URL** or **Copy as cURL** from the dropdown menu. The **Copy as cURL** option copies the URL as a cURL command which will include details such as the **API token** and **Environment**. An example of the Endpoint URL is as follows:
    ```
    http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:id/trigger
    ```
    In place of `:id`, you can also use the workflow's exact name. The name is case-sensitive and must be URL-encoded, for example `Shipment%20Delay%20Alerts`. Workflow names are only unique within a workspace, so use the workflow ID if your instance has more than one workspace.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/url.png" alt="Webhook option on the left panel" />
7. The API token is used to authenticate the request. You can find the API token in the **API Token** field. You can also click on the **Copy** button to copy the API token to the clipboard.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/api.png" alt="Webhook option on the left panel" />
    :::info
    Currently, authentication is mandatory for webhooks. Use a bearer token in the `Authorization` header for authentication. <br/>
    **Format:**
    `Authorization: Bearer <secret_token>`<br/>
    **Example:**`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
    :::
    Instead of the workflow's API token, you can use your instance's External API token in the same `Authorization: Bearer <token>` header. This works for every workflow on the instance. It requires `ENABLE_EXTERNAL_API=true`, a license that includes the External API, and the token set in `EXTERNAL_API_ACCESS_TOKEN`.

## Triggering a Webhook

Let's take a look at an example of triggering a webhook using **Postman**. 

1. Visit [Postman](https://www.postman.com/), and click **New Request**.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/postman.png" alt="Postman preview"/>
2. Select the **POST** Method and paste the **Endpoint URL** that was copied earlier.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/postman-url.png" alt="Paste URL in Postman"/>
3. Navigate to the **Authorization** tab, select **Bearer Token** as the **Auth Type**, and enter the **API token**.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/api-token.png" alt="Enter the API Token"/>
4. Go to the **Body** tab, select **Raw**, and enter the required parameters in JSON format.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/parameters-postman.png" alt="Enter the parameters in postman"/>
5. Click on **Send** to trigger the webhook. It will fetch the response from the created workflow.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/response.png" alt="Final Response"/>

## Environment and Version

Add query parameters to the endpoint URL to choose where and what to run:

```
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:id/trigger?environment=staging&version=v2
```

- **`environment`**: The environment name in lowercase, for example `development`, `staging` or `production`. If you leave it out, `production` is used. Without a multi-environment license, the workflow always runs in `development`, and any other value returns `403` with the message `Multi-environment is not enabled for this organization. Please contact the super admin.`
- **`version`**: The version **name**, for example `v2`. Version IDs aren't accepted. If you leave it out, the released version runs.

The version must have been promoted to the target environment or a later one. For example, a version in staging can run with `environment=staging` or `environment=development`, but not `environment=production`.

| Status | Message | Cause |
|--------|---------|-------|
| `404` | `Invalid environment` | No environment with that name. |
| `404` | `No released version found for this workflow` | No `version` was given and the workflow has never been released. |
| `404` | `Version "<version>" not found for workflow "<workflow>"` | No version with that name. |
| `400` | `Workflow version "<version>" is in the "<environment>" environment and cannot run in "<target>". Please promote this version to "<target>" or higher first.` | The version hasn't been promoted far enough. |

## Parameter Validation

When a request reaches the `/trigger` endpoint, ToolJet checks the request body against the parameters you declared:

- Each declared parameter must be in the request body or have a value in **Test JSON parameters**. Otherwise the request fails with `400` and the message `Params - <key> is missing`.
- Each value must match the declared type. Otherwise the request fails with `400` and the message `<key> has incorrect datatype`.
- Keys that aren't declared are dropped. The workflow only receives declared parameters. If you don't declare any parameters, the workflow receives none of the values in the request body.

| Type | Accepted values |
|------|-----------------|
| `string` | A JSON string. |
| `number` | A JSON number. A number sent as a string, such as `"33"`, fails. |
| `boolean` | `true` or `false`. |
| `array` | A JSON array. |
| `object` | A JSON object. Arrays and `null` are also accepted. |
| `null` | `null`. |

:::note
The `/trigger-async` endpoint doesn't validate parameters. The whole request body is passed to the workflow as is.
:::

## Async Workflow Query Execution

By default, when a workflow is triggered via the `/trigger` endpoint, the request waits until the entire execution is complete, which can lead to timeouts if the workflow takes too long.

To avoid this, you can use the `/trigger-async` endpoint. It starts the workflow in the background and immediately responds with an `execution_id` and `timestamp`. You can then track the execution separately.

You'll need to manually append `/trigger-async` to the endpoint URL. The final URL should look like this:
```
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger-async?environment=:environment
```

Once the execution starts, the webhook response should be in the following format:
```json
{
  "workflow_execution_id": "abc123...",
  "timestamp": "2025-05-15T10:30:45Z"
}
```

You can track the workflow execution in two ways: by streaming live updates or by polling the execution status at regular intervals.
- Stream live updates:
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/execution/:execution_id/stream
  ```
- Poll status:
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/status/:execution_id
  ```

To stop a run that's in progress, send a `DELETE` request to the terminate endpoint. The run stops before its next node starts. A successful request returns `{"success": true, "previousState": "<state>"}`. Only send it for runs that are still in progress: the endpoint doesn't always check whether a run has already finished.
```
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/execution/:execution_id/terminate
```

## Restrictions on Usage of Webhook Triggers

There are certain restrictions on the usage of webhook triggers that are configurable, both at the instance level and at the workspace level depending on the license. The restrictions are as follows:

- Number of executions per month
- Number of executions per day
- Execution time per workflow. See [`WORKFLOW_TIMEOUT_SECONDS`](/docs/setup/env-vars#customizing-workflow-configuration).

The daily and monthly limits count every execution in the workspace or instance, not only webhook runs. When a limit is reached, the webhook returns `451` with one of these messages:

- `Maximum daily limit for workflow execution has reached for this workspace`
- `Maximum monthly limit for workflow execution has reached for this workspace`
- `Maximum daily limit for workflow execution has been reached` (instance)
- `Maximum monthly limit for workflow execution has been reached` (instance)

To limit how many webhook requests ToolJet accepts in a time window, use the following environment variables. Requests over the limit return `429`.

| <div style={{ width:"200px"}}> Environment Variable </div> | <div style={{ width:"100px"}}> Value </div> | <div style={{ width:"100px"}}> Description </div> |
| -------------------- | ----- | ----------- |
| WEBHOOK_THROTTLE_TTL | 60000 | Time in milliseconds for the webhook requests to live |
| WEBHOOK_THROTTLE_LIMIT | 100 | Maximum number of requests within the TTL that will be throttled |

:::tip Whitelisting API endpoints
For Virtual Private Clouds (VPCs), restrict access only to the `{TOOLJET_HOST}/api/v2/webhooks/workflows/*` endpoint.
:::

## Error Responses

Before a workflow runs, the webhook checks the request in this order:

| Status | Message | Cause |
|--------|---------|-------|
| `429` | `ThrottlerException: Too Many Requests` | Too many requests. See `WEBHOOK_THROTTLE_LIMIT`. |
| `404` | `Workflow doesn't exists` | No workflow with that ID or name. |
| `401` | `Invalid authentication token` | The `Authorization` header is missing, doesn't use `Bearer`, or has the wrong token. |
| `403` | `Workflow is disabled or does not exist` | The workflow's [**Enable**](/docs/workflows/overview#enabling-or-disabling-a-workflow) toggle is off. |
| `403` | `Webhook endpoint disabled or doesn't exists` | The webhook trigger is turned off. |
| `451` | `Maximum ... limit for workflow execution ...` | An execution limit was reached. See [Restrictions](#restrictions-on-usage-of-webhook-triggers). |

After these checks, the `/trigger` endpoint can also return the [environment and version](#environment-and-version) errors and the [parameter validation](#parameter-validation) errors. If a node fails, the response uses the node's status code, or `422`, with a JSON body that includes the error message.