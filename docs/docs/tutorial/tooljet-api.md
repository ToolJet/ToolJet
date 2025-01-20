---
id: tooljet-api
title: ToolJet API
---
<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

:::info BETA
ToolJet API is currently in beta and not recommended for production use.
:::

ToolJet API allows you to interact with the ToolJet platform programmatically. You can use the APIs to manage users and their workspaces relations. The API endpoints are secured with an access token. You can perform various operations using the API such as:

 - [Get All Users](#get-all-users)
 - [Get User by ID](#get-user-by-id)
 - [Create User](#create-user)
 - [Update User](#update-user)
 - [Update User Role](#update-user-role)
 - [Replace User Workspace](#replace-user-workspace)
 - [Replace User Workspaces Relations](#replace-user-workspaces-relations)
 - [Get All Workspaces](#get-all-workspaces)

## Enabling ToolJet API

By default, the ToolJet API is disabled. To enable the API, add these variables to your `.env` file:

| variable                | description                                         |
| :-----------------------: | :------------------------------------------------:|
| ENABLE_EXTERNAL_API | `true` or `false`                                       |
| EXTERNAL_API_ACCESS_TOKEN |  `<access_token>` (To authenticate API requests) |


## Security

The ToolJet API is secured with an access token created by you in your `.env` file. You need to pass the access token in the `Authorization` header to authenticate your requests. The access token should be sent in the format `Basic <access_token>`.

<details>

<summary>cURL Request Example</summary>

```bash

curl -X GET 'https://your-tooljet-instance.com/api/ext/users' \
-H 'Authorization: Basic <access_token>' \
-H 'Content-Type: application/json'

```

</details>

## API Endpoints

### **Get All Users**
    - **Description:** Retrieves a list of all the users.
    - **URL:** `/api/ext/users`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Response:** Array of User objects.
  <details>
  <summary>**Response Example**</summary>
```json
[
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
        }
      ]
    },
    {
        "id": "919623a-5e14-4v4b-63b4-3343a9be57",
        "name": "David Smith",
        "email": "david@example.com",
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
  ]
```
</details>

### **Get User by ID**
    - **Description:** Returns a user by their ID.
    - **URL:** `/api/ext/user/:id`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - id (string): The ID of the user.
    - **Response:** User object.
  <details>
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


### **Create User**
    - **Description:** Creates a new user.
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
            - `status` (string, optional): The status of the group. Can be either `active` or `archived`.
  <details>
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

### **Update User**
    - **Description:** Finds and updates a user by their ID.
    - **URL:** `/api/ext/user/:id`
    - **Method:** PATCH
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - id (string): The ID of the user.
    - **Body:** The body object can contain the following fields:
        - `name` (string, optional): The updated name of the user.
        - `email` (string, optional): The updated email address of the user.
        - `password` (string, optional): The updated password for the user. Must be between 5 and 100 characters.
        - `status` (string, optional): The updated status of the user. Can be either `active` or `archived`.
        
<details>

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


### **Update User Role**
    - **Description:** Updates the user role for a particular workspace.
    - **URL:** `/api/ext/update-user-role/workspace/workspaceId`
    - **Method:** PUT
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - workspaceId (string): The unique identifier of the workspace.
    - **Body:** The body object can contain the following fields:
        - `newRole` (string, required): The updated user role of the user.
        - `userId` (string, required): The unique identifier of the user.
        
<details>

<summary>Request Body Example</summary>

```json

{
  "newRole":"end-user",
  "userId":"f2065dd1-e5ea-4793-af91-4a8831de68e6"
}

```

</details>

    - **Response:** `200 OK`

### **Replace User Workspaces Relations**

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
          - `status` (string, optional): The status of the group. Can be either `active` or `archived`.
    - **Note:** If the array is empty, it will remove all existing workspace relations.
    - **Response:** `200 OK`
 

### **Replace User Workspace**

    - **Description:** Updates a specific workspace relation associated with a user.
    - **URL:** `/api/ext/user/:id/workspaces/:workspaceId`
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
<details>

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

### **Get All Workspaces**

    - **Description:** Retrieves a list of all workspaces.
    - **URL:** `/api/ext/workspaces`
    - **Method:** GET
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Response:** Array of Workspace objects.

<details>
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



