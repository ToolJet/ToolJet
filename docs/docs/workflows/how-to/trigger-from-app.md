---
id: trigger-workflow-from-app
title: Trigger Workflows Within ToolJet
---

This guide will show you how to set up a workflow and trigger it from a ToolJet application. 
<div style={{paddingTop:'24px'}}>

## Create Workflow

To create a workflow follow the following steps:

1. Navigate to the Workflows Section from the navigation bar on the dashboard.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/workflow-section.png" alt="Navigate to Workflow Section" />

2. Click on **Create new workflow**, enter a unique name for your workflow, and click on **+Create workflow** to create the workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/new-wf.png" alt="Create a new workflow" />

3. Configure your workflow. You can refer to the **[workflow overview documentation](/docs/workflows/overview)** to learn how you can configure a workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />

</div>

<div style={{paddingTop:'24px'}}>

## Configure Workflow Query

1. Within your ToolJet application, create a new query and select **Run Workflow**.
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/run-wf.png" alt="Create a workflow query" />

2. Select your workflow from the dropdown and configure the parameters (if required).
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/wf-query.png" alt="Configure the Query" />

3. Now, you can trigger this workflow by clicking on the **Run** button or using events.
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-from-app/wf-eh.png" alt="Add event handler" />

</div>

