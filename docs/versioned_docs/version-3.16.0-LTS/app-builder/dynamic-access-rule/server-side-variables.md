---
id: server-side-variables
title: Server-Side Variables
---

<PlanBadge type="enterprise" />

Server-side variables let you reference the logged-in user's identity inside your queries and datasource configurations, with the values resolved securely **on the server** at the moment a query runs. These variables live under `globals.server.currentUser` and are substituted into your query on the backend, so their values never reach the browser.

Because resolution happens server-side, these variables are safe to use for [row-level security](/docs/app-builder/dynamic-access-rule/row-level-security), authentication headers, and datasource connection options, where exposing values to the client would be a security risk.

## Common Use Cases

- **Row-level filtering**: Return only the records that belong to the current user, enforced on the server.
- **Authenticated requests**: Inject the user's identity into REST API headers or tokens without exposing it client-side.
- **Per-user connection options**: Use the current user's attributes in datasource connection settings.

## Prerequisites

- Server-side variables are available on **Enterprise** plans only.
- They can be used **only inside the [Query Manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries)**, in query bodies and datasource connection options.

## How It Works

When you reference a server-side variable in a query, ToolJet does not send its value to the browser. Instead, the raw `{{globals.server.currentUser.*}}` reference is kept in the query and resolved on the server just before the query executes, using the identity of the user who triggered it.

This means:

- The resolved value, such as the user's email or ID, is never exposed in the client, in network responses, or in the browser console.
- Each user's query automatically runs with their own identity, without you having to pass user details from the frontend.

## Available Variables

All server-side variables are available under `globals.server.currentUser`:

| Variable | Type | Description |
|:---------|:-----|:------------|
| `globals.server.currentUser.id` | string | The user's unique ID (UUID). |
| `globals.server.currentUser.email` | string | The user's email address. |
| `globals.server.currentUser.firstName` | string | The user's first name. |
| `globals.server.currentUser.lastName` | string | The user's last name. |
| `globals.server.currentUser.role` | string | The user's role name, such as `admin`, `builder`, or `end-user`. |
| `globals.server.currentUser.metadata` | object | Custom [user metadata](/docs/user-management/onboard-users/user-metadata) stored as key/value attributes. |
| `globals.server.currentUser.ssoUserInfo` | object | [SSO provider user info](/docs/user-management/sso/oidc/ssouserinfo), populated for users who signed in through SSO. |
| `globals.server.currentUser.groups` | string[] | The names of the groups the user belongs to. The array always begins with `all_users`, followed by each assigned group. |

## Using Server-Side Variables

You can reference server-side variables anywhere within the Query Manager using the `{{globals.server.currentUser.*}}` syntax. When typing inside a query, ToolJet suggests these variables through autocomplete.

### Referencing User Attributes

```
{{globals.server.currentUser.email}}
{{globals.server.currentUser.id}}
{{globals.server.currentUser.role}}
{{globals.server.currentUser.groups}}
{{globals.server.currentUser.metadata.department}}
{{globals.server.currentUser.ssoUserInfo.name}}
```

### Filtering Query Results by User

A common use case is limiting the rows a query returns to those that belong to the current user. Because the email is resolved on the server, users cannot tamper with the filter from the client.

```sql
SELECT * FROM orders
WHERE owner_email = '{{globals.server.currentUser.email}}';
```

This is the foundation for [Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security), where you restrict which records a user can see based on their identity or group membership.

### Setting Authentication Headers and Connection Options

Server-side variables are also useful in REST API auth headers, request tokens, and datasource connection options, where the value must stay hidden from the client. For example, you can pass the current user's ID as a header value when calling an external service.

## Client Side Variables vs Server Side Variables

ToolJet exposes the same user fields through two different variables. The difference is where and how they are resolved.

|  | `globals.currentUser` | `globals.server.currentUser` |
|:-|:----------------------|:-----------------------------|
| Resolved | In the browser (client side) | On the server |
| Availability | Free | Enterprise |
| Where usable | Anywhere in the app | Query Manager only |
| Client exposure | Value is available client-side | Value is never sent to the client |

Use [`globals.currentUser`](/docs/app-builder/custom-code/access-currentuser) when you need user details for UI logic, such as showing or hiding a component. Use `globals.server.currentUser` when the value must remain secure, such as filtering data or authenticating a request.

:::info
Because `globals.currentUser` is resolved in the browser, a user can modify its value before it reaches the server. Never rely on it for security decisions such as [row-level security](/docs/app-builder/dynamic-access-rule/row-level-security). Use `globals.server.currentUser` for anything that must be enforced.
:::

## Limitations

- Server-side variables can be used only inside the Query Manager. They are not available in component properties or elsewhere in the app.
- They cannot be used in **RunJS** and **RunPy** queries, since those run code that is not resolved through the server-side substitution flow.

## Related

- [Setup Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security)
- [Workspace Constants](/docs/security/constants)
- [User Metadata](/docs/user-management/onboard-users/user-metadata)
- [Accessing Current User's Properties](/docs/app-builder/custom-code/access-currentuser)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
