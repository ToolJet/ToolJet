---
id: permissions
title: App Builder Permissions
---

In ToolJet App Builder you can configure three levels of permission to build secure, role-based applications. You can configure permissions at the page level, query level, and component level to ensure users only access the features and data they're authorized to use.

## When To Use

1. **Multi-role applications**: When your app serves different user types (leadership, managers, executives, etc.) who need access to different features, data, or functionality based on their role.
2. **Sensitive data protection**: When your application handles confidential information like financial data, personal records, or business-critical operations that should only be accessible to authorized personnel.
3. **Compliance and security requirements**: When your organization has regulatory requirements, audit trails, or security policies that mandate controlled access to specific features, data, or administrative functions.


## Permission Types

1. [Page Level Permissions](#page-level-permissions): Control which users can access specific pages in your application.
2. [Query Level Permissions](#query-level-permissions): Restrict which users can execute particular queries or API calls.
3. [Component Level Permissions](#component-level-permissions): Hide or show specific UI components based on access permission.

### Page Level Permissions

Page permissions control who can access a particular page in your application. When a user doesn't have permission to access a page, they won't be able to navigate to it.

:::note
1. Incase the user tries to access a restricted page, they will be redirected to home page if that’s accessible otherwise they will get redirected to the next accessible page.
2. User won’t be able to access the application itself, if all the pages are in accessible.
3. For public released apps, only non-restricted pages will be accessible to everyone. Restricted pages won’t be accessible to anyone including the users or user groups who have access to it.
:::

#### Common Use Case

- **Administrative pages**: Restrict access to admin related pages only to the authorized users.
- **Department-specific dashboards**: Create separate pages for Sales, Marketing, HR that only relevant teams can access.
- **Sensitive reporting**: Hide financial reports, audit logs, or compliance pages from unauthorized users.

#### Scenarios

- When entire sections of your application should not be accessible to certain user roles.
- When you need to create role-specific landing pages or dashboards.
- When compliance requires complete segregation of certain functionality.

#### Configuring Page Level Permission

**Role Required**: Admin or Builder

1. Navigate to the application, where you want to configure the page permission.
2. Click the kebab menu (three dots) next to the page name and select **Page permission**.
   <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/page-permission.png" alt="Page Permission" />
4. Choose your permission type:
    - **All users with access to the app**: Grants access to all users who can access the application.
    - **Users**: Select specific users from the dropdown (only the users with access to the application will be shown in the dropdown).
    - **User groups**: Restrict access to members of selected user groups (only the default user roles and custom groups which has access to the application will be shown in the dropdown).
   <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/page-modal.png" alt="Page Permission" />

### Query Level Permissions

Query-level permissions allow you to control which users can execute specific queries. This is crucial for protecting sensitive data operations and ensuring only authorized users can perform query execution.

:::note
For public released apps, only non-restricted queries will be accessible to everyone. Restricted queries won’t be accessible to anyone including the users or user groups who have access to it.
:::

#### Common Use Case

- **Data modification operations**: Restrict CREATE, UPDATE, DELETE queries to authorized users only.
- **Sensitive data access**: Limit access to queries that fetch personal information, financial data, or confidential records.
- **Administrative functions**: Control queries that manage user accounts, system settings, or configuration data.
- **Departmental data**: Restrict HR queries to HR team, Sales queries to Sales team.
- **Audit and compliance**: Limit access to queries that generate audit trails or compliance reports.

#### Scenarios

- When you need granular control over who can execute specific operations.
- When different user roles should access different data sets from the same tables.
- When you want to prevent accidental data modification by restricting write operations.

#### Configuring Query Level Permission

**Role Required**: Admin or Builder

1. Select the query, then click the kebab menu (three dots) next to the query name on the query panel. <br/>
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission-kebab.png" alt="App Builder: Create queries"/>
2. Select **Query permission**. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission.png" alt="App Builder: Component library"/>
3. Select the **Type**:
    - **All users with access to the app**: Grants access to all users who can access the application.
    - **Users**: Select specific users from the dropdown (only the users with access to the application will be shown in the dropdown).
    - **User groups**: Restricts access to members of selected user groups (only the default user roles and custom groups which has access to the application will be shown in the dropdown).
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/permission-type.png" alt="App Builder: Component library"/>

:::note
If an admin restricts a query and doesn't include the builder in the allowed users or groups, the builder will lose access to run, modify, or change permissions for that query. This is to prevent builders from overriding security policies established by administrators. To regain access, the builder must be explicitly added to the allowed users/groups by the admin.
:::

#### Handling Access Denied Scenarios

When a user attempts to run a query they don't have permission to access, admin can configure error handling by following the given steps:
1. Navigate to the query's Settings > Event handler.
2. Add a Query Failure event handler.
3. In the **Run Only If** property, add: `{{queries.<query_name>.response.statusCode === 401}}`.
4. Configure appropriate actions like showing an error message, redirecting users, or logging the access attempt.
   <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/query-denied.png" alt="Query Permission Denied" />

### Component Level Permissions

Component-level permissions control which UI elements users can see and interact with. Components that users don't have permission to access will not render at all in their interface.

:::note
For public released apps, only non-restricted components will be accessible to everyone. Restricted components won’t be accessible to anyone including the users or user groups who have access to it.
:::

#### Use Cases
- **Action buttons**: Hide Edit, Delete, Approve buttons from users who shouldn't perform these actions.
- **Input forms**: Show create/edit forms only to users with modification rights.
- **Sensitive information display**: Hide salary fields, personal details, or confidential data from unauthorized viewers.

#### Scenarios
- When users can view a page but should only interact with specific elements.
- When you want to provide read-only access to some users while allowing full interaction for others.
- When building multi-tenant applications where different tenants see different UI elements.

#### Configuring Component Level Permission

**Role Required**: Admin or Builder

1. Select the component, then click the kebab menu (three dots) next to the component name in the properties panel.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/components/permission-kebab.png" alt="App Builder: Component library"/>
2. Select **Component permission**. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/components/component-permission.png" alt="App Builder: Component library"/>
3. Select the **Type**:
    - **All users with access to the app**: Grants access to all users who can access the application.
    - **Users**: Select specific users from the dropdown. Note: These users must already have access to the application.
    - **User groups**: Restricts access to members of selected user groups. Note: The selected user groups must have access to the application.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/components/permission-type.png" alt="App Builder: Component library"/>

:::note
If an admin restricts a component and doesn't include the builder in the allowed users or groups, the builder will lose access to modify, or change permissions for that component. This is to prevent builders from overriding security policies established by administrators. To regain access, the builder must be explicitly added to the allowed users/groups by the admin.
:::
