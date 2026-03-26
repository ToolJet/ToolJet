---
id: tooljet-api
title: ToolJet API
---

<div style={{display:'flex',justifyContent:"start",alignItems:"center",gap:"8px"}}>
<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

<div className="badge badge--self-hosted heading-badge" >   
 <span>Self Hosted</span>
</div>

</div>


ToolJet API allows you to interact with the ToolJet platform programmatically. You can use the APIs to manage users and their workspaces relations. The API endpoints are secured with an access token. You can perform various operations using the API such as:

- [Get All Users](#get-all-users)
- [Get All Workspaces](#get-all-workspaces)
- [Get All App Details](#get-all-app-details)
- [Get User by Identifier](#get-user-by-identifier)
- [Create User](#create-user)
- [Update User](#update-user)
- [Update User Role](#update-user-role)
- [Replace User Workspace](#replace-user-workspace)
- [Replace User Workspaces Relations](#replace-user-workspaces-relations)
- [Export Application](#export-application)
- [Import Application](#import-application)
- [Update User Metadata](#update-user-metadata)
- [Get User Metadata](#get-user-metadata)
- [Create Group](#create-group)
- [Get All Groups](#get-all-groups)
- [Get Group by ID](#get-group-by-id)
- [Update Group](#update-group)
- [Delete Group](#delete-group)

## Enabling ToolJet API

By default, the ToolJet API is disabled. To enable the API, add these variables to your `.env` file:

|         variable          |                   description                   |
| :-----------------------: | :---------------------------------------------: |
|    ENABLE_EXTERNAL_API    |                `true` or `false`                |
| EXTERNAL_API_ACCESS_TOKEN | `<access_token>` (To authenticate API requests) |

## Security

The ToolJet API is secured with an access token created by you in your `.env` file. You need to pass the access token in the `Authorization` header to authenticate your requests. The access token should be sent in the format `Basic <access_token>`.

```bash title="cURL Request Example"
curl -X GET 'https://{your-tooljet-instance.com}/api/ext/users' \
-H 'Authorization: Basic <access_token>' \
-H 'Content-Type: application/json'
```

## API Endpoints

### Get All Users

    - **Description:** Retrieves a list of all users along with their workspace permissions and group memberships. You can optionally filter the list by user group names.
    - **URL:** `/api/ext/users`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Query Parameters:**
      - groups_names: Comma-separated list of user group names to filter the results (e.g., `nexus-dev,beta-tester`).
    - **Response:** Array of User objects.


    ```bash title="cURL Request"
    curl -X GET "https://{your-domain}/api/ext/users?group_names=nexus-dev,beta-tester" \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"

    ```

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
[
  {
    "id":"1034fd65-7b40-474c-ab79-42d32780b299",
    "name":"John Doe",
    "email":"john@example.com",
    "status":"active",
    "workspaces":
    [
      {
        "id":"22056424-6e01-41d9-b090-62a321388433",
        "name":"Nexus Corps",
        "status":"active",
        "userPermission":{
          "id":"325dac2e-fb34-47a3-bc8f-0653aa38c465",
          "organizationId":"22056424-6e01-41d9-b090-62a321388433",
          "name":"admin",
          "type":"default",
          "appCreate":true,
          "appDelete":true,
          "workflowCreate":true,
          "workflowDelete":true,
          "folderCRUD":true,
          "orgConstantCRUD":true,
          "dataSourceCreate":true,
          "dataSourceDelete":true,
          "appPromote":true,
          "appRelease":true,
          "createdAt":"2025-09-23T13:33:43.196Z",
          "updatedAt":"2025-09-23T13:33:43.196Z"
        }
      }
    ],
    "userGroups":
    [
      {
        "id":"c8865750-f5cb-4af5-addd-dd56f51f9bcd",
        "name":"admin"
      }
    ],
    "userDetails":[]
  },
  {
    "id":"8778588d-972f-4fe1-bd6c-7432e64d6632",
    "name":"James Smith",
    "email":"james@example.com",
    "status":"invited",
    "workspaces":
    [
      {
        "id":"22056424-6e01-41d9-b090-62a321388433",
        "name":"Nexus Corps",
        "status":"active",
        "userPermission":{
          "id":"a5af486e-28e6-468c-b92c-eac5d7583d00",
          "organizationId":"22056424-6e01-41d9-b090-62a321388433",
          "name":"end-user",
          "type":"default",
          "appCreate":false,
          "appDelete":false,
          "workflowCreate":false,
          "workflowDelete":false,
          "folderCRUD":false,
          "orgConstantCRUD":false,
          "dataSourceCreate":false,
          "dataSourceDelete":false,
          "appPromote":false,
          "appRelease":false,
          "createdAt":"2025-09-23T13:33:43.196Z",
          "updatedAt":"2025-09-23T13:33:43.196Z"
        }
      }
    ],
    "userGroups":
    [
      {
        "id":"e27ca96f-c8a9-4cdc-aa9d-a435cab1358b",
        "name":"end-user"
      }
    ],
    "userDetails":
    [
      {
        "organizationId":"22056424-6e01-41d9-b090-62a321388433",
        "ssoUserInfo":null,
        "userMetadata":
        {
          "user_api_key":"123xxfjnf489njf589o53njfv0935n0953"
        }
      }
    ]
  }
]
```
</details>

### Get All Workspaces

    - **Description:** Retrieves a list of all workspaces.
    - **URL:** `/api/ext/workspaces`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Response:** Array of Workspace objects.

    ```bash title="cURL Request"
    curl -X GET https://{your-domain}/api/ext/workspace \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"
    ```

<details id="tj-dropdown">
<summary>Response Example</summary>

```json
[
  {
    "id": "a831db72-c3d2-4b36-a98e-0023ffb15e66",
    "name": "demo-workspace",
    "status": "active",
    "groups": [
      {
        "id": "b3ae95dd-b1ca-4a21-abac-b321ee76698e",
        "name": "all_users"
      },
      {
        "id": "1830a113-24e5-4e33-8af2-e6502d477239",
        "name": "admin"
      }
    ]
  },
  {
    "id": "b8a0c07d-2430-46fd-ba71-2a71e48fde30",
    "name": "team-spac",
    "status": "active",
    "groups": [
      {
        "id": "7f7af977-a7e7-49e3-a08a-2dffce6f5942",
        "name": "all_users"
      },
      {
        "id": "eda68cf3-b70d-455f-8a2a-8cd4bbff77a6",
        "name": "admin"
      }
    ]
  }
]
```

</details>

### Get All App Details

    - **Description:** Get the app details for all the applications in the workspace.
    - **URL:** `/api/ext/workspace/:workspace_id/apps`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
      - **workspace_id**: The ID of the workspace.
    - **Response:** Array of app details for all the applications in the workspace.

    ```bash title="cURL Request"
    curl -X GET https://{your-domain}/api/ext/workspace/:workspace_id/apps \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"
    ```

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
    ```json
      [
        {
            "id": "ae06cc7a-2922-4fe7-9064-462741558813",
            "name": "Applicant tracking system",
            "slug": "ae06cc7a-2922-4fe7-9064-462741558813",
            "versions": [
                {
                    "id": "37be6442-ca1b-4a5a-a6f4-f929e00a0ac1",
                    "name": "v1"
                },
                {
                    "id": "be8a96c3-f7a4-4f82-b282-23678c52c973",
                    "name": "v3"
                },
                {
                    "id": "19405d8c-be75-47ad-aa96-36f2b1728e77",
                    "name": "v2"
                },
                {
                    "id": "15bd421d-54ce-44d5-8eef-39911fc2d4cb",
                    "name": "v4"
                }
            ]
        },
        {
            "id": "b68f87ca-6620-4cbf-83d6-becf073d8e96",
            "name": "Aws Tracker",
            "slug": "b68f87ca-6620-4cbf-83d6-becf073d8e96",
            "versions": [
                {
                    "id": "466a1cc4-62cf-4b46-b71d-114af61c04ca",
                    "name": "v1"
                },
                {
                    "id": "b65f1ae2-3702-4cba-91f3-3e5bddd55dbc",
                    "name": "v2"
                }
            ]
        }
      ]
    ```
</details>

### Get User by Identifier

    - **Description:** Returns details of a user, including their workspaces, permissions, and groups. The user can be identified by UUID or email address.
    - **URL:** `/api/ext/user/:identifier`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - **identifier** (string): UUID (e.g., `d1493ea9-315c-4d13-8132-328dc0486655`) or email (e.g., `john@example.com`) of the user.
    - **Response:** User object.

    ```bash title="cURL Request"
    curl -X GET https://{your-domain}/api/ext/user/:id \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"
    ```

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
    "id": "5b1608df-5e14-474b-b304-919623a9be57",
    "name": "Sam Oliver",
    "email": "sam@example.com",
    "status": "active",
    "workspaces": [
        {
            "id": "a831db72-c3d2-4b36-a98e-0023ffb15e66",
            "name": "demo-workspace",
            "status": "active",
            "groups": [
                {
                    "id": "b3ae95dd-b1ca-4a21-abac-b321ee76698e",
                    "name": "all_users"
                },
                {
                    "id": "1830a113-24e5-4e33-8af2-e6502d477239",
                    "name": "admin"
                }
            ]
        },
        {
            "id": "b8a0c07d-2430-46fd-ba71-2a71e48fde30",
            "name": "team-spac",
            "status": "active",
            "groups": [
                {
                    "id": "7f7af977-a7e7-49e3-a08a-2dffce6f5942",
                    "name": "all_users"
                },
                {
                    "id": "eda68cf3-b70d-455f-8a2a-8cd4bbff77a6",
                    "name": "admin"
                }
            ]
        }
    ]
}
```
</details>

### Create User

    - **Description:** Creates a user with workspace assignments and returns full user details.
    - **URL:** `/api/ext/users`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Body:** The body object can contain the following fields:
        - `name` (string, required): The name of the user.
        - `email` (string, required): The email address of the user.
        - `password` (string, optional): The user's password. Must be between 5 and 100 characters.
        - `status` (string, optional): The status of the user. Can be either `active` or `archived`. Defaults to `archived` if not provided.
        - `workspaces` (array, required): An array of workspace objects associated with the user. Each workspace object should contain:
          - `id` (string, required): The unique identifier of the workspace.
          - `name` (string, required): The name of the workspace.
          - `status` (string, optional): The status of the workspace. Can be either `active` or `archived`.
          - `groups` (array, optional): An array of group objects associated with the workspace. Each group object can contain:
            - `id` (string, optional): The unique identifier of the group.
            - `name` (string, optional): The name of the group.

    ```bash title="cURL Request"
    curl -X POST https://{your-domain}/api/ext/users \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "<name>",
        "email": "<email>",
        "password": "<password>",
        "status": "<active|archived>",
        "workspaces": [
          {
            "id": "<workspace_id>",
            "name": "<workspace_name>",
            "status": "<active|archived>",
            "groups": [
              {
                "id": "<group_id>",
                "name": "<group_name>"
              }
            ]
          }
        ]
      }'
    ```

  <details id="tj-dropdown">
  <summary>**Request Body Example**</summary>
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "qwy@4xt123",
  "status": "active",
  "workspaces": [
    {
      "name": "team-spac",
      "status": "active",
      "groups": [
        {
          "name": "all_users"
        }
      ]
    }
  ]
}
```
</details>
    - **Response:** `201 Created`

### Update User

    - **Description:** Partially updates fields of a user identified by UUID or email. Returns no content (204) on successful update.
    - **URL:** `/api/ext/user/:identifier`
    - **Method:** PATCH
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - identifier (string): UUID (e.g., `d1493ea9-315c-4d13-8132-328dc0486655`) or email (e.g., `john@example.com`) of the user to update.
    - **Body:** The body object can contain the following fields:
        - `name` (string, optional): The updated name of the user.
        - `email` (string, optional): The updated email address of the user.
        - `password` (string, optional): The updated password for the user. Must be between 5 and 100 characters.
        - `status` (string, optional): The updated status of the user. Can be either `active` or `archived`.

    ```bash title="cURL Request"
    curl -X PATCH https://{your-domain}/api/ext/user/:id \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "<name>",
        "email": "<email>",
        "password": "<password>",
        "status": "<active|archived>"
      }'
    ```

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "newsecurepassword",
  "status": "active"
}
```

</details>

    - **Response:** `200 OK`

### Update User Role

    - **Description:** Updates the role of a user within a specific workspace.
    - **URL:** `/api/ext/update-user-role/workspace/workspaceId`
    - **Method:** PUT
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - workspaceId (string): The unique identifier of the workspace.
    - **Body:** The body object can contain the following fields:
        - `newRole` (string, required): The updated user role of the user.
        - `email` (string, required): Email of the user whose role is being updated.

    ```bash title="cURL Request"
    curl -X PUT https://{your-domain}/api/ext/update-user-role/workspace/{workspaceId} \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "newRole": "<new_role>",
        "email": "<user_email>"
      }'
    ```

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "newRole": "end-user",
  "userId": "f2065dd1-e5ea-4793-af91-4a8831de68e6"
}
```

</details>

    - **Response:** `200 OK`

### Replace User Workspaces Relations

    - **Description:** Replaces all workspaces relations associated with a user.
    - **URL:** `/api/ext/user/:id/workspaces`
    - **Method:** PUT
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - id (string): The ID of the user.
    - **Body:** Array of workspace data transfer objects. It may contain the following fields:
        - `id` (string, required): The unique identifier of the workspace.
        - `name` (string, required): The name of the workspace.
        - `status` (string, optional): The status of the workspace. Can be either `active` or `archived`.
        - `groups` (array, optional): An array of group objects associated with the workspace. Each group object can contain:
          - `id` (string, optional): The unique identifier of the group.
          - `name` (string, optional): The name of the group.

    ```bash title="cURL Request"
    curl -X PUT https://{your-domain}/api/ext/user/:id/workspaces \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '[
        {
          "id": "<workspace_id>",
          "name": "<workspace_name>",
          "status": "<active|archived>",
          "groups": [
            {
              "id": "<group_id>",
              "name": "<group_name>"
            }
          ]
        }
      ]'
    ```
    
<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "status": "archived",
  "groups": [
    {
      "name": "all_users"
    }
  ]
}
```

</details>
    - **Note:** If the array is empty, it will remove all existing workspace relations.
    - **Response:** `200 OK`


### Replace User Workspace

    - **Description:** Updates a specific workspace relation associated with a user.
    - **URL:** `/api/ext/user/:id/workspace/:workspaceId`
    - **Method:** PATCH
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - id (string): The ID of the user.
        - workspaceId (string): The ID of the workspace.
    - **Body:** The body object can contain the following fields:
        - `id` (string, optional): The ID of the workspace.
        - `name` (string, optional): The updated name of the workspace.
        - `status` (string, optional): The updated status of the workspace. Can be either `active` or `archived`.
        - `groups` (array, optional): An array of group objects associated with the workspace. Each group object can contain:
          - `id` (string, optional): The ID of the group.
          - `name` (string, optional): The name of the group.

    ```bash title="cURL Request"
    curl -X PATCH https://{your-domain}/api/ext/user/:id/workspace/:workspaceId \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "id": "<workspace_id>",
        "name": "<workspace_name>",
        "status": "<active|archived>",
        "groups": [
          {
            "id": "<group_id>",
            "name": "<group_name>"
          }
        ]
      }'
    ```

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "status": "archived",
  "groups": [
    {
      "name": "all_users"
    }
  ]
}
```

</details>
    - **Note:** If no body is given or body is an empty object, it will not do anything.
    - **Response:** `200 OK`

### Export Application

    - **Description:** Exports a ToolJet application from a specified workspace, including pages, queries, data sources, environments, versions, and metadata.
    - **URL:** `/api/ext/export/workspace/:workspace_id/apps/:app_id`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
      - **workspace_id**: The ID of the workspace containing the app.
      - **app_id**: The ID of the application to export.
    - **Query Params:**
      - **exportTJDB** (boolean): Specifies whether to export TJDB data or not. By default **false**.
      - **appVersion** (string): Accepts a specific version of the application that is to be exported.
      - **exportAllVersions** (boolean): Defines whether to export all the available versions. By default it exports the latest version of the app.
    - **Response:** Exported application json.

    ```bash title="cURL Request"
    curl -X POST "https://{your-domain}/api/ext/export/workspace/:workspace_id/apps/:app_id?exportTJDB=<true|false>&appVersion=<version>&exportAllVersions=<true|false>" \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"
    ```

<details id="tj-dropdown">
<summary>Response Example</summary>

```json
{
  "app": [
    {
      "definition": {
        "appV2": {
          "type": "front-end",
          "id": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
          "name": "ToolJet API Application",
          "slug": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
          "isPublic": false,
          "isMaintenanceOn": false,
          "icon": "home",
          "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
          "currentVersionId": null,
          "userId": "3ca0bd7a-b8e0-40d9-a2d8-2c7531dc3bee",
          "workflowApiToken": null,
          "workflowEnabled": false,
          "createdAt": "2025-02-28T06:21:34.962Z",
          "creationMode": "DEFAULT",
          "updatedAt": "2025-02-28T06:21:34.961Z",
          "editingVersion": {
            "id": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
            "name": "v1",
            "definition": null,
            "globalSettings": {
              "hideHeader": false,
              "appInMaintenance": false,
              "canvasMaxWidth": 100,
              "canvasMaxWidthType": "%",
              "canvasMaxHeight": 2400,
              "canvasBackgroundColor": "#edeff5",
              "backgroundFxQuery": "",
              "appMode": "auto"
            },
            "pageSettings": null,
            "showViewerNavigation": true,
            "homePageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
            "appId": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
            "currentEnvironmentId": "60eff059-202a-4c12-ae12-507874f9191d",
            "promotedFrom": null,
            "createdAt": "2025-02-28T06:21:34.974Z",
            "updatedAt": "2025-02-28T06:21:34.961Z"
          },
          "components": [
            {
              "id": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
              "name": "table1",
              "type": "Table",
              "pageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "parent": null,
              "properties": {
                "title": {
                  "value": "Table"
                },
                "visible": {
                  "value": "{{true}}"
                },
                "loadingState": {
                  "value": "{{false}}"
                },
                "data": {
                  "value": "{{ [ \n\t\t{ id: 1, name: 'Olivia Nguyen', email: 'olivia.nguyen@example.com', date: '15/05/2022', mobile_number: 9876543210, interest: ['Reading', 'Traveling','Photography'], photo: 'https://reqres.in/img/faces/7-image.jpg' }, \n\t\t{ id: 2, name: 'Liam Patel', email: 'liam.patel@example.com', date: '20/09/2021', mobile_number: 8765432109, interest: ['Cooking','Gardening','Hiking'], photo: 'https://reqres.in/img/faces/5-image.jpg' }\n] }}"
                },
                "useDynamicColumn": {
                  "value": "{{false}}"
                },
                "columnData": {
                  "value": "{{[{name: 'email', key: 'email', id: '1'}, {name: 'Full name', key: 'name', id: '2', isEditable: true}]}}"
                },
                "rowsPerPage": {
                  "value": "{{10}}"
                },
                "serverSidePagination": {
                  "value": "{{false}}"
                },
                "enableNextButton": {
                  "value": "{{true}}"
                },
                "enablePrevButton": {
                  "value": "{{true}}"
                },
                "totalRecords": {
                  "value": "{{10}}"
                },
                "enablePagination": {
                  "value": "{{true}}"
                },
                "serverSideSort": {
                  "value": "{{false}}"
                },
                "serverSideFilter": {
                  "value": "{{false}}"
                },
                "displaySearchBox": {
                  "value": "{{true}}"
                },
                "showDownloadButton": {
                  "value": "{{true}}"
                },
                "showFilterButton": {
                  "value": "{{true}}"
                },
                "autogenerateColumns": {
                  "value": true,
                  "generateNestedColumns": true
                },
                "isAllColumnsEditable": {
                  "value": "{{false}}"
                },
                "columns": {
                  "value": [
                    {
                      "name": "id",
                      "id": "e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 30,
                      "columnType": "string"
                    },
                    {
                      "name": "photo",
                      "key": "photo",
                      "id": "f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a2",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "image",
                      "objectFit": "contain",
                      "borderRadius": "100",
                      "columnSize": 70
                    },
                    {
                      "name": "name",
                      "id": "5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 130,
                      "columnType": "string"
                    },
                    {
                      "name": "email",
                      "id": "afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 230,
                      "columnType": "string"
                    },
                    {
                      "name": "date",
                      "id": "27b75c8af9d34d1eaa1f9bb7f8f9f7b0abf1823e799748c8bb57e74f53b2c1dc",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "datepicker",
                      "isTimeChecked": false,
                      "dateFormat": "DD/MM/YYYY",
                      "parseDateFormat": "DD/MM/YYYY",
                      "isDateSelectionEnabled": true,
                      "columnSize": 130
                    },
                    {
                      "name": "mobile_number",
                      "id": "9c2e3c40572a4aefb8e179ee39a0e1ac9dc2b2e6634be56e1c05be13c3d1de56",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "number",
                      "columnSize": 140
                    },
                    {
                      "name": "interest",
                      "key": "interest",
                      "id": "f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a1",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "newMultiSelect",
                      "columnSize": 300,
                      "options": [
                        {
                          "label": "Reading",
                          "value": "Reading"
                        },
                        {
                          "label": "Traveling",
                          "value": "Traveling"
                        },
                        {
                          "label": "Photography",
                          "value": "Photography"
                        },
                        {
                          "label": "Music",
                          "value": "Music"
                        },
                        {
                          "label": "Cooking",
                          "value": "Cooking"
                        },
                        {
                          "label": "Crafting",
                          "value": "Crafting"
                        },
                        {
                          "label": "Voluntering",
                          "value": "Voluntering"
                        },
                        {
                          "label": "Garndening",
                          "value": "Garndening"
                        },
                        {
                          "label": "Dancing",
                          "value": "Dancing"
                        },
                        {
                          "label": "Hiking",
                          "value": "Hiking"
                        }
                      ]
                    }
                  ]
                },
                "showBulkUpdateActions": {
                  "value": "{{true}}"
                },
                "showBulkSelector": {
                  "value": "{{false}}"
                },
                "highlightSelectedRow": {
                  "value": "{{false}}"
                },
                "columnSizes": {
                  "value": "{{({})}}"
                },
                "actions": {
                  "value": []
                },
                "enabledSort": {
                  "value": "{{true}}"
                },
                "hideColumnSelectorButton": {
                  "value": "{{false}}"
                },
                "defaultSelectedRow": {
                  "value": "{{{\"id\":1}}}"
                },
                "showAddNewRowButton": {
                  "value": "{{true}}"
                },
                "allowSelection": {
                  "value": "{{true}}"
                },
                "visibility": {
                  "value": "{{true}}"
                },
                "disabledState": {
                  "value": "{{false}}"
                }
              },
              "general": {},
              "styles": {
                "textColor": {
                  "value": "#000"
                },
                "columnHeaderWrap": {
                  "value": "fixed"
                },
                "actionButtonRadius": {
                  "value": "0"
                },
                "cellSize": {
                  "value": "regular"
                },
                "borderRadius": {
                  "value": "8"
                },
                "tableType": {
                  "value": "table-classic"
                },
                "maxRowHeight": {
                  "value": "auto"
                },
                "maxRowHeightValue": {
                  "value": "{{0}}"
                },
                "contentWrap": {
                  "value": "{{true}}"
                },
                "boxShadow": {
                  "value": "0px 0px 0px 0px #00000090"
                },
                "padding": {
                  "value": "default"
                }
              },
              "generalStyles": {
                "boxShadow": {
                  "value": "0px 0px 0px 0px #00000040"
                }
              },
              "displayPreferences": {
                "showOnDesktop": {
                  "value": "{{true}}"
                },
                "showOnMobile": {
                  "value": "{{false}}"
                }
              },
              "validation": {},
              "createdAt": "2025-02-28T06:21:45.706Z",
              "updatedAt": "2025-02-28T06:23:49.872Z",
              "layouts": [
                {
                  "id": "f72adb7f-708c-4c5f-9a3b-be9467f7dcc0",
                  "type": "mobile",
                  "top": 180,
                  "left": 18,
                  "width": 35,
                  "height": 456,
                  "componentId": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
                  "dimensionUnit": "count",
                  "updatedAt": "2025-02-28T06:21:45.706Z"
                },
                {
                  "id": "d6c8807f-dde5-4d0a-83f3-2a8036c4c147",
                  "type": "desktop",
                  "top": 30,
                  "left": 2,
                  "width": 39,
                  "height": 630,
                  "componentId": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
                  "dimensionUnit": "count",
                  "updatedAt": "2025-02-28T06:23:32.534Z"
                }
              ]
            }
          ],
          "pages": [
            {
              "id": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "name": "Home",
              "handle": "home",
              "index": 1,
              "disabled": null,
              "hidden": null,
              "icon": null,
              "createdAt": "2025-02-28T06:21:34.961Z",
              "updatedAt": "2025-02-28T06:21:36.766Z",
              "autoComputeLayout": true,
              "appVersionId": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
              "pageGroupIndex": 1,
              "pageGroupId": null,
              "isPageGroup": false
            }
          ],
          "events": [],
          "dataQueries": [],
          "dataSources": [],
          "appVersions": [
            {
              "id": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
              "name": "v1",
              "definition": null,
              "globalSettings": {
                "hideHeader": false,
                "appInMaintenance": false,
                "canvasMaxWidth": 100,
                "canvasMaxWidthType": "%",
                "canvasMaxHeight": 2400,
                "canvasBackgroundColor": "#edeff5",
                "backgroundFxQuery": "",
                "appMode": "auto"
              },
              "pageSettings": null,
              "showViewerNavigation": true,
              "homePageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "appId": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
              "currentEnvironmentId": "60eff059-202a-4c12-ae12-507874f9191d",
              "promotedFrom": null,
              "createdAt": "2025-02-28T06:21:34.974Z",
              "updatedAt": "2025-02-28T06:21:34.961Z"
            }
          ],
          "appEnvironments": [
            {
              "id": "60eff059-202a-4c12-ae12-507874f9191d",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "development",
              "isDefault": false,
              "priority": 1,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            },
            {
              "id": "48aa7f50-8709-4ae1-92cd-049b2aa22080",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "staging",
              "isDefault": false,
              "priority": 2,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            },
            {
              "id": "8f0a5c41-cea1-452a-b27c-e93337b567bd",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "production",
              "isDefault": true,
              "priority": 3,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            }
          ],
          "dataSourceOptions": [],
          "schemaDetails": {
            "multiPages": true,
            "multiEnv": true,
            "globalDataSources": true
          }
        }
      }
    }
  ],
  "tooljet_version": "3.5.11-cloud-lts"
}
```

</details>

### Import Application

    - **Description:** Import a Application in ToolJet Workspace.
    - **URL:** `/api/ext/import/workspace/:workspace_id/apps`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
      - **workspace_id**: The ID of the workspace.
    - **Body:** The body object will contain following fields:
      - Application JSON
      - `appName` (string, optional): Defines the application name. If not defined then the app will be imported with the existing app name.

    ```bash title="cURL Request"
    curl -X POST https://{your-domain}/api/ext/import/workspace/:workspace_id/apps \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "appName": "<app_name>",
        <application_json>
      }'
    ```

:::info
By default, server accepts maximum JSON size as 50 MB. To increase this limit, use the following environment variable:
`MAX_JSON_SIZE`

**Example**: `MAX_JSON_SIZE = "250mb"`
:::

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "app": [
    {
      "definition": {
        "appV2": {
          "type": "front-end",
          "id": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
          "name": "ToolJet API Application",
          "slug": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
          "isPublic": false,
          "isMaintenanceOn": false,
          "icon": "home",
          "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
          "currentVersionId": null,
          "userId": "3ca0bd7a-b8e0-40d9-a2d8-2c7531dc3bee",
          "workflowApiToken": null,
          "workflowEnabled": false,
          "createdAt": "2025-02-28T06:21:34.962Z",
          "creationMode": "DEFAULT",
          "updatedAt": "2025-02-28T06:21:34.961Z",
          "editingVersion": {
            "id": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
            "name": "v1",
            "definition": null,
            "globalSettings": {
              "hideHeader": false,
              "appInMaintenance": false,
              "canvasMaxWidth": 100,
              "canvasMaxWidthType": "%",
              "canvasMaxHeight": 2400,
              "canvasBackgroundColor": "#edeff5",
              "backgroundFxQuery": "",
              "appMode": "auto"
            },
            "pageSettings": null,
            "showViewerNavigation": true,
            "homePageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
            "appId": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
            "currentEnvironmentId": "60eff059-202a-4c12-ae12-507874f9191d",
            "promotedFrom": null,
            "createdAt": "2025-02-28T06:21:34.974Z",
            "updatedAt": "2025-02-28T06:21:34.961Z"
          },
          "components": [
            {
              "id": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
              "name": "table1",
              "type": "Table",
              "pageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "parent": null,
              "properties": {
                "title": {
                  "value": "Table"
                },
                "visible": {
                  "value": "{{true}}"
                },
                "loadingState": {
                  "value": "{{false}}"
                },
                "data": {
                  "value": "{{ [ \n\t\t{ id: 1, name: 'Olivia Nguyen', email: 'olivia.nguyen@example.com', date: '15/05/2022', mobile_number: 9876543210, interest: ['Reading', 'Traveling','Photography'], photo: 'https://reqres.in/img/faces/7-image.jpg' }, \n\t\t{ id: 2, name: 'Liam Patel', email: 'liam.patel@example.com', date: '20/09/2021', mobile_number: 8765432109, interest: ['Cooking','Gardening','Hiking'], photo: 'https://reqres.in/img/faces/5-image.jpg' }\n] }}"
                },
                "useDynamicColumn": {
                  "value": "{{false}}"
                },
                "columnData": {
                  "value": "{{[{name: 'email', key: 'email', id: '1'}, {name: 'Full name', key: 'name', id: '2', isEditable: true}]}}"
                },
                "rowsPerPage": {
                  "value": "{{10}}"
                },
                "serverSidePagination": {
                  "value": "{{false}}"
                },
                "enableNextButton": {
                  "value": "{{true}}"
                },
                "enablePrevButton": {
                  "value": "{{true}}"
                },
                "totalRecords": {
                  "value": "{{10}}"
                },
                "enablePagination": {
                  "value": "{{true}}"
                },
                "serverSideSort": {
                  "value": "{{false}}"
                },
                "serverSideFilter": {
                  "value": "{{false}}"
                },
                "displaySearchBox": {
                  "value": "{{true}}"
                },
                "showDownloadButton": {
                  "value": "{{true}}"
                },
                "showFilterButton": {
                  "value": "{{true}}"
                },
                "autogenerateColumns": {
                  "value": true,
                  "generateNestedColumns": true
                },
                "isAllColumnsEditable": {
                  "value": "{{false}}"
                },
                "columns": {
                  "value": [
                    {
                      "name": "id",
                      "id": "e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 30,
                      "columnType": "string"
                    },
                    {
                      "name": "photo",
                      "key": "photo",
                      "id": "f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a2",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "image",
                      "objectFit": "contain",
                      "borderRadius": "100",
                      "columnSize": 70
                    },
                    {
                      "name": "name",
                      "id": "5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 130,
                      "columnType": "string"
                    },
                    {
                      "name": "email",
                      "id": "afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnSize": 230,
                      "columnType": "string"
                    },
                    {
                      "name": "date",
                      "id": "27b75c8af9d34d1eaa1f9bb7f8f9f7b0abf1823e799748c8bb57e74f53b2c1dc",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "datepicker",
                      "isTimeChecked": false,
                      "dateFormat": "DD/MM/YYYY",
                      "parseDateFormat": "DD/MM/YYYY",
                      "isDateSelectionEnabled": true,
                      "columnSize": 130
                    },
                    {
                      "name": "mobile_number",
                      "id": "9c2e3c40572a4aefb8e179ee39a0e1ac9dc2b2e6634be56e1c05be13c3d1de56",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "number",
                      "columnSize": 140
                    },
                    {
                      "name": "interest",
                      "key": "interest",
                      "id": "f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a1",
                      "autogenerated": true,
                      "fxActiveFields": [],
                      "columnType": "newMultiSelect",
                      "columnSize": 300,
                      "options": [
                        {
                          "label": "Reading",
                          "value": "Reading"
                        },
                        {
                          "label": "Traveling",
                          "value": "Traveling"
                        },
                        {
                          "label": "Photography",
                          "value": "Photography"
                        },
                        {
                          "label": "Music",
                          "value": "Music"
                        },
                        {
                          "label": "Cooking",
                          "value": "Cooking"
                        },
                        {
                          "label": "Crafting",
                          "value": "Crafting"
                        },
                        {
                          "label": "Voluntering",
                          "value": "Voluntering"
                        },
                        {
                          "label": "Garndening",
                          "value": "Garndening"
                        },
                        {
                          "label": "Dancing",
                          "value": "Dancing"
                        },
                        {
                          "label": "Hiking",
                          "value": "Hiking"
                        }
                      ]
                    }
                  ]
                },
                "showBulkUpdateActions": {
                  "value": "{{true}}"
                },
                "showBulkSelector": {
                  "value": "{{false}}"
                },
                "highlightSelectedRow": {
                  "value": "{{false}}"
                },
                "columnSizes": {
                  "value": "{{({})}}"
                },
                "actions": {
                  "value": []
                },
                "enabledSort": {
                  "value": "{{true}}"
                },
                "hideColumnSelectorButton": {
                  "value": "{{false}}"
                },
                "defaultSelectedRow": {
                  "value": "{{{\"id\":1}}}"
                },
                "showAddNewRowButton": {
                  "value": "{{true}}"
                },
                "allowSelection": {
                  "value": "{{true}}"
                },
                "visibility": {
                  "value": "{{true}}"
                },
                "disabledState": {
                  "value": "{{false}}"
                }
              },
              "general": {},
              "styles": {
                "textColor": {
                  "value": "#000"
                },
                "columnHeaderWrap": {
                  "value": "fixed"
                },
                "actionButtonRadius": {
                  "value": "0"
                },
                "cellSize": {
                  "value": "regular"
                },
                "borderRadius": {
                  "value": "8"
                },
                "tableType": {
                  "value": "table-classic"
                },
                "maxRowHeight": {
                  "value": "auto"
                },
                "maxRowHeightValue": {
                  "value": "{{0}}"
                },
                "contentWrap": {
                  "value": "{{true}}"
                },
                "boxShadow": {
                  "value": "0px 0px 0px 0px #00000090"
                },
                "padding": {
                  "value": "default"
                }
              },
              "generalStyles": {
                "boxShadow": {
                  "value": "0px 0px 0px 0px #00000040"
                }
              },
              "displayPreferences": {
                "showOnDesktop": {
                  "value": "{{true}}"
                },
                "showOnMobile": {
                  "value": "{{false}}"
                }
              },
              "validation": {},
              "createdAt": "2025-02-28T06:21:45.706Z",
              "updatedAt": "2025-02-28T06:23:49.872Z",
              "layouts": [
                {
                  "id": "f72adb7f-708c-4c5f-9a3b-be9467f7dcc0",
                  "type": "mobile",
                  "top": 180,
                  "left": 18,
                  "width": 35,
                  "height": 456,
                  "componentId": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
                  "dimensionUnit": "count",
                  "updatedAt": "2025-02-28T06:21:45.706Z"
                },
                {
                  "id": "d6c8807f-dde5-4d0a-83f3-2a8036c4c147",
                  "type": "desktop",
                  "top": 30,
                  "left": 2,
                  "width": 39,
                  "height": 630,
                  "componentId": "ebe9d705-a0df-4dbb-9bf3-ab28cab12ae3",
                  "dimensionUnit": "count",
                  "updatedAt": "2025-02-28T06:23:32.534Z"
                }
              ]
            }
          ],
          "pages": [
            {
              "id": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "name": "Home",
              "handle": "home",
              "index": 1,
              "disabled": null,
              "hidden": null,
              "icon": null,
              "createdAt": "2025-02-28T06:21:34.961Z",
              "updatedAt": "2025-02-28T06:21:36.766Z",
              "autoComputeLayout": true,
              "appVersionId": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
              "pageGroupIndex": 1,
              "pageGroupId": null,
              "isPageGroup": false
            }
          ],
          "events": [],
          "dataQueries": [],
          "dataSources": [],
          "appVersions": [
            {
              "id": "ab40f07f-96c7-4283-afb8-8cd88df7b195",
              "name": "v1",
              "definition": null,
              "globalSettings": {
                "hideHeader": false,
                "appInMaintenance": false,
                "canvasMaxWidth": 100,
                "canvasMaxWidthType": "%",
                "canvasMaxHeight": 2400,
                "canvasBackgroundColor": "#edeff5",
                "backgroundFxQuery": "",
                "appMode": "auto"
              },
              "pageSettings": null,
              "showViewerNavigation": true,
              "homePageId": "c7099c38-5e2a-4e68-9e30-9005f881d75b",
              "appId": "ab65b201-4207-4876-a8a6-fdcbf31661b6",
              "currentEnvironmentId": "60eff059-202a-4c12-ae12-507874f9191d",
              "promotedFrom": null,
              "createdAt": "2025-02-28T06:21:34.974Z",
              "updatedAt": "2025-02-28T06:21:34.961Z"
            }
          ],
          "appEnvironments": [
            {
              "id": "60eff059-202a-4c12-ae12-507874f9191d",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "development",
              "isDefault": false,
              "priority": 1,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            },
            {
              "id": "48aa7f50-8709-4ae1-92cd-049b2aa22080",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "staging",
              "isDefault": false,
              "priority": 2,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            },
            {
              "id": "8f0a5c41-cea1-452a-b27c-e93337b567bd",
              "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
              "name": "production",
              "isDefault": true,
              "priority": 3,
              "enabled": true,
              "createdAt": "2024-08-22T10:34:39.181Z",
              "updatedAt": "2024-08-22T10:34:39.181Z"
            }
          ],
          "dataSourceOptions": [],
          "schemaDetails": {
            "multiPages": true,
            "multiEnv": true,
            "globalDataSources": true
          }
        }
      }
    }
  ],
  "tooljet_version": "3.5.11-cloud-lts",
  "appName": "ToolJet API Application"
}
```

</details>

    - **Response:** `201 Created`

### Update User Metadata
:::warning BETA
This endpoint is in beta and may change in future releases.
:::


    - **Description:** Replaces the entire `userDetails` (metadata) object for a specific user in a workspace. The provided `userDetails` array fully replaces the existing metadata. Any keys not included in the request will be removed.
    - **URL:** `/api/ext/workspace/:workspace_identifier/user/:user_identifier`
    - **Method:** PUT
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Path Parameters:**

    | Parameter | Type | Required | Description |
    |:----------|:-----|:---------|:------------|
    | `workspace_identifier` | string | Yes | Workspace UUID or slug |
    | `user_identifier` | string | Yes | User UUID or email |

    - **Body:**

    | Field | Type | Required | Description |
    |:------|:-----|:---------|:------------|
    | `userDetails` | array | Yes | Array of key-value pairs representing the complete metadata set |
    | `userDetails[].key` | string | Yes | Free-form key (no schema enforced) |
    | `userDetails[].value` | string | Yes | Value for the key |

    ```bash title="cURL Request"
    curl -X PUT "https://{your-domain}/api/ext/workspace/:workspace_identifier/user/:user_identifier" \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "userDetails": [
          { "key": "department", "value": "Platform" },
          { "key": "title", "value": "Senior Engineer" },
          { "key": "location", "value": "San Francisco" }
        ]
      }'
    ```

:::warning
This is a **replace** operation, not a merge. The provided `userDetails` array fully replaces the existing metadata. Any keys not present in the request will be removed. Sending an empty array removes all metadata.
:::

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
{
  "id": "a1b2c3d4-...",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "userDetails": [
    { "key": "department", "value": "Platform" },
    { "key": "title", "value": "Senior Engineer" },
    { "key": "location", "value": "San Francisco" }
  ]
}
```

  </details>

    - **Response:** `200 OK` : Returns the full user object including the updated metadata.
    - **Error Responses:**

    | Status Code | Message |
    |:------------|:--------|
    | `404 Not Found` | Workspace not found |
    | `404 Not Found` | User not found |
    | `404 Not Found` | User is not a member of the specified workspace |
    | `400 Bad Request` | userDetails must be an array |
    | `401 Unauthorized` | Unauthorized |

### Get User Metadata
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

    - **Description:** Returns metadata for a specific user within a workspace.
    - **URL:** `/api/ext/workspace/:workspace_identifier/user/:user_identifier`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Path Parameters:**

    | Parameter | Type | Required | Description |
    |:----------|:-----|:---------|:------------|
    | `workspace_identifier` | string | Yes | Workspace UUID or slug |
    | `user_identifier` | string | Yes | User UUID or email |

    ```bash title="cURL Request"
    curl -X GET "https://{your-domain}/api/ext/workspace/:workspace_identifier/user/:user_identifier" \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json"
    ```

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>

```json
{
  "id": "a1b2c3d4-...",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "userDetails": [
    { "key": "department", "value": "Platform" },
    { "key": "title", "value": "Senior Engineer" },
    { "key": "location", "value": "San Francisco" }
  ]
}
```

  </details>

    - **Response:** `200 OK` : Returns the full user object including the complete `userDetails`.
    - **Error Responses:** Same as [Update User Metadata](#update-user-metadata).

### Create Group
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

    - **Description:** Creates a new user group in a workspace with workspace-level permissions and optional granular permissions for applications and datasources.
    - **URL:** `/api/ext/workspace/:workspaceId/groups`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Path Parameters:**

    | Parameter | Type | Required | Description |
    |:----------|:-----|:---------|:------------|
    | `workspaceId` | string | Yes | Workspace UUID |

    - **Body:**

    | Field | Type | Required | Description |
    |:------|:-----|:---------|:------------|
    | `name` | string | Yes | Name of the group |
    | `permissions` | object | No | Workspace-level permissions (`appCreate`, `appDelete`, etc.) |
    | `granularPermissions` | array | No | Array of granular permission objects for apps or datasources |

    **Granular Permission Object:**

    | Field | Type | Required | Description |
    |:------|:-----|:---------|:------------|
    | `type` | string | Yes | `"app"` or `"data_source"` |
    | `applyToAll` | boolean | Yes | Apply permissions to all resources of this type |
    | `resources` | array | Yes | Array of resource UUIDs. Must be empty if `applyToAll` is `true` |
    | `permissions` | object | Yes | Type-specific permissions (see below) |

    **Permissions for `type: "app"`:**

    | Field | Type | Description |
    |:------|:-----|:------------|
    | `canEdit` | boolean | Allow editing the application |
    | `hideFromDashboard` | boolean | Hide the application from the dashboard |
    | `environments` | array | Accessible environments: `"development"`, `"staging"`, `"production"`, `"released"` |

    **Permissions for `type: "data_source"`:**

    | Field | Type | Description |
    |:------|:-----|:------------|
    | `canUse` | boolean | Allow using the datasource in queries |
    | `canConfigure` | boolean | Allow configuring the datasource |

**Permissions for `type: "workflow"`:**

| Field   | Type    | Description |
|:--------|:--------|:------------|
| `canEdit` | boolean | Allows the user to create, modify, and execute workflows. When set to `false`, the user can only execute existing workflows. |

    ```bash title="cURL Request"
    curl -X POST "https://{your-domain}/ext/workspace/:workspaceId/groups" \
      -H "Authorization: Basic <access_token>" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Platform Engineers",
        "permissions": {
          "appCreate": true,
          "appDelete": false
        },
        "granularPermissions": [
          {
            "type": "app",
            "applyToAll": false,
            "resources": ["app-uuid-1", "app-uuid-2"],
            "permissions": {
              "canEdit": false,
              "hideFromDashboard": false,
              "environments": ["production", "released"]
            }
          },
          {
            "type": "data_source",
            "applyToAll": true,
            "resources": [],
            "permissions": {
              "canUse": true,
              "canConfigure": false
            }
          },
          {
            "type": "workflow",
            "applyToAll": true,
            "resources": [],
            "permissions": {
              "canEdit": true
            }
          }
        ]
      }'
    ```

    - **Response:** `201 Created` : No response body.

    **Validation Rules:**
    - If `applyToAll` is `false`, `resources` must not be empty.
    - If `applyToAll` is `true`, `resources` must be empty (or will be ignored).
    - `environments` values must be one of: `"development"`, `"staging"`, `"production"`, `"released"`. The array may be empty (indicating no environment access).
    - All IDs in `resources` must be valid UUIDs, exist within the workspace, and match the specified `type` (app IDs for `"app"`, datasource IDs for `"data_source"`).


### Get All Groups
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

- **Description**: Retrieves a list of all groups within a workspace. Supports optional search and pagination.
- **URL**: `/api/ext/workspaces/:workspaceId/groups`
- **Method**: GET
- **Authorization**: `Basic <access_token>`
- **Content-Type**: `application/json`
- **Query Parameters**:<br /><br />
  | Parameter  | Type   | Description                |
  | :--------- | :----- | :------------------------- |
  | `search`   | string | Filter groups by name      |
  | `page`     | number | Page number                |
  | `per_page` | number | Number of results per page |

```bash title="cURL Request"
curl -X GET "https://{your-domain}/api/ext/workspace/:workspaceId/groups" \
  -H "Authorization: Basic <access_token>" \
  -H "Content-Type: application/json"
```
- Response: `200 OK` : Returns list of groups with permissions and granular permissions.

<details id="tj-dropdown">
<summary>Response Example</summary>

```json
{
  "data": [
    {
      "id": "grp_12345",
      "name": "Backend Engineers",
      "permissions": {
        "appCreate": true,
        "appDelete": false,
        "workflowCreate": true,
        "workflowDelete": false,
        "folderCRUD": true,
        "orgConstantCRUD": false,
        "dataSourceCreate": true,
        "dataSourceDelete": false,
        "appPromote": true,
        "appRelease": false
      },
      "granularPermissions": [
        {
          "id": "gp_abc123",
          "type": "app",
          "applyToAll": false,
          "resources": ["app-uuid-1"],
          "permissions": {
            "canEdit": true,
            "hideFromDashboard": false,
            "environments": ["development", "staging"]
          }
        },
        {
          "id": "gp_def456",
          "type": "workflow",
          "applyToAll": true,
          "resources": [],
          "permissions": {
            "canEdit": true
          }
        }
      ]
    },
    {
      "id": "grp_67890",
      "name": "Frontend Engineers",
      "permissions": {
        "appCreate": true,
        "appDelete": true,
        "workflowCreate": true,
        "workflowDelete": true,
        "folderCRUD": true,
        "orgConstantCRUD": true,
        "dataSourceCreate": true,
        "dataSourceDelete": true,
        "appPromote": true,
        "appRelease": true
      },
      "granularPermissions": []
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_count": 2
  }
}
```
</details>

### Get Group by ID
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

- **Description**: Retrieves details of a specific group within a workspace, including workspace-level permissions and granular permissions.
- **URL**: `/api/ext/workspace/:workspaceId/groups/:groupId`
- **Method**: GET
- **Authorization**: `Basic <access_token>`
- **Content-Type**: `application/json`
- **Path Parameters**:

| Parameter              | Type   | Required | Description                    |
|:----------------------|:-------|:---------|:-------------------------------|
| `workspace_identifier` | string | Yes      | Workspace UUID                 |
| `group_id`            | string | Yes      | Unique identifier of the group |

```bash title="cURL Request"
curl -X GET "https://{your-domain}/api/ext/workspace/:workspaceId/groups/:groupId" \
  -H "Authorization: Basic <access_token>" \
  -H "Content-Type: application/json"
```

**Response**
- Status: `200 OK`
- Description: Returns the complete group object including workspace-level permissions and granular permissions.

<details id="tj-dropdown">
<summary>**Response Example**</summary>
```json
{
  "id": "grp_12345",
  "name": "Backend Engineers",
  "permissions": {
    "appCreate": true,
    "appDelete": false,
    "workflowCreate": true,
    "workflowDelete": false,
    "folderCRUD": true,
    "orgConstantCRUD": false,
    "dataSourceCreate": true,
    "dataSourceDelete": false,
    "appPromote": true,
    "appRelease": false
  },
  "granularPermissions": [
    {
      "type": "app",
      "applyToAll": false,
      "resources": ["app-uuid-1"],
      "permissions": {
        "canEdit": true,
        "hideFromDashboard": false,
        "environments": ["development", "staging"]
      }
    },
    {
      "type": "workflow",
      "applyToAll": true,
      "resources": [],
      "permissions": {
        "canEdit": true
      }
    }
  ]
}
```
</details>

### Update Group
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

- **Description**: Updates group name, workspace-level permissions, or granular permissions. You can update any combination of fields.
- **URL**: `/api/ext/workspace/:workspaceId/groups/:groupId`
- **Method**: PATCH
- **Authorization**: `Basic <access_token>`
- **Content-Type**: `application/json`
- **Body**: <br /><br />
  | Field                  | Type    | Required | Description                          |
  |:----------------------|:--------|:---------|:-------------------------------------|
  | `name`                | string  | No       | Updated group name                   |
  | `permissions`         | object  | No       | Workspace-level permissions          |
  | `granularPermissions` | array   | No       | Resource-level permission rules      |

```bash title="cURL Request"
curl -X PATCH "https://{your-domain}/api/ext/workspace/:workspaceId/groups/:groupId" \
  -H "Authorization: Basic <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Backend Engineers",
    "permissions": {
      "appCreate": true,
      "appDelete": true,
      "workflowCreate": true,
      "workflowDelete": true,
      "folderCRUD": true,
      "orgConstantCRUD": true,
      "dataSourceCreate": true,
      "dataSourceDelete": true,
      "appPromote": true,
      "appRelease": true
    },
    "granularPermissions": [
      {
        "type": "app",
        "applyToAll": false,
        "resources": ["app-uuid-1"],
        "permissions": {
          "canEdit": true,
          "hideFromDashboard": false,
          "environments": ["development", "staging"]
        }
      },
      {
        "type": "workflow",
        "applyToAll": true,
        "resources": [],
        "permissions": {
          "canEdit": true
        }
      }
    ]
  }'
```

- Response: `200 OK` : Returns updated group object

**Notes**
- Only provided fields are updated; others remain unchanged
- *granularPermissions* entries are merged or created based on permission combinations
- applyToAll: true ignores resources

### Delete Group
:::warning BETA
This endpoint is in beta and may change in future releases.
:::

- **Description**: Deletes a group from the workspace.
- **URL**: `/api/ext/workspace/:workspaceId/groups/:groupId`
- **Method**: DELETE
- **Authorization**: `Basic <access_token>`
- **Content-Type**: `application/json`

```bash title="cURL Request"
curl -X DELETE "https://{your-domain}/api/ext/workspace/:workspaceId/groups/:groupId" \
  -H "Authorization: Basic <access_token>" \
  -H "Content-Type: application/json"
```
- Response: `204 No Content`