---
id: workspace_constants
title: Workspace Constants and Secrets
---

Workspace constants and secrets are predefined values that can be used across your application to maintain consistency, facilitate easy updates, and securely store sensitive information. This document will guide you through the usage and management of workspace constants and secrets within your workspaces.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Types of Constants

ToolJet offers two types of constants:

1. **Global Constants**: Used for reusable values that can be applied consistently across the product.
2. **Secrets**: Used for secure storage of sensitive data.

</div>

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

Users can define environment-specific configurations by setting different values for constants and secrets across environments. This is useful for managing sensitive information such as API keys, database credentials, or external service endpoints which may vary between different environments. For example, you can set different API keys for development, staging, and production environments.
</div>

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/env-specific-const.png" alt="Environment-Specific Constants"/>
</div>

<div style={{paddingTop:'24px'}}>

## Server-Side Resolution and Security

Both workspace constants and secrets are resolved on the server side only. This ensures that sensitive data remains secure and is not exposed to the client-side. All constants and secrets are encrypted before being stored in the database, providing an additional layer of security.

</div>

<div style={{paddingTop:'24px'}}>

## Access Control

Creating, updating, and deleting constants and secrets are exclusive privileges granted to **Admins**. Workspace constants and secrets are specific to the workspace where they are created and cannot be utilized in other workspaces.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating Workspace Constants and Secrets

To create workspace constants or secrets, follow these steps:

1. Access the ToolJet Dashboard and click on the Workspace Constants tab from the left sidebar.
3. Click on the **Create new constant** button.
4. A drawer will appear. Enter the desired name and value for the constant or secret.
5. Select one of the following types:
    - **Global constant**
    - **Secret**
6. Click the **Add constant** button to save.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/create-new.png" alt="Create New Constant"/>
</div>

:::info
Once a constant or secret is created, its type cannot be changed. You'll need to delete it and create a new one of the desired type.
:::

</div>

<div style={{paddingBottom:'24px'}}>

## Using Global Constants

Global constants can be used in the app builder, data sources, data queries, and workflows.

### In App Builder

Inside the App Builder, you'll find the **Inspector** on the left sidebar with a Constants section displaying all available global constant values.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/global-constants-app-builder.png" alt="Use Global Constants Inside App Builder"/>
</div>

### In Data Sources and Queries

You can use global constants in datasource connection forms and queries using the syntax `{{constants.constant_name}}`.

**Data Source Connection Form**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/golbal-constants-data-source-connection.png" alt="Use Global Constants Data Source Connection Form"/>
</div>

**Inside Queries in Query Manager**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/global-constants-queries.png" alt="Use Global Constants Inside Queries in Query Manager"/>
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using Secrets

Secrets are designed for secure storage of sensitive information like API keys, database credentials, and encryption keys.

### In Data Sources and Queries

You can use secrets in datasource connection forms and queries using the syntax `{{secrets.secret_name}}`. The values of secrets will be masked in the frontend and cannot be viewed except in the workspace constant dashboard.

**Data Source Connection Form**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/secrets-data-source-connection.png" alt="Use Secrets in Data Source Connection Form"/>
</div>

**Inside Queries in Query Manager**:

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/secrets-queries.png" alt="Use Secrets Inside Queries in Query Manager"/>
</div>


:::info
Secrets cannot be used within the App Builder or workflows.
:::

</div>

## Mapping Workspace Contstants to Environment Variables

From version **`v3.5`**, you can use environment variables to set global and secret constants. Workspace constants set using environment variables will have a `.env` tag in front of them. If there are two constants with the same name, the one set through the environment variable will be used in the app builder, while the constant set through the UI will have a `duplicate` tag in front of it.

Users cannot edit or delete constants created from environment variables through the UI. To add, update, or delete any values from an environment variable, the container must be restarted.

<img className="screenshot-full" src="/img/workspace-const/global-constants-queries.png" alt="Use Global Constants Inside Queries in Query Manager"/>

### Setting Global Constants

**Setting Individual Global Constant**

Syntax - `TOOLJET_GLOBAL_CONSTANTS.<environment>.constant_name`

Example - TOOLJET_GLOBAL_CONSTANTS.development.companyName = "Corp Pvt. Ltd."

**Setting Multiple Global Constants**

Syntax - `TOOLJET_GLOBAL_CONSTANTS.<environment> = {“name1”: “value1", “name2”: “value2"}`

Example - TOOLJET_GLOBAL_CONSTANTS.development = `{"company1": "corp.com", "company2": "example.com"}`


### Setting Secret Constants

**Setting Individual Global Constant**

Syntax - `TOOLJET_SECRET_CONSTANTS.<environment>.constant_name`

Example - TOOLJET_SECRET_CONSTANTS.development.apiKey = "agdagdagdg"

**Setting Multiple Global Constants**

Syntax - `TOOLJET_SECRET_CONSTANTS.<environment> = {“name1”: “value1", “name2”: “value2"}`

Example - TOOLJET_SECRET_CONSTANTS.development = `{"api_url": "https://api.example.com", "password" : "12345", "key" : "agdagdagdg"}`

<div style={{paddingBottom:'24px'}}>

## Best Practices

- Use global constants for reusable values that are frequently used across your application.
- Use secrets for storing sensitive information that should not be exposed in the codebase or frontend.
- Regularly review and update your constants and secrets to ensure they remain relevant and secure.

</div>
