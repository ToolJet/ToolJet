---
id: constants
title: Workspace Constants and Secrets
---

**Workspace Constants:** These are predefined values that can be used across your applications within a workspace. They allow you to store frequently used values, such as API keys, URLs, configuration settings and access them within the workspace.

**Secrets:** These are a specific type of workspace constants designed for securely storing sensitive information like API keys and database credentials. Secrets are masked in the frontend to prevent exposure to unauthorized users.

<div style={{paddingBottom:'24px'}}>

## Characteristics and Usage

| Characteristic | Global Constants | Secrets |
|----------------|-------------------|---------|
| App Builder    | ✔️                | ❌       |
| Data Sources   | ✔️                | ✔️       |
| Data Queries   | ✔️                | ✔️       |
| Workflows      | ✔️                | ❌       |
| Encrypted in DB| ✔️                | ✔️       |
| Masked in FE   | ❌                | ✔️       |
| Naming Convention | `{{constants.constant_name}}` | `{{secrets.secret_name}}` |

</div>
:::info
Secrets cannot be used in RunJS or RunPy queries.
:::


<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Environment-Specific Configurations

ToolJet allows users to define environment-specific configurations by assigning different values to constants and secrets across various environments. This approach is essential for managing sensitive information, such as API keys, database credentials, and external service endpoints, which may differ between development, staging, and production environments. 

For instance, you can configure unique API keys for each environment to ensure seamless integration and security.

</div>

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/env-specific-const-v2.png" alt="Environment-Specific Constants"/>
</div>

<div style={{paddingTop:'24px'}}>

## Server-Side Resolution and Security

Both workspace constants and secrets are resolved exclusively on the server side, preventing exposure to the client. To enhance security, all constants and secrets are encrypted before being stored in the database, providing an additional layer of protection for sensitive data.

</div>

<div style={{paddingTop:'24px'}}>

## Access Control

**Admins** can only create, update, and delete constants and secrets. Additionally, workspace constants and secrets are confined to the workspace in which they are created and cannot be accessed or shared across different workspaces.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating Workspace Constants and Secrets

To create workspace constants or secrets, follow these steps:

1. Navigate to the ToolJet Dashboard and select the Workspace Constants tab from the left sidebar.
2. Click on **Create new constant** button to open the configuration drawer.
3. Enter a name and value for the constant or secret.
4. Select one of the following types:
    - **Global constant**
    - **Secret**
5. Click the **Add constant** button to save.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/create-new-V2.png" alt="Create New Constant"/>
</div>

:::info
Once a constant or secret is created, its type cannot be changed. You'll need to delete it and create a new one of the desired type.
:::

</div>

<div style={{paddingBottom:'24px'}}>

## Using Global Constants

Global constants, accessed using the syntax `{{constants.constant_name}}` can be used in the app builder, data sources, data queries, and workflows.

### In App Builder

Inside the App Builder, you'll find the **Inspector** on the left sidebar with a Constants section displaying all available global constant values.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/global-constants-app-builder-v2.png" alt="Use Global Constants Inside App Builder"/>
</div>

### In Data Sources and Queries

Global constants in ToolJet allow you to define values once and reuse them across your data sources and queries.

**Data Source Connection Form**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/golbal-constants-data-source-connection-v2.png" alt="Use Global Constants Data Source Connection Form"/>
</div>

**Inside Queries in Query Manager**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/global-constants-queries.png" alt="Use Global Constants Inside Queries in Query Manager"/>
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using Secrets

Secrets are designed for secure storage of sensitive information like API keys, database credentials, and encryption keys using the syntax `{{secrets.secret_name}}`.

### In Data Sources and Queries

In Data Sources and Queries, secret values are masked in the frontend and can only be viewed in the Workspace Constants dashboard.

**Data Source Connection Form**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/secrets-data-source-connection-v2.png" alt="Use Secrets in Data Source Connection Form"/>
</div>

**Inside Queries in Query Manager**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/secrets-queries.png" alt="Use Secrets Inside Queries in Query Manager"/>
</div>


:::info
Secrets cannot be used within the App Builder or workflows.
:::

</div>

<div style={{paddingBottom:'24px'}}>

## Best Practices

- Utilize global constants to maintain consistency by storing frequently used values across the application.
- Securely store secrets to prevent unauthorized access and exposure in the codebase or frontend.
- Regularly audit and update constants and secrets to ensure security, compliance, and relevance.

</div>
