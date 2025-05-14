---
id: overview
title: Overview
---

<div className='badge badge--primary heading-badge' style={{marginBottom:'10px'}}>Available on: Paid plans</div>

<br/>

## Introduction

ToolJet Workflows enable users to create complex, data-centric automations using a visual, node-based interface. It extends ToolJet's capabilities beyond building user interfaces, allowing developers and business users to automate processes, integrate data from various sources, and execute custom logic without writing extensive code.

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/workflows-preview.png" alt="Workflows Preview" />
</div>

Workflows complements the app-building features by providing a way to handle backend processes, data transformations, and integrations. This makes ToolJet a more comprehensive solution for creating internal tools and automations.

## Create Your First Workflow

This guide will walk you through creating your first workflow in ToolJet. You'll learn how to use the Workflow builder to create a simple automated process that fetches data from a database, filters it, and sends notifications based on certain conditions.

### Accessing the Workflow Builder

- Log in to your ToolJet account.
- From the main dashboard, click on the **Workflows** icon in the left sidebar.
- Click the **Create New Workflow** button to create a new workflow. Rename it to *sendEventNotification*.

### Step 1: Add a Database Query Node

You'll start by fetching employee data from a ToolJetDB table named *employees*.

- You'll see a **Start** node already on the canvas. This is the entry point of your workflow.
- Create an outgoing node from the **Start** node, and select the **ToolJetDB** node. Rename the node to *getEmployees*.
- Select Table name as *employees* and Operation as List view.

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-step-1.png" alt="Add a DB Query Node" />
</div>

### Step 2: Transform Data Using RunJS Node

Next, you'll filter the employee data to include only those from California.

- Create an outgoing node from the **Start** node, and select the **RunJS** node. Rename it to *filterEmployeeList*.
- Enter the code below to filter out employees who are from California.

```js
return getEmployees.data.filter(employee =>
  employee.location === "California")
 ```

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-step-2.png" alt="Transform Data Using RunJS" />
</div>

 ### Step 3: Send Notifications

Next, you'll implement a loop to send SMS notifications to the filtered employees. The Loop node allows you to iterate through an array and perform an operation on each element.

- Create an outgoing node from the **filterEmployeeList** node, and select the **Loop** node. Rename it to *sendSMS*.
- Under Looped function, select **Twilio** as the data source. Configure the Operation as Send SMS, enter `{{value.number}}` in the To Number field.
- Under the Body field, enter the following message:

```js
Hey {{value.name}},
Here's the link with all the details for today's ToolJet 
conference in California.
https://tooljet.com/events/{{value.location}}
```

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-step-3.png" alt="Send Notifications Through Twilio" />
</div>

### Step 4: Configure the Response Node

Finally, you'll set up conditions to handle the success or failure of the SMS sending process.

- Create a new outgoing **If condition** node from the *sendSMS* node.
- Enter the code below in the input field:
`sendSMS.status === "ok" ? true : false`
- Create an outgoing **Response** node from the green arrow to configure the response when the **If condition** node returns true. 
 Enter the following code to show the output as success when the SMS is successfully sent:
`return ({output: "success"})`
- Similarly, create an outgoing **Response** node from the red arrow to configure the response when the **If condition** node returns false. Enter the following code:
`return ({output: "failure"})`

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-step-4.png" alt="Configure The Response Node" />
</div>

### Step 5: Executing the Workflow

Click on the **Run** button on the top-right to execute the workflow. The logs panel will expand and provide an overview of all the nodes executed in this workflow.

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-execution.png" alt="Executing The Workflow" />
</div>

- The **Input** section of the log will display all the incoming data to a node. 

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-logs-input.png" alt="Input Logs" />
</div>

- The **Output** section will display the data that is transferred to the next node while Logs will display the sequence of execution, and success and error messages. 

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/v2/event-notification-logs-output.png" alt="Output Logs" />
</div>

Congratulations on creating your first workflow! This workflow fetches data, transforms the data, sends SMS notifications, and handles success or failure responses.

As you saw in this example, ToolJet Workflows provides a streamlined way to extend the capabilities of your ToolJet applications and automate complex processes. 

