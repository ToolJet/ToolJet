---
id: archive-user
title: Archive and Unarchive
---

Admin users can archive users in a workspace which will remove the access to the workspace for the user but will preserve all the apps and changes done by the user and the user can be re-invited to the workspace by unarchiving the user if needed.

:::info
1. Archived users will not be counted for billing/licensing.
2. There must be at least one active admin; all the admins in a workspace cannot be archived.
:::

## Steps to Archive User

### Instance Level

When a user is archived at the instance level, they will automatically be archived from all the workspaces and cannot be invited to any new workspace. Follow these steps to archive a user at the instance level:

Role Required: **Super Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > All Users**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/all-users`)

3. Spot the user that need to be archived and click on the kebab menu located at the end of their row. 
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-archive-user-menu.png" alt="Workspace Level Permissions" />

4. Select **Archive user**.

5. The status of the user will be updated to archived.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-archived-user.png" alt="Workspace Level Permissions" />

### Workspace Level

Archiving a user at the workspace level will only remove their access to that specific workspace. The user will still have access to any other workspaces where they are invited. Follow these steps to archive a user at the workspace level:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Spot the user that need to be archived and click on the kebab menu located at the end of their row. 
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archive-user-menu.png" alt="Workspace Level Permissions" />

4. Select **Archive user**.

5. The status of the user will be updated to archived.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archived-user.png" alt="Workspace Level Permissions" />

## Steps to Unarchive User

### Instance Level

When a user is unarchived at the instance level, after that the admins will need to unarchive or invite the user again at individual workspace.

Role Required: **Super Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > All Users**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/all-users`)

3. Spot the user that need to be unarchived and click on the kebab menu located at the end of their row. 
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-unarchive-user-menu.png" alt="Workspace Level Permissions" />

4. Select **Unarchive user**.

5. The status of the user will be updated to invited.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-unarchived-user.png" alt="Workspace Level Permissions" />

### Workspace Level

If a user is unarchived at the workspace level, they are automatically unarchived at the instance level as well.

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Spot the user that need to be unarchived and click on the kebab menu located at the end of their row. 
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchive-user-menu.png" alt="Workspace Level Permissions" />

3. Select **Unarchive user**.

4. The status of the user will be updated to invited and the user will recive a new invitation mail to join the workspace.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchived-user.png" alt="Workspace Level Permissions" />
