---
id: workspace-environment-variables
title: Workspace Variables
---

Workspace Variables are the variables with some value(usually tokens/secret keys/API keys) that can be used in different apps across the same Workspace.

## How can we add these variables to an Workspace?

Suppose there is an `API key` or a value that you want to use in the queries or widgets in the multiple apps of the same Workspace then the Workspace admin or the user with permissions can add an environment variable.

#### Adding the environment variable
- Go to the ToolJet Dashboard, and click on the dropdown on the navigation bar to show `Workspace` options
- Select `Manage Environment Variables`
- Click on `Add New Variable` button
- Give a `Name` to the variable, set the value, choose `Type`, toggle `Encryption`, and click **Add Variable** button
- Now this variable can be used inside any application of this Workspace


<img className="screenshot-full" src="/img/tutorial/use-env-org-vars/add-variable.gif" alt="add variable" />


### Types of variables

- **Client**: The client variable can be used in widgets and queries.

- **Server**: The server variables can be used with all the queries except the `RunJS`. The reason why we don't allow the server variables to be used with the widgets is that these variables are only resolved during the runtime so they're highly secured.

:::info
Variable Type cannot be changed once it has been created.
:::


<img className="screenshot-full" src="/img/tutorial/use-env-org-vars/variable-type.png" alt="variable-type" />

### Encryption

This feature enables us to add a client variable with and without `encryption`. The server variables are always encrypted by default.

### Using variable in an app

Let's use the variable that we created [here](Workspace-environment-variables#adding-the-environment-variable). If you have used ToolJet before, then you know that for getting the values from any variable we use JS notation i.e. `{{}}` but for using the Workspace variables we have different opening and closing notation `%% %%`. The environment variables will not work inside js code `{{}}`.

So, the syntax for using the variable that we created before will be `%%client.pi%%`

**Example for client variable usage:**


<img className="screenshot-full" src="/img/tutorial/use-env-org-vars/variable-usage.png" alt="variable-usage" />


**Example for server variable usage:**

<img className="screenshot-full" src="/img/tutorial/use-env-org-vars/server-variable-usage.png"  alt="server-variable-usage" />
