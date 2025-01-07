---
id: settings
title: Instance Settings
---

Only Super Admins can access the Instance Settings. To access the Settings page, click on the ⚙️ button and select Settings from the dropdown.

<img className="screenshot-full" src="/img/enterprise/superadmin/settings.png" alt="Superadmin: settings" />

## All Users

From the All Users tab under settings, the super admin can manage the following things:
- [Manage all Users in the Instance](#manage-all-users-in-the-instance)
- [Archiving a User from all the Workspaces (Instance Level)](#archiving-a-user-from-all-the-workspaces-instance-level)
- [Reset Password of any User](#reset-password-of-any-user)
- [Edit User Details](#edit-user-details)

### Manage all Users in the Instance

**All Users** settings can be used to check the list of all the users available on all the workspaces in the instance. Super Admins can also promote/demote any user to/from Super Admin from this page. They can also archive/unarchive any user at an instance level from this setting.

<img className="screenshot-full" src="/img/enterprise/superadmin/allusers1.png" alt="Superadmin: settings" />

### Archiving a User from all the Workspaces (Instance Level)

Super Admins have the authority to deactivate any user at instance level. This will remove the user from all the workspaces in the instance.

To archive a user, go to the **All Users** settings, click on the kebab menu next to the user that is to be archived and select **Archive** option. Once the user is archived, the status will change from **Active** to **Archived**. The user will not be able to login to any workspace in the instance.

<img className="screenshot-full" src="/img/enterprise/superadmin/archiveinstance.png" alt="Superadmin: settings" />

**Unarchiving** a user from **All Users** settings will unarchive the user from the instance and not at workspace level. <br/>
**Note**: The user will be unarchived from instance level automatically if a workspace admin unarchives the user from their workspace.

<img className="screenshot-full" src="/img/enterprise/superadmin/unarchiveinstance.png" alt="Superadmin: settings" />

### Reset Password of any User

Super Admins can reset the password of any user from the **All Users** settings. To reset the password, click on the kebab menu next to the user and select **Reset Password** option. A pop-up will appear asking either to auto-generate a password or to enter a new password. 

### Edit User Details

Super Admins can edit the details of any user from the **All Users** settings. To edit the details, click on the kebab menu next to the user and select **Edit user details** option. 

#### Edit name

On selecting the **Edit user details** option, a drawer will open from the right. Super Admins can edit the name of the user from this drawer. Once the changes are made, click on the **Update** button.

#### Make the user Super Admin

From the **Edit user details** drawer, Super Admins can make any user as Super Admin or remove any Super Admin. To make a user Super Admin, toggle on the **Super Admin** radio button. The user will become Super Admin and the Type column will update from **Workspace** to **Instance**.

<img className="screenshot-full" src="/img/enterprise/superadmin/edituserdetailsinstance.png" alt="Superadmin: settings" />

## All Workspaces

The All Workspaces tab provides a comprehensive view of all workspaces within the ToolJet instance. Super Admins can use this functionality to monitor and manage workspaces collectively, ensuring efficient administration and organization-wide oversight.

From **All Workspaces** the super admin can manage:
- **[Current Workspace](#current-workspace)**
- **[Open Active Workspace](#open-active-workspace)**
- **[Archive Workspace](#archive-workspace)**
- **[Unarchive Workspace](#unarchive-workspace)**

<img className="screenshot-full" src="/img/enterprise/superadmin/workspaces1.png" alt="Superadmin: settings" />

### Current Workspace

The **Current Workspace** label will be displayed next to the workspace that the Super Admin has currently opened. If the Super Admin archives the current workspace, they will be prompted to switch to another active workspace to ensure continuous accessibility.

### Open Active Workspace

In the list of active workspaces, there is an option to open the workspace directly. This feature helps superadmins to quickly navigate to the workspace on the new tab of the browser and manage the workspace.

### Archive Workspace

The **Archive** button on the right of the workspace name allows Super Admins to archive the workspace. Once archived, the workspace will be moved to the **Archived Workspaces** section.

**Impact**:
- The apps on the archived workspace won't be accessable through the URL
- Users will be logged out if they don't have access to any active workspace

### Unarchive Workspace

The **Archived** section displays a list of all archived workspaces. Super Admins can unarchive any workspace from this section by clicking the **Unarchive** button.

 <img className="screenshot-full" src="/img/enterprise/superadmin/workspaces2.png" alt="Superadmin: settings" />


## Manage Instance Settings

Through **Manage Instance Settings**, the super admin can manage following things:
- **[Restrict Creation of Personal Workspace of Users](#restrict-creation-of-personal-workspace-of-users)**
- **[Enable Multiplayer Editing](#enable-multiplayer-editing)**
- **[Comments](#comments)**

<img className="screenshot-full" src="/img/enterprise/superadmin/instanceoptions.png" alt="Superadmin: settings" />

### Restrict Creation of Personal Workspace of Users

When a user joins a workspace, they are provided with their own personal workspace and option to create new workspaces. <br/>
Super Admins can **control** this behavior from the Manage Settings page, they can **toggle off** the option to **Allow personal workspace**. Now whenever a user joins a workspace they won't be provided a personal workspace nor they will be able to create a new workspace in the instance.

### Enable Multiplayer Editing

Super Admins can enable multiplayer editing from the Manage Settings page. Once enabled, users will be able to edit the same app simultaneously resulting in real-time collaboration.

### Comments

Super Admins can enable comments from the Manage Settings page. Once enabled, users will be able to collaborate by adding comments anywhere on the canvas.

## Instance Login

Instance login configuration at the Settings level allows super admins to set up and manage the default login method for all workspaces within the instance. This ensures a standardized login experience unless individual workspace admins choose to configure a different method for their specific workspace.

### Access and Permissions

Only super admins have the authority to configure **Instance login** settings. This ensures centralized control over the default login method across the entire instance.

### Super Admin URL

This URL serves as a fail-safe in scenarios where password login is disabled, SSO is not configured, or a paid plan expires. Importantly, this URL exclusively supports password login and is accessible only by the super admin, preventing any unauthorized access. <br/>
The default URL for super admin login is `https://<domain>/login/super-admin`. This URL can be accessed by the super admin to log in to the instance and manage the settings.

### Enable sign-up

The **Enable Sign Up** option allows users to sign up without being invited. It is important to note that this feature includes both password login and SSO, providing a seamless onboarding experience for users.

### Password login

Super admins can enable or disable password login for the entire instance. This setting ensures that all workspaces within the instance adhere to the same login method, unless individual workspace admins choose to configure a different method for their specific workspace.

### Enable Workspace Configuration

Turning off this option restricts workspace admins from configuring the login method for their workspace. This configuration hides the Workspace Login option from the workspace settings tab.

<img className="screenshot-full" src="/img/enterprise/superadmin/instancelogin.png" alt="Superadmin: settings" />

## License

Manage the instance license via the **Settings** page. Super Admins have the capability to update the instance's license key from this page.

Check out the [License](/docs/org-management/licensing/self-hosted) page for more details.
