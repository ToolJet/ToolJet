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

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

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

Note: Secrets cannot be used in RunJS or RunPy queries.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Environment-Specific Configurations

Users can define environment-specific configurations by setting different values for constants and secrets across environments. This is useful for managing sensitive information such as API keys, database credentials, or external service endpoints.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Server-Side Resolution and Security

Both workspace constants and secrets are resolved on the server side only. This ensures that sensitive data remains secure and is not exposed to the client-side. All constants and secrets are encrypted before being stored in the database, providing an additional layer of security.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Access Control

Creating, updating, and deleting constants and secrets are exclusive privileges granted to **Admins**. Workspace constants and secrets are specific to the workspace where they are created and cannot be utilized in other workspaces.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating Workspace Constants and Secrets

To create workspace constants or secrets, follow these steps:

1. Access the ToolJet Dashboard and navigate to Workspace Settings.
2. Select the Workspace Constants tab.
3. Click on the **Create New Constant** button.
4. A drawer will appear. Enter the desired name and value for the constant or secret.
5. Select the type: Global Constant or Secret.
6. Click the **Add Constant** button to save.

Note: Once a constant or secret is created, its type cannot be changed. You'll need to delete it and create a new one of the desired type.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using Global Constants

Global constants can be used in the app builder, data sources, data queries, and workflows.

### In App Builder

Inside the App Builder, you'll find the **Inspector** on the left sidebar with a Constants section displaying all available global constant values.

### In Data Sources and Queries

You can use global constants in datasource connection forms and queries using the syntax `{{constants.constant_name}}`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using Secrets

Secrets are designed for secure storage of sensitive information like API keys, database credentials, and encryption keys.

### In Data Sources and Queries

You can use secrets in datasource connection forms and queries using the syntax `{{secrets.secret_name}}`. The values of secrets will be masked in the frontend and cannot be viewed except in the workspace constant dashboard.

Note: Secrets cannot be used in the App Builder or workflows.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Best Practices

- Use global constants for reusable values that are frequently used across your application.
- Use secrets for storing sensitive information that should not be exposed in the codebase or frontend.
- Regularly review and update your constants and secrets to ensure they remain relevant and secure.

</div>
