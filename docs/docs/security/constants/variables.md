---
id: variables
title: Workspace Variables Migration
---

<div className="badge badge--warning heading-badge">   
  <img 
    src="/img/badge-icons/warning.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Deprecated</span>
</div>



<br/><br/>

Workspace variables were used in ToolJet to store values such as tokens, secret keys, API keys, etc. But currently **Workspace variables are marked as deprecated, indicating that it will be removed in future releases**. In the current version, you are still able to delete existing variables and use it through out any ToolJet apps, but creating and updating variables are no longer supported. 

Please use **[Workspace Constants](/docs/security/constants/)** instead. This guide will help you migrate from **Workspace Variables** to **Workspace Constants**.

## Workspace Constants

Workspace Constants are predefined values that enhance consistency, simplify updates, and securely store sensitive information across applications within a workspace. Unlike other variables, they are resolved exclusively on the server side, ensuring a high level of security by preventing client-side exposure. Refer to **[Workspace Constants](/docs/security/constants/)** guide for more information.

## Migrating from Workspace Variables to Workspace Constants

To migrate from Workspace Variables to Workspace Constants, you need to create new constants and store each value, follow the steps in **[Creating Workspace Constants](/docs/security/constants/#creating-workspace-constants)** guide.

Once you have migrated all the Workspace Variables to Workspace Constants, you can replace the Workspace Variables in your apps with their corresponding Workspace Constants.

### Replacing Workspace Variables with Workspace Constants

- Navigate to the app or data source where you want to replace the Workspace Variables.
- Replace the Workspace Variables with their corresponding Workspace Constants. <br/>
    For example, if you have a Client Workspace Variable like `%%client.pi%%`, replace it with `{{constants.pi}}`. <br/>
    <img className="screenshot-full" src="/img/workspace-const/client-side-variable.gif" alt="Workspace constants"/>

    <img className="screenshot-full" src="/img/workspace-const/server-side-variable.gif" alt="Workspace constants"/>

### Deleting Workspace Variables

After migrating all Workspace Variables to Workspace Constants and thoroughly testing your applications, you can delete the Workspace Variables. To remove a Workspace Variable, follow these steps:

1. Navigate to the Workspace Variables tab in the Workspace Settings. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-variables`)

2. Click on the delete icon next to the Workspace Variable you want to delete.
    <img className="screenshot-full" src="/img/workspace-const/delete-variable.gif" alt="Workspace constants"/>