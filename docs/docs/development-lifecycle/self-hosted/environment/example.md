---
id: example
title: Environment - Example
---

This guide will walk you through setting up a multi-environment workflow in ToolJet with a practical example. Imagine **Nexora Enterprises**, a company building an internal application using ToolJet.

**Configuring Data source**

In ToolJet, you can configure data sources for each environment, allowing your application to connect to different databases or APIs based on the environment. 

In this case, the company uses data from a Postgres data source for their ToolJet apps, with separate databases for development, staging, and production environments. They need to configure the Postgres data source for each environment in the Data Sources section. For more details, refer to the [Data Source Documentation](http://d).


**Configuring constants**

The company also uses different global and secret constants for each environment. Global Constants are reusable values that can be applied consistently across the product, while Secrets are used for securely storing sensitive data. These can be configured in the Workspace Constants section. For more details, check the [Workspace Constants and Secrets](http://s) Documentation.

**Multi-Environment Setup in ToolJet**

- The company's developers can start building applications in the **development environment**, where they create and iterate on new features.
- Once the application is ready, it moves to the **staging environment**, where the QA team tests it thoroughly. If any bugs or feedback arise, developers create a new version, implement the necessary changes, and promote the updated application back to staging for further testing.
- The data sources for each environment will be connected based on the configuration set in the previous step.
- For details on managing versions, check the **Version Control Documentation**.After successful testing, the application is promoted to **production**, making it available to end users.

### Impacted behavior with environment permission 

Each environment has a different impact on your application. Please refer the following table for details.

| Action             | Development | Staging | Production |
|--------------------|------------|---------|------------|
| Edit versions     | ✔️         | ❌      | ❌         |
| Rename versions   | ✔️         | ❌      | ❌         |
| Delete versions   | ✔️         | ❌      | ❌         |
| Create new versions | ✔️      | ❌      | ❌         |
| Promote           | ✔️         | ✔️      | -          |
