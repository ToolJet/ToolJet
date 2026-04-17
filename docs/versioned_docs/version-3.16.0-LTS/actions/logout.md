---
id: logout
title: Logout
---

This action logs you out of your current ToolJet workspace session.

:::info Standalone App URLs
If your app is accessed via a standalone URL, logging out will redirect the user back to the app-specific login page instead of the workspace login page. See [Authentication for Standalone Application URLs](/docs/development-lifecycle/release/share-app#authentication-for-standalone-application-urls) for more details.
:::

The **Debounce** field is empty by default. Enter a numerical value (in milliseconds) to delay the action execution. For example, entering `300` will trigger the logout after 300ms.

:::info
You can also trigger this action programmatically using **JavaScript code**. Learn more [here](/docs/how-to/run-actions-from-runjs).
:::

<img className="screenshot-full img-l" src="/img/actions/logout/logout2.png" alt="ToolJet - Action reference - Logout" />