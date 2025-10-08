---
id: app
title: Trigger from ToolJet Application
---

<br/>

Workflows can be triggered from within the ToolJet application. This work similar to the queries of a data source. You can add a trigger to an application from the query panel. 

In the application, simply click on the **+** button in the query panel and select **Run Workflow**. Then select the desired workflow from the dropdown. Rename the query if required and click on the **Run** button to trigger the workflow or add this query to an event handler to trigger the workflow on a specific event.
  
<img className="screenshot-full img-m" src="/img/workflows/triggers/app/new-query.png" alt="Triggers" />

### Passing Parameters

Parameters can be passed to the workflow from the **Params** field in the query. The parameter **key** and their **value** can be specified in the **Params** field. For example, if you want to pass the `name` and `age` parameters to the workflow using the application, you can set the **Params** field as follows:

```json
"name": "John Doe",
"age": 30
```

Assume a scenario where teams manage multiple ToolJet apps, each requiring queries to the same database for specific data. Instead of duplicating these steps across various apps, a workflow can be created once and seamlessly integrated wherever needed.
<img className="screenshot-full img-full" src="/img/workflows/triggers/app/params.png" alt="Triggers" />

## Setting Up Workflow Trigger from a ToolJet Application

### Create Workflow

To create a workflow follow the following steps:

1. Navigate to the Workflows Section from the navigation bar on the dashboard.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/workflow-section.png" alt="Navigate to Workflow Section" />
2. Click on **Create new workflow**, enter a unique name for your workflow, and click on **+Create workflow** to create the workflow. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/new-wf.png" alt="Create a new workflow" />
3. Configure your workflow. You can refer to the **[workflow overview documentation](/docs/workflows/overview)** to learn how you can configure a workflow.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configure workflow" />

### Configure Workflow Query

1. Within your ToolJet application, create a new query and select **Run Workflow**.
2. Select your workflow from the dropdown and configure the parameters (if required).
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-from-app/wf-query.png" alt="Configure the Query" />
3. Now, you can trigger this workflow by clicking on the **Run** button or using events.