---
id: overview
title: Human-in-the-loop Node
sidebar_label: Overview
---

<br/>

The **Human-in-the-loop** node pauses a workflow run until a person reviews it and picks an outcome, such as **Approve** or **Reject**. Each outcome has its own output handle, so the chosen outcome decides which branch the run continues on. The approver can also fill in input fields, and the values are passed to the nodes that follow.

Use this node when a workflow needs a person's decision before it continues, for example to approve an expense, review an AI-generated reply before it is sent, or confirm a bulk delete before it runs.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/hitl-workflow.png" alt="Expense approval workflow with a Human-in-the-loop node branching to approve and reject paths" />

## Adding the Node

1. Drag a connection from the output handle of an existing node and release it on the canvas.
2. Select **Human-in-the-loop** from the node list.
3. Click the node to open its configuration panel. See [Configuration](/docs/workflows/nodes/human-in-the-loop/configuration) for the settings.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/add-node.png" alt="Node list with the Human-in-the-loop option" />

:::info
A workflow that contains a Human-in-the-loop node can't be run from another workflow through the **Run Workflow** node.
:::

## How a Run Waits for Approval

When a run reaches the Human-in-the-loop node:

1. The run pauses and its status changes to **Waiting**. In the workflow editor, the **Logs** panel shows **Waiting for human input**.
2. Each approver receives an email with a link to the **Approvals** tab.
3. If a notification webhook is configured, it is called.
4. When an approver picks an outcome, the run resumes from the output handle of that outcome. Nodes connected to the other outcome handles are skipped.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/run-waiting.png" alt="Logs panel showing a run waiting for human input" />

:::info
Approval emails need SMTP to be configured for the instance.
:::

### Effect on Triggers

A run started by a webhook or an application returns a response as soon as it starts waiting. The response contains the run ID and the approval request ID, not the result of the workflow:

```json
{ "executionStatus": "waiting", "executionId": "...", "requestId": "..." }
```

The nodes after the Human-in-the-loop node run only after the decision, and their output isn't sent back to the caller. To act on the decision, connect nodes to the outcome handles that do the work, such as updating a record or sending a message.

- **Webhook trigger**: The webhook responds with status code `202` and the body above. The **Response** node output isn't returned. A system that calls the webhook should treat a `202` as a pending approval, not as a completed run.
- **Application trigger**: The **Run Workflow** query returns the body above as its data, and its **Query Success** events run right away. Check `executionStatus` before showing the result as final.
- **Scheduled trigger**: While a run is waiting for a decision, later runs of the same schedule are skipped, not queued. A request that stays pending stops the schedule until it is resolved. To keep the schedule running, enable a [timeout](/docs/workflows/nodes/human-in-the-loop/configuration#timeout) shorter than the schedule interval.
