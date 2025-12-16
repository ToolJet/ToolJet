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

Loop node has three important components:
1. Loop Array
2. Looped function
3. Value

- Loop array refers to the array we want to run the loop node over. The syntax to set the loop array is:

```js
return <your-array>;
```

- Looped function lets us configure the action we want to perform on the array.

- Value represents the item you’re currently processing in the loop. You can access it with the ```{{value}}``` keyword.
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/example.png" alt="Loop Node Example" />

## Example 1 - Bulk Invoice Reminder Workflow
Consider a workflow that automatically sends a mail to the vendors with pending payments.  
Here's an overview of the workflow:
<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/sneakPeek.png" alt="Invoice Reminders Sneak Peek" />


**Step 1 - Get list of vendors.**  
First, add a ToolJet DB node (or any other data source tou prefer) to fetch a list of vendors who have unpaid invoices. Name this node ```fetchInvoices```.
Here's a sample element from the list:
```js
{
    "id":1,
    "vendor_name":"Example Enterprise",
    "vendor_email":"example.enterprise@gmail.com",
    "amount":1000,
    "status":"pending"
}
```

**Step 2 - Add a loop node to process the vendors.**  
Now connect a loop node after the *fetchInvoices* node.
In the Loop array input, set the value to:
```js
return fetchInvoices.data; // We created fetchInvoices in step 1.   
```
This tells the Loop node to run once for every vendor in the list.  
Inside the Looped function, you can choose what action should happen for each vendor.
In this example, we add an SMTP node that sends a payment reminder email to the vendor.

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/loop/invoiceReminder/mailLoop.png" alt="Mail Loop" />

## Example 2 - Process Orders and Update Inventory
