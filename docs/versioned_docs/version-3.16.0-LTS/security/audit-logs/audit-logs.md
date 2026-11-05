---
id: audit-logs
title: Audit Logs Overview
sidebar_label: Overview
---

<PlanBadge type="team" />

The audit log is the report of all the activities done in your ToolJet account. It will capture and display events automatically by recording who performed an activity, what when, and where the activity was performed, along with other information such as IP address.

<img className="screenshot-full" src="/img/enterprise/audit_logs/logsnew-v2.png" alt="Audit logs" />

### Date Range

Use the **Date Range Picker** to fetch events between a start and end date and time. When you open the page, it shows the last 24 hours. Turn on **Show Latest activity** to return to that view.

The longest range you can select depends on your license, up to 30 days. On a Business license it's up to 14 days, and the range must fall within the last 14 days.

:::info
Pagination at the bottom allows navigation through the pages, with each page displaying a maximum of 7 logs.
:::

<img className="screenshot-full" src="/img/enterprise/audit_logs/filtersnew-v2.png" alt="Audit logs" />

## Audit Log Retention Period

By default, ToolJet keeps audit logs for 90 days. A cleanup job runs every day at 2:00 AM server time and deletes logs older than the retention period from all workspaces. To change the period, set `AUDIT_LOGS_RETENTION_PERIOD` to the number of days to keep:

```bash
AUDIT_LOGS_RETENTION_PERIOD=180
```

To keep audit logs indefinitely, set the variable to `0`.

## Filter Audit Logs

Use the filters below the date range to narrow the events, then click **Filter**. Selected filters appear under **Filter By:**. Click **Clear all filters** to remove them.

## Select Users

Use **Users** to show only events performed by specific users. Search by name or email.

## Select Apps

Use **Apps** to show only events on specific apps.

## Select Resources

| <div style={{ width:"100px"}}> Resources </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| User | Sign-in, sign-up, invitation, profile, password, and user management events. |
| Group Permission | Creating, updating, duplicating, and deleting groups, and adding or removing group members. |
| Group Granular Permission | Creating, updating, and deleting app and data source permissions within a group. |
| Workspaces | Creating, updating, archiving, and unarchiving workspaces. |
| Workspace Login Settings | Changes to the workspace's general login settings. |
| SSO | Changes to the workspace's SSO configuration. |
| App | App, app version, import, export, and clone events. |
| Data Source | Creating, updating, and deleting data sources. |
| Query | Query runs. |

:::info
**Group Permission** and **Group Granular Permission** filter the same underlying resource type, so selecting either one returns events from both. The same applies to **Workspace Login Settings** and **SSO**.
:::

<img className="screenshot-full img-full" src="/img/enterprise/audit_logs/filters-resources-v3.png" alt="Audit log filters with the Resources dropdown open" />

## Select Actions

**Actions** lists the events for the selected resources, or all events if you haven't selected a resource.

### User

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| USER_LOGIN | A user signs in with a password or SSO. If two-factor authentication is on, the event is recorded once the password is accepted. |
| USER_LOGOUT | A user logs out. |
| USER_SIGNUP | A user activates a new account from the sign-up email, or sets up an account from an invitation. |
| USER_INVITE | An admin invites a user to the workspace, individually or through bulk upload. |
| USER_INVITE_REDEEM | An existing user accepts an invitation to a workspace. |
| USER_ARCHIVE | A user is archived from a workspace, or from all workspaces by a super admin. |
| USER_UNARCHIVE | A user is unarchived in a workspace, or in all workspaces by a super admin. |
| USER_PROFILE_UPDATE | A user changes their name, avatar, or preferences. |
| USER_PASSWORD_FORGOT | A user requests a password reset link from the login page. |
| USER_PASSWORD_RESET | A user sets a new password from a reset link, or a super admin resets a user's password. |
| USER_PASSWORD_UPDATE | A user changes their password from profile settings. |
| USER_DETAILS_UPDATE | A super admin updates a user's name, or a bulk upload updates an existing user. |
| SET_AS_SUPERADMIN | A super admin changes a user's type to or from super admin. The event is recorded in every workspace the user belongs to. |

### Group Permission

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| GROUP_PERMISSION_CREATE | A group is created. |
| GROUP_PERMISSION_UPDATE | A group's name or permissions are updated. |
| GROUP_PERMISSION_DELETE | A group is deleted. |
| GROUP_PERMISSION_DUPLICATE | A group is duplicated. |
| USER_ADD_TO_GROUP | Users are added to a group. |
| USER_REMOVE_FROM_GROUP | A user is removed from a group. |

### Group Granular Permission

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| GRANULAR_PERMISSION_APP_CREATE | An app permission is added to a group. |
| GRANULAR_PERMISSION_APP_UPDATE | An app permission in a group is updated. |
| GRANULAR_PERMISSION_APP_DELETE | An app permission is removed from a group. |
| GRANULAR_PERMISSION_DATA_SOURCE_CREATE | A data source permission is added to a group. |
| GRANULAR_PERMISSION_DATA_SOURCE_UPDATE | A data source permission in a group is updated. |
| GRANULAR_PERMISSION_DATA_SOURCE_DELETE | A data source permission is removed from a group. |

### Workspaces

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| WORKSPACE_CREATE | A workspace is created. |
| WORKSPACE_UPDATE | A workspace's name or slug is updated. |
| WORKSPACE_ARCHIVE | A workspace is archived. |
| WORKSPACE_UNARCHIVE | A workspace is unarchived. |

### Workspace Login Settings and SSO

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| WORKSPACE_LOGIN_SETTINGS_UPDATE | The workspace's general login settings are updated. |
| SSO_UPDATE | An SSO provider's configuration for the workspace is updated. |
| INSTANCE_SSO_INHERIT | The workspace's setting to show instance-level SSO is turned on or off. |

