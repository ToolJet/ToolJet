---
id: superadmin
title: Super Admin
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

A Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins.

The user details entered while setting up ToolJet will have Super Admin privileges.

## How Super Admin is different from Admin

| Privilege | Admin | Super Admin | 
| --------- | ----- | ----------- |
| Manage Users in their workspace (Invite/Archive/Unarchive) | ✅ | ✅ |
| Manage Groups in their workspace (Create Group/Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
| Manage SSO in their workspace | ✅ | ✅ |
| Manage Workspace Variables in their workspace | ✅ | ✅ |
| Manage Workspace Constants in their workspace | ✅ | ✅ |
| [Manage data sources for the user group in their workspace](/docs/data-sources/overview#permissions) | ✅ | ✅ |
| [Access any user's personal workspace (create, edit or delete apps)](#access-any-workspace) | ❌ | ✅ |
| [Archive Admin or any user of any workspace](#archiveunarchive-users) | ❌ | ✅ |
| [Access any user's ToolJet database (create, edit or delete database)](#access-tooljet-db-in-any-workspace) | ❌ | ✅ |
| [Manage any workspace's setting (Groups/SSO/Workspace constants)](#manage-workspace-setting-groupsssoworkspace-constants) | ❌ | ✅ |
| [Manage all users from all the workspaces in the instance](#manage-all-users-in-the-instance) | ❌ | ✅ |
| [Archive/Unarchive any user from all the workspaces in the instance](#archiving-a-user-from-all-the-workspaces-instance-level) | ❌ | ✅ |
| [Reset password of any user](#reset-password-of-any-user) | ❌ | ✅ |
| [Edit name of any user](#edit-name) | ❌ | ✅ |
| [Make any user Super Admin](#make-the-user-super-admin) | ❌ | ✅ |
| [Manage all workspaces in the instance(Archive/Unarchive)](#all-workspaces) | ❌ | ✅ |
| [Restrict creation of personal workspace of users](#restrict-creation-of-personal-workspace-of-users) | ❌ | ✅ |
| [Configure instance level login](#instance-login) | ❌ | ✅ |
| [Enable Multiplayer editing](#enable-multiplayer-editing) | ❌ | ✅ |
| [Implement White Labelling](#white-labelling) | ❌ | ✅ |

## Super Admin features

### Access any workspace

If a user is a Super Admin, they can switch to any workspace created by any user within the instance using the Workspace Switcher located in the bottom left corner of the screen.

The dropdown will display all workspaces, including those created by both Super Admins and any other users.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/workspaceswitcher.png" alt="Superadmin: settings" />
</div>

### Create, Edit or Delete apps from any user's personal workspace

Once the Super Admin access the workspace of any other user, they can create, edit or delete app on the workspace.

This also includes - modifying folders and importing, exporting, or cloning apps to any user's workspace.

### Archive/Unarchive Users

Super Admin can not only archive/unarchive users/admins on their workspace but also from the workspaces of any other user.

If a user is Super Admin, they just need to open the workspace in which they want to archive or unarchive a user. Then go to the **Workspace Settings** from the sidebar -> **Manage Users** -> **Archive/Unarchive** any user/admin

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/archiveusersa.png" alt="Superadmin: settings" />
</div>

###  Access ToolJet DB in any workspace

Super Admins have access to the database of any user's workspace - just like Super Admins can access any application in any workspace. They have full access to modify or create any table in the ToolJet DB of any workspace.

###  Manage Workspace Settings (Groups/SSO/Workspace constants)

Super Admins have all the privileges that an Admin of a workspace have, Super Admins can:
- **✅ Manage Groups**: Creating/Deleting/Updating a Group in any workspace
- **✅ Manage SSO**: Full control over General Settings, Password login and other SSO options
- **✅ Workspace Variables**: Adding, updating or deleting workspace variables
- **✅ Workspace Constants**: Adding, updating or deleting workspace constants
- **✅ Copilot**: Enabling or disabling Copilot
- **✅ Custom Styles**: Adding or modifying custom styles

## Settings

Only Super Admins can access the Settings. To access the Settings page, click on the **⚙️** button and select **Settings** from the dropdown.

- **[All Users](#all-users)**
- **[All workspaces](#all-workspaces)**
- **[Manage instance settings](#manage-instance-settings)**
- **[License](#license)**
- **[White labelling](#white-labelling)**

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/settings.png" alt="Superadmin: settings" />
</div>

## All Users

### Manage all users in the instance

**All Users** settings can be used to check the list of all the users available on all the workspaces in the instance. Super Admins can also promote/demote any user to/from Super Admin from this page. They can also archive/unarchive any user at an instance level from this setting.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/allusers1.png" alt="Superadmin: settings" />
</div>

### Archiving a user from all the workspaces (Instance level)

Super Admins have the authority to deactivate any user at instance level. This will remove the user from all the workspaces in the instance.

To archive a user, go to the **All Users** settings, click on the kebab menu next to the user that is to be archived and select **Archive** option. Once the user is archived, the status will change from **Active** to **Archived**. The user will not be able to login to any workspace in the instance.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/archiveinstance.png" alt="Superadmin: settings" />
</div>

<br/>

**Unarchiving** a user from **All Users** settings will unarchive the user from the instance and not at workspace level. 

**Info**: The user will be unarchived from instance level automatically if a workspace admin unarchives the user from their workspace.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/unarchiveinstance.png" alt="Superadmin: settings" />
</div>

### Reset password of any user

Super Admins can reset the password of any user from the **All Users** settings. To reset the password, click on the kebab menu next to the user and select **Reset Password** option. A pop-up will appear asking either to auto-generate a password or to enter a new password. 

### Edit user details

Super Admins can edit the details of any user from the **All Users** settings. To edit the details, click on the kebab menu next to the user and select **Edit user details** option. 

#### Edit name

On selecting the **Edit user details** option, a drawer will open from the right. Super Admins can edit the name of the user from this drawer. Once the changes are made, click on the **Update** button.

#### Make the user Super Admin

From the **Edit user details** drawer, Super Admins can make any user as Super Admin or remove any Super Admin from the **All Users** settings. To make a user Super Admin, toggle on the **Super Admin** radio button. The user will become Super Admin and the Type column will update from **`Workspace`** to **`Instance`**.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/edituserdetailsinstance.png" alt="Superadmin: settings" />
</div>

## All workspaces

The All Workspaces tab provides a comprehensive view of all workspaces within the ToolJet instance. Super Admins can use this functionality to monitor and manage workspaces collectively, ensuring efficient administration and organization-wide oversight. 

Super Admins have the authority to **archive** or **unarchive** workspaces of any user in the instance as needed. Archiving a workspace essentially sets it to an inactive state, removing it from active use. Conversely, unarchiving reactivates a previously archived workspace, making it accessible once again.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/workspaces1.png" alt="Superadmin: settings" />
</div>

### Current Workspace

The **Current Workspace** label will be displayed next to the workspace that the Super Admin has currently opened. If the Super Admin archives the current workspace, they will be prompted to switch to another active workspace to ensure continuous accessibility.

### Open Active Workspaces

In the list of active workspaces, there is an option to open the workspace directly. This feature helps superadmins to quickly navigate to the workspace on the new tab of the browser and manage the workspace.

### Archive Workspaces

The **Archive** button on the right of the workspace name allows Super Admins to archive the workspace. Once archived, the workspace will be moved to the **Archived Workspaces** section.

**Impact**:
- The apps on the archived workspace won't be accessable through the URL
- Users will be logged out if they don't have access to any active workspace

### Archived Workspaces

The **Archived** section displays a list of all archived workspaces. Super Admins can unarchive any workspace from this section by clicking the **Unarchive** button.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/workspaces2.png" alt="Superadmin: settings" />
</div>

## Manage instance settings

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/instanceoptions.png" alt="Superadmin: settings" />
</div>

### Restrict creation of personal workspace of users

When a user joins a workspace, they are provided with their own personal workspace and option to create new workspaces.

Super Admins can **control** this behavior from the Manage Settings page, they can **toggle off** the option to **Allow personal workspace**. Now whenever a user joins a workspace they won't be provided a personal workspace nor they will be able to create a new workspace in the instance.

### Enable multiplayer editing

Super Admins can enable multiplayer editing from the Manage Settings page. Once enabled, users will be able to edit the same app simultaneously resulting in real-time collaboration.

### Comments

Super Admins can enable comments from the Manage Settings page. Once enabled, users will be able to collaborate by adding comments anywhere on the canvas.

## White labelling
This feature allows you to customize the ToolJet instance with your own branding. You can change the logo, favicon, and the name of the instance.

Check out the [White labelling](/docs/enterprise/white-label/) page for more details.

## Instance login

Instance login configuration at the Settings level allows super admins to set up and manage the default login method for all workspaces within the instance. This ensures a standardized login experience unless individual workspace admins choose to configure a different method for their specific workspace.

### Access and permissions

Only super admins have the authority to configure **Instance login** settings. This ensures centralized control over the default login method across the entire instance.

### Super Admin URL

This URL serves as a fail-safe in scenarios where password login is disabled, SSO is not configured, or a paid plan expires. Importantly, this URL exclusively supports password login and is accessible only by the super admin, preventing any unauthorized access.

The default URL for super admin login is `https://<domain>/login/super-admin`. This URL can be accessed by the super admin to log in to the instance and manage the settings.

### Enable sign-up

The "Enable Sign Up" option allows users to sign up without being invited. It is important to note that this feature includes both password login and SSO, providing a seamless onboarding experience for users.

### Password login

Super admins can enable or disable password login for the entire instance. This setting ensures that all workspaces within the instance adhere to the same login method, unless individual workspace admins choose to configure a different method for their specific workspace.

### Enable workspace configuration

Turning off this option restricts workspace admins from configuring the login method for their workspace. This configuration hides the Workspace Login option from the workspace settings tab.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/superadmin/instancelogin.png" alt="Superadmin: settings" />
</div>

## License

Manage the instance license via the **Settings** page. Super Admins have the capability to update the instance's license key from this page.

Check out the [License](/docs/licensing) page for more details.