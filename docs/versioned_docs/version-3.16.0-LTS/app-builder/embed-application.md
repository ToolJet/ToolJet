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

### Embedding Public Applications

Use this option if your application contains no sensitive or user-specific data.
- **Access control**: None – anyone with the embed link or iframe can view.
- **Best for**: Public dashboards, demos, or open-data applications.
- **Example**: A live product status page displaying uptime and incident history.

Refer to the [Share Application](/docs/development-lifecycle/release/share-app#embed-application) guide for instructions on embedding public applications.

### Embedding Private and Data Sensitive Applications

Use this option for secure, user-specific embedding.
- **Access control**: Requires a valid PAT to load the app.
- **Granularity**: Tokens can be scoped to individual user and application.
- **Best for**: Authenticated portals, customer-specific views, and internal tools.
- **Example**: An embedded customer billing dashboard showing only that customer’s invoices.

Refer to [Personal Access Token](/docs/user-management/authentication/self-hosted/pat#generate-pat) guide to learn how to generate a PAT and embed private applications.
