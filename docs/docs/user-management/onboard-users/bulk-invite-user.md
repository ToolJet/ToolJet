---
id: bulk-invite-users
title: Bulk Inviting Users
---

Workspace admins can bulk invite users to a workspace using a CSV file containing user email address, **[roles](#)**, **[groups](#)** and other details. The invited users receive an email with instructions to join the workspace, ensuring a seamless onboarding process.

## Steps to Bulk Invite Users

Role Required: **Workspace Admin**

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.tooljetcorp.com/nexus/workspace-settings/users`)

3. Click on **Add users** button.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

3. Switch to **Upload CSV file** tab.
4. Upload a CSV file consiting following fields:
    | First Name | Last Name | Email | User Role | Group | Metadata |
    |:----------:|:---------:|:-----:|:---------:|:-----:|:--------:|
    
    You can also download the template to edit.
5. Click on **Upload users**.

<img className="screenshot-full" src="/img/user-management/onboard-user/bulk-invite/upload-csv.png" alt="Add user button" />

## Email Invitation

Once a user is invited to the workspace, they will receive an email containing a unique workspace invite link. By clicking the link, the user will be redirected to the workspace login or signup page to complete the onboarding process. 

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

## User Status

Admins can track the status of invited users as follows:

| <center> Status </center> | <center> Self-Hosted </center> | <center> Cloud </center> |
|:-------:|:------------|:------|
| **Requested** | The user has been invited to the current workspace and is not part of any other workspace within the instance. | The user has been invited to the current workspace but doesn't have a ToolJet account. |
| **Invited** | The user has been invited to the current workspace and is already a part of another workspace within the instance. | The user has been invited to the current workspace and has a ToolJet account. |
| **Active** | The user is a member of the current workspace. | The user is a member of the current workspace. |
| **Archived**| The user has been archived by the admin. | The user has been archived by the admin. |

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/user-status.png" alt="Workspace Level Permissions" />

