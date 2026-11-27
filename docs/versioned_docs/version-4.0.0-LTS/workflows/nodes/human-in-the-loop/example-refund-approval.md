---
id: example-refund-approval
title: "Example: Refund Approval"
---

<br/>

This example builds a workflow that approves customer refund requests. Refunds of $500 or less are approved immediately. Larger refunds pause at a Human-in-the-loop node until a member of the **Finance** group approves or rejects them. The decision and the approver's note are saved to the request in a ToolJet Database table.

## 1. Create the Refund Requests Table

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

## 2. Route Refunds Over $500 to Finance

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

## 3. Pass Refund Requests to the Workflow

Trigger the workflow from an [application](/docs/workflows/triggers/app) or a [webhook](/docs/workflows/triggers/webhook), and pass the refund request's values as the workflow inputs.

## 4. Approve a Refund from the Approvals Tab

When a refund of more than $500 is submitted, the run waits at `financeApproval`. A member of the **Finance** group opens the request from the **Approvals** tab of the **Workflows** page, adds a note and clicks **Approve**.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/refund-approve.png" alt="Approval request for the refund with a note and Approve and Reject buttons" />

The run resumes and `markApproved` sets the status of the request to `Approved` and saves the note. A refund of $500 or less skips `financeApproval` and is saved with the note `Auto-approved`.
