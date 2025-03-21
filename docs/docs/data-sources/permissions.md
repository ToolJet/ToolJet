---
id: permissions
title: User Permissions
---

Admins and Super Admins can configure various permissions for a data source within a workspace, for detailed information on other permissions and access control, refer to the **[Access Control](/docs/user-management/role-based-access/access-control#data-sources)** Guide.

## Permissions

### Creation and Deletion of Data Sources

| Permission | Description |
|:---|:---|
| **Just Create** | Add new data sources and modify existing ones. Delete button will not be visible on hovering over the connected data source. |
| **Just Delete** | Remove connected data sources from the workspace. Delete button will show up on hovering over the connected data source. |
| **Both Create and Delete** | Add new data sources and remove connected data sources from the workspace. |
| **Neither Create nor Delete** | No access to the Data Sources page from the Dashboard. Error toast will popup on trying to access the Data Sources page using URL. |

<img className="screenshot-full img-m" src="/img/datasource-reference/overview/ds-permissions.png" alt="Data Sources: Overview" />

### Configure or Build with Data Sources

| Permission | Description |
|:---|:---|
| **Build with** | Connect to authorized data sources for their user group. Users can't update the credentials of authorized data sources. | 
| **Configure** | Users can update the credentials of authorized data sources. |

<img className="screenshot-full img-m" src="/img/datasource-reference/overview/ds-granular.png" alt="Data Sources: Overview" />
