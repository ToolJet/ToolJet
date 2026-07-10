---
id: marketplace-plugin-asana
title: Asana
---

Asana is a work management platform that helps teams organize, track, and manage projects and tasks. The Asana plugin in ToolJet lets you:
- Create, update, and manage tasks and subtasks.
- Organize tasks with projects, sections, tags, and followers.
- Post comments and view task activity.
- Manage workspaces, users, and teams.
- Retrieve and manage task attachments.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

The Asana plugin uses **OAuth 2.0** authentication to securely connect your Asana account.

To configure the connection, you will need the following credentials, which you can generate from [Asana Developer Console](https://asana.com/developers).

- **Client ID** 
- **Client Secret**
- **Redirect URI**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/connection.png" alt="Asana plugin connection"/>

## Supported Operations

- **[Task](#task)**
- **[Project](#project)**
- **[Workspace](#workspace)**
- **[Attachment](#attachment)**

## Task

Manage tasks in Asana by creating, updating, retrieving, organizing, and collaborating on tasks, including subtasks, comments, followers, projects, and attachments.

### List Tasks
Retrieve a list of tasks from Asana.

#### Required Parameter
- Project GID

#### Optional Parameters
- Fields (opt_fields)
- Limit
- Offset token

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-task.png" alt="Asana List task ops"/>

### Get Task
Retrieve details of a specific task.

#### Required Parameter
- Task GID

#### Optional Parameter
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-task.png" alt="Asana Get task ops"/>

### Create Task
Create a new task in Asana.

#### Required Parameters
- Workspace GID
- Task data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-task.png" alt="Asana Create task ops"/>

### Update Task
Update the details of an existing task.

#### Required Parameters
- Task GID
- Task data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/update-task.png" alt="Asana Update task ops"/>

### Delete Task
Delete an existing task.

#### Required Parameter
- Task GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-task.png" alt="Asana Delete task ops"/>

### Add Comment
Add a comment to a task.

#### Required Parameters
- Task GID
- Comment text

#### Optional parameters
- Pin comment

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-comment.png" alt="Asana Add comment ops"/>

### List Stories (comments)
Retrieve comments and activity associated with a task.

#### Required Parameter
- Task GID

#### Optional Parameter
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-stories.png" alt="Asana List stories ops"/>

### List Subtasks
Retrieve all subtasks of a task.

#### Required Parameter
- Task GID

#### Optional Parameter
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-subtask.png" alt="Asana List subtask ops"/>

### Create Subtask
Create a new subtask under an existing task.

#### Required Parameters
- Parent Task GID
- Subtask data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-subtask.png" alt="Asana Create subtask ops"/>

### Add to Project
Add a task to a project.

#### Required Parameters
- Task GID
- Project GID

#### Optional Parameter
- Section GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-to-project.png" alt="Asana Add to project ops"/>

### Remove from Project
Remove a task from a project.

#### Required Parameters
- Task GID
- Project GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/remove-from-project.png" alt="Asana Remove from project ops"/>

### Add Followers
Add followers to a task.

#### Required Parameters
- Task GID
- Follower GIDs

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-followers.png" alt="Asana Add followers ops"/>

### Remove Followers
Remove followers from a task.

#### Required Parameters
- Task GID
- Follower GIDs

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/remove-followers.png" alt="Asana Remove followers ops"/>

### Duplicate Task

Create a duplicate of an existing task.

#### Required Parameter
- Task GID

#### Optional Parameters
- New task name
- Include fields

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/duplicate-task.png" alt="Asana Duplicate task ops"/>

### List Attachments
Retrieve all attachments associated with a task.

#### Required Parameter
- Task GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-attach.png" alt="Asana List attach ops"/>

## Project
Manage Asana projects by creating, updating, retrieving, deleting projects, and accessing their sections.

### List Projects
Retrieve a list of projects.

#### Required Parameter
- Workspace GID

#### Optional Parameters
- Fields (opt_fields)
- Limit
- Offset token

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-proj.png" alt="Asana List projects ops"/>

### Get Project
Retrieve details of a specific project.

#### Required Parameter
- Project GID

#### Optional Parameter
- Fields (opt_fields)   

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-proj.png" alt="Asana Get projects ops"/>

### Create Project
Create a new project.

#### Required Parameters
- Workspace GID
- Project data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-proj.png" alt="Asana Create projects ops"/>

### Update Project
Update an existing project.

#### Required Parameters
- Project GID
- Project data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/update-proj.png" alt="Asana Update projects ops"/>

### Delete Project
Delete a project.

#### Required Parameter
- Project GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-proj.png" alt="Asana delete projects ops"/>

### List Sections
Retrieve all sections within a project.

#### Required Parameter
- Project GID

#### Optional Parameter
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-sections.png" alt="Asana List section ops"/>

## Workspace
Access and manage workspace resources, including workspaces, users, teams, and tags.

### List Workspaces	
Retrieve all accessible workspaces.

#### Optional Parameter
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-workspace.png" alt="Asana List workspace ops"/>

### List Users	
Retrieve users within a workspace.

#### Required Parameter
- Workspace GID

#### Optional Parameter
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-users.png" alt="Asana List users ops"/>

### List Teams	
Retrieve teams in a workspace.

#### Required Parameter
- Workspace GID

#### Optional Parameter
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-teams.png" alt="Asana List teams ops"/>

### List Tags	
Retrieve tags available in a workspace.

#### Required Parameter
- Workspace GID

#### Optional Parameter
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-tags.png" alt="Asana List tags ops"/>

### Create Tag	
Create a new tag in a workspace.

#### Required Parameter
- Workspace GID
- Tag name

#### Optional Parameter
- Tag color 

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-tag.png" alt="Asana Create tag ops"/>

## Attachment
Retrieve and manage attachments associated with Asana tasks.

### Get Attachment	
Retrieve details of a specific attachment.

#### Required Parameter
- Attachment GID

#### Optional Parameter
- Fields (opt_fields) 

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-attachment.png" alt="Asana Get attachment ops"/>

### Delete Attachment	
Delete an existing attachment.

#### Required Parameter
- Attachment GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-attachment.png" alt="Asana Delete attachment ops"/>
