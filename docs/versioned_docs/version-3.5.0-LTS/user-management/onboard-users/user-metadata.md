---
id: user-metadata
title: Metadata
---

In ToolJet, user metadata allows you to store additional information about users, such as user personal details, API keys, or role-specific data. This custom data is stored at the workspace level and can be used within your ToolJet applications. All metadata values are encrypted in the database for security, and in the user interface, metadata values are masked to protect sensitive information.

## Adding User Metadata

User metadata can be added either when inviting the user or after the user has joined the workspace. Follow these steps to add user metadata:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Spot the user whose metadata needs to be updated, click on the kebab menu (three dots) at the end of their row, and select **Edit user details**.
    <img className="screenshot-full" src="/img/user-management/profile-management/user-details.png" alt="Edit User Details" />

4. Click on **+ Add more** below User metadata, and enter the key-value pair.
    <img className="screenshot-full" src="/img/user-management/profile-management/metadata.png" alt="Edit User Details" />

5. Click on **Update** button at the bottom.

## Using User Metadata in App Builder

User metadata can be accessed within any application in the workspace through the global variable using the following syntax:

```js
{{globals.currentUser.metadata}}
```
To access a specific key-value pair from the metadata, use the following syntax:

```js
{{globals.currentUser.metadata.<key>}} // Replace <key> with the key of the metadata value 
```

:::info
Remember that while metadata values are masked in the user interface, they are accessible in the App builder. Ensure you handle any sensitive information appropriately in your app logic.
:::

