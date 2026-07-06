---
id: row-level-security
title: Row Level Security
---

<PlanBadge type="enterprise" />

Row-level security in ToolJet lets you control which records a user can see or interact with, even when multiple users access the same table. This is useful when you want to restrict access to specific rows based on [custom groups](/docs/user-management/role-based-access/custom-groups/) or [default user roles](/docs/user-management/role-based-access/user-roles#default-user-roles). Row-level security is applied on the server side, ensuring the logic is secure and hidden from the client.

Row-level security is built on [Server-Side Variables](/docs/app-builder/dynamic-access-rule/server-side-variables). You reference the current user's identity through `globals.server.currentUser`, and ToolJet resolves those values on the server before the query runs, so users cannot tamper with the filter from the browser.

:::info
A filter written with the client-side `{{globals.currentUser.*}}` variable is resolved in the browser, so a user can modify its value (for example, through browser dev tools) to return another user's rows. Client-side filtering is a presentation convenience, not a security control.
:::

:::info
Server-side variables (`{{globals.server.currentUser.*}}`) are resolved on the server from the authenticated session, so the filter cannot be bypassed. Always use them for data segregation that is a security or compliance requirement.
:::

## Prerequisites

- Row-level security relies on server-side variables, which are available on **Enterprise** plans only.
- Filtering is written inside the [Query Manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries), so it works with all data sources except RunJS and RunPy.

## Common Use Cases

- **Department-specific data**: Restrict HR data to HR team, Sales data to Sales team.
- **Multi-tenant applications**: Ensure customers only see their own records in shared tables.
- **Regional access control**: Limit data visibility based on user's assigned region or branch.

## Scenarios

- When different users need access to different subsets of data from the same table.
- When you need server-side data filtering that can't be bypassed by the client.
- When building applications where data segregation is a compliance requirement.

## Server-Side User Syntax

You filter rows by referencing the current user's identity in your query. The most common approaches are filtering by group membership or by a user attribute such as email or ID.

The syntax below fetches the groups for the current user from the server side. Groups include both custom groups and default user roles like `admin` and `end-user`, and the list always begins with `all_users`.

```bash
{{globals.server.currentUser.groups}}
```

To filter by a specific user attribute instead, reference it directly:

```bash
{{globals.server.currentUser.email}}
{{globals.server.currentUser.id}}
```

For the full list of available attributes, see [Server-Side Variables](/docs/app-builder/dynamic-access-rule/server-side-variables).

:::info
The above syntax will work with all data sources except RunJS and RunPy.
:::

## Example: Department-Specific View Using PostgreSQL

If you're using PostgreSQL, you can filter records by referencing the user's group(s) directly in your SQL query. This ensures each user only sees data relevant to them.

Suppose you're building an internal issue tracking tool for your company. Each department (like "Engineering", "HR", "Marketing") logs and manages its own issues in a shared table with the below structure:

- Table name: **issue_reports**
- Columns: **id**, **title**, **status** and **department**
- Access control: Each user is assigned to department-based Custom Groups matching department names in the database.

To ensure users only see reports from their own department(s), use the following SQL query:

```sql
SELECT * FROM issue_reports
WHERE department = ANY (
  string_to_array('{{globals.server.currentUser.groups}}', ',')
);
```

**How This Works:**
- `{{globals.server.currentUser.groups}}` fetches the user's groups securely from the server.
- `string_to_array(...)` converts the comma-separated string containing groups into a usable array.
- `department = ANY (...)` ensures users only see issues filed under their own departments.

### Filtered Results Based on Departments

Users assigned to the **Engineering** and **HR** groups will see:

| id | title                             | status   | department  |
|:---|:----------------------------------|:---------|:------------|
| 1  | Login bug on portal               | Open     | Engineering |
| 3  | Leave approval stuck              | Open     | HR          |
| 4  | Data sync error                   | Open     | Engineering |
| 5  | Employee onboarding delay         | Pending  | HR          |
| 9  | GitHub webhook failure            | Open     | Engineering |

Users assigned to the **Marketing** group will see:

| id | title                              | status   | department |
|:---|:-----------------------------------|:---------|:-----------|
| 2  | Delivery failure issues            | Pending  | Marketing  |
| 7  | Campaign budget approval delayed   | Pending  | Marketing  |
| 8  | Social media calendar not updated  | Open     | Marketing  |

## Example: Department-Specific View Using MySQL

MySQL does not support the `ANY (...)` array operator used above, so you use the `FIND_IN_SET` function instead. It checks whether a value exists within a comma-separated string, which matches the format that `globals.server.currentUser.groups` resolves to.

Using the same **issue_reports** table, the query becomes:

```sql
SELECT * FROM issue_reports
WHERE FIND_IN_SET(department, '{{globals.server.currentUser.groups}}') > 0;
```

**How This Works:**
- `{{globals.server.currentUser.groups}}` resolves to a comma-separated string of the user's groups, such as `all_users,Engineering,HR`.
- `FIND_IN_SET(department, ...)` returns the position of `department` within that string, or `0` if it is not present.
- `> 0` keeps only the rows whose department matches one of the user's groups.

The filtered results are identical to the PostgreSQL example above.

## Example: Restricting Rows to the Current User

When rows belong to individual users rather than departments, filter on a unique attribute such as email or ID instead of groups. This ensures each user sees only their own records.

Suppose an **orders** table stores an `owner_email` column identifying who created each order. To return only the current user's orders:

```sql
SELECT * FROM orders
WHERE owner_email = '{{globals.server.currentUser.email}}';
```

Because `globals.server.currentUser.email` is resolved on the server, users cannot change the filter from the client to view another user's data.

This setup ensures that a shared internal tool remains secure, with minimal query changes and no duplication of logic or views, making it ideal for HR dashboards, ticketing systems, CRM tools, and more.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
