---
sidebar_position: 6
---

# Adding actions

ToolJet supports several actions that can be invoked as the handler for any `event` that is triggered in an application.

## To add actions

To attach an action for component events, click on the component's handle, and then click on the `Add handler` button on the
inspector panel available on the right side.  
  
To attach an action for query events, select the query, go to the `advanced` tab and then click on the `Add handler` button.

## Available actions

Some of the actions that ToolJet Support are

   Action| Description|
   ----| -----------  |
   Show alert | Show an alert message as a bootstrap toast           |
   Run query | Run any of the data queries that you have created           |
   Open webpage | Go to another webpage in a new tab          |
   Goto app | Go to another ToolJet application          |
   Show modal | Open any modal that you've added          |
   Close modal | Close any modal that you've added if its already open          |
   Copy to clipboard | Copy any available text that you see on the application to clipboard          |
   Set localStorage | Set a key and corresponding value to localStorage          |
   Generate file | Construct file using data available in your application and let the user download it          |