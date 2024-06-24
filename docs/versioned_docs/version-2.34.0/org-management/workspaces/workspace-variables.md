---
id: workspace-variables
title: Workspace Variables
---

:::caution
Workspace variables are currently marked as deprecated, indicating that it will be removed in future releases. In the current version, you are still able to delete existing variables and use it through out any ToolJet apps, but creating and updating variables are no longer supported. 

Please use [Workspace Constants](/docs/org-management/workspaces/workspace_constants) instead.
:::

Workspace Variables are the variables with some value(usually tokens/secret keys/API keys) that can be used in different apps across the same Workspace.

:::note
Server variables will not resolve if you use bracket notation. This is because bracket notation is not supported on the server-side, where server variables are resolved. If you use bracket notation in a query that is executed on the server, the query will fail. To avoid this, use dot notation to resolve workspace variables in queries.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## How Can We Add these Variables to a Workspace?

Suppose there is an `API key` or a value that you want to use in the queries or widgets in the multiple apps of the same Workspace then the Workspace admin or the user with permissions can add an environment variable.

#### Adding the environment variable
- Go to the ToolJet Dashboard, and click on the dropdown on the navigation bar to show `Workspace` options
- Select `Manage Environment Variables`
- Click on `Add New Variable` button
- Give a `Name` to the variable, set the value, choose `Type`, toggle `Encryption`, and click **Add Variable** button
- Now this variable can be used inside any application of this Workspace

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/use-env-org-vars/work-var2.gif" alt="add variable" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Types of variables

- **Client**: The client variable can be utilized in components, queries, and global datasources.

- **Server**: The server variables can be employed in all queries except for `RunJS` and the connection form for global datasources. The restriction on using server variables with components is due to their resolution occurring solely during runtime, ensuring a high level of security.

:::info
Variable Type cannot be changed once it has been created.
:::

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/use-env-org-vars/variable-type.png" alt="variable-type" width="700"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Encryption

This feature enables us to add a client variable with and without `encryption`. The server variables are always encrypted by default.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Using Variable in an App

Let's use the variable that we created [here](/docs/tutorial/workspace-variables/#adding-the-environment-variable). If you have used ToolJet before, then you know that for getting the values from any variable we use JS notation i.e. `{{}}` but for using the Workspace variables we have different opening and closing notation `%% %%`. The environment variables will not work inside js code `{{}}`.

So, the syntax for using the variable that we created before will be `%%client.pi%%`

**Example for client variable usage:**

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/use-env-org-vars/variable-usage.png" alt="variable-usage" width="700"/>

</div>

**Example for server variable usage:**

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/use-env-org-vars/server-variable-usage.png"  alt="server-variable-usage" width="700" />

</div>

Starting from ToolJet version `2.10.0` and onwards, it is possible to utilize Server-type workspace variables in the global datasources connection form.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/use-env-org-vars/varingds.gif"  alt="server-variable-usage" />

</div>


</div>