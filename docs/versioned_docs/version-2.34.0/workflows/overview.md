---
id: overview
title: Overview
---
<div className='badge badge--primary heading-badge' style={{marginBottom:'10px'}}>Available on: Paid plans</div>
<br/>

ToolJet Workflows is a visual, node-based platform tailored for data-centric automation tasks. With its intuitive design, users can create detailed queries across diverse data sources, manage conditional flows, and execute custom JavaScript code while making the processes presentable and easy to manage. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/hero.png" alt="Workflows Preview" />
</div>

Whether you're delving into data integration, generating detailed reports, or ensuring rigorous validation, ToolJet Workflows is your go-to solution. 

:::danger
You're currently exploring the beta version of ToolJet Workflows. Please be aware that this version is experimental, and is not recommended for production use at the moment.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Quickstart Guide

This introductory guide will help you understand the basics of ToolJet Workflows. We'll create a workflow that fetches the sales data from the database, transforms the data using JavaScript and sends an SMS notification to the Sales Manager using Twilio. The workflow will also conditionally return a success/failure message that can be used in a ToolJet Application to show a pop-up alert. 

:::info
All data sources that are configured in **Global Datasources** will be available in Workflows.
:::

To create a new workflow, click on the workflow icon in the left sidebar and click on the **Create New Workflow** button. You'll be taken to the flow builder with a new workflow. Let's start by renaming the workflow to *Quickstart Guide*. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/create-new-workflow.gif" alt="Create New Workflow" />
</div>

The new workflow will have two nodes on the canvas - **Start Trigger** and **Result**. Nodes are a graphical representation of each process in a workflow.  

Click on the blue circle on the **Start trigger** node and drag it to create a new node. Then select **PostgreSQL** node. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/new-db-node.gif" alt="Create New PostgreSQL Node" />
</div>

For this guide, we've created a MonthlySales table in PostgreSQL with 5 columns - *SalesID, ProductID, Month, UnitsSold* and *Total Revenue*. We've also configured Twilio to send an SMS notification.

We can now see a node named *postgresql1* connected to the outgoing flow of the **Start trigger** node on the canvas. Click on the *postgresql1* node, a dialog box will show up on the right.  

- Click on the input field next to the PostgreSQL logo and rename the node to <i>fetchSalesData</i>.     
- There are two dropdowns right below the name field. The first dropdown lets you pick from a list of available nodes. The second dropdown lets you pick between <b>SQL mode</b> and <b>GUI mode</b> to frame your query. 
- We will stick to <b>SQL mode</b> for our example.
- Below the two dropdowns we have an input field to write our SQL query, we'll enter the below query in the input field to fetch the required data:
**SELECT** *ProductID, Month, UnitsSold, TotalRevenue* **FROM** *MonthlySales*;
- If you click on the <b>Run</b> button in the top bar, the results field at the bottom will be populated with the result of the query.  

  <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/postgresql-config.png" alt="New Table"  />
  </div>

Create an outgoing flow from the *fetchSalesData* node that we just created by clicking on the blue circle on its right. Select the **JavaScript** node and rename it to *createNotification*. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/new-js-node.gif" alt="Create New JavaScript Node" />
</div>

The **JavaScript** node lets you run JavaScript code to transform data and perform other tasks. The JavaScript code executes on the server side to protect sensitive logic and data from exposure to the client. In our example, we are using it to convert the result from the previous node into a string. 

- In the JavaScript node, the data retrieved from the *fetchSalesData* node can be accessed using the property - **fetchSalesData.data**. 
- Additionally, to determine the execution status (success or failure) of the node, refer to the **fetchSalesData.status** property. 
- It is important to use a **return** statement in the JavaScript node to ensure that the node returns some data after the code executes.

    <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/js-config.png" alt="JavaScript Node Configuration"  />
    </div>

We'll use the following code in the *createNotification* node to format our notification. Note that we are using a **return** statement to make sure that we are returning the data for the next node. 
```js
const notification = fetchSalesData.data.map(sale => {
                     return`Product ID ${sale.productid} sold
                     ${sale.unitssold} units this month.
                     Total Revenue: ${sale.totalrevenue}.`;
                     }).join(' ');

return notification;
```

Now that we are ready with our notification text, let's create a way to send it using Twilio. 

Create an outgoing flow from the *createNotification* node and select the **Twilio** node. Rename the node to *sendSMS*. Click on the **Operation** dropdown and select **Send SMS** and then enter a  number in the **To Number** field. 

In the **Body** field of the *sendSMS* node, we will retreive the data returned from the *createNotification* node. Since *createNotification* only returns a string, simply enter the name of the node as shown below to access it:
```js
{{createNotification}}
```

