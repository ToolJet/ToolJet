---
id: responding-to-approvals
title: Responding to Approvals
---

<br/>

Approvers respond to the requests raised by **Human-in-the-loop** nodes from the **Approvals** tab of the **Workflows** page. Runs that wait for a decision can be tracked from the **Executions** tab.

## Approvals Tab

Pending requests are listed on the **Approvals** tab of the **Workflows** page. Approvers see the requests that list them. Users who can edit workflows see all requests in the workspace.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/approvals-tab.png" alt="Approvals tab listing a pending request" />

The list shows **Pending** requests by default. Use the filters to narrow the list by environment, workflow, status (**Pending**, **Resolved**, **Expired** or **Cancelled**), approver or date.

## Responding to a Request

1. Click the request to open it. The request shows its status, when it was raised, its deadline, the description and the approvers.
2. Fill in the input fields. Required fields are marked with `*`.
3. Click an outcome button, such as **Approve** or **Reject**.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/approval-request.png" alt="Approval request with input fields and Approve and Reject buttons" />

The run resumes as soon as the outcome is submitted. In the run's logs, the node shows **Human input received**, followed by the nodes on the chosen branch.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/run-resumed.png" alt="Logs of a resumed run showing the approved outcome and the recordApproval node" />

## Cancelling a Request

Workspace admins can click **Cancel request** on a pending request. Cancelling marks the request as **Cancelled** and fails the run.

## Monitoring Waiting Runs

Paused runs appear on the **Executions** tab of the **Workflows** page with the status **Waiting**. Filter by the **Waiting** status to see every run that is waiting on a decision. Click **Stop** to end a waiting run. Stopping a run also cancels its pending approval request.

<img className="screenshot-full img-full" src="/img/workflows/nodes/human-in-the-loop/executions-waiting.png" alt="Executions tab showing a run with the Waiting status" />
