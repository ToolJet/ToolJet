---
id: constants
title: Workspace Constants
---

ToolJet allows you to set workspace constants to store pre-defined values that can be used across your application to maintain consistency, facilitate easy updates, and securely store sensitive information.

Only **Workspace Admins** can create, update, or delete workspace constants. Workspace constants are specific to the workspace where they are created and cannot be accessed in other workspaces.

There are two types of constants:
1. **Global Constants:** These are predefined values that can be used across your applications within a workspace. They allow you to store frequently used values, such as API URLs, configuration settings, etc. and access them within the workspace.
2. **Secrets:** These are a specific type of workspace constants designed for securely storing sensitive information like API keys and database credentials. Secrets are masked and stored in encrypted format to prevent exposure to unauthorized users. <br/>
        **Note**: Secrets cannot be used in RunJS or RunPy queries.

## Usage of Workspace Constants

Workspace constants can be used for following:
- [Store Pre-Defined Values](#store-pre-defined-values)
- [Environment Specific Configurations](#environment-specific-configurations)
- [Server-Side Resolution and Security](#server-side-resolution-and-security)

### Store Pre-Defined Values

Workspace constants can be used to store predefined values that need to be used across the application or values that might need to be updated throughout the application. Sensitive informations can be stored as a secret which is a masked value and prevent exposure to unauthorized users.

### Environment Specific Configurations

ToolJet allows users to define environment-specific configurations by assigning different values to constants and secrets across various environments. This approach is essential for managing sensitive information, such as API keys, database credentials, and external service endpoints, which may differ between development, staging, and production environments. 

For example, you can configure unique API keys for each environment to ensure seamless integration and security.

<img className="screenshot-full" src="/img/security/constants/constants-secret/env-specific-const-v2.png" alt="Environment-Specific Constants"/>

### Server-Side Resolution and Security

Both workspace constants and secrets are resolved exclusively on the server side, preventing exposure to the client. To enhance security, all constants and secrets are encrypted before being stored in the database, providing an additional layer of protection for sensitive data.

## Creating Workspace Constants

To create workspace constants or secrets, follow these steps:

Role Required: **Admin**

1. Navigate to the Workspace Constants tab from the left sidebar in ToolJet dashboard. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-constants`)
    <img className="screenshot-full" src="/img/security/constants/constants-secret/dashboard.png" alt="Environment-Specific Constants"/>

2. Click on **Create new constant** button to open the configuration drawer.
    <img className="screenshot-full" src="/img/security/constants/constants-secret/create-new-v2.png" alt="Create New Constant"/>

3. Enter a name and value for the workspace constant.

4. Select the type of workspace constant:
    - **Global constant**
    - **Secret**

5. Click the **Add constant** button to save.

:::info
Once a constant or secret is created, its type cannot be changed. You'll need to delete it and create a new one of the desired type.
:::

## Accessing Workspace Constants

### Global Constants

Global constants can be accessed using the syntax `{{constants.constant_name}}` can be used in the [app builder](#in-app-builder), data sources, data queries, and workflows.

#### In App Builder

Inside the App Builder, you can find all the constants inside the inspector element on the left sidebar.

<img className="screenshot-full" src="/img/security/constants/constants-secret/global-const-app.png" alt="Use Global Constants Inside App Builder"/>

#### In Data Sources and Queries

Global constants in ToolJet allow you to define values once and reuse them across your data sources and queries.

- Data Source Connection Form:
    <img className="screenshot-full" src="/img/security/constants/constants-secret/golbal-constants-data-source-connection-v2.png" alt="Use Global Constants Data Source Connection Form"/>

- Inside Queries in Query Manager:
    <img className="screenshot-full" src="/img/security/constants/constants-secret/global-constants-queries.png" alt="Use Global Constants Inside Queries in Query Manager"/>

### Using Secrets

Secrets are designed for secure storage of sensitive information like API keys, database credentials, and can be access using the syntax `{{secrets.secret_name}}`.

#### In Data Sources and Queries

In Data Sources and Queries, secret values are masked in the frontend and can only be viewed in the Workspace Constants dashboard.

- Data Source Connection Form:
    <img className="screenshot-full" src="/img/security/constants/constants-secret/secrets-data-source-connection-v2.png" alt="Use Secrets in Data Source Connection Form"/>

- Inside Queries in Query Manager:
    <img className="screenshot-full" src="/img/security/constants/constants-secret/secrets-queries.png" alt="Use Secrets Inside Queries in Query Manager"/>

:::info
Secrets cannot be used within the App Builder or workflows.
:::

## Best Practices

- Utilize global constants to maintain consistency by storing frequently used values across the application.
- Securely store secrets to prevent unauthorized access and exposure in the codebase or frontend.
- Regularly audit and update constants and secrets to ensure security, compliance, and relevance.

## Characteristics and Usage

|   Characteristic   |       Global Constants        |         Secrets           |
|--------------------|:-----------------------------:|:-------------------------:|
| App Builder        |             ✅                |           ❌              |
| Data Sources       |             ✅                |           ✅              |
| Data Queries       |             ✅                |           ✅              |
| Workflows          |             ✅                |           ❌              |
| Encrypted in DB    |             ✅                |           ✅              |
| Masked in Frontend |             ❌                |           ✅              |
| Naming Convention  | `{{constants.constant_name}}` | `{{secrets.secret_name}}` |
