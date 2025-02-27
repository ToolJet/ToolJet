---
id: marketplace-plugin-jira
title: Jira
---

# Jira

ToolJet allows you to connect to your Jira instance to perform various operations such as managing issues, users, worklogs, and boards.

## Connection

To connect to a Jira data source in ToolJet, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

To connect to your Jira instance, the following details are required:
- **URL**: Your Jira instance URL
- **Email**: Your Jira account email
- **Token**: Your Jira API token

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/connect-v2.png" alt="Jira Connect" />
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

## Supported Operations

The following are the operations supported in ToolJet for Jira:

## Issue

### Get Issue

This operation retrieves details of a specific Jira issue.

#### Required Parameters:
- **Issue key**: The key or ID of the issue to retrieve.

#### Optional Parameters:
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-issue-v2.png" alt="Jira Get Issue"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Issue Key: OPS-4
Param/Body: {
  "fields": "summary, description, created, ..."
  "expand": "renderedFields, names, schema, transitions, operations, editmeta, changelog, versionedRepresentations"
  "properties": "..."
  "updateHistory": "..."
}
```

</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "expand":"renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations,customfield_10010.requestTypePractice"
    "id":"10002"
    "self":"https://PROJECT.atlassian.net/rest/api/3/issue/10002"
    "key":"OPS-6"
    "fields": ...
}
```
</details>

### Create Issue

This operation creates a new Jira issue.

#### Required Parameters:
- **Params/Body**: The details of the issue to be created.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/create-issue-v2.png" alt="Jira Create Issue"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Param/Body: {
 "fields": {
   "project":
   { 
      "key": "OPS"
   },
   "summary": "A particular bug needs to be fixed.",
   "description": "The XYZ feature is not working as expected.",
   "issuetype": {
    "name": "Bug"
   },
   "assignee": {
    "accountId": "712020:db571319-3980-4086-a365-d0f4602c7a17"
   },
   "labels": [
    "bug",
    "urgent"
   ]
 }
}
```

</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "id":"10019"
    "key":"OPS-12"
    "self":"https://PROJECT.atlassian.net/rest/api/3/issue/10019"
}
```
</details>

### Delete Issue

This operation deletes a specific Jira issue.

#### Required Parameters:
- **Issue key**: The key or ID of the issue to delete.
- **Delete subtasks**: Whether to delete the issue's subtasks.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/delete-issue-v2.png" alt="Jira Delete Issue"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
 Issue Key: OPS-6,
 Delete subtasks: Yes // Can be Yes or No
```

</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "data":"The issue 'OPS-6' and its subtasks have been deleted."
}
```
</details>

### Assign Issue

This operation assigns a Jira issue to a specific user.

#### Required Parameters:
- **Issue key**: The key or ID of the issue to assign.
- **Account id**: The account ID of the user to assign the issue to.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/assign-issue-v2.png" alt="Jira Assign Issue"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
 Issue Key: OPS-4,
 Account id: 712020:2d316457-3a7d-4bd7-bb9c-c16cef914005
```

</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "data":"The issue 'OP-4' has been assigned to account '712020:2d316457-3a7d-4bd7-bb9c-c16cef914005'"
}
```
</details>

### Edit Issue

This operation modifies an existing Jira issue.

#### Parameters:
- **Issue key**: The key or ID of the issue to edit.
- **Params/Body**: The fields to update and their new values.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/edit-issue-v2.png" alt="Jira Edit Issue"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
 Issue Key: 4,
 Param/Body: {
 "fields": {
    "Description":"Updated issue description" 
 }
 }
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "data":"The issue "4" has been updated."
}
```
</details>

## User

### Get User

This operation retrieves details of a specific Jira user.

#### Required Parameters:
- **Account id**: The account ID of the user to retrieve.

#### Optional Parameters:
- **Expand**: Additional user details to include in the response.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-user-v2.png" alt="Jira Get User"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
 Account id: 712020:2d316457-3a7d-4bd7-bb9c-c16cef914005,
 Expand: widgets
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "self":"https://PROJECT.atlassian.net/rest/api/3/user?accountId=712020:2d316457-3a7d-4bd7-bb9c-c16cef914005",
    "accountId":"712020:2d316457-3a7d-4bd7-bb9c-c16cef914005",
    "accountType":"atlassian",
    "displayName":"Akshat",
    "active":true,
    "timeZone":"Asia/Calcutta",
    "locale":"en_US",
    "..."
}
```
</details>

### Find Users by Query

This operation searches for users based on a query.

#### Required Parameters:
- **Query**: The search query in Jira Query Language (JQL) format.

