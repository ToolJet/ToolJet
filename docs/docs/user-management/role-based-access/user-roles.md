---
id: user-roles
title: User Roles
hide_title: true
---

import { ROLES, ALL_ROLES, RESOURCES, LAYERS } from './permissions-data';

<DocHero
  eyebrow="Roles, groups and permissions"
  title="User Roles"
  description="Every member of a workspace has one role: Admin, Builder or End-user. The role sets the most a user can do. Groups carry the permissions, and a user's access is the sum of their groups, within what the role allows."
/>

ToolJet's role-based access control decides who can build, configure and use the resources in a workspace: apps, workflows, modules, data sources, folders, workspace constants and the ToolJet Database. Roles count towards licensing and billing; see **[ToolJet Pricing](https://www.tooljet.com/pricing)**.

## Default User Roles

<RoleCards roles={ROLES} />

Two more kinds of administrator exist outside the three roles. A **[Super Admin](/docs/user-management/role-based-access/super-admin)** manages every workspace of a self-hosted instance. A **[Group Admin](/docs/user-management/role-based-access/group-admin)** manages the members of one custom group.

## Where Access Is Decided

Access is decided in layers, from the instance down to a single query. Each layer can only narrow what the layer above allows, so when a user can't do something, start at the top.

<AccessLayers layers={LAYERS} roles={ALL_ROLES} />

## Permissions for User Roles

Admins have every permission and can't be restricted. Builders start with every permission on by default; an admin can turn permissions off for the Builder group, or grant them to custom groups instead. End-users only ever view and use what they are given access to. Expand a row to see its permissions and settings.

<PermissionMatrix level="resource" roles={ROLES} sections={RESOURCES} caption="Permissions by role" />

Every setting, what it allows and how to configure it is on the **[Access Control](/docs/user-management/role-based-access/access-control)** page.

## How Access Adds Up

- A user has exactly one role, so they are in exactly one default group: Admin, Builder or End-user.
- Custom groups add permissions on top of the default group. A user can be in any number of them.
- A user gets the highest level that any of their groups grants, within the ceiling of their role. A custom group can give an end-user View on more apps, but never Edit.

See a worked example in **[Custom Groups](/docs/user-management/role-based-access/custom-groups#how-access-adds-up)**.

## Manage User Roles

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Find the user, click the kebab menu at the end of their row, then click **Edit user details**.
    <!-- TODO screenshot: user-management/rbac/user-roles/edit-user-menu-v2.png | img-l | alt: The row menu on the Users page with Edit user details highlighted | shows: Workspace settings > Users, kebab menu open on a user row in the Northwind Logistics workspace -->

4. Under **User groups**, pick the new role under **USER ROLE**.
    <img className="screenshot-full img-m" src="/img/user-management/rbac/user-roles/update-user-role.png" alt="The Edit user details drawer with the User groups dropdown open, showing the Admin, Builder and End-user options" />

5. Click **Update** at the bottom of the drawer.

6. Read the confirmation and click **Continue**. Moving a user to a lower role also removes them from custom groups that grant more than the new role allows.
    <img className="screenshot-full img-s" src="/img/user-management/rbac/user-roles/warning.png" alt="The Edit user role confirmation dialog" />

## Where to Go Next

<CardGrid min={220}>
  <NextStepCard
    title="Access Control"
    description="Every permission and granular access setting, and how to configure them."
    href="/docs/user-management/role-based-access/access-control"
  />
  <NextStepCard
    title="Custom Groups"
    description="Give a team exactly the access it needs, and see how access adds up."
    href="/docs/user-management/role-based-access/custom-groups"
  />
  <NextStepCard
    title="Super Admin"
    description="What an instance-level administrator can do that a workspace admin can't."
    href="/docs/user-management/role-based-access/super-admin"
  />
  <NextStepCard
    title="Dynamic Access Rules"
    description="Restrict pages, components, queries and rows inside an app."
    href="/docs/app-builder/dynamic-access-rule/overview"
  />
</CardGrid>
