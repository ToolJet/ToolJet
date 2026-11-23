---
id: group-admin
title: Group Admin
---

import { ALL_ROLES, LAYERS, WORKSPACE_ADMIN_VS_GROUP_ADMIN } from './permissions-data';

<PlanBadge type="team" />

<AccessLayers layers={LAYERS} roles={ALL_ROLES} compact highlight="groups" />

A Group Admin manages the members of one or more **[custom groups](/docs/user-management/role-based-access/custom-groups)**. Workspace Admins control what each group can access, while Group Admins, such as team leads, add and remove people as their teams change.

## Workspace Admin vs Group Admin

<PermissionMatrix
  roles={WORKSPACE_ADMIN_VS_GROUP_ADMIN.roles}
  sections={WORKSPACE_ADMIN_VS_GROUP_ADMIN.sections}
  stateLabels={{ always: 'Yes', never: 'No' }}
  legend={false}
  firstColumn="Capability"
  caption="What a workspace admin and a group admin can do"
/>

Any active workspace user can be a Group Admin, including End Users. Group Admins can be assigned only to custom groups, not to the default **Admin**, **Builder** and **End User** groups.

## Assigning a Group Admin

Role Required: **Admin**

1. Click the settings icon (⚙️) on the bottom left of the dashboard.
2. Go to **Workspace Settings** > **Groups** and select a custom group.
3. Open the **Group admins** tab.
4. Search for users by name or email and select them.
5. Click **Assign group admin**.

<img className="screenshot-full img-l" src="/img/user-management/rbac/group-admin/group-admins-tab.png" alt="Group admins tab of a custom group with two assigned Group Admins" />

To remove a Group Admin, click **Remove** on their row.

## Managing Group Members

Role Required: **Group Admin**

1. Click the settings icon (⚙️) on the bottom left of the dashboard.
2. Go to **Workspace Settings** > **Groups** and select the group.
3. In the **Users** tab, search for users by name or email and select them.
4. Click **Add users**.

<img className="screenshot-full img-l" src="/img/user-management/rbac/group-admin/group-admin-users-tab.png" alt="Users tab of a custom group as seen by a Group Admin" />

To remove a user, click **Remove** on their row.

End Users can't be added to a group that grants builder-level permissions, such as editing apps. A Workspace Admin has to change their role to Builder first.

## Groups a Group Admin Can See

| Group Admin's Role | Groups Listed |
|:---|:---|
| End User | Only the custom groups they administer |
| Builder | The custom groups they administer, plus the default groups (read-only) |

Custom groups a Group Admin is only a member of aren't listed.

## Related

- [Custom Groups](/docs/user-management/role-based-access/custom-groups)
- [User Roles](/docs/user-management/role-based-access/user-roles)
- [Access Control](/docs/user-management/role-based-access/access-control)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
