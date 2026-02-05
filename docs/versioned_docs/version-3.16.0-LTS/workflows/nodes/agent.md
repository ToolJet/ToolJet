---
id: agent
title: Agent Node
---

<br/>

The **Agent Node** enables AI-powered automation within your workflows. It connects to AI Models and can use tools (databases/APIs) to perform multi-step reasoning and task execution. The agent autonomously decides which tools to use and how to combine their results to accomplish complex tasks.

## Configuration

### Configuring Agent

| Setting | Description |
|:--------|:------------|
| **System Prompt** | Instructions that define the agent's behavior, persona, and constraints. |
| **User Prompt** | The task or question for the agent to process. Supports dynamic values using `{{ }}` syntax. |
| **Output Format** | Defines the structure of the agent's final response. Use this to specify a JSON schema or format that the agent should follow when returning results. |

### AI Model

Connect the Agent node to an AI model datasource by linking it to the **ai-model** handle on the node.

Supported AI providers:
- OpenAI
- Anthropic
- Gemini
- Mistral AI

#### Model Parameters

| Parameter | Description |
|:----------|:------------|
| **Temperature** | Controls randomness in responses. Higher values (0-1) produce more creative outputs. |
| **Max Tokens** | Maximum number of tokens the model can generate in a response. |
| **Top P** | Alternative to temperature for controlling randomness via nucleus sampling (0-1). |
| **Max Steps** | Maximum number of reasoning steps/iterations the agent can take. |
| **Max Retries** | Number of retry attempts for failed API calls. |
| **Timeout** | Maximum time in milliseconds for the agent to complete execution. |
| **Stop Sequences** | Sequences that signal the model to stop generating further text. |

### Tools

Tools allow the agent to interact with your data and perform actions. Each tool is a workflow node that the agent can invoke.

Drag the nodes from the agent node that you want to use as tools (datasource queries, REST API calls, JavaScript nodes, etc.)

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/agent-tools.png" alt="Agent Tools Configuration" />

## Accessing Agent Node Data

### Inside Tools

When the agent invokes a tool, it passes parameters that you can access within the tool node. Use the following syntax to retrieve these values:

```js
aiParameters.<paramName>
```

The parameter names are determined by the agent based on your system prompt instructions. For example, if your system prompt instructs the agent to extract `user_email` from the user's message, you can access it in your tool as:

```js
aiParameters.user_email
```

### Outside Agent Node

Only the final result of the agent node can be accessed by other nodes in the workflow. If you need specific data in the output, define the expected output format in your system prompt.

To access the agent's output in subsequent nodes, use the following syntax:

```js
<agentNodeName>.data
```

For example, if your agent node is named `agent1`:

```js
agent1.data
```


## Example: Customer Support Agent

Suppose you wish to create an agent that can look up customer information and create support tickets, here is how you can do it:

**System Prompt:**
```
You are a Customer Support Automation Agent integrated with a ToolJet workflow.

Your task is to process the user's message and execute the following steps strictly in order:

STEP 1:
Extract the following information from the user's message:
- user_name
- user_email
- issue_summary (1 concise sentence)
- tags (array of keywords)
- priority ("critical", "normal", "low")

Infer missing values using reasonable defaults such as "Unknown".

STEP 2:
Look up for the customer in the database "lookupCustomer".

STEP 3:
After verifying the customer, create a new support ticket using the REST API "createTicket"

STEP 4:
After creating the ticket, find the order history of the customer in the database "getOrderHistory"

Rules:
- Always call lookupCustomer first.
- Always call createTicket after verifying customer.
- Do not ask follow-up questions.
- Do not explain your reasoning.
```

**User Prompt**

```
{{startTrigger.params.userPrompt}}
```

**Tools:**
- `lookupCustomer`: Queries the database for customer details by email
- `createTicket`: Creates a new support ticket in the ticketing system
- `getOrderHistory`: Retrieves recent orders for a customer

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/customer-support-agent.png" alt="Agent Tools Configuration" />

## Limitations

- The agent's performance depends on the underlying AI model's capabilities
- Complex multi-tool workflows may require higher max steps settings
- API rate limits from AI providers may affect execution

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
