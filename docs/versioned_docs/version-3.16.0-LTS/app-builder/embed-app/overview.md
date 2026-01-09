---
id: overview
title: Overview
---

Embedding a ToolJet application allows you to deliver interactive dashboards, tools, or workflows directly inside other websites or internal portals. Instead of switching between tools, users can interact with your application where they already work, improving efficiency and engagement.

ToolJet applications can be embedded in a variety of scenarios:
- **Customer facing dashboards** – Display personalized analytics directly inside your platform.
- **Partner or vendor portals** – Provide external stakeholders with secure, scoped access to specific applications.
- **Internal productivity widgets** – Place internal tools inside intranet pages, wikis, or CRM systems.

By embedding applications, you reduce context switching, accelerate user adoption, and keep critical workflows within your product ecosystem.

## Example

For example, we have embedded a **Documentation Feedback** application directly in this document. Users can submit feedback without switching tabs, making the process faster and more efficient. On the backend, you can create a separate admin app on ToolJet to analyze the results or set up a [ToolJet workflow](/docs/workflows/overview) to perform automated actions based on the feedback.

<iframe width="100%" height="650" src="https://app.tooljet.com/applications/docs-embed-app-example" title="ToolJet app - docs-embed-app-example" frameborder="0" allowfullscreen></iframe>

<br/><br/>

By embedding the feedback form here, we achieved several benefits:

- **Faster and easier submissions**: Users can provide feedback instantly, reducing friction and improving response rates.
- **Centralized data collection**: All responses are captured in real time in a ToolJet-connected database, eliminating the need for manual tracking.
- **Actionable insights**: Teams can create a separate admin app or workflow to analyze responses, view trends, and take immediate action based on user feedback.
- **Enhanced engagement**: By keeping the interaction within the documentation, users feel more involved, and important feedback is less likely to be missed.

## Public vs Private Embedded Applications

ToolJet allows you to embed applications as either public or private, depending on who should have access and how sensitive the data is.

| Feature            | Public Embed                                              | Private Embed                                                     |
|:------------------ |:--------------------------------------------------------- |:----------------------------------------------------------------- |
| **Access**         | Anyone with the embed link or iframe can view             | Restricted to authorized users only                               |
| **Authentication** | Not required  | Required (Embed Application will follow the SSO of host application) |
| **Granularity** | Not applicable | Tokens can be scoped to individual user and application |
| **Use Cases**      | Marketing dashboards, open forms, customer-facing widgets | Internal dashboards, partner portals, sensitive data applications |
| **How to Embed**   | [Public Application](/docs/app-builder/embed-app/public-app) | [Private Application](/docs/app-builder/embed-app/private-app) |
