---
id: public-app
title: Public Application
---

# Embedding a Public ToolJet Application

ToolJet applications can be embedded publicly that is accessible to anyone without requiring authentication. This is ideal when the embedded application does not expose sensitive data and is intended for broad access.

Public embeds are commonly used for feedback forms, marketing dashboards, surveys, or customer-facing widgets where ease of access is more important than access control.

#### When to Use a Public Application

- The data displayed or collected is **non-sensitive**
- The app is intended for **external** or **anonymous** users

#### When an Application is Embedded Publicly

- The app is rendered inside an iframe
- No authentication or login is required
- Anyone with the embed URL can view and interact with the app

## Example

For example, if you run an inventory management portal and want to share stock levels publicly — for vendors, partner stores, or customers — you can embed the ToolJet inventory dashboard publicly on your portal. It lets viewers see item names, quantities, and availability, and filter by “Available” or “Out of Stock,” providing a transparent, interactive view of your inventory without requiring any login.

<iframe width="100%" height="650" src="https://app.tooljet.com/applications/docs-inventory-example" title="ToolJet app - docs-inventory-example" frameborder="0" allowfullscreen></iframe>

<br/><br/>

By embedding the application in the portal, you can achieve:
- Reduce context switching by letting users check inventory without leaving the portal
- Faster decision-making with immediate access to stock levels
- Transparent collaboration with partners or vendors in real time
- Interactive insights through filtering, highlighting available and out-of-stock items
- Consistent public access without requiring logins or additional tools

## Steps to Embed a Public Application

1. [Create](/docs/getting-started/quickstart-guide) and [release](/docs/development-lifecycle/release/release-rollback/) your ToolJet application.
2. Click the Share button on the top-right corner of the application builder.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/share.png" alt="Click on the share button on the top right." />
3. Enable **Make application public** by toggling it on.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/public-app.png" alt="Make Application Public" />
4. Copy the iframe code from the **Embedded app link** and paste it on your portal or web page wherever you want to embed the application.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/embed-apps/iframe.png" alt="Make Application Public" />
