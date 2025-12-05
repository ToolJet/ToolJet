---
id: wf
title: Workflow Node
---

<br/>

The **Workflow** node allows you to trigger another workflow from within your current workflow. This makes it possible to break complex processes into smaller, reusable workflows, improving modularity and maintainability.

With the **Workflow** node, you can:
- Trigger child workflows based on conditions or events
- Pass data from the current workflow to the triggered workflow
- Reuse common automation logic across multiple workflows
- Build hierarchical workflows for complex business processes

The **Workflow** node is ideal for enterprise automation where processes need to be standardized, reusable, and easy to manage. For example, you could trigger an invoice processing workflow from an order management workflow, or call a notification workflow after a task is completed.
You can also send parameters to the other workflow, allowing dynamic control over the triggered workflow’s execution.

A workflow can call itself recursively. It’s recommended to define an exit condition to avoid creating an infinite loop.

The timeout for each workflow can be configured using the `WORKFLOW_TIMEOUT_SECONDS` environment variable. For more information checkout [Customizing Workflow Configuration](/docs/setup/env-vars#customizing-workflow-configuration).

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/example.png" alt="IF Else Node Example" />

### Example - Notification System
Imagine an enterprise with thousands of workflows that need to notify a concerned person about an incident. Instead of repeating the same steps, a centralised notification workflow can be built.

Here's a quick overview of the centralised notification workflow -

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/centralNotifcationSystem.png" alt="Central Notification System" />

Following is the parameter structure for the notification system -

```js
{
    "incident": "Payment Failure",
    "raised_by": "Monitoring System",
    "recipients": ["cto@organistion.com"],
    "severity": "critical"
}
```

The workflow extracts recipient details from the database, determines the severity level, and triggers the appropriate notification channels.
At the end of the workflow, ```Response``` nodes return structured output.
These values can then be consumed by any parent workflow that triggers this one.

Now that the centralised notification workflow is defined, let’s look at how another workflow can invoke it using the Workflow node.

To integrate the notification system into another workflow, we create a new workflow. Its job is to remove an object from an AWS S3 bucket and then notify the organisation's AWS team.

Here's an overview.

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/sneakPeek.png" alt="Overview" />

We have configured an AWS S3 Datasource and added a node named ```removeObjectFromAWSS3``` to perform delete operation. We create an outgoing node from ```removeObjectFromAWSS3``` and create a ```Run Workflow``` node and name it ```notificationSystem```.

Here's the configuration for ```notificationSystem``` node.

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/notificationSystemNode.png" alt="Notification System node" />

After the child workflow completes, we evaluate its response to determine whether the notification was successful. For this, we use an ```If Condition``` node named ```checkNotificationSuccess```, which checks:
```notificationSystem.data.success == true```

After running the workflow, we'll receive an email like this.

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/successMail.png" alt="Success Mail" />
