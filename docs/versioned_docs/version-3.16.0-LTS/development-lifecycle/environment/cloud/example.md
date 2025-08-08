---
id: example-configuration
title: Example Configuraiton
---

This guide will walk you through setting up a multi-environment in ToolJet with a practical example. Imagine **Nexora Enterprises**, a company building an internal application using ToolJet.

## Configuring Data Source

In ToolJet, you can configure data sources for each environment, allowing your application to connect to different databases or APIs based on the environment. 

In this case, the company uses data from a Postgres data source for their ToolJet apps, with separate databases for development, staging, and production environments. They need to configure the Postgres data source for each environment in the Data Sources section. For more details, refer to the [Data Source](/docs/data-sources/overview) Documentation.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/selfhosted-datasource.png" alt="self-hosted-env-concept" />

## Configuring Constants

The company also uses different global and secret constants for each environment. Global Constants are reusable values that can be applied consistently across the product, while Secrets are used for securely storing sensitive data. These can be configured in the Workspace Constants section. For more details, check the [Workspace Constants and Secrets](/docs/security/constants/) Documentation.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/cloud-constants.png" alt="self-hosted-env-concept" />

## Multi-Environment Setup in ToolJet
- The company can configure data sources and constants for each environment, and ToolJet will automatically use the appropriate ones based on the target environment.
- Now developers can start building applications in the **development environment**, where they create and iterate on new features. In this environment, they have access to the development database, which is configured during data source setup.
- Once the application is ready, it moves to the **staging environment**, where the QA team tests it thoroughly. If any bugs or feedback arise, developers create a new version, implement the necessary changes, and promote the updated application back to staging for further testing.
- The data sources for each environment will be connected based on the configuration set in the previous step.
- For details on managing versions, check the **Version Control Documentation**.
- After successful testing, the application is promoted to **production** and released, making it available to end users. This environment uses the production database set up during data source configuration.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/appbuilder.png" alt="self-hosted-env-concept" />