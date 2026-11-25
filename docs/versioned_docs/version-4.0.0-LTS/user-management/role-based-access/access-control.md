---
id: access-control
title: Access Control
---

import { ROLES, ALL_ROLES, RESOURCES, LAYERS } from './permissions-data';

<AccessLayers layers={LAYERS} roles={ALL_ROLES} compact highlight="groups" />

Access control in ToolJet is configured per group. Under **Workspace Settings > Groups**, every group has two tabs:

- **Permissions**: workspace-wide actions, such as creating or deleting apps, data sources and folders.
- **Granular access**: what the group can do with individual apps, workflows, modules, data sources and folders, on all of them or on selected ones.

Admins configure both tabs. A group admin can open the two tabs of their own groups but not change them. For what each role gets by default, see **[User Roles](/docs/user-management/role-based-access/user-roles#permissions-for-user-roles)**.

## Permissions

<SectionSubtitle text="Workspace-wide actions a group may perform. Labels and descriptions are the ones the Permissions tab shows." />

<PermissionMatrix level="permission" roles={ROLES} sections={RESOURCES} caption="Workspace permissions and who has them by default" />

To configure view or edit access to individual resources, see **[Granular Access Control](#granular-access-control)**.

:::info
If a user has the create permission and creates a resource, the user becomes the owner of that resource and has all the permissions related to it by default. <br/>
For example, if a user creates a data source A, then by default, the user will have the configure and build access for data source A.
:::

### Configuring Permissions

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure permissions.

4. Switch to the **Permissions** tab and tick the permissions the group needs. Each change is saved as you make it.
    <!-- TODO screenshot: user-management/rbac/access-control/permissions-tab-v2.png | img-l | alt: The Permissions tab of the Operations group with Create apps and Create data sources ticked and Delete left unticked | shows: Workspace settings > Groups > Operations > Permissions tab in the Northwind Logistics workspace -->

The **Admin** group has every permission and the **End-user** group has none; neither can be changed. Give end-users more access through the **Granular access** tab of a custom group instead.

## Granular Access Control

Granular access decides what a group can do with specific resources. Every grant has three parts:

<CardGrid columns={3}>
  <FlowStep
    number="1"
    title="Choose the resources"
    description="All of a kind, including ones created later, or Custom: a hand-picked list. Custom is available on custom groups only."
  />
  <FlowStep
    number="2"
    title="Choose the level"
    description="View or Edit for apps, Execute or Edit for workflows, Build with or Edit for modules, Build with or Configure for data sources, and the three folder levels."
  />
  <FlowStep
    number="3"
    title="Add modifiers"
    description="Hide from dashboard, the environments the group can open an app in, or Restrict query run on a data source."
  />
</CardGrid>

The **Admin** group has every granular permission and can't be edited. The **End-user** group, and any custom group that contains end-users, can only hold View on apps, Execute on workflows, and View apps on app and workflow folders. Adding a higher grant to such a group asks you to change those users' role first.

### Apps

<AccessLevels resources={RESOURCES} id="apps" roles={ROLES} />

With **View**, users open the app in the environments selected under **Environment** and use the released version. With **Edit**, they open it in the builder as well. **Hide from dashboard** removes the app from the dashboard for everyone in the group, builders included; the app stays reachable by its URL. For how environment access combines across groups, see **[Environment Access Permission](/docs/development-lifecycle/environment/cloud/multi-environment#environment-access-permission)**.

<img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/app-permission-v2.png" alt="The Edit app permissions modal with Edit selected, the environments Development, Staging and Released app, and All apps as the resources" />

### Data Sources

<AccessLevels resources={RESOURCES} id="data-sources" roles={ROLES} />

**Build with** is for the builders who write queries against the data source. **Configure** is for the people who own the connection and its credentials. **Restrict query run** stops the group's members from running the data source's queries, whatever else they can do with the apps that use it.

<img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/ds-permission.png" alt="The Add data sources permissions modal with Configure selected and All data sources as the resources" />

### Modules

<AccessLevels resources={RESOURCES} id="modules" roles={ROLES} />

Modules with **Build with** access open on the dashboard in a locked, read-only state, so builders can read a module's queries, components and logic without changing them. **Hide from dashboard** hides a module from the dashboard and from search, but not from the **Module** section of the component library in the App Builder.

:::info
There is no separate **View** permission for modules. A module is never opened on its own, so end users inherit access to a module from their access to the app it is used in.
:::

:::note
A builder with access to an app can change the properties and styles of a module that is already on its canvas, and move, resize or delete it, without any module permission. Opening the module builder to see or change the module's internals needs **Edit** on the module.
:::

### Workflows

<AccessLevels resources={RESOURCES} id="workflows" roles={ROLES} />

<!-- TODO screenshot: user-management/rbac/access-control/workflow-permissions-v2.png | img-m | alt: The Add workflows permissions modal with Execute selected and two workflows chosen under Custom | shows: the Add permission > Workflows modal filled in for the Operations group -->

### Folders

:::warning BETA
Folder permissions is currently in beta and not recommended for production use.
:::

Folder permissions grant access to everything in a folder at once. If a workspace has hundreds of apps organised by team, give each team the right level on its folder instead of a grant per app. Everyone in the group gets that access to every app in the folder, including apps added later.

<AccessLevels resources={RESOURCES} id="folders" roles={ROLES} />

Each level includes the ones below it: **Edit folder** includes **Edit apps**, which includes **View apps**. Folder permissions apply across all environments.

<img className="screenshot-full img-m" src="/img/user-management/rbac/access-control/folder-permissions.png" alt="The Add folder permissions modal with the Edit folder, Edit apps and View apps levels and All folders as the resources" />

### Configuring Granular Access Permission

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure granular access permissions.

4. Switch to the **Granular access** tab and click **Add permission**.

5. Pick the kind of resource: **Apps**, **Modules**, **Data source**, **Workflows**, **App folders**, **Workflow folders**, **Module folders** or **Data source folders**.

6. Enter a **Permission name**, choose the level and any modifiers, choose **All** or **Custom** under **Resources**, and click **Add**.
    <!-- TODO screenshot: user-management/rbac/access-control/add-permission-menu-v2.png | img-l | alt: The Granular access tab of the Operations group with the Add permission menu open, listing Apps, Modules, Data source, Workflows and the four kinds of folders | shows: existing grants Dispatch apps, Fleet data and Carrier onboarding in the list behind the menu -->

To change or remove a grant later, click it in the list. The modal shows its settings and a delete icon.

## Where to Go Next

<CardGrid min={220}>
  <NextStepCard
    title="Custom Groups"
    description="Create a group for a team, see how access adds up, and delegate membership to group admins."
    href="/docs/user-management/role-based-access/custom-groups"
  />
  <NextStepCard
    title="Environment Access"
    description="How Development, Staging, Production and the released app combine across groups."
    href="/docs/development-lifecycle/environment/cloud/multi-environment#environment-access-permission"
  />
  <NextStepCard
    title="Dynamic Access Rules"
    description="Restrict pages, components, queries and rows inside an app."
    href="/docs/app-builder/dynamic-access-rule/overview"
  />
  <NextStepCard
    title="React Builder Access"
    description="Restrict screens and queries of a React Builder app to groups or users."
    href="/docs/app-builder/react-builder/access-control"
  />
</CardGrid>
