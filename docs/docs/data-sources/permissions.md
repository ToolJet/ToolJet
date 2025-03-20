---
id: permissions
title: User Permissions
---

Changing the **Permissions** for Data Sources is a privilege reserved for **Admins** and **[Super Admins](/docs/user-management/role-based-access/access-control#data-sources)** within the workspace.

To configure these permissions, navigate to **Workspace Settings** -> **Groups Settings**. Admins and Super Admins have the authority to assign the following permissions to user groups:

<br/>

#### Creation and Deletion of data sources within the workspace

| Permission | Description |
|:---|:---|
| **Just Create** | Add new data sources and modify existing ones. Delete button will not be visible on hovering over the connected data source. |
| **Just Delete** | Remove connected data sources from the workspace. Delete button will show up on hovering over the connected data source. |
| **Both Create and Delete** | Add new data sources and remove connected data sources from the workspace. |
| **Neither Create nor Delete** | No access to the Data Sources page from the Dashboard. Error toast will popup on trying to access the Data Sources page using URL. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/newpermissions.png" alt="Data Sources: Overview" />

</div>

<br/>

#### Authorization to View or Edit permitted data sources from the data source page

| Permission | Description |
|:---|:---|
| **View** | Connect to authorized data sources for their user group. Users can't update the credentials of authorized data sources. | 
| **Edit** | Users can update the credentials of authorized data sources. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/newui/overview/viewedit.png" alt="Data Sources: Overview" />

</div>

<br/>
