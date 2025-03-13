---
id: intentionally-fail-js-query
title: Intentionally Throwing an Error in RunJS for Debugging
---
<div style={{paddingBottom:'24px'}}>

In this step-by-step guide, we'll walk you through the process of creating a RunJS query that intentionally throws an error for debugging purposes.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Creating the Error-Throwing RunJS Query

1. Create a new RunJS query by clicking the `+ Add` button on the query panel.

2. Paste the following code into the RunJS query editor. This code utilizes the `ReferenceError` constructor to intentionally generate an error.
    ```js
    throw new ReferenceError('This is a reference error.'); 
    ```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Adding an Event Handler for Failure

3. Now, enhance the query by adding an event handler that will display an alert when the query fails.

4. Click the "Run" button to execute the query and observe the intentional error being thrown.

Refer to the screencast below:

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/failjs/failjsn.gif" alt="reate a new RunJS query" />
</div>

</div>

By following these steps, you can effectively simulate errors in your RunJS queries, aiding in the debugging process and improving the overall robustness of your code.