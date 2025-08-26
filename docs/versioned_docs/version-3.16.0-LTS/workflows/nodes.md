---
id: nodes
title: Types of Nodes
---

Nodes are graphical representations of each process in a workflow. Each node can access the data from the nodes that were executed earlier. Every workflow contains key node types that help orchestrate the flow of data and logic.

## Start Trigger Node
The **Start Trigger** node is the entry point of your workflow. It can be triggered:
- Manually through ToolJet applications similar to queries
- Via webhooks from external systems

The data received by the Start Trigger through parameters is accessible throughout the workflow.

<img className="screenshot-full" src="/img/workflows/nodes/v2/start-node.png" alt="Workflows Preview" />

## Logic Nodes

### JavaScript Node
The **JavaScript** node lets you write custom server-side code to:
- Transform data
- Perform complex calculations
- Create custom messages
- Handle business logic

The code must include a **return** statement to pass results to subsequent nodes.

<img className="screenshot-full" src="/img/workflows/nodes/v2/javascript.png" alt="JavaScript Node" />

### If Condition Node
The **If condition** node enables branching logic with:
- One or two incoming flows
- Two outgoing flows (true/false paths)
- Logical expressions for decision making

When the condition evaluates to true, the outgoing node connected to the green arrow will be executed. If it is false, the outgoing node connected to the red arrow will be executed.

<img className="screenshot-full" src="/img/workflows/nodes/v2/if-node.png" alt="If Condition Node" />

### Loop Node
The **Loop** node allows you to:
- Iterate over datasets
- Process items sequentially
- Apply operations to each item
- Aggregate results

<img className="screenshot-full" src="/img/workflows/nodes/v2/loop-node.png" alt="Loop Node" />

## Data Source Nodes
Data source nodes connect to your configured data sources, enabling you to:
- Execute database queries
- Make API calls
- Send emails/messages
- Interact with external services

Each data source node has specific configurations based on its type:
- **PostgreSQL**: SQL query fields
- **REST API**: HTTP method, endpoint, headers
- **Twilio**: SMS configuration fields
- And more based on your configured sources

<img className="screenshot-full" src="/img/workflows/nodes/v2/datasources.png" alt="Data Sources Node" />

## Response Node
The **Response** node defines the final output of your workflow. You can configure multiple response nodes to return multiple execution results.

<img className="screenshot-full" src="/img/workflows/nodes/v2/response-node.png" alt="Response Node" />

Each node type serves a specific purpose in the workflow. By combining these nodes, you can create powerful automation flows tailored to your business needs.

