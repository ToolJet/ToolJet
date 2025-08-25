---
id: marketplace-plugin-jira
title: Jira
---

# Jira

ToolJet allows you to connect to your Jira instance to perform various operations such as managing issues, users, worklogs, and boards.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/jira-homepage.png" alt="Jira Homepage" />
</div>


## Connection

To connect to a Jira data source in ToolJet, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

To connect to your Jira instance, the following details are required:
- **URL**: Your Jira instance URL
- **Email**: Your Jira account email
- **Token**: Your Jira API token

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/connect.png" alt="Jira Connect" />
</div>

:::tip
You can generate a personal access token from your Jira account **Manage account > Security > API Tokens** section.
:::

## Querying Jira

1. Click the **+** button in the query manager at the bottom of the editor and select the Jira data source added earlier.
2. Choose the resource and operation you want to perform on your Jira instance.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
:::

## Supported Resources and Operations

ToolJet supports the following Jira resources and operations:

#### Issue

- **[Get Issue](#get-issue)**
- **[Create Issue](#create-issue)**
- **[Delete Issue](#delete-issue)**
- **[Assign Issue](#assign-issue)**
- **[Edit Issue](#edit-issue)**

#### User

- **[Get User](#get-user)**
- **[Find Users by Query](#find-users-by-query)**
- **[Find Assignable Users](#find-assignable-users)**

#### Worklog

- **[Get Issue Worklogs](#get-issue-worklogs)**
- **[Add Worklog](#add-worklog)**
- **[Delete Worklog](#delete-worklog)**

#### Board

- **[Get Issues for Backlog](#get-issues-for-backlog)**
- **[Get All Boards](#get-all-boards)**
- **[Get Issues for Board](#get-issues-for-board)**


## Issue

### Get Issue

This operation retrieves details of a specific Jira issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-issue.png" alt="Jira Get Issue"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to retrieve.
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.

#### Example:
```yaml
Issue Key: 10001
Params/Body: 
{
    "fields": "summary,description,created",
    "expand": "renderedFields,names"
}
```

### Create Issue

This operation creates a new Jira issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/create-issue.png" alt="Jira Create Issue"/>
</div>

#### Parameters:
- **Params/Body**: The details of the issue to be created.

#### Example:
```yaml
Params/Body:
{
  "fields": {
    "project": { 
      "key": "SCRUM"
    },
    "summary": "A particular bug needs to be fixed.",
    "description": "The XYZ feature is not working as expected.",
    "issuetype": {
      "name": "Bug"
    },
    "assignee": {
      "accountId": "712020:4581444c-054e-41d8-90ed-6d1d849557f7"
    },
    "labels": [
      "bug",
      "urgent"
    ]
  }
}
```

### Delete Issue

This operation deletes a specific Jira issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/delete-issue.png" alt="Jira Delete Issue"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to delete.
- **Delete subtasks**: Whether to delete the issue's subtasks.

#### Example:
```yaml
Issue Key: 10001
Delete Subtasks: Yes // Can be Yes or No
```

### Assign Issue

This operation assigns a Jira issue to a specific user.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/assign-issue.png" alt="Jira Assign Issue"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to assign.
- **Account id**: The account ID of the user to assign the issue to.

#### Example:
```yaml
Issue Key: 10001
Account id: 712020:4581444c-054e-41d8-90ed-6d1d849557f7
```

### Edit Issue

This operation modifies an existing Jira issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/edit-issue.png" alt="Jira Edit Issue"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to edit.
- **Params/Body**: The fields to update and their new values.

#### Example:
```yaml
Issue Key: 10007
Params/Body:
{
  "fields": {
    "summary": "Updated issue summary",
    "description": "Updated issue description"
  }
}
```

## User

### Get User

This operation retrieves details of a specific Jira user.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-user.png" alt="Jira Get User"/>
</div>

#### Parameters:
- **Account id**: The account ID of the user to retrieve.
- **Expand**: Additional user details to include in the response.

#### Example:
```yaml
Account id: 5b10a2844c20165700ede21g
Expand: groups,applicationRoles
```

### Find Users by Query

This operation searches for users based on a query.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/find-users.png" alt="Jira Find Users"/>
</div>

#### Parameters:
- **Query**: The search query in Jira Query Language (JQL) format.
- **Start at**: The index of the first user to return.
- **Max results**: The maximum number of users to return.

#### Example:
```yaml
Query: is assignee of PROJ
Start at: 1
Max results: 10
```

### Find Assignable Users

This operation finds users that can be assigned to issues.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/assignable-users.png" alt="Jira Assignable Users"/>
</div>

#### Parameters:
- **Query**: The search query in Jira Query Language (JQL) format.
- **Account id**: The account ID of the user to find assignable users for.
- **Project key**: The key or id of the project to find assignable users for.
- **Issue key**: The key or id of the issue to find assignable users for.
- **Start at**: The index of the first user to return.
- **Max results**: The maximum number of users to return.
- **Action descriptor id**: The action descriptor ID to find assignable users for.
- **Recommended**: Whether to return recommended users.

:::info
Note: Query and Account id are mutually exclusive parameters. You can only use one of them.
:::

#### Example:
```yaml
Query: Mark // Search for users with "Mark" in their name, username, or email
Account id: 5b10a2844c20165700ede21g
Project key: PROJ
Issue key: SCRUM-1
Start at: 1
Max results: 10
Action descriptor id: 12345
Recommended: Yes

```

## Worklog

### Get Issue Worklogs

This operation retrieves the worklogs for a specific issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-issue-worklogs.png" alt="Jira Get Issue Worklogs"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to get worklogs for.
- **Start at**: The index of the first worklog to return.
- **Max results**: The maximum number of worklogs to return.
- **Started after**: The date and time to start retrieving worklogs from.
- **Started before**: The date and time to stop retrieving worklogs.

#### Example:
```yaml
Issue Key: SCRUM-1
Start at: 1
Max results: 10
Started after: 1626228754515
Started before: 1726228754515
```

### Add Worklog

This operation adds a new worklog entry to an issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/add-worklog.png" alt="Jira Add Worklog"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue to add the worklog to.
- **Params/Body**: The details of the worklog entry.

#### Example:
```yaml
Issue Key: SCRUM-1
Params/Body:
{
  "comment": "I did some work here.",
  "created": "2017-03-14T10:35:37.097+0000",
  "id": "100028",
  "issueId": "SCRUM-1",
  "started": "2017-03-14T10:35:37.097+0000",
  "timeSpent": "3h 20m"
}
```

### Delete Worklog

This operation deletes a specific worklog entry from an issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/delete-worklog.png" alt="Jira Delete Worklog"/>
</div>

#### Parameters:
- **Issue key**: The key or id of the issue containing the worklog
- **Worklog id**: The ID of the worklog to delete
- **Params/Body**: Additional parameters such as notify users, adjust estimate, etc.

#### Example:
```yaml
Issue Key: SCRUM-1
Worklog id: 100010
Params/Body:
{
    "notifyUsers": "true",
    "adjustEstimate": "auto"
}
```

## Board

### Get Issues for Backlog

This operation retrieves issues from a board's backlog.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/backlog-issues.png" alt="Jira Backlog Issues"/>
</div>

#### Parameters:
- **Board id**: The ID of the board to get backlog issues from.
- **Start at**: The index of the first issue to return.
- **Max results**: The maximum number of issues to return.
- **Expand**: Additional issue details to include in the response.
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.


#### Example:
```yaml
Board id: 1
Start at: 1
Max results: 10
Expand: changelog
Params/Body:
{
    "fields": ["summary", "description", "created"],
}
```

### Get All Boards

This operation retrieves all boards visible to the user.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/all-boards.png" alt="Jira All Boards"/>
</div>

#### Parameters:
- **Project key**: Limit the boards to a specific project.
- **Start at**: The index of the first board to return.
- **Name**: The name of the board to search for.
- **Max results**: The maximum number of boards to return.
- **Expand**: Additional board details to include in the response.

#### Example:
```yaml
Project key: PROJ
Start at: 1
Name: SCRUM
Max results: 10
Expand: projects
```

### Get Issues for Board

This operation retrieves all issues from a specific board.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/board-issues.png" alt="Jira Board Issues"/>
</div>

#### Parameters:
- **Board id**: The ID of the board to get issues from.
- **Start at**: The index of the first issue to return.
- **Max results**: The maximum number of issues to return.
- **Expand**: Additional issue details to include in the response.
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.

#### Example:
```yaml
Board id: 1
Start at: 1
Max results: 10
Expand: changelog
Params/Body:
{
    "fields": ["summary", "description", "created"],
}
```