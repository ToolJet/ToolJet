---
id: trigger-using-webhook
title: Trigger Workflows Using Webhooks
---

This guide demonstrates how to trigger workflows using webhooks.

<div style={{paddingTop:'24px'}}>

## Creating a Workflow

To create a workflow follow the following steps:

1. Navigate to the **Workflows** Section on the dashboard.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/workflow-section.png" alt="Navigate to Workflow Section" />

2. Click on **Create new workflow**, enter a unique name for your workflow and click on **+ Create workflow** to create the workflow.
    
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/new-wf.png" alt="Create a new workflow" />

3. Configure your workflow. You can refer to the **[workflow overview documentation](/docs/workflows/overview)** to learn how you can configure a workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/configure-wf.png" alt="Configure workflow" />

4. Navigate to the Triggers section.
    
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/trigger-section.png" alt="Webhook option on the left panel" />

5. Click on **Webhooks**. By default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger. Refer to the [trigger documentation](/docs/workflows/workflow-triggers#webhooks) for more information.
    
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/enable-webhook.png" alt="Enable Webhook" />

6. Add **Parameters** to the workflow by clicking the **+ Add parameter** button.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/parameters.png" alt="Add parameters to your webhook" />

7. Copy the **Endpoint URL** and **API token**.

<img className="screenshot-full" src="/img/workflows/trigger-using-webhook/copy-url.png" alt="Copy URL and API Token" />

</div>

<div style={{paddingTop:'24px'}}>

## Triggering a Webhook

Let's take a look at an example of triggering a webhook using Postman. 

1. Visit [Postman](https://www.postman.com/), and click **New Request**.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/postman.png" alt="Postman preview"/>

2. Select the **POST** Method and paste the **Endpoint URL** that was copied earlier.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/postman-url.png" alt="Paste URL in Postman"/>

3. Navigate to the **Authorization** tab, select **Bearer Token** as the **Auth Type**, and enter the **API token**.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/api-token.png" alt="Enter the API Token"/>

4. Go to the **Body** tab, select **Raw**, and enter the required parameters in JSON format.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/parameters-postman.png" alt="Enter the parameters in postman"/>

5. Click on **Send** to trigger the webhook. It will fetch the response from the created workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/response.png" alt="Final Response"/>

</div>

This was a basic example of how you can trigger workflows using webhooks. You can use webhooks to connect ToolJet to external applications and services for advanced use-cases and event-driven automation. 

If you want to learn how to trigger workflows withing ToolJet, refer to **[this guide](/docs/workflows/trigger-workflow-from-app)**.