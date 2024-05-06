---
id: workspace-variables-migration
title: Workspace Variables Migration Guide
---


Workspace variables are currently marked as deprecated, indicating that it will be removed in future releases. This guide will help you migrate from Workspace Variables to Workspace Constants. Workspace Constants are designed to be resolved on the server-side only, ensuring a high level of security. Only the Workspace admin can create, update, and delete Workspace Constants.


## Syntax

The syntax for using Workspace Constants is different from Workspace Variables. For example, if you have a constant named "psql_host", we used to use `%%client.psql_host%%` but for Workspace Constants, we use `{{constants.psql_host}}`.

### Migrating from Workspace Variables to Workspace Constants

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

Once you have migrated all the Workspace Variables to Workspace Constants, you can replace the Workspace Variables in your apps with Workspace Constants. For example, if you have a Workspace Variable in your app or data source `%%client.psql_host%%`, you can replace it with `{{constants.psql_host}}`.

# Add GIF FOR REPLACING WORKSPACE VARIABLES WITH WORKSPACE CONSTANTS IN APP


### Deleting Workspace Variables

Once you have migrated all the Workspace Variables to Workspace Constants, and tested your apps, you can delete the Workspace Variables. To delete a Workspace Variable, follow these steps:

# ADD GIF FOR DETELE WORKSPACE VARIABLES