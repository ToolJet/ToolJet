---
id: marketplace-plugin-microsoft_graph
title: Microsoft Graph
---

By integrating Microsoft Graph with ToolJet, you can interact with Microsoft 365 services such as Outlook Mail, Calendar, Users, and OneDrive.

## Connection

To connect ToolJet with Microsoft Graph, you’ll need the following credentials:

- Tenant
- Access token URL
- Client ID
- Client secret

Follow this [Microsoft guide](https://learn.microsoft.com/en-us/graph/auth-register-app-v2) to register an app and generate the required credentials.

You can enable the **Authentication required for all users** toggle in the configuration panel. When enabled, each user will be redirected to the OAuth consent screen the first time a query from this data source is triggered in your application. This ensures that every user connects with their own Microsoft account securely.

**Note**: After completing the OAuth flow, the query must be triggered again to fetch data from Microsoft Graph.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/microsoft-graph/connection.png" alt="Microsoft Graph Configuration" />

## Supported Operations

### Outlook

#### Messages 

| Method | Endpoint                                   | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| GET    | `/me/messages`                             | List messages in the user's mailbox. |
| POST   | `/me/messages`                             | Create a new draft message.          |
| GET    | `/me/messages/{message-id}`                | Get a specific message by ID.        |
| PATCH  | `/me/messages/{message-id}`                | Update a message.                    |
| DELETE | `/me/messages/{message-id}`                | Delete a message.                    |
| POST   | `/me/messages/{message-id}/forward`        | Forward an existing message.         |
| POST   | `/me/messages/{message-id}/createForward`  | Create a forward draft.              |
| POST   | `/me/messages/{message-id}/reply`          | Reply to a message.                  |
| POST   | `/me/messages/{message-id}/createReply`    | Create a reply draft.                |
| POST   | `/me/messages/{message-id}/replyAll`       | Reply all to a message.              |
| POST   | `/me/messages/{message-id}/createReplyAll` | Create a reply-all draft.            |
| POST   | `/me/messages/{message-id}/send`           | Send a draft message.                |
| POST   | `/me/messages/{message-id}/move`           | Move a message.                      |
| POST   | `/me/messages/{message-id}/copy`           | Copy a message.                      |
| POST   | `/me/sendMail`                             | Send mail without creating a draft.  |

#### Mail Folders

| Method | Endpoint                                         | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/me/mailFolders`                                | List mail folders.                    |
| POST   | `/me/mailFolders`                                | Create a mail folder.                 |
| GET    | `/me/mailFolders/{mailFolder-id}`                | Get specific mail folder.             |
| PATCH  | `/me/mailFolders/{mailFolder-id}`                | Update a mail folder.                 |
| DELETE | `/me/mailFolders/{mailFolder-id}`                | Delete a mail folder.                 |
| GET    | `/me/mailFolders/{mailFolder-id}/messages`       | List messages inside a folder.        |
| GET    | `/me/mailFolders/Inbox/messages/delta`           | Track changes to inbox messages.      |
| GET    | `/me/mailFolders/{mailFolder-id}/messages/delta` | Track changes to a folder's messages. |
| GET    | `/me/mailFolders/delta`                          | Track changes to all folders.         |

#### Categories and Rooms

| Method | API Endpoint                                        | Description             |
| ------ | --------------------------------------------------- | ----------------------- |
| GET    | `/me/outlook/masterCategories`                      | List master categories  |
| POST   | `/me/outlook/masterCategories`                      | Create a new category   |
| GET    | `/me/outlook/masterCategories/{outlookCategory-id}` | Get a specific category |
| PATCH  | `/me/outlook/masterCategories/{outlookCategory-id}` | Update a category       |
| DELETE | `/me/outlook/masterCategories/{outlookCategory-id}` | Delete a category       |
| GET    | `/me/findRooms`                                     | List available rooms    |
| GET    | `/me/findRooms(RoomList='{roomList-emailAddress}')` | Find rooms by room list |
| GET    | `/me/findRoomLists`                                 | List room lists         |

### Calendar

#### Default Calendar

| Method | API Endpoint                                      | Description                           |
| ------ | ------------------------------------------------- | ------------------------------------- |
| GET    | `/me/calendar`                                    | Get default calendar                  |
| PATCH  | `/me/calendar`                                    | Update default calendar               |
| GET    | `/me/calendar/events`                             | List events from default calendar     |
| POST   | `/me/calendar/events`                             | Create an event in default calendar   |
| GET    | `/me/calendar/calendarPermissions`                | List calendar permissions             |
| POST   | `/me/calendar/calendarPermissions`                | Grant permissions to default calendar |
| GET    | `/me/calendar/calendarPermissions/{permissionId}` | Get specific calendar permission      |
| PATCH  | `/me/calendar/calendarPermissions/{permissionId}` | Update calendar permission            |
| DELETE | `/me/calendar/calendarPermissions/{permissionId}` | Delete calendar permission            |
| POST   | `/me/calendar/getSchedule`                        | Get free/busy schedule info           |

#### User Calendars and Groups

| Method | API Endpoint                             | Description                             |
| ------ | ---------------------------------------- | --------------------------------------- |
| GET    | `/user/{userId}/calendar`                | Get default calendar of a specific user |
| GET    | `/me/calendars`                          | List user calendars                     |
| POST   | `/me/calendars`                          | Create a new calendar                   |
| GET    | `/me/calendars/{calendarId}`             | Get a specific calendar                 |
| PATCH  | `/me/calendars/{calendarId}`             | Update a calendar                       |
| DELETE | `/me/calendars/{calendarId}`             | Delete a calendar                       |
| GET    | `/me/calendars/{calendarId}/events`      | List events in a specific calendar      |
| POST   | `/me/calendars/{calendarId}/events`      | Create event in a specific calendar     |
| GET    | `/me/calendarGroups`                     | List calendar groups                    |
| POST   | `/me/calendarGroups`                     | Create a calendar group                 |
| GET    | `/me/calendarGroups/{groupId}/calendars` | Get calendars in a group                |
| POST   | `/me/calendarGroups/{groupId}/calendars` | Add calendar to a group                 |

#### Events

| Method | API Endpoint                       | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/me/events/{eventId}`             | Get an event by ID                  |
| PATCH  | `/me/events/{eventId}`             | Update an event                     |
| DELETE | `/me/events/{eventId}`             | Delete an event                     |
| GET    | `/me/events/{eventId}/instances`   | List instances of a recurring event |
| GET    | `/me/events/{eventId}/attachments` | List attachments of an event        |
| POST   | `/me/events/{eventId}/attachments` | Add attachments to an event         |
| GET    | `/me/calendarView`                 | Get calendar view of events         |
| POST   | `/me/findMeetingTimes`             | Find meeting times                  |

### Users

#### User Management

| Method | API Endpoint       | Description            |
| ------ | ------------------ | ---------------------- |
| GET    | `/users`           | List all users         |
| POST   | `/users`           | Create a user          |
| GET    | `/users/{user-id}` | Get a specific user    |
| PATCH  | `/users/{user-id}` | Update a specific user |
| DELETE | `/users/{user-id}` | Delete a specific user |

#### Profile

| Method | API Endpoint | Description                      |
| ------ | ------------ | -------------------------------- |
| GET    | `/me`        | Get profile of signed-in user    |
| PATCH  | `/me`        | Update profile of signed-in user |

### Teams

#### Teams and Chats

| Method | API Endpoint      | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | `/teams`          | List teams                     |
| POST   | `/teams`          | Create a team                  |
| GET    | `/chats`          | List chats                     |
| POST   | `/chats`          | Create a chat                  |
| GET    | `/me/joinedTeams` | List teams the user has joined |

#### Chat Operations

| Method | API Endpoint                                       | Description                      |
| ------ | -------------------------------------------------- | -------------------------------- |
| GET    | `/chats/{chat-id}`                                 | Get a chat                       |
| PATCH  | `/chats/{chat-id}`                                 | Update a chat                    |
| DELETE | `/chats/{chat-id}`                                 | Delete a chat                    |
| GET    | `/chats/{chat-id}/members`                         | List members in a chat           |
| POST   | `/chats/{chat-id}/members`                         | Add members to a chat            |
| POST   | `/chats/{chat-id}/members/add`                     | Add members (alternate endpoint) |
| GET    | `/chats/{chat-id}/members/{conversationMember-id}` | Get chat member details          |
| PATCH  | `/chats/{chat-id}/members/{conversationMember-id}` | Update chat member               |
| DELETE | `/chats/{chat-id}/members/{conversationMember-id}` | Remove chat member               |
| GET    | `/chats/{chat-id}/messages`                        | List messages in a chat          |
| POST   | `/chats/{chat-id}/messages`                        | Send message in a chat           |
| GET    | `/chats/{chat-id}/messages/{chatMessage-id}`       | Get a specific chat message      |
| PATCH  | `/chats/{chat-id}/messages/{chatMessage-id}`       | Update a chat message            |
| DELETE | `/chats/{chat-id}/messages/{chatMessage-id}`       | Delete a chat message            |
| GET    | `/chats/getAllMessages`                            | Get all messages across chats    |

#### Team Operation

| Method | API Endpoint                   | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/teams/{team-id}`             | Get a team                       |
| PATCH  | `/teams/{team-id}`             | Update a team                    |
| DELETE | `/teams/{team-id}`             | Delete a team                    |
| POST   | `/teams/{team-id}/archive`     | Archive a team                   |
| POST   | `/teams/{team-id}/unarchive`   | Unarchive a team                 |
| GET    | `/teams/{team-id}/members`     | List team members                |
| POST   | `/teams/{team-id}/members`     | Add team members                 |
| POST   | `/teams/{team-id}/members/add` | Add members (alternate endpoint) |

#### Channels and Messages 

| Method | API Endpoint                                                       | Description                             |
| ------ | ------------------------------------------------------------------ | --------------------------------------- |
| GET    | `/teams/{team-id}/allChannels`                                     | List all channels in a team             |
| GET    | `/teams/{team-id}/channels`                                        | List standard channels in a team        |
| POST   | `/teams/{team-id}/channels`                                        | Create a channel in a team              |
| GET    | `/teams/{team-id}/channels/{channel-id}`                           | Get channel details                     |
| PATCH  | `/teams/{team-id}/channels/{channel-id}`                           | Update a channel                        |
| DELETE | `/teams/{team-id}/channels/{channel-id}`                           | Delete a channel                        |
| GET    | `/teams/{team-id}/channels/{channel-id}/members`                   | List members in a channel               |
| POST   | `/teams/{team-id}/channels/{channel-id}/members`                   | Add members to a channel                |
| GET    | `/teams/{team-id}/channels/{channel-id}/messages`                  | List messages in a channel              |
| POST   | `/teams/{team-id}/channels/{channel-id}/messages`                  | Send message in a channel               |
| GET    | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Get a specific channel message          |
| PATCH  | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Update a channel message                |
| DELETE | `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | Delete a channel message                |
| GET    | `/teams/{team-id}/allChannels/{channel-id}`                        | Get specific channel under all channels |

### OneDrive

#### Root and Shared Content

| Method | API Endpoint                                | Description                         |
| ------ | ------------------------------------------- | ----------------------------------- |
| GET    | `/me/drive/root/children`                   | List items in root folder           |
| POST   | `/me/drive/root/children`                   | Create a new file or folder in root |
| GET    | `/me/drive/recent`                          | List recent files                   |
| GET    | `/me/drive/sharedWithMe`                    | List files shared with the user     |
| GET    | `/me/drive/root/search(q='{search-query}')` | Search files by query               |

#### Specific Drives and Items

| Method | API Endpoint                                     | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/drives/{drive-id}/root/children`               | List items in a specific drive's root |
| GET    | `/drives/{drive-id}/items/{item-id}/children`    | List children of a folder             |
| POST   | `/drives/{drive-id}/items/{item-id}/children`    | Add item to folder                    |
| GET    | `/drives/{drive-id}/items/{item-id}`             | Get metadata for an item              |
| PATCH  | `/drives/{drive-id}/items/{item-id}`             | Update metadata of an item            |
| DELETE | `/drives/{drive-id}/items/{item-id}`             | Delete an item                        |
| GET    | `/drives/{drive-id}/items/{item-id}/content`     | Download file content                 |
| PUT    | `/drives/{drive-id}/items/{item-id}/content`     | Upload file content                   |
| POST   | `/drives/{drive-id}/items/{item-id}/createLink`  | Create sharing link                   |
| GET    | `/drives/{drive-id}/items/{item-id}/permissions` | Get item permissions                  |
