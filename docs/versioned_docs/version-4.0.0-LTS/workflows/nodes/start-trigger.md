---
id: start-trigger
title: Start Trigger Node
---

<br/>

The **Start Trigger Node** is the entry point of the workflow. It determines how and when a workflow is initiated and allows you to pass initial data into the workflow.

- **Defines the Start of a Workflow**: Every workflow must begin with a single **Start Trigger Node**. It ensures a clear entry point, making workflows easier to manage and debug.
- **Passes Initial Data**: The **Start Trigger Node** allows you to pass data into the workflow, which can then be used by subsequent nodes. For example, form input values, webhook payloads, or scheduled default values can flow into the workflow to drive logic and actions.
- **Organize Workflow Execution**: By acting as the starting node, it defines the flow of data and control, connecting the trigger event to subsequent logic and action nodes in a structured, visual manner.

## Test JSON Parameters

**Test JSON Parameters** let you define test parameters in JSON format to test webhook payloads. When you click **Run**, the workflow executes using these test parameters in place of the webhook payload. 

<img className="screenshot-full img-full" src="/img/workflows/nodes/start/testJson.png" alt="Test JSON Param" />

### Accessing Parameter Values

You can access the parameters sent through the webhook payload or defined in the **Test JSON Parameters** using the following syntax:

```js
startTrigger.params.<parameter-name>
```

If both, webhook payload and **Test JSON Parameters**, are present then the webhook payload takes precedence. If no value is provided through the webhook, the **Test JSON Parameters** serve as the default values.