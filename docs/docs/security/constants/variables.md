---
id: variables
title: Workspace Variables and Migration
---

## Workspace Variables

Workspace Variables in ToolJet are designed to store values such as tokens, secret keys, or API keys, facilitating their use across multiple applications within the same workspace. This centralized approach ensures that sensitive information is managed securely and efficiently, promoting consistency and ease of access throughout the workspace.

:::caution
Workspace variables are currently marked as deprecated, indicating that it will be removed in future releases. In the current version, you are still able to delete existing variables and use it through out any ToolJet apps, but creating and updating variables are no longer supported. 

Please use **[Workspace Constants](/docs/org-management/workspaces/workspace_constants)** instead. This guide will help you migrate from **Workspace Variables** to **Workspace Constants**.
:::

## Workspace Variables Migration Guide

Workspace Constants are predefined values that enhance consistency, simplify updates, and securely store sensitive information across applications within a workspace. Unlike other variables, they are resolved exclusively on the server side, ensuring a high level of security by preventing client-side exposure. 

Access to Workspace Constants is managed through role-based permissions, allowing administrators to assign specific users the ability to create, update, or delete constants as needed. By default, the Workspace Admin has full control over these constants, ensuring centralized management. This approach not only strengthens security but also streamlines configuration management across multiple applications.

## Syntax

The syntax for using **Workspace Constants** differs from that of **Workspace Variables**. Previously, a variable named `psql_host` was accessed using `%%client.psql_host%%`, but with Workspace Constants, the correct syntax is `{{constants.psql_host}}`. Since Workspace Constants are resolved exclusively on the server side, they cannot be used on the client side.

:::note
Server variables will not resolve if you use bracket notation. This is because bracket notation is not supported on the server-side, where server variables are resolved. If you use bracket notation in a query that is executed on the server, the query will fail. To avoid this, use dot notation to resolve workspace variables in queries.
:::

## Migrating from Workspace Variables to Workspace Constants

To migrate from Workspace Variables to Workspace Constants, follow these steps:

- Access the ToolJet Dashboard and navigate to Workspace Settings.
- Select the Workspace Constants tab.
- Click on the **Create New Constant** button.
- A drawer will appear. Provide the desired name and value for the constant, and specify its type (Global or Private).
- Click the **Add Constant** button to save the constant.
- Repeat the above steps for all the Workspace Variables.

<img className="screenshot-full" src="/img/security/constants/constants-secret/create-constant.png" alt="Create Variable Constant"/>

Once you have migrated all the Workspace Variables to Workspace Constants, you can replace the Workspace Variables in your apps with their corresponding Workspace Constants.

### Replacing Client Workspace Variables with Workspace Constants

- Navigate to the app or data source where you want to replace the Workspace Variables.
- Replace the Workspace Variables with their corresponding Workspace Constants.
- For example, if you have a Client Workspace Variable like `%%client.pi%%`, replace it with `{{constants.pi}}`.

<img className="screenshot-full" src="/img/workspace-const/client-side-variable.gif" alt="Workspace constants"/>

### Replacing Server Workspace Variables with Workspace Constants
- Navigate to the app or data source where you want to replace the Workspace Variables.
- Replace the Workspace Variables with their corresponding Workspace Constants.
- For example, if you have a Server Workspace Variable like `%%server.psql_host%%`, replace it with `{{constants.psql_host}}`.

<img className="screenshot-full" src="/img/workspace-const/server-side-variable.gif" alt="Workspace constants"/>

### Deleting Workspace Variables

After migrating all Workspace Variables to Workspace Constants and thoroughly testing your applications, you can delete the Workspace Variables. To remove a Workspace Variable, follow these steps:

- Navigate to the Workspace Variables tab in the Workspace Settings.
- Click on the delete icon next to the Workspace Variable you want to delete.

<img className="screenshot-full" src="/img/workspace-const/delete-variable.gif" alt="Workspace constants"/>