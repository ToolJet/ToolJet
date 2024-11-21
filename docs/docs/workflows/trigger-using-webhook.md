---
id: trigger-using-webhook
title: Trigger Workflows Using Webhooks
---

This guide will show you how to trigger a workflow using a webhook.

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

## Setup Application

In this guide we are going to use ToolJet App to trigger workflow using webhook.

1. Navigate to App Section from the left navigation bar on the dashboard.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/app-section.png" alt="Navigate App Section" />
2. Click on **Create an app**, enter a unique name for your app and click on **+ Create app** to create the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/new-app.png" alt="Create a new app" />
3. Create your ToolJet App including a button to trigger the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/app.png" alt="Configure your app" />

</div>

<div style={{paddingTop:'24px'}}>

## Setup Webhook

1. Navigate back to your workflow, there you can find a trigger section on the left panel, which contains the webhook option.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/trigger-section.png" alt="Webhook option on the left panel" />
2. Click on Webhooks option, by default, the webhook trigger is disabled. Toggle the switch to **enable** the webhook trigger. Refer [trigger documentation](/docs/workflows/workflow-triggers#webhooks) for more info.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/enable-webhook.png" alt="Enable Webhook" />
3. Copy the **Endpoint URL** and **API token**.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/copy-url.png" alt="Copy URL and API Token" />
4. Go back to your application and create a new **REST API** query.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/new-query.png" alt="Create a new REST API Query"/>
5. In the query, select **POST** Method and paste the **Endpoint URL** we copied from the workflow. In Headers section add the following key-value pair:
    - **Key:** `Authorization`
    - **Value:** `Bearer <secret_token>`
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/query-setup.png" alt="Setup REST API Query"/>
6. Now add a new event handler to the button to trigger the **REST API** query through it.
    - Event: **On click**
    - Action: **Run Query**
    - Query: **triggerWorkflow** (Choose your query from the dropdown)
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/event.png" alt="Create a new Event Handler"/>
7. Click on the button, this should trigger the REST API query and fetch the response from the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-using-webhook/response.png" alt="Final Response"/>

</div>
