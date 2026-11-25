---
id: permissions
title: Data Source Permissions
---

import { ROLES, RESOURCES } from '../user-management/role-based-access/permissions-data';

Who can add, remove, configure and query a data source is decided per group under **Workspace Settings > Groups**, by admins and super admins. This page describes what each permission changes on the Data Sources page. For the whole model, see **[Access Control](/docs/user-management/role-based-access/access-control#data-sources)**.

## Permissions

### Creation and Deletion of Data Sources

The **Create** and **Delete** permissions under **Data sources** on a group's **Permissions** tab decide what its members can do on the Data Sources page.

| Permission | Description |
|:---|:---|
| **Create** | Add new data sources and modify existing ones. Delete button will not be visible on hovering over the connected data source. |
| **Delete** | Remove connected data sources from the workspace. Delete button will show up on hovering over the connected data source. |
| **Create and Delete** | Add new data sources and remove connected data sources from the workspace. |
| **Neither Create nor Delete** | No access to the Data Sources page from the Dashboard. Error toast will popup on trying to access the Data Sources page using URL. |

<img style={{marginBottom:'15px'}} className = "screenshot-full img-l" src="/img/datasource-reference/overview/permissions-v2.png" alt="The Data sources rows of a group's Permissions tab" />

### ToolJet Database Permissions

The **ToolJet Database** permission (**Create/Update/Delete**) on the same tab allows all operations on the ToolJet Database from the database editor: creating and changing tables, and adding, editing and deleting rows. Apps read and write the database through their own queries, which this permission does not affect.

:::note
The **Create/Update/Delete** permission can be assigned to any group, including custom groups. Workspace admins and super admins configure it from **Workspace Settings > Groups**.
:::

### Configure or Build with Data Sources

Access to individual data sources is granted on a group's **Granular access** tab, on all data sources or on selected ones.

<AccessLevels
  resources={RESOURCES}
  id="data-sources"
  roles={ROLES}
  href="/docs/user-management/role-based-access/access-control#configuring-granular-access-permission"
  linkLabel="How to configure"
/>

With **Build with**, users write queries against the data source in apps and workflows but cannot see or change its credentials. With **Configure**, they open the data source and update its connection details.
