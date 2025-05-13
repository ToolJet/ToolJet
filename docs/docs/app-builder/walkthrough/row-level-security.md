---
id: row-level-security
title: Implement Row Level Security
---

In ToolJet, you can implement row level security on the server side to make sure users only see the data they are allowed to see. This means that different users can access the same table, but only see rows that belong to their group. Row level security can be implemented using [Custom Groups](/docs/user-management/role-based-access/custom-groups/).

Use the following syntax to fetch the groups for the current user from the server side:
```
{{globals.server.currentUser.groups}}
```

## Implementing Row Level Security in PostgREST SQL

If you're using PostgREST, you can set up row level security by writing SQL queries that filter data based on the user’s custom group.

#### Example: Tracking Applications by Team

Let’s say you're building an app to track job applications, and you want each user to only see the applicants that have applied to their team. You can achieve this by filtering the applicants based on their coustom group, which links to the user's Job Position column.

To filter the applications based on the user's group, use the following query:
```sql
SELECT * FROM application_tracker
WHERE "job_position" = ANY (
  string_to_array('{{globals.server.currentUser.groups}}', ',')
);
```

This query will only return applications where the Job Position matches one of the user's groups.