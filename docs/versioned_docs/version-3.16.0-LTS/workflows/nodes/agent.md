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

Tools allow the agent to interact with your data and perform actions. Each tool is a workflow node that the agent can invoke. The agent autonomously decides which tools to use based on the task and your system prompt instructions.

To add tools, drag nodes from the Agent node's tool handle to connect datasource queries, REST API calls, JavaScript nodes, or any other workflow nodes.

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/agent-tools.png" alt="Agent Tools Configuration" />

#### Supported Tool Types

You can use any workflow node as a tool, including:

- **Datasource Queries**: PostgreSQL, MySQL, MongoDB, and other database queries
- **REST API**: Connect to external services like Slack, GitHub, Gmail, Twilio, etc.
- **JavaScript**: Custom logic for data transformation or complex operations
- **ToolJet Database**: Query your ToolJet Database tables

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


## Use Cases

### Customer Support Agent

Create an agent that looks up customer information, creates support tickets, and retrieves order history.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `lookupCustomer` | PostgreSQL | Queries the database for customer details by email |
| `createTicket` | REST API | Creates a new support ticket in the ticketing system |
| `getOrderHistory` | PostgreSQL | Retrieves recent orders for a customer |

**System Prompt:**
```
You are a Customer Support Automation Agent.

Process the user's message and execute the following steps in order:

1. Extract: user_name, user_email, issue_summary, tags, priority ("critical", "normal", "low")
2. Look up the customer using "lookupCustomer"
3. Create a support ticket using "createTicket"
4. Retrieve order history using "getOrderHistory"

Rules:
- Always call lookupCustomer first
- Always call createTicket after verifying customer
- Do not ask follow-up questions
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/customer-support-agent.png" alt="Customer Support Agent" />

### GitHub Issue Triager

Automate issue management by analyzing new issues and assigning labels, assignees, and priorities.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `getIssueDetails` | GitHub | Fetches issue title, description, and metadata |
| `addLabels` | GitHub | Adds appropriate labels to the issue |
| `assignReviewer` | GitHub | Assigns a team member based on issue type |
| `postComment` | GitHub | Posts a welcome comment or asks for more details |

**System Prompt:**
```
You are a GitHub Issue Triage Agent.

When a new issue is created:
1. Analyze the issue content using "getIssueDetails"
2. Categorize it (bug, feature, documentation, question)
3. Add appropriate labels using "addLabels"
4. Assign to the right team member using "assignReviewer"
5. Post a helpful comment using "postComment"

Label guidelines:
- Bug reports: add "bug" and priority label
- Feature requests: add "enhancement"
- Questions: add "question" and post documentation links
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/github-issue-triager.png" alt="GitHub Issue Triage" />

### Slack Notification Agent

Monitor events and send contextual notifications to the right Slack channels.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `getAlertDetails` | PostgreSQL | Fetches alert information from the database |
| `getUserOnCall` | REST API | Gets the current on-call engineer |
| `sendSlackMessage` | Slack | Sends a message to a Slack channel |
| `createIncident` | REST API | Creates an incident in your incident management system |

**System Prompt:**
```
You are an Alert Notification Agent.

When an alert is triggered:
1. Get alert details using "getAlertDetails"
2. Determine severity (critical, warning, info)
3. For critical alerts:
   - Get on-call engineer using "getUserOnCall"
   - Create incident using "createIncident"
   - Send urgent Slack message using "sendSlackMessage"
4. For warnings: send Slack message to #engineering-alerts
5. For info: send Slack message to #system-logs

Always include: alert name, severity, timestamp, and recommended action.
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/slack-agent.png" alt="Slack Agent" />

### Email Assistant Agent

Process incoming emails and draft responses or route them to the appropriate team.

**Tools:**
| Tool | Type | Description |
|:-----|:-----|:------------|
| `getEmailContent` | Gmail | Fetches email subject, body, and sender info |
| `classifyEmail` | JavaScript | Analyzes email intent and urgency |
| `draftReply` | Gmail | Creates a draft response |
| `forwardEmail` | Gmail | Forwards to the appropriate department |
| `logEmail` | PostgreSQL | Logs the email for tracking |

**System Prompt:**
```
You are an Email Processing Agent.

For each incoming email:
1. Get email content using "getEmailContent"
2. Classify the email type (inquiry, complaint, order, spam)
3. Based on classification:
   - Inquiries: draft a helpful reply using "draftReply"
   - Complaints: forward to support team using "forwardEmail"
   - Orders: log in database using "logEmail"
   - Spam: ignore
4. Log all processed emails in the database

Maintain a professional and helpful tone in all responses.
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/agent/email-assistant.png" alt="Email Assistant" />

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
