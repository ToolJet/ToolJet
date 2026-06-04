---
id: group-admin-role
title: Group Admin Role
---

:::warning BETA
The Group Admin Role is currently in beta and not recommended for production use.
:::

In large organizations, workspace resources like apps, data sources, and modules are often organized into custom groups by project or team. Managing who belongs to which group is typically separate from managing what those groups can access.

The **Group Admin** role is designed for exactly this separation. A Group Admin can manage user membership within specific custom groups — adding or removing users as teams change — without having access to modify the group's permissions or any other workspace settings. This keeps user movement operational while resource control remains with workspace admins.

## What a Group Admin Can Do

A Group Admin can perform the following within the custom groups they are assigned to:

- Add existing workspace users to the group
- Remove users from the group
- View the **Permissions** tab of the group (read-only)
- View the default user role groups (Admin, Builder, End User) to verify a user's role

## What a Group Admin Cannot Do

Group Admins have intentionally limited access:

- Cannot invite new users to the workspace
- Cannot change a user's role
- Cannot create, delete, or rename custom groups
- Cannot manage Group Admins in their group (cannot add or remove other Group Admins)
- Cannot view custom groups they are not assigned as Group Admin of, even if they are a member of that group
- Cannot access any other workspace settings beyond the Groups and Themes tabs

:::note
The Groups and Themes tabs are accessible to all builders by default. Group Admins do not receive any additional workspace settings access beyond this.
:::

## Who Can Be a Group Admin

Only **Builders** can be assigned as Group Admins. End Users cannot hold this role.

If you attempt to assign an End User as a Group Admin, ToolJet will prompt you to convert them to a Builder first. This restriction exists for security — an End User who can manage group membership could add themselves to groups that grant access to resources they are not authorized to see.

## Which Groups Can Have a Group Admin

Group Admins can only be assigned to **custom user groups**. The three default role groups — Admin, Builder, and End User — cannot have Group Admins. These groups are tied to workspace-level licensing and role management, which remains the responsibility of a Workspace Admin.

## Assigning a Group Admin

Only a **Workspace Admin** or **Super Admin** can assign or remove Group Admins.

To assign a Group Admin to a custom group:

1. Click the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**.
3. Select the custom group you want to configure.
4. Click the **Group Admin** tab.
5. Search for the builder you want to assign and click **Add**.

To remove a Group Admin, go to the same **Group Admin** tab and remove them from the list.

## How Group Admins Manage Users

Once assigned, a Group Admin can access their group's settings directly from the workspace. They will see their assigned groups listed under **Workspace Settings** > **Groups**, with access limited to the **Users** tab for each group.

To add a user to the group:

1. Go to **Workspace Settings** > **Groups**.
2. Select the group.
3. In the **Users** tab, search for the user by name or email.
4. Click **Add** to include them in the group.

To remove a user from the group:

1. Go to **Workspace Settings** > **Groups**.
2. Select the group.
3. In the **Users** tab, locate the user and click **Remove**.

:::note
Group Admins can only add users who already exist in the workspace. Inviting new users is a Workspace Admin action.
:::

## Audit Logs

All user additions and removals performed by a Group Admin are recorded in the workspace audit logs. Each entry captures the action, the user affected, and the role of the person who performed it (e.g., Group Admin, Workspace Admin, Super Admin).

## Limitations

- API support for Group Admin management is not available yet.
- Group Admins cannot be assigned to default role groups (Admin, Builder, End User).
- A Group Admin cannot view groups they are a member of but not assigned as Group Admin.
- End Users must be converted to Builders before they can be assigned as Group Admins.
