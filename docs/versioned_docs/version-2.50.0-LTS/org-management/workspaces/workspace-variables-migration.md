---
id: workspace-variables-migration
title: Workspace Variables Migration Guide
---


Workspace variables are currently marked as deprecated, indicating that it will be removed in future releases. This guide will help you migrate from Workspace Variables to Workspace Constants. Workspace Constants are designed to be resolved on the server-side only, ensuring a high level of security. You can assign users to a specific role and provide create, update, and delete access to Workspace Constants based on the role. By default, the Workspace admin has full access to Workspace Constants.


## Syntax

The syntax for using **Workspace Constants** is different from **Workspace Variables**. For example, if you have a variables named **psql_host**, we used to use `%%client.psql_host%%` but for Workspace Constants, we use `{{constants.psql_host}}`. Since Workspace Constants are resolved only on the server-side, there is no option to use them in the client-side.

## Migrating from Workspace Variables to Workspace Constants

To migrate from Workspace Variables to Workspace Constants, follow these steps:

- Access the ToolJet Dashboard and navigate to Workspace Settings.
- Select the Workspace Constants tab.
- Click on the **Create New Constant** button.
- A drawer will appear. Enter the desired name and value for the constant.
- Click the **Add Constant** button to save the constant.
- Repeat the above steps for all the Workspace Variables.

<div style={{textAlign: 'center'}}>
    
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/create-constant-v2.gif" alt="Workspace constants: create"/>
    
</div>

Once you have migrated all the Workspace Variables to Workspace Constants, you can replace the Workspace Variables in your apps with their corresponding Workspace Constants.

### Replacing Client Workspace Variables with Workspace Constants

- Navigate to the app or data source where you want to replace the Workspace Variables.
- Replace the Workspace Variables with their corresponding Workspace Constants.
- For example, if you have a Client Workspace Variable like `%%client.pi%%`, replace it with `{{constants.pi}}`.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/client-side-variable.gif" alt="Workspace constants"/>
</div>

### Replacing Server Workspace Variables with Workspace Constants
- Navigate to the app or data source where you want to replace the Workspace Variables.
- Replace the Workspace Variables with their corresponding Workspace Constants.
- For example, if you have a Server Workspace Variable like `%%server.psql_host%%`, replace it with `{{constants.psql_host}}`.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/server-side-variable.gif" alt="Workspace constants"/>
</div>


### Deleting Workspace Variables

Once you have migrated all the Workspace Variables to Workspace Constants, and tested your apps, you can delete the Workspace Variables. To delete a Workspace Variable, follow these steps:

- Navigate to the Workspace Variables tab in the Workspace Settings.
- Click on the delete icon next to the Workspace Variable you want to delete.

<div style={{textAlign: 'center'}}>
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/delete-variable.gif" alt="Workspace constants"/>
</div>