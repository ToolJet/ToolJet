---
id: human-in-the-loop
title: Human-in-the-loop Node
---

<br/>

The **Human-in-the-loop** node pauses a workflow run until a person reviews it and picks an outcome, such as **Approve** or **Reject**. Each outcome has its own output handle, so the chosen outcome decides which branch the run continues on. The approver can also fill in input fields, and the values are passed to the nodes that follow.

Use this node when a workflow needs a person's decision before it continues, for example to approve an expense, review an AI-generated reply before it is sent, or confirm a bulk delete before it runs.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/hitl-workflow.png" alt="Expense approval workflow with a Human-in-the-loop node branching to approve and reject paths" />

## Adding the Node

1. Drag a connection from the output handle of an existing node and release it on the canvas.
2. Select **Human-in-the-loop** from the node list.
3. Click the node to open its configuration panel.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/add-node.png" alt="Node list with the Human-in-the-loop option" />

:::info
A workflow that contains a Human-in-the-loop node can't be run from another workflow through the **Run Workflow** node.
:::

## Configuration

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/general-approvers-outcomes.png" alt="Human-in-the-loop configuration showing the General, Approvers and Outcomes sections" />

### General

| Setting | Description |
|:--------|:------------|
| **Description** | The message shown to the approver, such as what to review and why. Supports `{{ }}` to include data from earlier nodes, for example `Review the expense of ${{getExpense.data.amount}} from {{getExpense.data.employee}}.` |

### Approvers

Approvers are the people who can respond to the request and who receive the approval email. Use any combination of the following:

| Setting | Description |
|:--------|:------------|
| **Users** | Workspace users who can approve. |
| **Groups** | Custom groups whose members can approve. |
| **Dynamic (fx)** | An expression that resolves to an email address or an array of email addresses, for example `{{ getManager.data.email }}`. Use this when the approver depends on the data in the run. |

:::info
Workspace admins can respond to any approval request, even when they are not listed as approvers. Only active workspace users can respond.
:::

### Outcomes

Outcomes are the choices the approver can make. Each outcome appears as a button on the approval request and as a separate output handle on the node. By default, the node has two outcomes: `approved` (**Approve**) and `rejected` (**Reject**).

| Field | Description |
|:------|:------------|
| **Key** | The identifier of the outcome, returned in the node output as `outcome`. Keys must be unique. |
| **Label** | The text shown on the outcome button. |
| **Color** | The color of the outcome button. |

Click **+ Add outcome** to add more choices, such as **Request changes** or **Escalate**. At least one outcome is required. Connect each outcome handle to the node that should run when that outcome is chosen.

### Input Fields

Input fields collect extra information from the approver, such as a comment or a cost center. Click **+ Add input field** to add one.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/input-fields.png" alt="Input fields section with a required Select field and an optional Text field" />

| Field | Description |
|:------|:------------|
| **Name** | The key used to read the value in later nodes, for example `costCenter`. Names must be unique. |
| **Label** | The label shown to the approver. |
| **Type** | **Text**, **Number**, **Boolean** or **Select**. |
| **Required** | When checked, the approver can't submit an outcome without filling in the field. |
| **Default value** | The value the field starts with. |
| **Options** | For **Select** fields only. A comma-separated list of choices, for example `Low, Medium, High`. |

### Timeout

By default, a run waits for a decision indefinitely. Turn on **Enable timeout** to set a deadline.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/timeout-reminders-notification.png" alt="Timeout, Reminders and Notification sections" />

| Setting | Description |
|:--------|:------------|
| **Duration** | How long to wait for a decision, in seconds, minutes, hours or days. The default is 1 day. |
| **On expire** | **Fail** marks the request as expired and fails the run. **Branch** continues the run with the outcome selected in **Timeout outcome**. |
| **Timeout outcome** | The outcome to use when the deadline passes. Shown only when **On expire** is set to **Branch**. If no outcome is selected, the run fails when the timeout expires. |

### Reminders

