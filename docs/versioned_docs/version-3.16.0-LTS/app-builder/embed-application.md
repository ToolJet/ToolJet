---
id: embed-application
title: Embedding ToolJet Applications
---

Embedding a ToolJet application allows you to deliver interactive dashboards, tools, or workflows directly inside other websites or internal portals. Instead of switching between tools, users can interact with your application where they already work.

ToolJet applications can be embedded for:
- **Customer facing dashboards** – Display personalized analytics directly inside your platform.
- **Partner or vendor portals** – Provide external stakeholders with secure, scoped access to specific applications.
- **Internal productivity widgets** – Place internal tools inside intranet pages, wikis, or CRM systems.

By embedding applications, you reduce context switching, accelerate user adoption, and keep critical workflows within your product ecosystem.

## Data Security

When embedding applications, ToolJet ensures that only the right users can access your app and its data. You can choose from two security modes based on your use case.

| **Feature** | **Public Applications** | **Private & Data-Sensitive Applications** |
| ------------| ----------------------- | ------------------------------------------|
| **Access Control** | None – anyone with the embed link or iframe can view | Requires a valid Personal Access Token (PAT) to load the app. |
| **Granularity** | Not applicable | Tokens can be scoped to individual user and application |
| **Best For** | Public dashboards, demos, or open-data applications | Authenticated portals, customer-specific views, internal tools |
| **Example** | Live product status page displaying uptime and incident history | Embedded customer billing dashboard showing only that customer’s invoices |
| **Reference** | [Share Application](/docs/development-lifecycle/release/share-app#embed-application) | [Personal Access Token](/docs/user-management/authentication/self-hosted/pat#generate-pat) |