Click on the **Run** button on the top right to test our workflow. The **Logs** panel at the bottom will expand with details of each node execution. Logs give a quick overview of errors, execution start time, execution end time and success/failure of each node. Click on top bar of the Logs panel to expand or minimize it. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/sendSMS-trigger.png" alt="Send SMS trigger" />
</div>

In the above screenshot, Logs indicate that all three nodes have successfully executed. The *sendSMS* node has sent an SMS notification to the entered number.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/message-screenshot.png" alt="Send SMS trigger" />
</div>
<br/>

Click on the *sendSMS* node and look at the **Results**. Under the **data** property, we can see an **errorMessage** identifier. The **errorMessage** will be null for the messages that are successfully sent to the intended number. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/sendSMS-result.png" alt="Send SMS result" />
</div>
<br/>

Referring to the **errorMessage** identifier of the *sendSMS* node, we'll use the **If condition** node to end the workflow with a success or failure message. Create an outgoing flow from the *sendSMS* node and select **If condition**. The If condition node can have one or two incoming flows and two outgoing flows. For our use-case we need just one incoming flow. 

The **If condition** node accepts a logical expression and evaluates it. The outgoing flow connected to the green circle will execute if the logical expression is evaluated to `true`, and the one with the red circle will execute if the logical expression is evaluated to `false`.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/if-condition.png" alt="If condition flow" />
</div>
<br/>

Click on the **If condition** node, a dialog box will appear on the right. 

- Enter the below logical expression in the input area: 
**sendSMS.data.errorMessage == null**
- The If condition node will return true if **errorMessage** is null. In case an error message is present, it'll return false.  
- We can now configure two outgoing flows, one of which will be executed based on the provided logical expression.

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/if-condition-config.png" alt="If Condition Configuration"  />
</div>


Click on the green circle on the **If condition** node and drag it, select a new **JavaScript node** and rename it to *successMessage*. Similarly, create one outgoing flow from the red circle and select a JavaScript node. Rename it to *failureMessage*. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/success-failure-messages.png" alt="Success and Failure Nodes" />
</div>

Click on the *successMessage* node, and enter the below code.

```js
return "Success: Message delivered"
```

Similarly, click on the *failureMessage* node and enter the below code

```js
return "Error: Message Not Sent"
```

Note that we are using the return statement in both the newly created JavaScript nodes. Without a return statement, the nodes will not return any data. Click on the **Run** button to execute the workflow.  

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/final-preview.png" alt="Create New Workflow" />
</div>

Check the logs. All the nodes should get executed sequentially. The *successMessage* or *failureMessage* node will get executed based on the evaluation of the **If condition** node.  

With this basic workflow, we've essentially isolated a complex data-centric task and made it presentable and reusable. First we used a **PostgreSQL** node to fetch the sales data from our table. Using the **JavaScript** node, we transformed that data and returned a string that can be used for our SMS notification. Then we used **Twilio** to send the notification via SMS, followed by the **If else** node to return a success or failure message. 

You can now use this workflow in your ToolJet Application from the query panel. In your application, simply click on the **+ Add** button in the query panel and select **Run Workflow**. Then select **Quickstart Guide** in the **Workflow** dropdown. Rename the query to *sendNotification*.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/add-workflow-in-app.gif" alt="Add workflow to application" />
</div>
<br/>

We'll now run the workflow whenever a **Button** is clicked. 

Select a **Button** component, click on **Add handler** under **Events**. Leave the **Event** as **On click** and select **Run Query** as **Action**. For the **Query** dropdown under **Action Options**, select the *sendNotification* query that we have created in the previous step using our *Quickstart Guide* workflow. 

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/send-notification-button-config.png" alt="Configure send notification button" />
</div>
<br/>

Let's add another **Event** to the button. We'll keep the action as **Show Alert** for this event and add the below code to the **Message** property.
```js
{{queries.sendNotification.data.successMessage ||
queries.sendNotification.data.failureMessage}}
```
The above code will return success or failure message based on the output we receive from the *Quickstart Guide* workflow. Now, every time we press the button, an SMS containing the sales data will be sent, and an alert message will appear.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/overview/alert-message.png" alt="Configure send notification button" />
</div>
<br/>

We've now successfully used a workflow in our ToolJet Application. 

Continue learning about the different elements of ToolJet Workflows using the below links:

**[Types Of Nodes](/docs/workflows/nodes)** <br/>
**[Overview of Logs](/docs/workflows/logs)** <br/>
**[Permissions in Workflows](/docs/workflows/permissions)**

</div>