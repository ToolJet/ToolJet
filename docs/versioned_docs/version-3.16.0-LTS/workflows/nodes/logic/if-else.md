---
id: if-else
title: If Condition Node
---

<br/>

The **If Condition** node lets you create conditional logic in your workflow. It evaluates a JavaScript expression or condition and routes the workflow execution based on whether the condition is true or false. This allows you to control the flow dynamically, enabling different paths for different data, events, or user inputs.

Common use cases include:

- Branching workflows based on user input or API response values
- Executing different sets of actions depending on data conditions
- Handling success and error paths separately
- Implementing complex decision-making logic

When the condition evaluates to true, the outgoing node connected to the green arrow will be executed. If it is false, the outgoing node connected to the red arrow will be executed.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/example.png" alt="IF Else Node Example" />

## Example: Reimbursement workflow

Let's consider a workflow for issuing reimbursements for a company. If the amount is less than $500, it auto approves it; else it mails the CFO for approval.

Here's a sneak peek to the workflow
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/reimbursementApproval/sneakPeek.png" alt="Reimburement Approval Sneak Peek" />

#### Sample Input (for demonstration only)

For this example, let's consider that the data is in the following format.
```js
{
  "employeeID": 1,
  "amount": 2000,
  "reason": "Travel"
}
```

#### Create an outgoing ```If condition``` node from the trigger node
Add the following condition to the node
```js 
startTrigger.params.amount < 500 
```
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/reimbursementApproval/amountCondition.png" alt="If condition" />

---

You can click on *Preview* to see what the node will evaluate into.
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/reimbursementApproval/preview.png" alt="Preview" />


Now you can create success or failure actions based on your choice and requirement. These can be SMTP nodes, database operations or REST API calls.

