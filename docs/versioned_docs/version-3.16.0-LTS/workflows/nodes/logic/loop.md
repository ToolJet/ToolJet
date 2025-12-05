---
id: loop
title: Loop Node
---

<br/>

The **Loop** node allows you to iterate over an array of items and perform actions on each item within your workflow. It is useful when you need to process multiple records, send bulk notifications, or execute repetitive tasks dynamically.

With the Loop node, you can:
- Iterate through arrays returned from APIs or database queries
- Perform actions on each item individually (e.g., send emails, create tasks)
- Combine with other nodes to aggregate results or handle errors per item
- Automate bulk operations efficiently without manual intervention

Loop node has three important components -
1. Loop Array
2. Looped function
3. Value

- Loop array refers to the array we want to run the loop node over. The syntax to set the loop array is -

```js
return <your-array>;
```

- Looped function lets us configure the action we want to perform on the array.

- Value on the other hand refers to the value of the element in the current iteration over the array.
To access it, you can use the ```{{value}}``` keyword.
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/example.png" alt="Loop Node Example" />

## Example - Bulk Invoice Reminder Workflow
Let's consider a workflow that automatically sends a mail to the vendors with pending payments.

Here's a sneak peek of the workflow.
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/sneakPeek.png" alt="Invoice Reminders Sneak Peek" />


#### Step 1 - Create an outgoing ToolJet DB node (or any other data source of your choice) to fetch the array of vendors with pending payments, and name it ```fetchInvoices```.

#### Step 2 - Create an outgoing ```Loop node``` from your data node
In the Loop array input, set the value to
```js
return fetchInvoices.data; // We created fetchInvoices in step 1.   
```
Then, in the Looped function, you can configure SMTP or any other action of your choice to perform over the array. Here's an example -

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/mailLoop.png" alt="Mail Loop" />

