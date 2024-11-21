---
id: trigger-using-webhook
title: Trigger Workflows Using Webhooks
---

This guide will show you how to trigger a workflow using a webhook. We will be using Postman for this guide to test our webhook.

<div style={{paddingTop:'24px'}}>

## Create Workflow

To create a workflow follow the following steps:

1. Navigate to Workflow Section from the left navigation bar on the dashboard.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/workflow-section.png" alt="Navigate to Workflow Section" />
2. Click on **Create new workflow**, enter a unique name for your workflow and click on **+Create workflow** to create the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/new-wf.png" alt="Create a new workflow" />
3. Configure your workflow, refer [workflow documentation](/docs/workflows/overview) for more info.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/configure-wf.png" alt="Configure workflow" />

</div>

<div style={{paddingTop:'24px'}}>

## Setup Webhook

1. On your workflow, you can find a trigger section on the left panel, which contains the webhook option.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/trigger-section.png" alt="Webhook option on the left panel" />
2. Click on Webhooks option, by default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger. Refer [trigger documentation](/docs/workflows/workflow-triggers#webhooks) for more info.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/enable-webhook.png" alt="Enable Webhook" />
3. Copy the **Endpoint URL** and **API token**.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/copy-url.png" alt="Copy URL and API Token" />
4. Go to [Postman](https://www.postman.com/), and click on **New Request**.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/postman.png" alt="Go to Postman.com"/>
5. Select **POST** Method and paste the **Endpoint URL** we copied from the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/postman-url.png" alt="Paste URL in Postman"/>
6. Now go to Authorization tab and select **Bearer Token** as the Auth Type, and enter the API token copied from the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/api-token.png" alt="Enter the API Token"/>
7. Click on **Send** to test the webhook, it will fetch the response from the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/response.png" alt="Final Response"/>

</div>
