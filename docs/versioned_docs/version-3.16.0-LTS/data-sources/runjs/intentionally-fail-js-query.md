---
id: intentionally-fail-js-query
title: Intentionally Throwing an Error in RunJS for Debugging
---

In this step-by-step guide, we'll walk you through the process of creating a RunJS query that intentionally throws an error for debugging purposes.

### Creating the Error-Throwing RunJS Query

1. Create a new RunJS query by clicking the `+ Add` button on the query panel.

2. Paste the following code into the RunJS query editor. This code utilizes the `ReferenceError` constructor to intentionally generate an error.
    ```js
    throw new ReferenceError('This is a reference error.'); 
    ```

### Adding an Event Handler for Failure

3. Now, enhance the query by adding an event handler that will display an alert when the query fails.

4. Click the "Run" button to execute the query and observe the intentional error being thrown.

Refer to the screencast below:

<img className="screenshot-full" src="/img/how-to/failjs/failjsn.gif" alt="reate a new RunJS query" />

By following these steps, you can effectively simulate errors in your RunJS queries, aiding in the debugging process and improving the overall robustness of your code.