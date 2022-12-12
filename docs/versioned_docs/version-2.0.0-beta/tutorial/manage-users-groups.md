---
id: manage-users-groups
title: Managing Users and Groups
---

# Managing Users and Groups

## Managing Users

Admin of a workspace can add users to the workspace. To manage the users in your workspace, just go to the **Workspace menu** on top right corner and click on the **Manage Users**.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/menu1.png" alt="menu1" />



### Inviting users

Admins can invite anyone to a workspace using the email address. To invite a user:

- On the **Manage Users** page click on the `Invite new user` button.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/userspage.png" alt="userspage" />



- Now enter the details of new user such as first name, last name, email, and then click on the **Create User**.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/addnewuser.png" alt="add new user" />



- An email including the **Invite Link** to join your workspace will be send to the created user. The status will turn from **invited** to **active** after the user successfully joins your workspace using the invite link.

:::tip

You can also copy the invitation url by clicking on the copy icon next to `invited` status of the created user.

:::



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/status.png" alt="status"/>



### Disabling a user's access

You can disable any active user's access to your workspace by clicking on the **Archive** and then the status of the user will change from **active** to **archived**.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/archived.png" alt="archived"/>



### Enabling a user's access

Similar to archiving a user's access, you can enable it again by clicking on **Unarchive**. The status of user will change from **archived** to **invited** and the user will have to join again using the invite link received via the e-mail.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/status.png" alt="status" />



## Managing Groups

On ToolJet, Admins can create groups for users added in a workspace and grant them access to particular app(s) with specific permissions. To manage groups, just go to the **Account menu** on top right corner and click on the **Manage Groups**.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/menu2.png" alt="menu2" />



### Group properties

Every group on ToolJet has three components:

#### Apps: 

Admins can add or remove any number of apps for a group of users. To add an app to a group, select an app from the dropdown and click on `Add` button next to it. You can also set app permissions such as `View` or `Edit` for the group. You can set different permissions for different apps in a group.



<img className="screenshot-full" src="/img/tutorial/manage-users-groups/apps.png" alt="apps"/>



#### Users: 

Admins can add or remove any numbers of users in a group. Just select a user from the dropdown and click on `Add` button to add it to a group. To delete a user from a group, click on `Delete` button next to it.


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/users.png" alt="users" />



#### Permissions: 

Admins can set granular permission like creating/deleting apps or creating folder for a group of users.


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/permissions.png" alt="permissions" />


:::tip

All the activities performed by any Admin or any user in a workspace is logged in `Audit logs` - including any activity related with managing users and groups.

:::

### Predefined Groups

By default, every workspace will have two User Groups:

**1. All Users**

This group contains all the users and admins.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| You can add or remove apps. | Modification is disabled. This group will have all the users and admins added in a workspace. | You can edit permissions for all the users globally. |


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/allusers.png" alt="all users" />


**2. Admin**

This group contains admins by default. Admins can add more admins or remove the users in this group.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| Modification is disabled. By default, this group has `Edit` permission for all the apps in a workspace  | Admins can add or remove users in this group. | Modification is disabled. By default, all the admins can create and delete apps or create folders. |


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/admin.png" alt="admin" />

### Creating new group

- Click on `Create new group` button in the **User Groups** page.


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/newgroup1.png" alt="new group" />


- Enter a name for the group and click `Create Group` button.


<img className="screenshot-full" src="/img/tutorial/manage-users-groups/newgroup2.png" alt="new group 2"/>

- Once the group is created, you can add **Apps**, **Users** and set their **Properties** for that group.

### Deleting a group

To delete a group, click on `Delete` next to it. It will confirm whether you want to delete it or not, Click on `Yes` to delete the group.

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/deletegroup.png" alt="delete group" />
