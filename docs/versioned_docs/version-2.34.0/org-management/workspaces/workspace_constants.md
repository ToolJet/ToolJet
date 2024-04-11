---
id: workspace_constants
title: Workspace Constants
---

Workspace constants are predefined values(usually tokens/secret keys/API keys) that can be used across your application to maintain consistency and facilitate easy updates. They allow you to store important data or configurations that should remain unchanged during the application's runtime. This doc will guide you through the usage and management of workspace constants within your workspaces.

:::danger
Workspace constants are handled server-side and are not intended for use in query transformations or RunJS and RunPy queries. For these operations, employ variables and page variables instead.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Environment-Specific Configurations

Users can define environment-specific configurations by setting different values for constants across environments. It is useful for managing sensitive information such as API keys, database credentials, or external service endpoints. For Community edition only production environment is available and for Cloud/EE we will have multi environments (development, staging, production).

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Server-Side Resolution

Workspace constants are designed to be resolved on the server side only. This means that when you make network calls, the payload sent will not include the actual values of the constants. Instead, the server will resolve the constants and use their actual values while processing the requests. This ensures that the constants remain secure and are not exposed to the client-side.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Access Control

Creating, updating, and deleting constants are exclusive privileges granted to **Admins** (workspaces). Only users with administrative rights can perform these operations. Workspace constants are specific to the workspace where they are created and cannot be utilized in other workspaces.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Usage in App Builder and Global Datasource Connection

All users with edit app permissions have access to consume and utilize constants in the app builder and global datasource connection forms. This enables you to use the same constant values across different components of your application, ensuring consistency and reducing duplication of effort.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Syntax

To use a workspace constant, you need to follow the syntax: **`{{constants.constant_name}}`**. For example, if you have a constant named "psql_host", you can access its value by using `{{constants.psql_host}}`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating Workspace Constants

To create workspace constants, follow these steps:

- Access the ToolJet Dashboard and navigate to Workspace Settings.
- Select the Workspace Constants tab.
- Click on the **Create New Constant** button.
- A drawer will appear. Enter the desired name and value for the constant.
- Click the **Add Constant** button to save the constant.

<div style={{textAlign: 'center'}}>
    
<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/create-constant-v2.gif" alt="Workspace constants: create"/>
    
</div>

- If you are an admin, you have the privilege to edit or delete constants. However, if you are a user with edit app permissions in the workspace, you can only view the constants and consume them in the app builder and global datasource connection forms.

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/edit-delete-v2.png" alt="Workspace constants: edit/delete"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using Workspace Constants

Workspace constants can be used in the app builder and the global datasource connection forms.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Using Workspace Constants in Global Datasource Connection

You can use workspace constants in the **[global datasource connection](/docs/data-sources/overview#connecting-global-datasources)** form to store sensitive information like API keys, tokens, etc. This will ensure that the data remains secure and is not exposed to the client-side. You can use the syntax `{{constants.constant_name}}` to access the value of the constant.

 <div style={{textAlign: 'center'}}>

 <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/globaldatasource.png" alt="Workspace constants: global datasource"/>

 </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Using Workspace Constants in App Builder

Inside the App Builder, you will find the **[Inspector](/docs/app-builder/left-sidebar#inspector)** on the left sidebar. The inspector will have a Constants section which will be updated dynamically to display all the available constant values.

 <div style={{textAlign: 'center'}}>

 <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workspace-const/inspector-v2.png" alt="Workspace constants: inspector"/>

 </div>

As you build the application, you can easily refer to the constants and incorporate them into different elements of your app.

 <div style={{textAlign: 'center'}}>
    
 <img className="screenshot-full" src="/img/workspace-const/querypanel.png" alt="Workspace constants: querypanel"/>
    
 </div>

With workspace constants, you can streamline your application's configuration and maintain a consistent experience for your users. By leveraging this feature, you can ensure that vital data remains secure while making it accessible for authorized users throughout the application building process.

</div>
