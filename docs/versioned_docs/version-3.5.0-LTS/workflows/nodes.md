---
id: nodes
title: Types of Nodes
---

<div style={{display:'flex',justifyContent:"start",alignItems:"center",gap:"8px"}}>

<div className="badge badge--self-hosted heading-badge" >   
 <span>Self Hosted</span>
</div>

</div>

Nodes are graphical representations of each process in a workflow. Each node can access the data from the nodes that were executed earlier. Every workflow contains key node types that help orchestrate the flow of data and logic.

## Start Trigger Node

The **Start Trigger** node is the entry point of your workflow. It can be triggered:
- Manually through ToolJet applications similar to queries
- Via webhooks from external systems

The Start Trigger receives data through parameters, which can be used in any node of the workflow. You can also set default values using Test JSON parameters. These defaults will be used if no values are provided when the workflow is triggered from the app builder or a webhook.

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

## Workflow Node

The **Workflow** node is used to trigger another workflow from within a workflow. Parameters can also be passed to another workflow.

:::note
1. A workflow can call itself recursively. It’s recommended to define an exit condition to avoid an infinite loop.
2. The timeout for each workflow can be configured using the `WORKFLOW_TIMEOUT_SECONDS` environment variable, for more information checkout [Customizing Workflow Configuration](/docs/workflows/overview#customizing-workflow-configuration).
:::

<img className="screenshot-full" src="/img/workflows/nodes/workflow.png" alt="Data Sources Node" />

## Response Node

The **Response** node defines the final output of your workflow. You can configure multiple response nodes to return multiple execution results.

<img className="screenshot-full" src="/img/workflows/nodes/v2/response-node.png" alt="Response Node" />

Each node type serves a specific purpose in the workflow. By combining these nodes, you can create powerful automation flows tailored to your business needs.

## Node Operations

### Error Handling

The **Error Handling** node operation in ToolJet workflows lets you define different execution paths based on whether a node succeeds or fails. If a node runs successfully, the workflow continues along the success path, if it fails, the error path is triggered, allowing you to perform custom actions like logging, notifications, or retries.

<img className="screenshot-full img-full" src="/img/workflows/nodes/error-handling.png" alt="Workflows Preview" />

### Copy

The **Copy** operation lets you copy a node’s configuration to your clipboard. You can then paste it into another part of the workflow or a different workflow for quick reuse.

<img className="screenshot-full img-full" src="/img/workflows/nodes/copy.png" alt="Workflows Preview" />

### Duplicate

The **Duplicate** operation instantly creates a copy of the node in the same workflow. This helps speed up building workflows with similar nodes without reconfiguring from scratch.

<img className="screenshot-full img-full" src="/img/workflows/nodes/duplicate.png" alt="Workflows Preview" />

### Delete

The **Delete** operation removes a node and its connections from the workflow. Use this to clean up unused or obsolete nodes and keep your workflow organized.

<img className="screenshot-full img-full" src="/img/workflows/nodes/delete.png" alt="Workflows Preview" />
