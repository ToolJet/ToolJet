---
id: super-admin
title: Super Admin
---

import { ALL_ROLES, LAYERS, ADMIN_VS_SUPER_ADMIN } from './permissions-data';

<PlanBadge type="team" />

<AccessLayers layers={LAYERS} roles={ALL_ROLES} compact highlight="instance" />

On a self-hosted ToolJet, a Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins. The user who creates the instance gets the Super Admin role by default.

## Admin v/s Super Admin

A workspace admin's reach ends at their workspace. A super admin reaches every workspace and user of the instance, and the settings of the instance itself.

<PermissionMatrix
  roles={ADMIN_VS_SUPER_ADMIN.roles}
  sections={ADMIN_VS_SUPER_ADMIN.sections}
  stateLabels={{ always: 'Yes', never: 'No' }}
  legend={false}
  firstColumn="Privilege"
  caption="What an admin and a super admin can do"
/>

## Promote a User to Super Admin

Role Required: **Super Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > All Users**. <br/>
   (Example URL - `https://app.corp.com/instance-settings/all-users`)

3. Spot the user whose details needs to be updated and click on the kebab menu (three dots) located at the end of their row.
   <img className="screenshot-full" src="/img/user-management/profile-management/user-details/edit-menu.png" alt="Edit User Details Menu" />

4. Select **Edit user details**.

5. Enable the toggle in front of **Super Admin** to promote the user to a Super Admin.
   <img className="screenshot-full img-s" src="/img/user-management/profile-management/user-details/super-admin-toggle.png" alt="Super Admin Toggle" />

6. Click on **Update** at the bottom of the drawer.
