---
id: share-app
title: Share Application
---

Once the application is released, it can be shared with the end users in multiple ways, including via a direct URL, through the ToolJet dashboard, or by embedding it into another application.

## Share Application via URL

Once the application is released, it can be accessed via a URL, and the URL slug can be customized. ToolJet also provides an option to make the application public or private.

- **Public Application**: Allows anyone on the internet to access the application without signing up for ToolJet. 
- **Private Application**: Private applications are restricted to workspace users with the necessary **[access permissions](/docs/user-management/role-based-access/access-control)**.

The latest released version of the application is always accessible through the same URL, ensuring a consistent access point across updates.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/url.png" alt="Share Application Modal"/>

### Authentication for Standalone Application URLs

When users access an application using a standalone URL, the entire experience stays within the context of that app, including login, logout, and session expiry.

#### Signing In

If a user is not logged in, they'll see a login page specific to that application. For example, **"Sign in to [App Name]"** instead of the generic workspace login page. After signing in, they are taken directly to the app.

All backend configurations such as SSO settings are inherited from the workspace, so no additional setup is required.

#### Signing Out and Session Expiry

When a user signs out or their session expires, they are redirected back to the same app's login page instead of workspace login page or the workspace dashboard. This ensures that users remain within the app's context at all times.

:::info
To trigger logout from within your app, use the [Logout action](/docs/actions/logout).
:::

## Access Application via Dashboard

Users can launch the released version of the application from the dashboard. The application can also be hidden from the dashboard for end users. Refer to the **[Access Control](/docs/user-management/role-based-access/access-control)** guide for more details.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/dashboard.png" alt="Access Application via Dashboard"/>

## Embed Application

ToolJet applications can be embedded into other web applications using iframes. To embed an application, make the app public, after which ToolJet will automatically generate an iframe code snippet for integration.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/embed.png" alt="Embed application using Iframe"/>

