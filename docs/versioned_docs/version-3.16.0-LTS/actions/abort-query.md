---
id: abort-query
title: Abort Query
---

This action stops an in-flight query, one that was triggered via **Run** or **Preview** and is still waiting for a response, when an event occurs.

Debounce field is empty by default, you can enter a numerical value to specify the time in milliseconds after which the action will be performed. Example: `300`

:::info
You can also trigger actions from the **JavaScript code**. Check it out [here](/docs/actions/run-actions-from-runjs/).
:::

:::note
Abort only cancels the pending request on the client. If the data source (for example, a database) has already started processing the query, it may continue running on its end until it completes on its own.
:::

Abort is not available for **RunJS**, **RunPy**, and **Workflow** queries, since these don't execute as cancellable network requests.