### App

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| APP_UPDATE | An app's name, slug, or icon is changed, or a version's app or page settings are updated. |
| APP_PUBLIC_UPDATE | An app is made public or private. |
| APP_RELEASE | A version of an app is released. |
| APP_PROMOTE | A version is promoted to the next environment. |
| APP_IMPORT | An app is imported. |
| APP_EXPORT | An app is exported. |
| APP_CLONE | An app is cloned. |

### Data Source and Query

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| DATA_SOURCE_CREATE | A data source is created. |
| DATA_SOURCE_UPDATE | A data source is updated. |
| DATA_SOURCE_DELETE | A data source is deleted. |
| DATA_QUERY_RUN | A query runs from the query editor or a released app. |

### Other Recorded Events

These events appear in the log list but not in **Actions**. To find app and version events, select the **App** resource without selecting an action.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div> |
| --- | --- |
| APP_CREATE | An app is created. |
| APP_DELETE | An app is deleted. |
| APP_VERSION_CREATE | A new version of an app is created. |
| APP_VERSION_UPDATE | A version of an app is updated, such as renamed. |
| APP_VERSION_DELETE | A version of an app is deleted. |
| CREATE_WORKFLOW | A workflow is created. |
| WORKFLOW_RUN | A workflow finishes running. The `metadata` contains the execution logs for each node. |
| delete_organization_sso | An SSO provider configuration is deleted from the workspace. |
| verifyOrganizationToken | An active user opens an invitation link to join another workspace. |

## Understanding Log Information

<img className="screenshot-full" src="/img/enterprise/audit_logs/readinglogv2.png" alt="Audit logs" />

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action_type                                    | This indicates the type of action that was logged in the event. Refer to [this](#select-actions) for more information on actions.                                                                                           |
| created_at                                     | Shows the date and time when the event was logged.                                                                                                                                                                          |
| id                                             | Each logged event is assigned a unique event ID.                                                                                                                                                                            |
| ip_address                                     | Displays the IP address from which the event was logged.                                                                                                                                                                    |
| metadata                                       | The metadata includes two sub-properties: `tooljet_version` and `user_agent`. `tooljet_version` shows the version of ToolJet used for the event, while `user_agent` contains information about the device and browser used. |
| organization_id                                | Every organization in ToolJet has a unique ID associated with it, which is recorded when an event occurs.                                                                                                                   |
| resource_id                                    | Different [resources](#select-resources) have their respective IDs associated with them. These IDs are assigned when the resources are created.                                                                             |
| resource_name                                  | Shows the name of the [resources](#select-resources) that were involved in the logged event. For example, if an app was created or deleted, it will display the name of that app.                                           |
| resource_type                                  | Indicates the type of the [resources](#select-resources) involved in the logged event.                                                                                                                                      |
| user_id                                        | Each user account in ToolJet has a unique ID associated with it, which is recorded when an event occurs.                                                                                                                    |

### Log File

The file will contain all the data from audit logs. The log file can be created by specifying the path in the [environment variables](/docs/setup/env-vars). The log file is rotated on a daily basis and is updated dynamically every time a new audit log is generated.

Learn more about **setting up the log file generation** [here](/docs/security/audit-logs/setup-rsyslog).

### Log Rotation

The log file is configured to rotate on a daily basis. This means that a new log file will be created every day, ensuring efficient management and organization of audit data.

### Log Redaction

ToolJet implements log redaction to protect sensitive information. By default, the following headers are masked in the logs:

- authorization
- cookie
- set-cookie
- x-api-key
- proxy-authorization
- www-authenticate
- authentication-info
- x-forwarded-for

Additionally, you can specify custom fields to be masked using the `LOGGER_REDACT` environment variable.

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"100px"}}> Description </div>                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| LOGGER_REDACT                                  | Comma-separated list of additional fields to be masked in logs (e.g., req.headers["x-session-id"],req.headers["x-device-fingerprint"]) |

For example:

```bash
LOGGER_REDACT=res.headers["x-rate-limit-remaining"],res.headers["x-request-id"]
```

### Log File Path

The path for the log file is defined using the `LOG_FILE_PATH` variable in the environment. It's important to understand that this path is relative to the home directory of the machine. For instance, if `LOG_FILE_PATH` is set to `hsbc/dashboard/log`, the resulting log file path will be structured as follows:

```
homepath/hsbc/dashboard/log/tooljet_log/{process_id}-{date}/audit.log
```

Here, `{process_id}` is a placeholder for the unique process identifier, and `{date}` represents the current date. This structured path ensures that audit logs are organized by both process and date, facilitating easy traceability and analysis.

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"100px"}}> Description </div>                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| LOG_FILE_PATH | Folder, relative to the home directory, where ToolJet creates audit log files (e.g., `rsyslog`). |

<details id="tj-dropdown">
<summary>Example Log file data</summary>

```bash
{
  level: 'info',
  message: 'PERFORM APP_CREATE OF awdasdawdwd APP',
  timestamp: '2023-11-02 17:12:40',
  auditLog: {
    userId: '0ad48e21-e7a2-4597-9568-c4535aedf687',
    organizationId: 'cf8e132f-a68a-4c81-a0d4-3617b79e7b17',
    resourceId: 'eac02f79-b8e2-495a-bffe-82633416c829',
    resourceType: 'APP',
    actionType: 'APP_CREATE',
    resourceName: 'awdasdawdwd',
    ipAddress: '::1',
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      tooljetVersion: '2.22.2-ee2.8.3'
    }
  },
  label: 'APP'
}
```

</details>
