---
id: workflow-triggers
title: Triggers
---

Triggers can be used to execute a workflow. Currently, ToolJet supports three types of triggers: webhooks, scheduled triggers, and manual triggers.

<img className="screenshot-full img-full" src="/img/workflows/triggers/triggers.png" alt="Triggers" />

## Webhooks

A webhook trigger allows you to run the workflow when a webhook is received. You can configure the webhook trigger from the Triggers tab. The webhook URL is unique for each workflow.

#### Creating a Webhook Trigger
- Click on the **Triggers** option in the left panel to open the Triggers tab.
  <img className="screenshot-full img-full img-full" src="/img/workflows/triggers/triggerbutton.png" alt="Triggers" />
- Click on the **Webhooks** option.
  <img className="screenshot-full img-full" src="/img/workflows/triggers/webhooks.png" alt="Triggers" />
- By default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger.
  <img className="screenshot-full img-full" src="/img/workflows/triggers/enable.png" alt="Triggers" />
- Once enabled, you can choose the **Environment** to modify the webhook endpoint URL to be copied for that specific environment. For example, if you choose the **Production** environment, you can `Copy URL` or `Copy as cURL` which can then be used to trigger for **Production** environment accordingly.
  <img className="screenshot-full img-full" src="/img/workflows/triggers/env.png" alt="Triggers" />
- Find the API endpoint URL in the **Endpoint** field. You can use this URL to send a POST request to trigger the workflow. You can also click on the **Copy** button to copy the URL to the clipboard. You can either select `Copy URL` or `Copy as cURL` from the dropdown menu. The `Copy as cURL` option copies the URL as a cURL command which will include details such as the `API token` and `Environment`. An example of the Endpoint URL is as follows:
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:id/trigger
  ```
    <img className="screenshot-full img-full" src="/img/workflows/triggers/copy.png" alt="Triggers" />
- The API token is used to authenticate the request. You can find the API token in the **API Token** field. You can also click on the **Copy** button to copy the API token to the clipboard.
    <img className="screenshot-full img-full" src="/img/workflows/triggers/token.png" alt="Triggers" />
  :::info
  Currently, authentication is mandatory for webhooks. Use a bearer token in the `Authorization` header for authentication. <br/>
  **Format:**
  `Authorization: Bearer <secret_token>`<br/>
  **Example:**
  `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  :::
- Parameters can be passed to the workflow using the **Parameters** field. The parameter `key` and their `type` can be specified in the **Parameters** field. For example, if you want to pass the `name` and `age` parameters to the workflow using the webhook triggers, you can set the **Parameters** field as follows:
  ```json
  "name": "string",
  "age": "number"
  ```
    <img className="screenshot-full img-full" src="/img/workflows/triggers/params.png" alt="Triggers" />
- The **Test JSON parameters** field can be used to test the webhook trigger. You can enter the parameter values in the **Test JSON parameters** field and click on the **Run** button to test the webhook trigger. The workflow will be executed with the parameter values specified in the **Test JSON parameters** field.
  ```json
  {
    "name": "John Doe",
    "age": 30
  }
  ```
  These parameters can be accessed in the workflow using the `startTrigger.params`.
    <img className="screenshot-full img-full" src="/img/workflows/triggers/test.png" alt="Triggers" />

### Async Workflow Query Execution

By default, triggering a workflow via the `/trigger` endpoint waits until the entire execution is complete, which can lead to timeouts if the workflow takes too long.

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

To track execution:
- Stream live updates:
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/execution/:execution_id/stream
  ```
- Poll status:
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/status/:execution_id
  ```


### Restrictions on Usage of Webhook Triggers

There are certain restrictions on the usage of webhook triggers that are configurable, both at the instance level and at the workspace level depending on the license. The restrictions are as follows:

- Number of executions per month
- Number of executions per day
- Number of parallel executions
- Execution time per workflow

For limiting parallel executions, the following environment variables can be used:

| <div style={{ width:"200px"}}> Environment Variable </div> | <div style={{ width:"100px"}}> Value </div> | <div style={{ width:"100px"}}> Description </div> |
| -------------------- | ----- | ----------- |
| WEBHOOK_THROTTLE_TTL | 60000 | Time in milliseconds for the webhook requests to live |
| WEBHOOK_THROTTLE_LIMIT | 100 | Maximum number of requests within the TTL that will be throttled |

:::tip Whitelisting API endpoints
For Virtual Private Clouds (VPCs), restrict access only to the `{TOOLJET_HOST}/api/v2/workflows/*` endpoint.
:::

## Manual

Manual triggers can be used to run a workflow manually from the ToolJet apps. Manual triggers work similar to the queries of a data source. You can add a trigger to an application from the query panel. 

In the application, simply click on the `+ Add` button in the query panel and select **Run Workflow**. Then select the desired workflow from the dropdown. Rename the query if required and click on the **Run** button to trigger the workflow or add this query to a event handler to trigger the workflow on a specific event.
  <img className="screenshot-full img-full" src="/img/workflows/triggers/workflowdrop.png" alt="Triggers" />

### Passing Parameters

Parameters can be passed to the workflow from the **Params** field in the query. The parameter `key` and their `value` can be specified in the **Params** field. For example, if you want to pass the `name` and `age` parameters to the workflow using the manual triggers, you can set the **Params** field as follows:

```json
"name": "John Doe",
"age": 30
```

Assume a scenario where teams manage multiple ToolJet apps, each requiring queries to the same database for specific data. Instead of duplicating these steps across various apps, a workflow can be created once and seamlessly integrated wherever needed.
  <img className="screenshot-full img-full" src="/img/workflows/triggers/paramui.png" alt="Triggers" />