---
id: marketplace-plugin-googlecalendar
title: Google Calendar
---

ToolJet can connect to Google Calendar to fetch, create, update, and delete calendar events directly from your ToolJet application.

## Connection

You will need the following credential to connect with Google Calendar:
 - **Client ID**
 - **Client Secret**

These credentials are used to authenticate via OAuth2 and access calendar data securely. You can review all available permission scopes [here](https://developers.google.com/workspace/calendar/api/auth).

You can toggle on **Authentication required for all users** in the configuration. When enabled, users will be redirected to the OAuth consent screen the first time a query from this data source is triggered in the application. This ensures each user connects their own Google Calendar account securely.

Note: After completing the OAuth flow, the query must be triggered again to load the data.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/googlecal/connection.png" alt="Hugging Face Configuration" />

### Generating Client ID and Client Secret


1. Go to **[Google Cloud console](https://console.cloud.google.com/)** and create a project.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/gc-new-project.png" alt="Create New Project"/>
2. Go to the **[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials)**, and create an OAuth client ID.
    <img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/create-oauth.png" alt="General Settings: SSO"/>
3. You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.
    <img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/oauth-type.png" alt="General Settings: SSO"/>
4. After configuring the consent screen you will be redirected to OAuth overview page, click on **Create OAuth client**.
5. Then on the Clients page, select the Application type as **Web application**, and give it a name, under Authorised JavaScript origins, set the domain on which ToolJet is hosted and under Authorized redirect URIs, enter the Redirect URL which was generated in ToolJet's data source configuration page.
    <img className="screenshot-full img-l"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/clients.png" alt="General Settings: SSO"/>
6. Click on **Create** and copy the **Client ID** and **Client Secret**.
    <img className="screenshot-full img-full"  style={{ marginTop: '15px' }} src="/img/marketplace/plugins/googlecal/client-id.png" alt="General Settings: SSO"/>

## Supported Operations

### Calendars

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}` | Get calendar details. |
| PUT | `/calendars/{calendarID}` | Update a calendar. |
| DELETE | `/calendars/{calendarID}` | Delete a calendar. |
| POST | `/calendars` | Create a calendar. |
| GET | `/users/me/calendarList` | List calendars accessible to the user. |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}/events` | List events. |
| POST | `/calendars/{calendarID}/events` | Create an event. |
| GET | `/calendars/{calendarID}/events/{eventID}` | Get event details. |
| PUT | `/calendars/{calendarID}/events/{eventID}` | Update an event. |
| DELETE | `/calendars/{calendarID}/events/{eventID}` | Delete an event. |
| POST | `/calendars/{calendarID}/events/quickAdd` | Quick add event. |

### Access Control (ACL)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars/{calendarID}/acl` | List access control rules. |
| POST | `/calendars/{calendarID}/acl` | Create an access control rule. |
| GET | `/calendars/{calendarID}/acl/{ruleID}` | Get an access control rule. |
| PUT | `/calendars/{calendarID}/acl/{ruleID}` | Update an access control rule. |
| DELETE | `/calendars/{calendarID}/acl/{ruleID}` | Delete an access control rule. |

### Free/Busy

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/freeBusy` | Query free/busy information. |