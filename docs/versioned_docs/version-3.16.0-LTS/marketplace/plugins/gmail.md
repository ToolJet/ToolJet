---
id: marketplace-plugin-gmail
title: Gmail
---

The Gmail plugin lets you connect your Gmail account to ToolJet apps to send, read, and manage emails within your ToolJet application.

## Connection

You will need the following credential to connect with Gmail:
- **Client ID**
- **Client Secret**

These credentials are used to authenticate via OAuth2 and access Gmail data securely. You can generate the required credentials from the [Google Cloud Console](https://console.cloud.google.com/).

You can toggle on **Authentication required for all users** in the configuration. When enabled, users will be redirected to the OAuth consent screen the first time a query from this data source is triggered in the application. This ensures each user connects their own Gmail account securely.

Note: After completing the OAuth flow, the query must be triggered again to load the data.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/gmail/connection.png" alt="Gmail Configuration" />

## Supported Operations

### User Info

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/profile` | Get user profile information |

### Messages

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/messages` | List messages |
| POST   | `/gmail/v1/users/{userId}/messages` | Create a message |
| GET    | `/gmail/v1/users/{userId}/messages/{messageId}` | Get a specific message |
| DELETE | `/gmail/v1/users/{userId}/messages/{messageId}` | Delete a message |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/modify` | Modify message labels |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/trash` | Move message to trash  |
| POST   | `/gmail/v1/users/{userId}/messages/{messageId}/untrash` | Remove message from trash |
| POST   | `/gmail/v1/users/{userId}/messages/send` | Send a message |
| POST   | `/gmail/v1/users/{userId}/messages/batchDelete` | Delete multiple messages |
| POST   | `/gmail/v1/users/{userId}/messages/batchModify` | Modify labels on multiple messages |
| GET    | `/gmail/v1/users/{userId}/messages/{messageId}/attachments/{attachmentId}` | Get message attachment |

### Threads

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/threads` | List threads |
| GET    | `/gmail/v1/users/{userId}/threads/{threadId}` | Get a specific thread |
| DELETE | `/gmail/v1/users/{userId}/threads/{threadId}` | Delete a thread |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/modify`  | Modify thread labels |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/trash`   | Move thread to trash |
| POST   | `/gmail/v1/users/{userId}/threads/{threadId}/untrash` | Remove thread from trash |

### Drafts

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/drafts` | List drafts |
| POST   | `/gmail/v1/users/{userId}/drafts` | Create a draft |
| GET    | `/gmail/v1/users/{userId}/drafts/{draftId}` | Get a specific draft |
| PUT    | `/gmail/v1/users/{userId}/drafts/{draftId}` | Update a draft |
| DELETE | `/gmail/v1/users/{userId}/drafts/{draftId}` | Delete a draft |
| POST   | `/gmail/v1/users/{userId}/drafts/send` | Send a draft |

### Labels

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/labels` | List labels |
| POST   | `/gmail/v1/users/{userId}/labels` | Create a label |
| GET    | `/gmail/v1/users/{userId}/labels/{labelId}` | Get a specific label |
| PUT    | `/gmail/v1/users/{userId}/labels/{labelId}` | Update a label |
| PATCH  | `/gmail/v1/users/{userId}/labels/{labelId}` | Partially update a label |
| DELETE | `/gmail/v1/users/{userId}/labels/{labelId}` | Delete a label |

### Watch and History

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/gmail/v1/users/{userId}/history` | Get mailbox history |
| POST   | `/gmail/v1/users/{userId}/watch` | Start push notifications |
| POST   | `/gmail/v1/users/{userId}/stop` | Stop push notifications  |
