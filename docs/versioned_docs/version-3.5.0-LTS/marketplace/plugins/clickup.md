---
id: marketplace-plugin-clickup
title: Click Up
---

ClickUp is a cloud-based project management and collaboration platform designed to help teams of all sizes manage projects, tasks, and workflows efficiently. By integrating ClickUp with ToolJet, you can build custom internal tools that interact with your ClickUp workspace to manage tasks, folders, lists, and more.

## Connection

To connect with ClickUp, you will need an API Key, which can be generated from [ClickUp Settings](https://app.clickup.com/settings/apps).

<img className="screenshot-full img-l" src="/img/marketplace/plugins/clickup/connection.png" alt="Marketplace ClickUp Plugin"/>

## Supported Operations

ToolJet supports a wide range of ClickUp operations, grouped into the following categories. Each category corresponds to a specific part of the ClickUp data model, allowing you to perform targeted actions across your workspace:

| **Category**   | **Description**                                                     |
| -------------- | ------------------------------------------------------------------- |
| **Task**       | Create, retrieve, update, and delete tasks in your workspace.       |
| **OAuth**      | Post the OAuth token.                                               |
| **User**       | Access user-related data in your workspace.                         |
| **Team**       | Interact with teams in ClickUp.                                     |
| **Checklist**  | Manage checklists and checklist items within tasks.                 |
| **View**       | Retrieve views available in a list (e.g., board, table, list view). |
| **List**       | Access and manage lists inside folders or directly under spaces.    |
| **Comment**    | Add or fetch comments associated with tasks.                        |
| **Folder**     | Retrieve and manage folders within a space.                         |
| **Space**      | Interact with spaces that organize folders and lists under a team.  |
| **Goal**       | Manage goals and their progress within your workspace.              |
| **Key Result** | Track measurable outcomes tied to specific goals.                   |
| **Group**      | Manage task groups or assignee groups for better organization.      |
| **Webhook**    | Create and manage webhooks for real-time ClickUp event tracking.    |
| **Workspace**  | Access general workspace-level information and settings.            |

### Operation Type

The plugin supports the following HTTP methods:
- **GET** – Retrieve data (e.g., fetch a task, list users).
- **POST** – Create new resources (e.g., create a task or comment).
- **PUT** – Update existing resources (e.g., update task details).
- **DELETE** – Remove resources (e.g., delete a checklist item or webhook).

## Navigating the ClickUp Hierarchy

ClickUp data structure is hierarchical, meaning many entities (like lists or views) are nested within others. To perform operations — such as fetching tasks from a specific view — you must first retrieve a chain of IDs step-by-step, as each one depends on the previous.

```
# ClickUp Hierarchy

User
└── Workspace / Team
    └── Space
        └── Folder
            └── List
                ├── Task
                │   ├── Checklist
                │   └── Comment
                └── View
    ├── Group
    ├── Webhook
    └── Goal
        └── Key Result
```


#### Example: Retrieving a view_id

To get a `view_id` (which is needed to access a specific list view like board, table, or list), you must go through the following steps:

1. Get Team ID
    - Operation: `GET /v2/team`
    - returns a list of `team_ids` available to the authenticated user.
2. Get Space ID
    - Operation: `GET /v2/team/{team_id}/space`
    - returns the `space_ids` under that team.
3. Get Folder ID
    - `GET /space/{space_id}/folder`
    - returns folder_ids in the selected space.
4. Get List ID
    - Operation: `GET /folder/{folder_id}/list`
    - returns the `list_ids` under that folder. <br/>
    If the space has lists directly (not inside folders), you can use:
    - Operation: `GET /space/{space_id}/list`
5. Get View ID
    - Operation: `GET /list/{list_id}/view`
    - returns `view_ids` associated with that list, such as Board view, List view, etc.

## Example: Creating a Task

To create a task using the ClickUp plugin in ToolJet, you’ll need the `list_id` where the task should be created. Follow Click Up Hierarchy till step 4 to get the list id. Once you get the list id, select `POST /v2/list/{list_id}/task` operation.

**Required Parameters**:
- **list_id**: The ID of the list where the new task will be added.
- **name**: The name/title of the task to be created.

##### Sample Output:
<img className="screenshot-full img-l" src="/img/marketplace/plugins/clickup/post-task.png" alt="Marketplace ClickUp Plugin"/>
