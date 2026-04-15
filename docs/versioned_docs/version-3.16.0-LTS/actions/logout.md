---
id: logout
title: Logout
---

This action allows you to log out of the application (ToolJet).

:::info Standalone App URLs
If your app is accessed via a standalone URL, logging out will redirect the user back to the app-specific login page instead of the workspace login page. See [Authentication for Standalone Application URLs](/docs/development-lifecycle/release/share-app#authentication-for-standalone-application-urls) for more details.
:::

Debounce field is empty by default, you can enter a numerical value to specify the time in milliseconds after which the action will be performed. For example: `300`

:::info
You can also trigger actions from the **JavaScript code**. Check it out [here](/docs/how-to/run-actions-from-runjs).
:::

<img className="screenshot-full img-l" src="/img/actions/logout/logout2.png" alt="ToolJet - Action reference -  Logout" />