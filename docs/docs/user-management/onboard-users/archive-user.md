---
id: archive-user
title: Archiving and Unarchiving Users
---

Admins can archive users in a workspace which will remove the access to the workspace for the user but will preserve all the apps and changes done by the user and the user can be re-invited to the workspace by unarchiving the user if needed.

## Steps to Archive User

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.tooljetcorp.com/nexus/workspace-settings/users`)

3. Spot the user that need to be archived and click on the kebab menu located at the end of their row. 

<img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archive-user-menu.png" alt="Workspace Level Permissions" />

4. Select **Archive user**.

5. The status of the user will be updated to archived.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archived-user.png" alt="Workspace Level Permissions" />

:::info
1. Archived users will not be counted for billing/licensing.
2. There must be at least one active admin; all the admins in a workspace cannot be archived.
:::

## Steps to Unarchive User

Role Required: **Workspace Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.tooljetcorp.com/nexus/workspace-settings/users`)

3. Spot the user that need to be archived and click on the kebab menu located at the end of their row. 

<img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchive-user-menu.png" alt="Workspace Level Permissions" />

3. Select **Unarchive user**.

4. The status of the user will be updated to invited/requested and the user will recive a new invitation mail to join the workspace.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchived-user.png" alt="Workspace Level Permissions" />
