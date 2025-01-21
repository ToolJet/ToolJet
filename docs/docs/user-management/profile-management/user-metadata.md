---
id: user-metadata
title: User Metadata
---

In ToolJet, Admin user can easily manage user profile by **[editing user detail](#)**, **[updating user metadata](#)** and **[resetting password](#)**.

## Edit User Details

Super Admins can edit the details of any user in their instance. To edit the details of a user:

1. Go to the **All Users** settings from the **Settings**. <br/>
    (Example URL)
2. Click on the kebab menu (three dots) next to the user you want to edit and select **Edit user details**.
3. In the drawer that opens, you can edit the **Name** of the user or toggle the Super admin toggle to promote the user.
4. Once you have made the changes, click on the **Update** button.

<img className="screenshot-full" src="/img/managing-users/user-management/user-drawer.png" alt="edit user" />

## User Metadata

User Metadata allows you to store additional information for users in your workspace. This custom data is stored at the workspace level and can include any key-value pairs relevant to your organization's needs.

- User metadata can be added when inviting a new user or editing an existing user. Additionally, you can also specify metadata while bulk inviting users.
- It can store various types of information such as user preferences, API keys, or role-specific data.
- Metadata is accessible in your applications through the global variable `{{globals.currentUser.metadata}}`.
- All metadata values are encrypted in the database for security.
- In the user interface, metadata values are masked to protect sensitive information.

### Using User Metadata in Applications

You can access user metadata in the app builder using the following syntax:

```javascript
{{globals.currentUser.metadata.<key>}} // Replace <key> with the key of the metadata value 
```

:::info
Remember that while metadata values are masked in the user interface, they are accessible in the App builder. Ensure you handle any sensitive information appropriately in your app logic.
:::

