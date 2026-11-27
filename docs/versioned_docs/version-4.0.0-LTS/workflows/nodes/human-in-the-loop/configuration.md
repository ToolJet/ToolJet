---
id: configuration
title: Human-in-the-loop Configuration
sidebar_label: Configuration
---

<br/>

The configuration panel of the **Human-in-the-loop** node sets the message shown to the approver, who can respond, the outcomes they can choose, and how long the run waits for a decision.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/general-approvers-outcomes.png" alt="Human-in-the-loop configuration showing the General, Approvers and Outcomes sections" />

## General

| Setting | Description |
|:--------|:------------|
| **Description** | The message shown to the approver, such as what to review and why. Supports `{{ }}` to include data from earlier nodes, for example `Review the expense of ${{getExpense.data.amount}} from {{getExpense.data.employee}}.` |

## Approvers

Approvers are the people who can respond to the request and who receive the approval email. Use any combination of the following:

| Setting | Description |
|:--------|:------------|
| **Users** | Workspace users who can approve. |
| **Groups** | Custom groups whose members can approve. |
| **Dynamic (fx)** | An expression that resolves to an email address or an array of email addresses, for example `{{ getManager.data.email }}`. Use this when the approver depends on the data in the run. |

:::info
Workspace admins can respond to any approval request, even when they are not listed as approvers. Only active workspace users can respond.
:::

## Outcomes

Outcomes are the choices the approver can make. Each outcome appears as a button on the approval request and as a separate output handle on the node. By default, the node has two outcomes: `approved` (**Approve**) and `rejected` (**Reject**).

| Field | Description |
|:------|:------------|
| **Key** | The identifier of the outcome, returned in the node output as `outcome`. Keys must be unique. |
| **Label** | The text shown on the outcome button. |
| **Color** | The color of the outcome button. |

Click **+ Add outcome** to add more choices, such as **Request changes** or **Escalate**. At least one outcome is required. Connect each outcome handle to the node that should run when that outcome is chosen.

## Input Fields

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

## Timeout

By default, a run waits for a decision indefinitely. Turn on **Enable timeout** to set a deadline.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/timeout-reminders-notification.png" alt="Timeout, Reminders and Notification sections" />

| Setting | Description |
|:--------|:------------|
| **Duration** | How long to wait for a decision, in seconds, minutes, hours or days. The default is 1 day. |
| **On expire** | **Fail** marks the request as expired and fails the run. **Branch** continues the run with the outcome selected in **Timeout outcome**. |
| **Timeout outcome** | The outcome to use when the deadline passes. Shown only when **On expire** is set to **Branch**. If no outcome is selected, the run fails when the timeout expires. |

## Reminders

Reminders resend the approval email a set time after the request is created, whether or not a timeout is set. Click **+ Add reminder** and set the delay. A reminder set at or after the timeout duration never fires.

## Notification

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
