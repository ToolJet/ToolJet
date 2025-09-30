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
