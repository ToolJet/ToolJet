---
id: public-app
title: Public Application
---

# Embedding a Public Application

Public applications allow you to embed a ToolJet app that is accessible to anyone without requiring authentication. This is ideal when the embedded application does not expose sensitive data and is intended for broad access.

Public embeds are commonly used for feedback forms, marketing dashboards, surveys, or customer-facing widgets where ease of access is more important than access control.

#### When to Use a Public Application

- The data displayed or collected is **non-sensitive**
- The app is intended for **external** or **anonymous** users

#### When an application is embedded publicly:

- The app is rendered inside an iframe
- No authentication or login is required
- Anyone with the embed URL can view and interact with the app

------------


Once the application is released, it can be shared with the end users in multiple ways, including via a direct URL, through the ToolJet dashboard, or by embedding it into another application.

## Share Application via URL

Once the application is released, it can be accessed via a URL, and the URL slug can be customized. ToolJet also provides an option to make the application public or private.

- **Public Application**: Allows anyone on the internet to access the application without signing up for ToolJet. 
- **Private Application**: Private applications are restricted to workspace users with the necessary **[access permissions](/docs/user-management/role-based-access/access-control)**.

The latest released version of the application is always accessible through the same URL, ensuring a consistent access point across updates.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/url.png" alt="Share Application Modal"/>

## Access Application via Dashboard

Users can launch the released version of the application from the dashboard. The application can also be hidden from the dashboard for end users. Refer to the **[Access Control](/docs/user-management/role-based-access/access-control)** guide for more details.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/dashboard.png" alt="Access Application via Dashboard"/>

## Embed Application

ToolJet applications can be embedded into other web applications using iframes. To embed an application, make the app public, after which ToolJet will automatically generate an iframe code snippet for integration.

<img className="screenshot-full" src="/img/development-lifecycle/release/share/embed.png" alt="Embed application using Iframe"/>

