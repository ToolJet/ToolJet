---
id: logout
title: Logout
---

The **Logout** action logs the current user out of their active ToolJet workspace session. It clears all locally stored session data and redirects the user to the login page. Use this action to build secure logout flows triggered by buttons, timers, or any component event.

## Configuration

| Parameter | Description                                              | Default          |
| --------- | -------------------------------------------------------- | ---------------- |
| Debounce  | Time in milliseconds to wait before executing the action | Empty (no delay) |

Set a numeric value in the **Debounce** field to delay the logout. For example, entering `300` will trigger the logout after 300ms.

<img className="screenshot-full img-s" src="/img/actions/logout/logout-v3.png" alt="ToolJet - Action reference - Logout" />

## Behavior

- Clears all locally stored session data.
- Redirects the user to the workspace login page upon logout.

:::info Standalone App URLs
If your application is accessed via a standalone URL, logging out redirects the user back to the app-specific login page rather than the workspace login page. See [Authentication for Standalone Application URLs](/docs/development-lifecycle/release/share-app#authentication-for-standalone-application-urls) for more details.
:::

## Triggering via RunJS

You can trigger the logout action programmatically from a RunJS query:

```js
await actions.logout();
```

:::info
For a full guide on triggering actions from RunJS, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
