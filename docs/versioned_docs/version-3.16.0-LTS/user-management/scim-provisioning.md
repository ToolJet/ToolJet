---
id: scim-provisioning
title: SCIM Provisioning
---

<PlanBadge type="enterprise" /> <PlanBadge type="self-hosted" />

SCIM 2.0 (System for Cross-domain Identity Management) lets your identity provider (IdP), such as Okta or Microsoft Entra ID, create, update, and archive ToolJet users and custom groups automatically. Users you assign to ToolJet in your IdP are provisioned in ToolJet, and users you remove are archived.

SCIM handles provisioning only. Users still sign in through [SSO](/docs/user-management/sso/overview) or another login method you've configured.

:::info
SCIM needs an Enterprise license that includes SCIM. To check, go to **Settings** > **License** > **Access** and look for **SCIM**. Without it, the Users and Groups endpoints return HTTP `451`.
:::

## How SCIM Works in ToolJet

- **Default workspace only:** Every user, role, and group change made over SCIM applies to the instance's [default workspace](/docs/tj-setup/workspaces#default-workspace).
- **Email is the identifier:** ToolJet uses the SCIM `userName` as the user's email address, and falls back to the primary `emails` value. Configure your IdP to send the user's email as `userName`.
- **Roles come from a ToolJet attribute, not from groups:** Set the user's role (`admin`, `builder`, or `end-user`) through the ToolJet extension attribute described in [Map the User Role](#map-the-user-role). If no role is sent when a user is created, the user becomes an `end-user`.
- **Only custom groups sync:** Groups pushed from your IdP become [custom groups](/docs/user-management/role-based-access/custom-groups) in the default workspace. The built-in `admin`, `builder`, and `end-user` groups can't be created, renamed, or deleted over SCIM.

## Configure SCIM on Your Server

SCIM has no settings screen. Turn it on and set its credentials with environment variables on the ToolJet server, then restart the server.

| Variable | Required | Description |
|:---|:---|:---|
| `SCIM_ENABLED` | Yes | Set to `true` to turn on the SCIM API. Any other value, or leaving it unset, turns it off. |
| `SCIM_HEADER_AUTH_TOKEN` | For bearer authentication | Token your IdP sends as `Authorization: Bearer <token>`. Use a long random value, for example from `openssl rand -hex 32`. |
| `SCIM_BASIC_AUTH_USER` | For basic authentication | Username your IdP sends with HTTP Basic authentication. |
| `SCIM_BASIC_AUTH_PASS` | For basic authentication | Password your IdP sends with HTTP Basic authentication. |

ToolJet accepts both authentication methods at the same time. Set the credentials for the method your IdP uses.

:::warning
Set `SCIM_HEADER_AUTH_TOKEN` to a strong value whenever `SCIM_ENABLED` is `true`, even if your IdP uses Basic authentication. Don't reuse the sample values from `.env.example`.
:::

## Connect Your Identity Provider

In your IdP's SCIM provisioning settings, enter:

- **SCIM base URL:** `https://<your-tooljet-domain>/api/scim/v2`. If ToolJet runs on a subpath, include it, for example `https://<your-domain>/tooljet/api/scim/v2`.
- **Authentication:** A bearer token with the value of `SCIM_HEADER_AUTH_TOKEN`, or Basic authentication with `SCIM_BASIC_AUTH_USER` and `SCIM_BASIC_AUTH_PASS`.
- **Unique identifier:** `userName`, mapped to the user's email address.

To check the connection, use your IdP's connection test or send a `GET` request to `/Users`. A successful response is a SCIM `ListResponse` of ToolJet users.

### Map the User Role

ToolJet reads the role from the attribute `role` in the extension schema `urn:ietf:params:scim:schemas:extension:tooljet:User:2.0`:

```json
{
  "schemas": [
    "urn:ietf:params:scim:schemas:core:2.0:User",
    "urn:ietf:params:scim:schemas:extension:tooljet:User:2.0"
  ],
  "userName": "jane.doe@example.com",
  "name": { "givenName": "Jane", "familyName": "Doe" },
  "active": true,
  "urn:ietf:params:scim:schemas:extension:tooljet:User:2.0": {
    "role": "builder"
  }
}
```

The value must be `admin`, `builder`, or `end-user`. In your IdP, add a custom attribute named `role` in this namespace and map it for every user.

:::caution
When your IdP replaces a user (`PUT`) without a `role`, ToolJet resets that user's role to `end-user`. A `PUT` also replaces the user's custom groups with the groups in the request, so a `PUT` without groups removes the user from all custom groups. Map the role attribute for every user before you turn on provisioning updates.
:::

## Supported Operations

### Users

| IdP action | What ToolJet does |
|:---|:---|
| Assign a user (`POST /Users`) | Creates an active user and adds them to the default workspace with the given role (default `end-user`) and any listed custom groups. The password is randomly generated, and no invitation email is sent. Fails if a user with the same email already exists in the instance. |
| Update a user (`PUT` or `PATCH /Users/{id}`) | Updates the first name, last name, email, role, and status. `PATCH` applies `replace` operations only. |
| Deactivate a user (`active: false`) | Archives the user at the instance level, which archives them in every workspace. |
| Reactivate a user (`active: true`) | Sets the user to active and unarchives them in the default workspace only. Unarchive them in other workspaces from the workspace's **Users** settings. |
| Delete a user (`DELETE /Users/{id}`) | Archives the user, the same as deactivating. ToolJet doesn't permanently delete users over SCIM. |

Creating a user counts toward your license's user limit, and the request fails if the limit is reached.

### Groups

| IdP action | What ToolJet does |
|:---|:---|
| Push a group (`POST /Groups`) | Creates a custom group named after the group's `displayName` in the default workspace, and adds the listed members. |
| Update members (`PATCH /Groups/{id}`) | Adds, removes, or replaces members. |
| Replace a group (`PUT /Groups/{id}`) | Renames the group and replaces its members. |
| Delete a group (`DELETE /Groups/{id}`) | Removes all members and deletes the custom group. |

Group members are identified by their ToolJet user IDs, which is the SCIM `id` returned when the user was provisioned. Provision users before you push groups. An end-user can't be added to a group that grants builder-level permissions.

## Supported Filters

ToolJet supports these SCIM filters, which IdPs use to look up existing records:

- `GET /Users?filter=userName eq "jane.doe@example.com"`
- `GET /Groups?filter=displayName eq "Finance"`

The `userName` lookup is case-sensitive, and ToolJet stores emails in lowercase, so send `userName` in lowercase.

## API Reference

For request and response formats, see the [SCIM API reference](/api/scim/). ToolJet also exposes the standard discovery endpoints `GET /ServiceProviderConfig`, `GET /ResourceTypes`, and `GET /Schemas`.
