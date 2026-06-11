---
id: nodes
title: Types of Nodes
---

Nodes are a graphical representation of each process in a workflow. Each node in the workflow passes over the result to the next node. Every new workflow will have two nodes - **Start Trigger** and **Result**. The **Start Trigger** node triggers the workflow to run. Once the workflow execution is completed, the resulting data is stored in the **Result** node type.

Apart from the default **Start Trigger** and **Result** nodes, there are an array of nodes that you can add to the canvas. They can be broadly divided into four types - **JavaScript**, **If condition**, **Data sources** and **REST API**. Let's take a closer look at each node.

## JavaScript

The **JavaScript** node lets you write custom JavaScript code than runs on the server side. Server-side execution of code protects sensitive logic and data from exposure to the client and improves performance by offloading complex computations from the client. You can use the JavaScript code to transform data, create alert messages and more. The code you enter in each JavaScript node needs a **return** statement to ensure that the result is sent to the next node. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/js-node.png" alt="JavaScript Node" />
</div>

## If condition
The **If condition** node can have one or two incoming flows and two outgoing flows. If it has two incoming flows, it'll only trigger after the execution of both the incoming flows is completed. 

The **If condition** node triggers one of the outgoing flows depending on the given logical expression. If the expression evaluates to true, it activates the flow connected to the green circle. Conversely, if it's false, the flow linked to the red circle will be activated.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/if-condition-node.png" alt="If Condition Node" />
</div>
<br/>
<div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
  <div style={{flex: 1, padding: '0', alignment:'center'}}>
    <p style={{textAlign: 'left'}}>
        - If you click on the <b>If condition</b> node, a dialog box will appear on the right that accepts a logical expression. 
        <br/>    
        <br/>    
        - The <b>If condition</b> node can be handy when you want to run flows based on the data received or create alert messages based on success or failure of certain nodes.
    </p>
  </div>
  <div style={{flex: 1, padding: '10px'}}>
    <img className="screenshot-full" src="/img/workflows/nodes/if-condition-config.png" alt="If condition configuration"  />
  </div>
</div>
<br/>

## Data Sources 
In the flow builder of ToolJet, all the data sources you've set up will appear as nodes. These nodes can be utilised to perform intricate queries on your data sources, establish connections with APIs, send emails and messages, and more.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/datasources-nodes.png" alt="Datasources and Other Services" />
</div>

Each node type will have a different configuration based on the function it performs. For example, a **Twilio** node might come with the relevant fields needed to send an SMS, while a **PostgreSQL** node will have a query field to retrieve the data.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/twilio-postgres-config.png" alt="Twilio and Postgres Configuration" />
</div>

## REST API

The **REST API** node acts as a bridge to connect with RESTful web services. By leveraging standard HTTP methods like GET, POST, PUT, and DELETE, the REST API node ensures smooth communication with web services, making data integration and manipulation more efficient and straightforward.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/restapi-node.png" alt="Rest API Configuration" />
</div>