#### Optional Parameters:
- **Start at**: The index of the first user to return.
- **Max results**: The maximum number of users to return.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/find-users-v2.png" alt="Jira Find Users"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Query: is assignee of OPS
Start at: 0
Max results: 100
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "maxResults":100,
    "startAt":0,
    "total":2,
    "isLast":true,
    "self":"https://PROJECT.atlassian.net/rest/api/3/user?accountId=712020:db571319-3980-4086-a365-d0f4602c7a17",
    "accountId":"712020:db571319-3980-4086-a365-d0f4602c7a17",
    "accountType":"atlassian",
    "..."
}
```
</details>

### Find Assignable Users

This operation finds users that can be assigned to issues.

#### Required Parameters:
- **Account id**: The account ID of the user to find assignable users for.
- **Project key**: The key or ID of the project to find assignable users for.
- **Issue key**: The key or ID of the issue to find assignable users for.

#### Optional Parameters:

- **Query**: The search query in Jira Query Language (JQL) format.
- **Start at**: The index of the first user to return.
- **Max results**: The maximum number of users to return.
- **Action descriptor id**: The action descriptor ID to find assignable users for.
- **Recommended**: Whether to return recommended users.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/assignable-users-v2.png" alt="Jira Assignable Users"/>
</div>

:::info
Note: Query and Account ID are mutually exclusive parameters. You can only use one of them.
:::

<details>
<summary>**Example Values**</summary>

```yaml
Query: //Enter a query, e.g., string matched against name, email, or displayName
Account id: 712020:2d316457-3a7d-4bd7-bb9c-c16cef914005
Project key: OPS
Issue key: OPS-4
Start at: //0
Max results: //100
Action descriptor id: Enter ID of the action descriptor for filtering
Recommended: Yes // Can be Yes or No
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "self":"https://PROJECT.atlassian.net/rest/api/3/user?accountId=712020:2d316457-3a7d-4bd7-bb9c-c16cef914005",
    "accountId":"712020:2d316457-3a7d-4bd7-bb9c-c16cef914005",
    "accountType":"atlassian",
    "displayName":"UserName",
    "active":true,
    "..."
}
```
</details>

## Worklog

### Get Issue Worklogs

This operation retrieves the worklogs for a specific issue.

#### Required Parameters:
- **Issue key**: The key or ID of the issue to get worklogs for.

#### Optional Parameters:

- **Start at**: The index of the first worklog to return.
- **Max results**: The maximum number of worklogs to return.
- **Started after**: The date and time to start retrieving worklogs from.
- **Started before**: The date and time to stop retrieving worklogs.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/get-issue-worklogs-v2.png" alt="Jira Get Issue Worklogs"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Issue key: OPS-4
Start at: //0
Max results: //100
Started After: //Enter worklog start date and time, as a UNIX timestamp in milliseconds
Started Before: //Enter worklog start date and time, as a UNIX timestamp in milliseconds
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "startAt":0,
    "maxResults":5000,
    "total":2,
    "workloads":"..."
}
```
</details>

### Add Worklog

This operation adds a new worklog entry to an issue.

#### Required Parameters:
- **Issue key**: The key or ID of the issue to add the worklog to.
- **Params/Body**: The details of the worklog entry.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/add-worklog-v2.png" alt="Jira Add Worklog"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Issue key: OPS-4,
Param/Body: {
"fields":{
  "comment": "Hello Team, I did some work here. Please check!",
  "created": "2017-03-14T10:35:37.097+0000",
  "id": "10004",
  "issueId": "OPS-4",
  "started": "2017-03-14T10:35:37.097+0000",
  "timeSpent": "3h 20m"
}
}
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "self":"https://PROJECT.atlassian.net/rest/api/3/issue/10004/worklog/10007",
    "author":"...",
    "created":"2025-02-27T10:34:32.528+0530",
    "updated":"2025-02-27T10:34:32.528+0530",
    "started":"2017-03-14T16:05:37.097+0530",
    "timeSpent":"3h 20m",
    "timeSpentSeconds":12000
}
```
</details>

### Delete Worklog

This operation deletes a specific worklog entry from an issue.

#### Required Parameters:
- **Issue key**: The key or ID of the issue containing the worklog
- **Worklog id**: The ID of the worklog to delete

#### Optional Parameters:
- **Params/Body**: Additional parameters such as notify users, adjust estimate, etc.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/delete-worklog-v2.png" alt="Jira Delete Worklog"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Issue key: OPS-4,
Worklog id: 10004
Param/Body: {
notifyUsers: true,...
}
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "data":"The worklog with id '10004' has been deleted."
}
```
</details>

## Board

### Get Issues for Backlog

This operation retrieves issues from a board's backlog.

#### Required Parameters:
- **Board id**: The ID of the board to get backlog issues from.

#### Optional Parameters:

- **Start at**: The index of the first issue to return.
- **Max results**: The maximum number of issues to return.
- **Expand**: Additional issue details to include in the response.
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/backlog-issues.png-v2" alt="Jira Backlog Issues"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Board id: 1
Start at: //0
Max results: //100
Expand: //admins, permissions, favourite
Param/Body: { fields: "exampleField, ..." }
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "maxResults":50,
    "startAt":0,
    "total":1,
    "isLast":true,
    "issues": "..."
}
```
</details>

### Get All Boards

This operation retrieves all boards visible to the user.

#### Required Parameters:
- **Project key**: Limit the boards to a specific project.

#### Optional Parameters:

- **Start at**: The index of the first board to return.
- **Name**: The name of the board to search for.
- **Max results**: The maximum number of boards to return.
- **Expand**: Additional board details to include in the response.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/all-boards-v2.png" alt="Jira All Boards"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Project key: OPS
Start at: //0
Name: //Enter board name
Max results: //100
Expand: //admins, permissions, favourite
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "maxResults":50,
    "startAt":0,
    "total":1,
    "isLast":true,
    "value": "..."
}
```
</details>

### Get Issues for Board

This operation retrieves all issues from a specific board.

#### Required Parameters:
- **Board id**: The ID of the board to get issues from.

#### Optional Parameters:
- **Start at**: The index of the first issue to return.
- **Max results**: The maximum number of issues to return.
- **Expand**: Additional issue details to include in the response.
- **Params/Body**: Additional parameters such as fields to retrieve, expand options, etc.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/board-issues-v2.png" alt="Jira Board Issues"/>
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Board id: 1
Start at: //0
Max results: //100
Expand: changelog
Params/Body:
{
    "fields": "exampleField,..."
}
```
</details>

<details>
<summary>**Response Example**</summary>

```json
{
    "expand":"schema,names",
    "startAt":0,
    "maxResults":50,
    "total":11,
    "issues":"..."
}
```
</details>