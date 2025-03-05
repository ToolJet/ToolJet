---
id: workflow-manual
title: Manual
---

Manual triggers can be used to run a workflow manually from the ToolJet apps. Manual triggers work similar to the queries of a data source. You can add a trigger to an application from the query panel. 

In the application, simply click on the ` + ` button in the query panel and select **Run Workflow**. Then select the desired workflow from the dropdown. Rename the query if required and click on the **Run** button to trigger the workflow or add this query to a event handler to trigger the workflow on a specific event.

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/triggers/workflowdrop-v2.png" alt="Manual" />
</div>

<div style={{paddingTop:'24px'}}>

## Passing Parameters

Parameters can be passed to the workflow from the **Params** field in the query. The parameter `key` and their `value` can be specified in the **Params** field. For example, if you want to pass the `name` and `age` parameters to the workflow using the manual triggers, you can set the **Params** field as follows:

```json
"name": "John Doe",
"age": 30
```

Assume a scenario where teams manage multiple ToolJet apps, each requiring queries to the same database for specific data. Instead of duplicating these steps across various apps, a workflow can be created once and seamlessly integrated wherever needed.

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/triggers/paramui-v2.png" alt="Manual" />
</div>

</div>