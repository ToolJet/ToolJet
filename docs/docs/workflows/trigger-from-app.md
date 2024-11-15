---
id: trigger-workflow-from-app
title: Trigger Workflows from a ToolJet App
---

Triggering workflows in ToolJet enables you to automate sequences of actions directly from your app. This guide will show you how to set up a workflow and connect it to a trigger in your ToolJet app. This guide will use ToolJet Database as the data source, but you can select from a wide range of [data sources](/docs/data-sources/overview) offered by ToolJet.

<div style={{paddingTop:'24px'}}>

## Create Workflow

To create a workflow follow the following steps:

1. Navigate to Workflow Section from the left navigation bar on the dashboard.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/workflow-section.png" alt="Navigate to Workflow Section" />
2. Click on **Create new workflow**, enter a unique name for your workflow and click on **+Create workflow** to create the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/new-wf.png" alt="Create a new workflow" />
3. Configure your workflow, refer [workflow documentation](/docs/workflows/overview) for more info.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />

</div>

<div style={{paddingTop:'24px'}}>

## Create ToolJet App

1. Navigate to App Section from the left navigation bar on the dashboard.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/app-section.png" alt="Navigate App Section" />
2. Click on **Create an app**, enter a unique name for your app and click on **+Create app** to create the workflow.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/new-app.png" alt="Create a new app" />
3. Create your ToolJet App.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/app.png" alt="Configure your app" />

</div>

<div style={{paddingTop:'24px'}}>

## Configure Workflow Query

1. Inside your ToolJet application, on the bottom query panel click on **+** and select **Run Workflow**.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/run-wf.png" alt="Create a workflow query" />
2. Select your workflow from the dropdown and add required parameters.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/wf-query.png" alt="Configutr the Query" />
3. Now, you can trigger this query by adding a new event handler on a button.
    <img style={{marginTop:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/wf-eh.png" alt="Add event handler" />

</div>