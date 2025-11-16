---
id: overview
title: Overview
---

System for Cross-domain Identity Management (**SCIM**) enables automated user and group provisioning for enterprise customers. With SCIM, identity providers (IdPs) like Okta can automatically create, update, deactivate, and sync users in ToolJet, removing the need for manual user management.

**Use Cases**
- Automatically provision new users in ToolJet when they are added in the IdP.
- Update user attributes (name, email, role mapping) in real time based on IdP changes.
- Archive users in ToolJet instantly when access is revoked in the IdP.
- Maintain a centralized, secure identity workflow across large teams and enterprises.
- Reduce manual user management and minimize access control errors.

## SCIM Setup

### API Configuration

To enable SCIM provisioning, integrate the ToolJet SCIM API endpoint with your IdP.

Base URL:

```js
https://<your-domain>/api/scim/v2
```

### Authentication Setup

ToolJet supports Basic Authentication as well as Header Token Authentication.

Add the following environment variables in your ToolJet backend `.env` file:

```js
SCIM_BASIC_AUTH_USER=customer
SCIM_BASIC_AUTH_PASS=pass
SCIM_HEADER_AUTH_TOKEN=12345
SCIM_ENABLED=true
```
:::warning IMPORTANT
Make sure `SCIM_ENABLED` is set to **true** — otherwise SCIM endpoints will not be active.
:::

### Verify the Connection

Once setup is complete, test the SCIM connection from your IdP. Send a **GET** request to `/Users` and `/Groups`:

```
https://your-domain.com/api/scim/v2/Users
```

You should receive a list of existing users and groups from ToolJet. If the connection succeeds, your SCIM app is ready to proceed.

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "totalResults": 0,
  "startIndex": 0,
  "itemsPerPage": 0,
  "Resources": [
    {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:User"
      ],
      "userName": "string",
      "name": {
        "givenName": "string",
        "familyName": "string"
      },
      "active": true,
      "password": "string",
      "emails": [
        {
          "value": "string",
          "primary": true,
          "type": "string"
        }
      ],
      "externalId": "string",
      "groups": [
        {
          "value": "string",
          "display": "string"
        }
      ],
      "meta": {
        "resourceType": "User",
        "created": "2019-08-24T14:15:22Z",
        "lastModified": "2019-08-24T14:15:22Z"
      },
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08"
    }
  ]
}
```

</details>

## Attribute Mapping (Required)

Since ToolJet requires a default user role (**admin**, **builder**, or **end-user**), we must inform the IdP (e.g., Okta) to include this information during user provisioning.

### Steps for Okta

1. Go to Directory → Profile Editor.
2. Select your ToolJet SCIM app.
3. Click Add Attribute.
4. In the form:
    - Display Name: Can be anything (e.g., ToolJet Role)
    - External Name: role (Must be role only)

**External Namespace:**

```js
urn:ietf:params:scim:schemas:extension:tooljet:User:2.0
```
:::warning IMPORTANT
This namespace **must match exactly**, do not modify or use a different string.
:::

<img className="screenshot-full img-m" src="/img/user-management/sso/scim/okta/attribute-mapping.png" alt="Attribute Mapping for Okta" />

Once this is done, Okta will send the user’s role attribute to ToolJet during provisioning or updates.

## Important Notes

### Roles vs Groups

- ToolJet only manages Custom Groups via SCIM.
- User Roles must be passed as part of the User attributes (not through groups).
- If no role is provided, **the user defaults to an end-user**, this **may cause permission mismatches** if the user belongs to a builder/admin custom group.

### Default Workspace

- All SCIM operations (User and Group creation, updates, deletions) are performed in the Default Workspace of your ToolJet instance.

### Group Management

- Only Custom Groups are supported via SCIM.
- Any group created in your IDP will be considered a Custom Group for Tooljet
- To sync a group with ToolJet, assign the group to your SCIM application or push groups manually from your IdP (e.g., Okta).

### User Management

- Users must be assigned to the ToolJet SCIM application in your IdP.
- Only then will be provisioning and updates (create, update, deactivate, delete) be synchronized with ToolJet.

### License Requirements
- Ensure your ToolJet license has SCIM and Custom Groups enabled.

### Editable User Attributes

ToolJet supports SCIM updates for:
- firstName
- lastName
- email
- status
- groups

## SCIM Standards Support

ToolJet fully supports all standard SCIM endpoints, including:
- `/Schemas`
- `/ResourceTypes`
- `/ServiceProviderConfig`

This ensures complete compatibility with standard-compliant IdPs such as Okta, Azure AD, and others.

## Supported SCIM APIs
For a complete list of ToolJet SCIM API endpoints and specifications, refer to [SCIM References](/api/scim).

