---
id: invite-user
title: Invite
---

Admins can invite users to a workspace using their email addresses and assign them specific **[roles](/docs/user-management/role-based-access/user-roles)** and **[groups](/docs/user-management/role-based-access/custom-groups)** to manage permissions. The invited users receive an email with instructions to join the workspace, ensuring a seamless onboarding process.

## Steps to Invite a User

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Click on the **Add users** button.
    <img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

4. Fill out the following details:
    | Field | Required/Optional | Example |
    |:-----|:---------|:-------|
    | Name | Required | John Doe |
    | Email address | Required | john@corp.com |
    | Select groups | Required | USER ROLE: **Admin** |
    | | Optional | CUSTOM GROUPS: **Manager** |
    | [User metadata](/docs/user-management/onboard-users/user-metadata) | Optional | `{"apiKey": "abc123"}` |

    <img className="screenshot-full img-m" src="/img/user-management/onboard-user/invite-user/user-details.png" alt="Invite User" />

5. Click on the **Invite users** button to send the invitation.
    

## Email Invitation

Pre-Requisite: **[Setup SMTP Server](/docs/tj-setup/smtp-setup/configuration)**

Once a user is invited to the workspace, they will receive an email containing a unique workspace invite link. By clicking the link, the user will be redirected to the workspace login or signup page to complete the onboarding process. 

<img className="screenshot-full img-l" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

## Invitation URL 

On Self-Hosted ToolJet, admins can copy unique invitation URL and share with the user.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/copy-link.png" alt="Workspace Level Permissions" />

## User Status

Admin users can track the status of users as follows:

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

