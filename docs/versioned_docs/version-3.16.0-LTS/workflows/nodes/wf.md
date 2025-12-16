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

### Example 1 - Reusable Logging Workflow
This example shows how you can centralise common tasks like logging, into a reusable workflow that other workflows can call.  
Consider a centralised workflow that inserts event logs in a database. So any workflow that performs a critical task inserts a log.

For this example we'll have a child and a parent workflow.

**Child Workflow**  
Child workflow will be the centralised logging workflow that adds entries to a database.
Here's an overview of the child workflow (logger):
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/sneakPeakChild.png" alt="Child Workflow Sneak Peek" />
For this example, the data that the child workflow receives is in the following format:
```js
{
  "logged_by": "Authentication System",
  "message": "New user created"
}
```
The child workflow receives the data and performs an insert operation to the database and returns a response based on the success of the insert operation.

**Result (Child Workflow):**
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/childWFResult.png" alt="Child Workflow Result" />

**Parent Workflow**  
We will create a workflow, which needs to log the event data in the database. This workflow:
- Adds an employee to the company database.
- Sends a welcome email to the employee.
- Adds a failure/success log using the earlier created workflow using workflow node.

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/sneakPeekParent.png" alt="Parent Workflow Sneak Peek" />

For this example, the data that the parent workflow receives is in the following format:
```js
{
  "email": "employee@org.com",
  "name": "Employee",
  "phone_number": "+1111111111"
}
```
1. **Create a DB Node to insert the data to the DB named `addEmployee`.**  
2. **Branch the `addEmployee` node.**  
Click the branch icon to branch the `addEmployee` node. From the green port, create an SMTP Node to send a success mail to the employee named `mailTheEmployee`.  
From the red port, create a workflow node and name it `logFailure`.  
3. **From the `mailTheEmployee` node, create a workflow node and name it `logSuccess`.**  
4. **Configure the `logSuccess` and `logFailure` nodes.**

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/logFailure.png" alt="Log Failure" />
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/logger/logSuccess.png" alt="Log Success" />

**Result**  
Both success and failure paths create a log entry, ensuring that the parent workflow’s actions are traceable.

### Example 2 - Centralised Notification Workflow
Often, different workflows need to alert the right person when an incident occurs. To avoid repeating the same notification steps in every workflow, we can create one shared workflow for sending notifications.

For this example:
- The parent workflow deletes an S3 object and then calls the child workflow.
- The child workflow sends notifications.
- The parent workflow checks if the notification succeeded.

**Child workflow**  

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/centralNotifcationSystem.png" alt="Central Notification System" />

Following is the parameter structure for the child workflow:
```js
{
    "incident": "Payment Failure",
    "raised_by": "Monitoring System",
    "recipients": ["cto@organistion.com"],
    "severity": "critical"
}
```

The workflow does the following work
- Extract recipient details from the database. 
- Extrace the severity level from the parameters
- Triggers the appropriate notification channels.  

At the end of the workflow, ```Response``` nodes return structured output.
These values can then be consumed by any parent workflow that triggers this one.

**Parent Workflow**  
Now that the child workflow is defined, let’s look at how another parent workflow can invoke it using the Workflow node.

We are creating a new workflow that removes an object from an AWS S3 bucket and then notify the organisation's AWS team.  
Here's an overview of the parent workflow:

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/sneakPeek.png" alt="Overview" />

We add a node that deletes an object from S3 and name it `removeObjectFromAWSS3`. Then, from this node, we create an outgoing connection to a Run Workflow node named `notificationSystem`.

Here's the configuration for ```notificationSystem``` node. This follow the same format as given in child workflow:
<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/notificationSystemNode.png" alt="Notification System node" />

After the child workflow completes, we evaluate its response to determine whether the notification was successful. For this, we use an ```If Condition``` node named ```checkNotificationSuccess```, which checks:
```notificationSystem.data.success == true```

After running the workflow, we'll receive an email like this:

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/notification-system/successMail.png" alt="Success Mail" />
