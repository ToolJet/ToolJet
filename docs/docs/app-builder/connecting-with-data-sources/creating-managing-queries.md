---
id: "creating-managing-queries"
title: "Creating and Managing Queries"
---

Queries are used to perform API requests, query **[databases](/docs/data-sources/overview)**, and apply **[transformations](/docs/tutorial/transformations)** or data manipulation using **[JavaScript](/docs/data-sources/run-js)** and **[Python](/docs/data-sources/run-py)**.

You can create and manage queries in the Query Panel, located at the bottom of the App Builder. 

The Query Panel consists of two sections:
- The **Query Manager** on the left side, which displays a list of all the created queries.
- The **Query Editor** on the right side, used to configure the selected query.

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/query-panel.png" alt="App Builder: Query Panel"/>


## Creating a New Query

- Click on the **+** button in the Query Panel to open a menu listing the available data sources or you can add a new data source by clicking on **+ Add new Data Source** button.
- Select your the desired data source.

<img className="screenshot-full img-s" src="/img/app-builder/connecting-with-datasouces/create-query.png" alt="App Builder: Create queries"/>

## Configuring the Query

- Depending on the data source you’ve selected, you can configure your query using either GUI mode or SQL mode. For example, if you’re using a Postgres data source, you’ll have the option to choose between both available modes.

### GUI mode

- For Postgre data source, you will have to enter the table name and choose the operations you want to perform. 

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/gui-mode.png" alt="App Builder: configure PostgreSQL queries"/>

- For AWS S3 data source, you will have to select the bucket name, key, etc.

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/aws-gui.png" alt="App Builder: configure AWS S3 queries"/>


### SQL mode

- For other data sources such as MYSQL, PostgreSQL or SQL Server, you can choose SQL mode where you can write the SQL query to perform your desired operation. 

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/sql-mode.png" alt="App Builder: configure PostgreSQL queries"/>


### Examples

Let's explore CRUD operations for managing admin users with a PostgreSQL data source using a table named *admin_users*.

#### Reading Admin Users
- Create a query named *getAdminUsers* that retrieves all admin users from the database.

```sql
SELECT id, username, email, role, last_login, is_active FROM admin_users;
```

- To fetch a specific admin user by ID:

```sql
SELECT * FROM admin_users WHERE id = {{parameters.adminId}};
```

- To search admin users by name or email:

```sql
SELECT * FROM admin_users 
WHERE username ILIKE '%{{components.searchInput.value}}%' 
OR email ILIKE '%{{components.searchInput.value}}%';
```

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/search-admin.png" alt="App Builder: SQL examples"/>


#### Creating Admin Users
- Define a query *createAdmin* to add a new admin user to the system.

```sql
INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
VALUES (
  '{{components.usernameInput.value}}', 
  '{{components.emailInput.value}}', 
  '{{components.passwordInput.value}}', 
  '{{components.roleDropdown.value}}', 
  {{components.isActiveToggle.value}}, 
  CURRENT_TIMESTAMP
);
```
<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/create-admin.png" alt="App Builder: SQL example"/>

#### Updating Admin Users
- Set up a query *updateAdmin* to modify an existing admin user's details.

```sql
UPDATE admin_users
SET 
    username = '{{components.usernameInput.value}}',
    email = '{{components.emailInput.value}}',
    role = '{{components.roleDropdown.value}}',
    is_active = {{components.isActiveToggle.value}},
    updated_at = CURRENT_TIMESTAMP
WHERE id = {{components.adminTable.selectedRow.id}};
```

- To update just the admin's status (active/inactive):

```sql
UPDATE admin_users
SET 
    is_active = {{!components.adminTable.selectedRow.is_active}},
    updated_at = CURRENT_TIMESTAMP
WHERE id = {{components.adminTable.selectedRow.id}};
```

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/update-admin-status.png" alt="App Builder: SQL example"/>

#### Deleting Admin Users
- Create a query *deleteAdmin* to remove an admin user from the system.

```sql
DELETE FROM admin_users WHERE id = {{components.adminTable.selectedRow.id}};
```

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/delete-admin.png" alt="App Builder: SQL example"/>

You can bind these queries to appropriate UI components like buttons, forms, and tables to create a complete admin user management interface.


## Using Transformations and Events

**Transformations**: After fetching data, you might want to format it (e.g., filtering out unnecessary fields or converting data types). ToolJet allows using JavaScript or Python for these transformations.

**Event Handling**: Link queries with application events for dynamic interactions. For example, in the *updateRequest* query, you can set up an event to automatically run the *getAllRequests* query right after *updateRequest*. This ensures that the application retrieves and displays the updated data in the relevant components.


## Advanced Settings and Debugging

**Preview and Run**: Use the **Preview** button to test queries and view results in raw or JSON format before executing them within the app using the **Run** button.

**Configuration Settings**:
- **Run this query on application load?**: Decide if the query should execute automatically when the app loads.
- **Request confirmation before running query?**: Set up confirmations for query operations to prevent accidental data changes.
- **Show notification on success?**: Configure notifications to inform users of successful operations. You can customize this property's notification message content and display duration.