Reminders resend the approval email a set time after the request is created, whether or not a timeout is set. Click **+ Add reminder** and set the delay. A reminder set at or after the timeout duration never fires.

### Notification

Optionally, the node can send an HTTP request to a webhook when it starts waiting for a decision, for example to post a message to a chat tool. Leave the URL blank to skip it. The notification is sent in addition to the approval email.

| Setting | Description |
|:--------|:------------|
| **Endpoint** | The method (**POST** or **PUT**) and the webhook URL. The URL supports `{{ }}`. |
| **Headers** | Request headers, such as an authorization token. Values support `{{ }}`. |
| **Body template (JSON, optional)** | A custom JSON body. Supports `{{ }}` to include data from earlier nodes and from `approval`, which contains `requestId`, `nodeName` and `expiresAt`. |

When no body template is set, the request body contains the node name, the description, the outcomes and the input fields. A failed notification is logged and doesn't stop the run.

## Accessing Node Data

When the approver responds, the node returns the chosen outcome, the submitted input values and the ID of the user who responded:

```json
{
  "outcome": "approved",
  "input": {
    "costCenter": "Sales",
    "comments": "Within the Q4 travel budget."
  },
  "resolvedBy": "1afbc240-cd3b-4ed8-a422-8dcdba2f838c"
}
```

To use these values in later nodes, reference the node by its name:

```js
managerApproval.data.outcome            // "approved"
managerApproval.data.input.costCenter   // "Sales"
managerApproval.data.resolvedBy         // ID of the user who responded
```

`resolvedBy` is `null` when the outcome was chosen by a timeout.

## How a Run Waits for Approval

When a run reaches the Human-in-the-loop node:

1. The run pauses and its status changes to **Waiting**. In the workflow editor, the **Logs** panel shows **Waiting for human input**.
2. Each approver receives an email with the subject **Approval requested: &lt;workflow name&gt;**, with a link to the **Approvals** tab. Reminder emails use the subject **Reminder: approval requested for &lt;workflow name&gt;**.
3. If a notification webhook is configured, it is called.
4. When an approver picks an outcome, the run resumes from the output handle of that outcome. Nodes connected to the other outcome handles are skipped.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/run-waiting.png" alt="Logs panel showing a run waiting for human input" />

A paused run doesn't hold up the caller:

- **Webhook trigger**: The webhook responds immediately with status code `202` and a body such as `{ "executionStatus": "waiting", "executionId": "...", "requestId": "..." }`. The rest of the workflow runs after the approval, so its **Response** node output isn't returned to the webhook caller.
- **Scheduled trigger**: A scheduled run is skipped while a previous run of the same schedule is still waiting.

:::info
Approval emails need SMTP to be configured for the instance. Timeouts and reminders are processed by the workflow worker, so self-hosted deployments need at least one instance running with `WORKER=true`.
:::

## Responding to an Approval Request

Pending requests are listed on the **Approvals** tab of the **Workflows** page. Approvers see the requests that list them. Users who can edit workflows see all requests in the workspace.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/approvals-tab.png" alt="Approvals tab listing a pending request" />

The list shows **Pending** requests by default. Use the filters to narrow the list by environment, workflow, status (**Pending**, **Resolved**, **Expired** or **Cancelled**), approver or date.

To respond to a request:

1. Click the request to open it. The request shows its status, when it was raised, its deadline, the description and the approvers.
2. Fill in the input fields. Required fields are marked with `*`.
3. Click an outcome button, such as **Approve** or **Reject**.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/approval-request.png" alt="Approval request with input fields and Approve and Reject buttons" />

The run resumes as soon as the outcome is submitted. In the run's logs, the node shows **Human input received**, followed by the nodes on the chosen branch.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/run-resumed.png" alt="Logs of a resumed run showing the approved outcome and the recordApproval node" />

### Cancelling a Request

Workspace admins can click **Cancel request** on a pending request. Cancelling marks the request as **Cancelled** and fails the run.

## Monitoring Waiting Runs

