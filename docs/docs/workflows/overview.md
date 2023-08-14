---
id: overview
title: Overview
---
<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>
<br/>

Tooljet Workflows is as a visual, node-based platform tailored for data-centric automation tasks. With its intuitive design, users can effortlessly create nodes to run detailed queries across diverse data sources, manage conditional flows, and execute custom Javascript code. This not only simplifies intricate processes but also makes them more presentable, bridging the gap between complexity and clarity. Whether you're delving into data integration, generating detailed reports, or ensuring rigorous validation, Tooljet Workflows is your go-to solution. 


## Quickstart Guide

This introductory guide will help you understand the basics of Tooljet Workflows. We'll create a workflow that fetches the sales data from the database, transforms the data using Javascript and sends an SMS notification to the Sales Manager using Twilio. We will also conditionally return a success/failure message that can be used in a Tooljet Application to show a pop-up alert. 

:::info
For this guide, we've created a MonthlySales table in PostgreSQL with 5 columns - SalesID, ProductID, Month, UnitsSold and Total Revenue. We've also configured Twilio for SMS notification. All data sources that are configured in **Global Datasources** will be available in Workflows.
:::

To create a new workflow, click on the workflow icon in the left sidebar and click on the **Create New Workflow** button. You'll be taken to a fresh instance of a workflow. Let's start by renaming the workflow to *Quickstart Guide*. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/create-new-workflow.gif" alt="Create New Workflow" />
</div>

The new instance of the workflow will have two nodes on the canvas - *Start Trigger* and *Result*. Nodes are a graphical representation of each process in a workflow.  

Click on the blue circle on the *Start trigger* node and drag it to create a new node. Then select "PostgreSQL" node. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/new-db-node.gif" alt="Create New PostgreSQL Node" />
</div>

<br/>

We can now see a *postgresql1* node connected to the outgoing flow of the *Start trigger* node on the canvas. Click on the *postgresql1* node, a dialog box will show up on the right.  

