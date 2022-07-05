---
id: organization-environment-variables
title: Organization environment variables
---

# Organization environment variables

## What is organization environment variables 

Organization environment variables are key value pairs that can be used in different apps across same organization. 

## How can we add these variables to an organization?

Let us say, if we have a common `apikey` or a common value that can be used in queries or widgets in multiple apps of the same organization then an admin or user who has permission to do, can add a particular variable to this table 

To add an environment variable, go to 

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Airtable](/img/tutorial/use-env-org-vars/add-variable.gif)

</div>

### There are two types of variables

1. Client
2. Server

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Airtable](/img/tutorial/use-env-org-vars/variable-type.png)

</div>

#### Client

The client variable can be used in widgets and queries.

#### Server

The major difference with the server variable is, that it's only resolved when runtime, so it's highly secured and because of that we can't use the server variables with widgets, currently its only work with queries except for `RunJs`.

**Important**
Once a variable has been created, we can't change the variable type

### Encryption

This feature enables us to add a client variable with and without `encryption`. But the server variables are always encrypted by default.

### How to use a variable inside an app

Let us use a variable that created before in this tutorial inside an app.

We have different opening and closing notation for environment variables `%% %%`. The environment variables will not work inside js code `{{}}`

`%%client.pi%%`

Example for client variable usage :

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Airtable](/img/tutorial/use-env-org-vars/variable-usage.png)

</div>

Example for server variable usage :

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Airtable](/img/tutorial/use-env-org-vars/server-variable-usage.png)

</div>