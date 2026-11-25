---
id: custom-groups
title: Custom Groups
---

import { ALL_ROLES, LAYERS, EFFECTIVE_ACCESS_EXAMPLE } from './permissions-data';

<PlanBadge type="team" />

<AccessLayers layers={LAYERS} roles={ALL_ROLES} compact highlight="groups" />

Custom groups give a team exactly the access it needs. A group has members and permissions. A user can be in any number of custom groups and gets the highest access any of them grants, within what their role allows.

For example, if you have apps built for two teams, HR and Sales, and you want team members to only have access to the apps that are relevant to their team, create two custom groups named HR and Sales, and grant each one its own apps under **[granular access](/docs/user-management/role-based-access/access-control#granular-access-control)**.

## Default Groups and Custom Groups

<CardGrid columns={2}>
  <ConfigCard
    label="Default group"
    title="One per role"
    description="Admin, Builder and End-user. Every user is in exactly one of them: the one that matches their role."
    features={[
      'Carries the permissions of the role',
      'Admin cannot be changed; Builder and End-user can, within the role',
      'Granular access always applies to all resources of a kind',
      'Cannot be renamed or deleted; its members change when a user changes role',
    ]}
  />
  <ConfigCard
    label="Custom group"
    labelBg="#ecf0fe"
    labelColor="#4368e3"
    title="Any members, any permissions"
    description="Created by an admin for a team or a purpose, with only the users who need that access."
    features={[
      'Any mix of builders and end-users',
      'Permissions within the ceiling of each member’s role',
      'Granular access on all resources of a kind, or on selected ones',
      'Can have group admins who manage its members',
    ]}
  />
</CardGrid>

## How Access Adds Up

<SectionSubtitle text="Priya Raman is a Builder in the Operations and Finance groups. An admin set the Builder group to View on all apps and turned off Delete." />

<PermissionMatrix
  roles={EFFECTIVE_ACCESS_EXAMPLE.roles}
  sections={EFFECTIVE_ACCESS_EXAMPLE.sections}
  stateLabels={{ always: 'Granted', never: 'Not granted' }}
  legend={false}
  firstColumn="Resource"
  caption="How Priya's access adds up across her groups"
  stack="md"
/>

- Users inherit permissions from the default group of their role and from every custom group they belong to. Where groups differ, the highest level wins.
- Adding a user to a custom group that grants more than their role allows upgrades the role once you confirm. Adding an end-user to a group with **Edit** on apps, for example, makes them a Builder.
- Moving a user to a lower role removes them from the custom groups that grant more than the new role allows.

## Creating Custom Groups

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
   (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click **+ Add new group**.
4. Enter a name for the group and click **Create Group**.

Then add members on the **Users** tab, and set what the group may do on the **Permissions** and **Granular access** tabs. See **[Access Control](/docs/user-management/role-based-access/access-control)**.

<img className="screenshot-full" src="/img/user-management/rbac/custom-group/new-group.png" alt="Create Custom Group" />

## Duplicate or Delete a Group

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
   (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click on the kebab menu next to the group.
4. To copy the group, select **Duplicate group**, tick the parts to copy (users, group admins, permissions and each kind of granular access) and click **Duplicate**.
5. To remove the group, select **Delete group** and confirm. Its members keep their role and their other groups. The default groups cannot be deleted.

<img className="screenshot-full img-s" src="/img/tutorial/manage-users-groups/duplicate-group.png" alt="Duplicate Group" />

## Group Admins

A custom group can have group admins: members who add and remove the group's users without being able to change its permissions. Any active workspace user can be one. See **[Group Admin](/docs/user-management/role-based-access/group-admin)**.

## Where to Go Next

<CardGrid min={220}>
  <NextStepCard
    title="Access Control"
    description="Every permission and granular access setting, and how to configure them for a group."
    href="/docs/user-management/role-based-access/access-control"
  />
  <NextStepCard
    title="User Roles"
    description="The three roles, where access is decided, and what each role gets by default."
    href="/docs/user-management/role-based-access/user-roles"
  />
  <NextStepCard
    title="Group Admin"
    description="Let team leads add and remove the members of a custom group."
    href="/docs/user-management/role-based-access/group-admin"
  />
  <NextStepCard
    title="Group Sync"
    description="Map groups from your identity provider to ToolJet groups and roles."
    href="/docs/user-management/group-sync/workspace-level/oidc"
  />
</CardGrid>
