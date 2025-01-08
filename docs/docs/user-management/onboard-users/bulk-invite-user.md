---
id: bulk-invite-users
title: Bulk Inviting Users
---

Admins can bulk invite users to a workspace using a CSV file containing user email address, **[roles](#)**, **[groups](#)** and other details. The invited users receive an email with instructions to join the workspace, ensuring a seamless onboarding process.

## Steps to Bulk Invite Users

Role Required: **Admin**

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.tooljetcorp.com/nexus/workspace-settings/users`)

3. Click on **Add users** button.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

3. Switch to **Upload CSV file** tab.
4. Upload a CSV file consiting following fields:

    | Field | Required/Optional | Example |
    |:-----|:---------|:-------|
    | First Name | Either of first or last name is required. | John |
    | Last Name | Either of first or last name is required. | Doe |
    | Email address | Required | john@corp.com |
    | User Role | Required | Admin |
    | Group | Optional | Manager |
    | Metadata | Optional | `{"apiKey": "abc123"}` |

    You can also download the template to edit.
5. Click on **Upload users**.

<img className="screenshot-full" src="/img/user-management/onboard-user/bulk-invite/upload-csv.png" alt="Add user button" />

## Email Invitation

Pre-Requisite: **[Setup SMTP Server](/docs/tj-setup/smtp-setup/configuration)**

Once a user is invited to the workspace, they will receive an email containing a unique workspace invite link. By clicking the link, the user will be redirected to the workspace login or signup page to complete the onboarding process. 

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

:::info
On Self-Hosted ToolJet, admin can copy unique invitation URL and share with the user.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/copy-link.png" alt="Workspace Level Permissions" />

:::

## User Status

Admins can track the status of users as follows:

### Self-Hosted ToolJet

- **Invited**: The user has been invited to join the workspace.
- **Active**: The user is a member of the current workspace.
- **Archived**: The user has been archived by the admin.

### ToolJet Cloud

- **Requested**: The user has been invited to the current workspace but doesn't have a ToolJet account.
- **Invited**: The user has been invited to the current workspace and has a ToolJet account.
- **Active**: The user is a member of the current workspace.
- **Archived**: The user has been archived by the admin.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/user-status.png" alt="Workspace Level Permissions" />

