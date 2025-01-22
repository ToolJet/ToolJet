---
id: access-control
title: Access Control
---

ToolJet enables you to manage access control by configuring permissions like create and delete. Access control can be applied to all of your resources such as apps and data sources. Additionally, ToolJet supports granular access control, allowing you to configure permissions for individual resources to ensure precise and secure management.

## Permissions

The following permissions can be configured for the given resources:
| Resource                    | Permission            | Description                                                                                 |
|:----------------------------|:----------------------|:--------------------------------------------------------------------------------------------|
| **Apps**                    | Create           | Allows users of the group to create new applications within the workspace.                 |
|                             | Delete           | Allows users of the group to delete applications from the workspace.              |
| **Data sources**            | Create           | Allows users of the group to add new data sources in the workspace. |
|                             | Delete           | Allows users of the group to remove data sources from the workspace.              |
| **Folder**                  | Create/Update/Delete | Allows users of the group to create, update, or delete folders to organize resources. |
| **Workspace constants/variables** | Create/Update/Delete | Allows users of the group to define, modify, or remove constants and variables used across the workspace. |

### Configuring Permissions

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure permissions.

4. Switch to the **Permissions** tab and configure the required permissions.

<img className="screenshot-full" src="/img/user-management/rbac/access-control/select-permission.png" alt="Create Custom Group" />


## Granular Access Control

In ToolJet, you can set granular level access control for apps and data sources, by configuring permissions like view access or edit access, to manage who can interact with the resources in your workspace. You can apply permissions either to all resources (e.g., all apps or all data sources) or to specific, selected resources, offering flexibility and precision in managing access.

### Apps

**Permissions**

- **Edit**: Grants the edit access to the selected resources.
- **View**: Grants the view access to the released version of the selected resources.
- **Hide from dashboard**:  Hides the selected resources from the dashboard, making them accessible only via URL. This feature is disabled for Edit Access.

**Resources**

- **All apps**: Provides the selected access (Edit or View) to all the apps in the workspace, including any newly created apps.
- **Custom**: Provide the selected access (Edit or View) only to the specified apps.

<img className="screenshot-full" src="/img/user-management/rbac/access-control/app-permission.png" alt="Create Custom Group" />

### Data Sources

**Permissions**

- **Configure**: Users in the group can access and edit the configuration details of the selected resources.
- **Build with**: Users in the group can use the selected resources in apps and workflows.

**Resources**

- **All data sources**: Provides the selected access (Configure or Build with) to all the data sources in the workspace, including any newly created data source.
- **Custom**: Provide the selected access (Configure or Build with) only to the specified data sources.

<img className="screenshot-full" src="/img/user-management/rbac/access-control/ds-permission.png" alt="Create Custom Group" />

### Configuring Granular Access Permission

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure granular access permissions.

4. Switch to the **Granular access** tab and click on **+ Add permission** button.

5. Select the resource (Apps/Data source) based on requirement. Give a name for the permission, configure required permission and click on **Add** at the bottom of the modal.

<img className="screenshot-full" src="/img/user-management/rbac/access-control/select-resource.png" alt="Create Custom Group" />
