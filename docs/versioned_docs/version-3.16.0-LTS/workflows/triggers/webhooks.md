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
3. Configure your workflow. You can refer to the **[workflow overview documentation](/docs/workflows/overview)** to learn how you can configure a workflow.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />
4. Navigate to the Triggers section and click on **Webhooks**. By default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/enable-modal.png" alt="Webhook option on the left panel" /> <br/>
    Once enabled, you can choose the **Environment** to modify the webhook endpoint URL for that specific environment. For example, if you choose the **Production** environment, you can **Copy URL** or **Copy as cURL** which can then be used to trigger for **Production** environment accordingly. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/env.png" alt="Webhook option on the left panel" />
5. Parameters can be passed to the workflow. The parameter `key` and their `type` can be specified in the **Parameters** field. For example, if you want to pass the `name` and `emp_id` parameters to the workflow using the webhook triggers, you can set the **Parameters** field as follows:
    ```json
    "name": "string",
    "emp_id": "number"
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/params.png" alt="Webhook option on the left panel" /> <br/>
    The **Test JSON parameters** field can be used to test the webhook trigger. You can enter the parameter values in the **Test JSON parameters** field and click on the **Run** button to test the webhook trigger. The workflow will be executed with the parameter values specified in the **Test JSON parameters** field.
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
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/url.png" alt="Webhook option on the left panel" />
7. The API token is used to authenticate the request. You can find the API token in the **API Token** field. You can also click on the **Copy** button to copy the API token to the clipboard.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/api.png" alt="Webhook option on the left panel" />
    :::info
    Currently, authentication is mandatory for webhooks. Use a bearer token in the `Authorization` header for authentication. <br/>
    **Format:**
    `Authorization: Bearer <secret_token>`<br/>
    **Example:**`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
    :::

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

## Restrictions on Usage of Webhook Triggers

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