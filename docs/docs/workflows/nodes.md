---
id: nodes
title: Types of Nodes
---

Nodes are a graphical representation of each process in a workflow. Every new instance of a workflow will have two nodes - **Start Trigger** and **Result**. The **Start Trigger** node triggers the workflow to run. Once the workflow execution is completed, the resulting data is stored in the **Result** node.

Apart from the default **Start Trigger** and **Result** nodes, there are an array of nodes that you can add to the canvas. They can be broadly divided into four types - **JavaScript**, **If condition**, **Data sources** and **REST API**. Let's take a closer look at each node.

## JavaScript node

The **JavaScript** node lets you write custom JavaScript code. You can write the code to transform data, create alert messages and more. Each JavaScript node needs a return statement to ensure that the data is sent to the next node. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/js-node.png" alt="JavaScript Node" />
</div>

## If condition
The **If condition** node has one incoming flow and two outgoing flows. It executes one of the outgoing flows based on the provided logical expression. If the expression evaluates to **true**, the outgoing flow connected to the green circle gets executed. In case it is **false**, the flow connected to the red circle will get executed.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/if-condition-node.png" alt="JavaScript Node" />
</div>
<br/>
<div style={{display: 'flex', justifyContent: 'space-between', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', alignItems:'center'}}>
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
All the data sources that you have configured will be available in the workflow. You can use them to run complex queries on your database tables, connect with APIs, send emails and messages, etc.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/datasources-nodes.png" alt="Datasources and Other Services" />
</div>

Each node will have a different layout based on the function it performs. For example, a **Twilio** node might comes with the relevant fields needed to send an SMS, while a **PostgreSQL** node will have a query field to retrieve the data.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/workflows/nodes/twilio-postgres-config.png" alt="Twilio and Postgres Configuration" />
</div>

## REST API

The **REST API** node acts as a bridge to connect with RESTful web services. By leveraging standard HTTP methods like GET, POST, PUT, and DELETE, the REST API node ensures smooth communication with web services, making data integration and manipulation more efficient and straightforward.







