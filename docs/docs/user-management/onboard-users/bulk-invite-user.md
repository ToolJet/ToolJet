---
id: bulk-invite-users
title: Bulk Inviting Users
---

Role Required: Workspace Admin <br/>
Admins can bulk invite users to a workspace using a CSV file by following these steps:

1. Go to **Workspace settings > Users**.

2. Click on **Add Users** button.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

3. Switch to **Upload CSV file** tab.
4. Upload a CSV file consiting following fields:
    | First Name | Last Name | Email | User Role | Group | Metadata |
    |:----------:|:---------:|:-----:|:---------:|:-----:|:--------:|
    
    You can also download the template to edit
5. Click on **Upload users**.

<img className="screenshot-full" src="/img/user-management/onboard-user/bulk-invite/uploaded-users.png" alt="Add user button" />

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
