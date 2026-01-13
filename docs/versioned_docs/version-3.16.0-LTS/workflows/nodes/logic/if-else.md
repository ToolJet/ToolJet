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

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/example.png" alt="If Else Node Example" />

## Example: Reimbursement Approval Workflow by Amount

Consider a workflow for issuing reimbursements. If the amount is less than $500, it auto approves, else the Finance Department receives a mail for approval.  

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/if/reimbursementApproval/sneakPeek.png" alt="Reimburement Approval Sneak Peek" />

#### Input  
For this example, the data that the workflow receives is in the following format:
```js
{
  "employeeID": 1,
  "amount": 2000,
  "reason": "Travel"
}
```

#### Add the If Condition Node
- Create an outgoing ```If condition``` node from the trigger node.**  
- Add the following condition to the node: <br /> <br />
  ```js 
  startTrigger.params.amount < 500 
  ```
Click on *Preview* to see what the node will evaluate into.

  <img className="screenshot-full img-m" src="/img/workflows/nodes/logic/if/reimbursementApproval/amountCondition.png" alt="If condition" />


Now you can create success or failure actions based on your requirements. In this example, when the condition evaluates to true, the reimbursement is auto-approved. When it evaluates to false, the workflow continues to notify the Finance Department.

