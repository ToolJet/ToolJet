---
id: invite-user
title: Inviting User
---

Workspace admins can invite users to a workspace using their email addresses and assign them specific **[roles](#)** and **[groups](#)** to manage permissions. The invited users receive an email with instructions to join the workspace, ensuring a seamless onboarding process.

## Steps to Invite a User

Role Required: **Workspace Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.tooljetcorp.com/nexus/workspace-settings/users`)

3. Click on **Add users** button.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

4. Fill out the following details:
    - Name
    - Email address
    - Select groups from the drop down.
    - Add metadata if required in key-value pair format.

5. Click on **Invite users** button to send the invitation.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/user-details.png" alt="Invite User" />

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