Paused runs appear on the **Executions** tab of the **Workflows** page with the status **Waiting**. Filter by the **Waiting** status to see every run that is waiting on a decision. Click **Stop** to end a waiting run. Stopping a run also cancels its pending approval request.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/executions-waiting.png" alt="Executions tab showing a run with the Waiting status" />

## Example: Refund Approval

This example builds a workflow that approves customer refund requests. Refunds of $500 or less are approved immediately. Larger refunds pause at a Human-in-the-loop node until a member of the **Finance** group approves or rejects them. The decision and the approver's note are saved to the request in a ToolJet Database table.

#### 1. Create the Table

Create a ToolJet Database table named `refund_requests` with the following columns:

| Column | Type | Notes |
|:-------|:-----|:------|
| `id` | serial | Primary key |
| `order_id` | varchar | |
| `customer` | varchar | |
| `amount` | float | |
| `reason` | varchar | |
| `status` | varchar | Default value `Pending` |
| `reviewer_note` | varchar | |

#### 2. Build the Workflow

1. Create a workflow named **Refund Approval**.
2. Open **Workflow inputs** from the left sidebar and add these inputs:

   | Name | Type | Required |
   |:-----|:-----|:---------|
   | `request_id` | number | Yes |
   | `order_id` | string | Yes |
   | `customer` | string | Yes |
   | `amount` | number | Yes |
   | `reason` | string | No |

3. Add an **If condition** node named `needsApproval` after the **Start** node, with the condition `startTrigger.params.amount > 500`.
4. From the **If** handle, add a **Human-in-the-loop** node named `financeApproval` and configure it:
   - **Description**: `{{startTrigger.params.customer}} requested a ${{startTrigger.params.amount}} refund on order {{startTrigger.params.order_id}}. Reason: {{startTrigger.params.reason}}`
   - **Groups**: **Finance**
   - **Outcomes**: Keep the default `approved` and `rejected` outcomes.
   - **Input fields**: Add a **Text** field with the name `note` and the label **Note**.
   - **Timeout**: Turn on **Enable timeout**, set **Duration** to 2 days, set **On expire** to **Branch** and **Timeout outcome** to **Reject**.

   <img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/refund-finance-approval.png" alt="financeApproval node configured with the Finance group, Approve and Reject outcomes and a Note input field" />

5. Add two ToolJet Database query nodes that use the **Update rows** operation on `refund_requests`, with the filter `id` equals `{{startTrigger.params.request_id}}`:

   | Node | `status` | `reviewer_note` |
   |:-----|:---------|:----------------|
   | `markApproved` | `Approved` | `{{typeof financeApproval === 'undefined' ? 'Auto-approved' : financeApproval.data.input.note}}` |
   | `markRejected` | `Rejected` | `{{financeApproval.data.input.note}}` |

   `markApproved` runs on two paths. On the **Else** path, `financeApproval` doesn't run, so the expression falls back to `Auto-approved`.

6. Connect the **Else** handle of `needsApproval` and the **approved** handle of `financeApproval` to `markApproved`. Connect the **rejected** handle of `financeApproval` to `markRejected`.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/refund-workflow.png" alt="Refund Approval workflow with the Start, needsApproval, financeApproval, markApproved and markRejected nodes" />

#### 3. Trigger the Workflow

Trigger the workflow from an [application](/docs/workflows/triggers/app) or a [webhook](/docs/workflows/triggers/webhook), and pass the refund request's values as the workflow inputs.

#### 4. Approve the Refund

When a refund of more than $500 is submitted, the run waits at `financeApproval`. A member of the **Finance** group opens the request from the **Approvals** tab of the **Workflows** page, adds a note and clicks **Approve**.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/refund-approve.png" alt="Approval request for the refund with a note and Approve and Reject buttons" />

The run resumes and `markApproved` sets the status of the request to `Approved` and saves the note. A refund of $500 or less skips `financeApproval` and is saved with the note `Auto-approved`.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
