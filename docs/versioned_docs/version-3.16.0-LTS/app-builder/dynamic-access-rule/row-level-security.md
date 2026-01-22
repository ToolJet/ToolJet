---
id: row-level-security
title: Row Level Security
---

Row-level security in ToolJet lets you control which records a user can see or interact with, even when multiple users access the same table. This is useful when you want to restrict access to specific rows based on [custom groups](/docs/user-management/role-based-access/custom-groups/) or [default user roles](/docs/user-management/role-based-access/user-roles#default-user-roles). Row-level security is applied on the server side, ensuring the logic is secure and hidden from the client.

## Common Use Cases

- **Department-specific data**: Restrict HR data to HR team, Sales data to Sales team.
- **Multi-tenant applications**: Ensure customers only see their own records in shared tables.
- **Regional access control**: Limit data visibility based on user's assigned region or branch.

## Scenarios

- When different users need access to different subsets of data from the same table.
- When you need server-side data filtering that can't be bypassed by the client.
- When building applications where data segregation is a compliance requirement.

## Server-Side User Groups Syntax

The below syntax fetches the groups for the current user from the server side. Groups include both custom groups and default user roles like `admin` and `end-user`.

```bash
{{globals.server.currentUser.groups}}
```

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

This setup ensures that a shared internal tool remains secure, with minimal query changes and no duplication of logic or views—making it ideal for HR dashboards, ticketing systems, CRM tools, and more.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
