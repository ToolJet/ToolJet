---
id: audit_logs
title: Audit logs
---

<div className='badge badge--primary heading-badge'>Available on: Enterprise Edition</div>


The audit log is the report of all the activities done in your ToolJet account. It will capture and display events automatically by recording who performed an activity, what when, and where the activity was performed, along with other information such as IP address.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/audit_logs/auditlogv2.png" alt="Audit logs" />

</div>

### Filter audit logs

Audited events can be filtered using the below characteristics:

#### Select Users

Select a specific user from this dropdown to check all their activities. 

#### Select Apps

The dropdown will list all the apps present in your account. Choose an app to filter the logs associated with that app.

#### Select Resources

| Resources  | description |
| ----------- | ----------- |
| User | Filter all the User events like `USER_LOGIN`, `USER_SIGNUP`, `USER_INVITE`, AND `USER_INVITE_REDEEM`. |
| App | Filter all the App events like `APP_CREATE`, `APP_UPDATE`,`APP_VIEW`,`APP_DELETE`,`APP_IMPORT`,`APP_EXPORT`,`APP_CLONE`. |
| Data Query | Filters the events associated with Data Query like `DATA_QUERY_RUN`. |
| Group Permission | All the events associated with Group Permissions will be filtered. Group Permissions include `GROUP_CREATE`, `GROUP_UPDATE`, `GROUP_DELETE`. |
| App Group Permission | Within each group, you can set apps for read or edit privileges. These events get recorded as App Group Permissions. |

#### Select Actions

| Actions  | description |
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

:::info
It is mandatory to set a Data Range in `From` and `To` to filter audit logs.
:::

### Understanding information from logs

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/audit_logs/readinglogv2.png" alt="Audit logs" />

</div>


| Property  | description |
| ----------- | ----------- |
| action_type | It is the type of action that was logged in this event. Refer [this](#select-actions) to know about actions. |
| created_at | Displays the date and time of a logged event.  |
| id | Every event logged has a specific event id associated with it. |
| ip_address | Displays the IP address from where the event was logged. |
| metadata | Metadata includes two sub-properties - `tooljet_version` and `user_agent`. `tooljet_version` displays the version of ToolJet used for the logged event and `user_agent` contains information about the device and browser used for that event. |
| organization_id | Every organization in ToolJet has an id associated with it and is recorded when an event occurs. |
| resource_id | There are several [resources](#select-resources) and for each resource that is created, an id gets associated with it.|
| resource_name | Displays the name of the [resources](#select-resources) that were logged in the event. For example, if an app was created or deleted then it will display the name of the app. |
| resource_type | Displays the type of the [resources](#select-resources) that were logged in the event. |
| user_id | Every user account in ToolJet has an id associated with it and is recorded when an event occurs. |
