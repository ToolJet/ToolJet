---
id: invite-user
title: Inviting User
---

Role Required: Admin <br/>
Admins can invite users to a workspace using their email addresses by following these steps:

1. Go to **Workspce settings > Users**.
2. Click on **Add Users** button.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

3. Fill out the following details:
    - Name
    - Email address
    - Select groups from the drop down.
    - Add metadata if required in key-value pair format.
4. Click on **Invite users** button to send the invitation.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/user-details.png" alt="Invite User" />

The invited user will receive an email containing the workspace invite link.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

Admins can track the status of invited users as follows:

**For Self-Hosted**

- **Requested**: The user has not joined any workspace in the instance.
- **Invited**: The user is part of the instance in some other workspace.
- **Active**: The status changes to Active once the user joins the workspace.


**For Cloud**

- **Requested**: The user does not have a ToolJet account.
- **Invited**: The user have a ToolJet account.
- **Active**: The status changes to Active once the user joins the workspace.
