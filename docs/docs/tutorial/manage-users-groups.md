---
sidebar_position: 11
---

# Managing Users and Groups

## Managing Users

Admin of an organization can add users to the organization. To manage the users in your organization, just go to the **Account menu** on top right corner and click on the **Manage Users**.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/menu1.png)

</div>

### Inviting users

Admins can invite anyone to a ToolJet organization using the email address. To invite a user:

- On the **Manage Users** page click on the `Invite new user` button.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/userspage.png)

</div>

- Now enter the details of new user such as first name, last name, email, and then click on the **Create User**.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/addnewuser.png)

</div>

- An email including the **Invite Link** to join your organization will be send to the created user. The status will turn from **invited** to **active** after the user successfully joins your organization using the invite link.

:::tip

You can also copy the invitation url by clicking on the copy icon next to `invited` status of the created user.

:::

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/status.png)

</div>

### Disabling a user's access

You can disable any active user's access to your organization by clicking on the **Archive** and then the status of the user will change from **active** to **archived**.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/archived.png)

</div>

### Enabling a user's access

Similar to archiving a user's access, you can enable it again by clicking on **Unarchive**. The status of user will change from **archived** to **invited** and the user will have to join again using the invite link recieved via the e-mail.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/status.png)

</div>

## Managing Groups

On ToolJet, Admins can create groups for users added in an organization and grant them access to particular app(s) with specific permissions. To manage groups, just go to the **Account menu** on top right corner and click on the **Manage Groups**.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/menu2.png)

</div>

### Group properties

Every group on ToolJet has three components:

#### Apps: 

Admins can add or remove any number of apps for a group of users. To add an app to a group, select an app from the dropdown and click on `Add` button next to it. You can also set app permissions such as `View` or `Edit` for the group. You can set different permissions for different apps in a group.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/apps.png)

</div>

#### Users: 

Admins can add or remove any numbers of users in a group. Just select a user from the dropdown and click on `Add` button to add it to a group. To delete a user from a group, click on `Delete` button next to it.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/users.png)

</div>

#### Permissions: 

Admins can set granular permission like creating/deleting apps or creating folder for a group of users.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/permissions.png)

</div>

:::tip

All the activities performed by any Admin or any user in a ToolJet organization is logged in `Audit logs` - including any activity related with managing users and groups.

:::

### Predefined Groups

By default, every organization will have two User Groups:

**1. All Users**

This group contains all the users and admins.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| You can add or remove apps. | Modification is disabled. This group will have all the users and admins added in an organization. | You can edit permissions for all the users globally. |

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/allusers.png)

</div>

**2. Admin**

This group contains admins by default. Admins can add more admins or remove the users in this group.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| Modification is disabled. By default, this group has `Edit` permission for all the apps in an organization  | Admins can add or remove users in this group. | Modification is disabled. By default, all the admins can create and delete apps or create folders. |

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/admin.png)

</div>

### Creating new group

- Click on `Create new group` button in the **User Groups** page.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/newgroup1.png)

</div>

- Enter a name for the group and click `Create Group` button.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/newgroup2.png)

</div>

- Once the group is created, you can add **Apps**, **Users** and set their **Properties** for that group.

### Deleting a group

To delete a group, click on `Delete` next to it. It will confirm whether you want to delete it or not, Click on `Yes` to delete the group.

<div style={{textAlign: 'center'}}>

![ToolJet - Managing Users and Groups](/img/tutorial/manage-users-groups/deletegroup.png)

</div>
