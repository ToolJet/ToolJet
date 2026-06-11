---
id: audit_logs
title: Audit logs
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>


The audit log is the report of all the activities done in your ToolJet account. It will capture and display events automatically by recording who performed an activity, what when, and where the activity was performed, along with other information such as IP address.

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/audit_logs/logsnew-v2.png" alt="Audit logs" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Date Range

Retrieve the log of events that occurred within the specified date and time range using the range picker. By default, the system loads 24-hour logs for the initial view. The maximum duration that can be specified for the "from" and "to" dates is 30 days.

:::info
Pagination at the bottom allows navigation through the pages, with each page displaying a maximum of 7 logs.
:::

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/enterprise/audit_logs/filtersnew-v2.png" alt="Audit logs" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Filter Audit Logs

You can apply filters to the audited events based on the following criteria.

#### Select Users

Choose a specific user from the dropdown list to view all their activities.

#### Select Apps

The dropdown will display all the apps associated with your account. Select an app to filter the logs related to that particular app.

#### Select Resources

| <div style={{ width:"100px"}}> Resources </div> | <div style={{ width:"100px"}}> Description </div> |
| ----------- | ----------- |
| User | Filter all the User events like `USER_LOGIN`, `USER_SIGNUP`, `USER_INVITE`, AND `USER_INVITE_REDEEM`. |
| App | Filter all the App events like `APP_CREATE`, `APP_UPDATE`,`APP_VIEW`,`APP_DELETE`,`APP_IMPORT`,`APP_EXPORT`,`APP_CLONE`. |
| Data Query | Filters the events associated with Data Query like `DATA_QUERY_RUN`. |
| Group Permission | All the events associated with Group Permissions will be filtered. Group Permissions include `GROUP_CREATE`, `GROUP_UPDATE`, `GROUP_DELETE`. |
| App Group Permission | Within each group, you can set apps for read or edit privileges. These events get recorded as App Group Permissions. |

#### Select Actions

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"100px"}}> Description </div>|
| ----------- | ----------- |
| USER_LOGIN | This event is recorded everytime a user logins. |
| USER_SIGNUP | This event is recorded everytime a new signup is made. |
| USER_INVITE | You can invite users to your account from `Manage Users` section and an event is audited everytime an invite is sent. |
| USER_INVITE_REDEEM | This event is recorded whenever an invite is redeemed. |
| APP_CREATE | This event is recorded when a user creates a new app. |
| APP_UPDATE | This event is recorded whenever actions like renaming the app, making the app public, editing shareable link, or deploying the app are made. |
| APP_VIEW | This event is logged when someone views the launched app. (public apps aren't accounted for) |
| APP_DELETE | This event is recorded whenever a user deletes an app from the dashboard. |
| APP_IMPORT | This event is recorded whenever a user imports an app. |
| APP_EXPORT | This event is recorded whenever an app is exported. |
| APP_CLONE | This event is recorded whenever a clone of the existing app is created. |
| DATA_QUERY_RUN | This event is logged whenever a data source is added, a query is created, or whenever a query is run either from the query editor or from the launched app. |
| GROUP_PERMISSION_CREATE | This event is recorded whenever a group is created. |
| GROUP_PERMISSION_UPDATE | This event is recorded whenever an app or user is added to or removed from a group, or the permissions for a group are updated. |
| GROUP_PERMISSION_DELETE | This event is recorded whenever a user group is deleted from an account. |
| APP_GROUP_PERMISSION_UPDATE | For every app added in to user group, you can set privileges like `View` or `Edit` and whenever these privileges are updated this event is recorded. By default, the permission of an app for a user group is set to `View`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Understanding Log Information

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/audit_logs/readinglogv2.png" alt="Audit logs" />

</div>

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div>|
| ----------- | ----------- |
| action_type | This indicates the type of action that was logged in the event. Refer to [this](#select-actions) for more information on actions. |
| created_at | Shows the date and time when the event was logged.  |
| id | Each logged event is assigned a unique event ID. |
| ip_address | Displays the IP address from which the event was logged. |
| metadata | The metadata includes two sub-properties: `tooljet_version` and `user_agent`. `tooljet_version` shows the version of ToolJet used for the event, while `user_agent` contains information about the device and browser used. |
| organization_id | Every organization in ToolJet has a unique ID associated with it, which is recorded when an event occurs. |
| resource_id | Different [resources](#select-resources) have their respective IDs associated with them. These IDs are assigned when the resources are created. |
| resource_name | Shows the name of the [resources](#select-resources) that were involved in the logged event. For example, if an app was created or deleted, it will display the name of that app. |
| resource_type | Indicates the type of the [resources](#select-resources) involved in the logged event. |
| user_id | Each user account in ToolJet has a unique ID associated with it, which is recorded when an event occurs. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Log File

The file will contain all the data from audit logs. The log file can be created by specifying the path in the [environment variables](/docs/setup/env-vars). The log file is rotated on a daily basis and is updated dynamically every time a new audit log is generated.

Learn more about **setting up the log file generation** [here](/docs/how-to/setup-rsyslog).

#### Log Rotation

The log file is configured to rotate on a daily basis. This means that a new log file will be created every day, ensuring efficient management and organization of audit data.

#### Log File Path

The path for the log file is defined using the `LOG_FILE_PATH` variable in the environment. It's important to understand that this path is relative to the home directory of the machine. For instance, if `LOG_FILE_PATH` is set to `hsbc/dashboard/log`, the resulting log file path will be structured as follows:
```
homepath/hsbc/dashboard/log/tooljet_log/{process_id}-{date}/audit.log
```
Here, `{process_id}` is a placeholder for the unique process identifier, and `{date}` represents the current date. This structured path ensures that audit logs are organized by both process and date, facilitating easy traceability and analysis.

| <div style={{ width:"100px"}}> Variable </div>| <div style={{ width:"100px"}}> Description </div>                                                                |
| -------- | --------------------------------------------------------------------------- |
| LOG_FILE_PATH | the path where the log file will be created ( eg: tooljet/log/tooljet-audit.log) |

<details>
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

</div>