<div style={{display: 'flex', paddingTop:'10px', justifyContent: 'space-between', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
        - Click on the input field next to the PostgreSQL logo and rename the node to <i>fetchSalesData</i>. 
        <br/>    
        <br/>    
        - There are two dropdowns right below the name field. The first dropdown lets you pick from a list of available nodes. The second dropdown lets you pick between "SQL" and "GUI" to frame your query. 
        <br/>
        <br/>
        - We will stick to "SQL mode" for our example.
        <br/>
        <br/>
        - Below the two dropdowns we have an input field to write our SQL query, we'll enter the below query in the input field to fetch the required data:
        <br/>
        <b>SELECT</b> <i>ProductID, Month, UnitsSold, TotalRevenue</i> <b>FROM</b> <i>MonthlySales</i>;
        <br/>    
        <br/>
        - If you click on the Run button in the top-bar and open this node again, the results window at the bottom will be populated with the result of the query.  
    </p>
  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/postgresql-config.png" alt="New Table"  />
  </div>
</div>
<br/>

Create an outgoing flow from the *fetchSalesData* node that we just created by clicking on the blue circle on its right. Select the Javascript node and rename it to *createNotification*. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/new-js-node.gif" alt="Create New Javascript Node" />
</div>
<br/>
    
<div style={{display: 'flex', paddingTop:'10px', justifyContent: 'space-between', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
        - The JavaScript node lets you run JavaScript code to transform data and perform other tasks. 
        <br/>
        <br/>
        - Use a "return" statement to ensure that the node returns the data after the JavaScript code runs. 
        <br/>    
        <br/>    
        - In the JavaScript node, the data retrieved from the <i>fetchSalesData</i> node can be accessed using the property - <b>fetchSalesData.data</b>. 
        <br/>    
        <br/>    
        - Additionally, to determine the execution status (success or failure) of the node, refer to the <b>fetchSalesData.status</b> property. 
    </p>    
  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/js-config.png" alt="Javascript Node Configuration"  />
  </div>
</div>
<br/>

We'll use the following code in the *createNotification* node to format our notification. 
```js
const notification = fetchSalesData.data.map(sale => {
                     return`Product ID ${sale.productid} sold
                     ${sale.unitssold} units this month.
                     Total Revenue: ${sale.totalrevenue}.`;
                     }).join(' ');

return notification;
```

Now that we are ready with our notification text, let's create a way to send it using Twilio. 

Create an outgoing flow from the *createNotification* node and select the "Twilio" node. Rename the node to *sendSMS*. Click on the "Operation" dropdown and select "Send SMS" and then enter the Sales Manager's  number in the "To Number" field. 

In the "body" field, we will retreive the data returned from the *createNotification* node. Since *createNotification* only returns a string. Simply enter the name of the node as shown below to access it:
```js
{{createNotification}}
```

Click on the **Run** button on the top right to test our workflow. The **Logs** panel at the bottom will expand and with details of each node executes sequentually. Logs give a quick overview of errors, execution start time, execution end time and success/failure of each node. Click on top bar of the Logs panel to expand or minimize it. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/sendSMS-trigger.png" alt="Send SMS trigger" />
</div>

In the above screenshot, Logs indicate that all three nodes that we've created have successfully executed. The *sendSMS* node has sent an SMS notification to the Sales Manager.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/message-screenshot.png" alt="Send SMS trigger" />
</div>
<br/>
Click on the *sendSMS* node and look at the "Results". Under the "data" property, we can see "errorMessage" property along with a host of other properties. The "errorMessage" will be null for successful SMS notifications. 
<br/>
<br/>
<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/sendSMS-result.png" alt="Send SMS result" />
</div>
<br/>

Referring to the "errorMessage" property of the *sendSMS* node, we'll use the **If Else** node to end the workflow with a success or failure message. 

Create an outgoing flow from the *sendSMS* node and select **If condition**. The If condition node will have one incoming flow and two outgoing flows. The outgoing flow connected to the green circle will execute if the condition is evaluated to true and the one with the red condition will execute if the condition is false.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/if-condition.png" alt="If condition flow" />
</div>
<br/>

Click on the **If condition** node, a dialog box will appear on the right. 

<div style={{display: 'flex', paddingTop:'10px', justifyContent: 'space-between', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
        - Enter the below logic in the input area: <br/>
        <b>sendSMS.data.errorMessage = null</b>
        <br/>    
        <br/>
        - The If condition node will return true if the <b>sendSMS.data.errorMessage</b> property is null. In case an error message is present, it'll return false.
        <br/>    
        <br/>   
        - We can now configure two outgoing flows, one of which will be executed based on the provided logic.  
    </p>    
  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/workflows/overview/if-condition-config.png" alt="If Condition Configuration"  />
  </div>
</div>
<br/>

Click on the green circle on the **If condition** node and drag it, select a new **Javascript node** and rename it to *Success*. Similarly, create one outgoing flow from the red circle and select a JavaScript node. Rename it to *Failure*. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/success-failure-messages.png" alt="Success and Failure Nodes" />
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
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/overview/final-preview.png" alt="Create New Workflow" />
</div>

Check the logs. All the nodes should get executed sequentially. The *successMessage* or *failureMessage* node will get executed based on the evaluation of the **If condition** node.  

With this basic workflow, we've essentially isolated a complex data-centric task and made it reusable and easy to maintain. First we used a **PostgreSQL** node to fetch the sales data from our table. Using the **JavaScript** node, we transformed that data and returned a string that can be used for our SMS notification. Then we used **Twilio** to send the notification via SMS, followed by the **If else** node to return a success or failure message. 

You can now use this workflow in your Tooljet Application from the query panel. 

<!-- 

## Topbar
The topbar will have the application name on the left along with a text that indicates whether the latest changes have been saved. To the right, we have a **Enable** checkbox and a "Run" button. If you uncheck the **Enable** button, the workflows will stop executing in the application. The **Run** button allows you run the entire flow. 

## Nodes
Every new instance of a workflow will have two nodes - **Start Trigger** and **Result** on the canvas. Nodes are a graphical representation of each process in a workflow. 

The list of nodes that you can add to the canvas can be divided into four types:

- **JavaScript** node that lets you run custom JavaScript logic.
- **If Else** condition node that executes the outgoing path based on the condition provided
- **Data Source And Other Services** nodes that will allow you to run complex queries on your databases, send emails/messages, etc.
- **Rest API** node that allows for interaction with RESTful web services

The **Start Trigger** node triggers the workflow to run. Once the workflow execution is completed, the resulting data is stored in the **Result** node. 

To create a new node on the canvas, click and drag the blue circle right next to **Start Trigger** node. You'll get a list of nodes to choose from. 

The **Start Trigger** node will only have an outgoing flow while the "Result" node will only have an incoming flow. The **If condition** node will have one incoming node and two outgoing nodes, one of which will be executed based on whether the **If condition** evaluates to true or false. All the other nodes will have one incoming and one outgoing flows, denoted by the blue circles on either side.


## Logs

Once you execute the workflow by pressing on the **Run** button, the logs panel will reflect the execution details of each node. Logs let you easily track the order of execution and check whether the execution of individual nodes is successfull. You can click on the topbar of the logs panel to expand or minimize it. 

 -->
