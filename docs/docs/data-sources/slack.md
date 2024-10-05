---
id: slack
title: Slack
---

# Slack

ToolJet can connect to your Slack workspace to send messages. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/connect.png" alt="Slack datasource: ToolJet"/>

</div>

## Connection
- To add the Slack datasource, click the **Datasource manager** icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select Slack from the modal that pops up.
 
- In the next dialog, you'll be asked to choose the **permission scope**. Choose the permission scope and then click on **Connect to Slack** button.

- A new tab will open up asking for authorization confirmation. Once done, you can close the tab.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/authorize.png" alt="Slack datasource: ToolJet"/>

</div>

- Click on the '**Save data source** button to save the data source.


:::note
The App (which credentials are provided) needs to be installed in the workspace to use the Slack data source, and it needs to be added to the channel where you want to post the message.
:::

## Supported operations

1. **List members**
2. **Send message**
3. **List messages from a channel**
4. **Get Conversation Details**

### List members

This operation will return the data of all the members in your slack workspace.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/listmembers.png" alt="Slack datasource: ToolJet"/>

</div>

### Send message

This operation will send/post the message to a specified channel or posting to direct messages (also known as DMs or IMs) in your slack workspace.

| Property | Description |
| :--- | :--- |
| Channel | The channel ID or user ID to post the message to. |
| Message | The message to post. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/sendmessage.png" alt="Slack datasource: ToolJet"/>

</div>

### List messages

This operation will get the messages from a specified channel.

| Property | Description                             |
| :--- |:----------------------------------------|
| Channel | The channel ID to get the messages from |
| Limit | The maximum number of messages to return. |
| Next Cursor | A cursor value returned by a previous call to list messages. |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/listmessages.png" alt="Slack datasource: ToolJet"/>

</div>

### Get Conversation Details:

This operation retrieves detailed information about a specific conversation in Slack.

| Property | Description |
| :------- | :---------- |
| `conversationId` | The unique ID of the conversation to retrieve details for. |

**Response:**

| Property | Description |
| :------- | :---------- |
| `id` | The unique ID of the conversation. |
| `name` | The name of the conversation. |
| `type` | The type of conversation (Channel or Group). |
| `num_members` | The number of members in the conversation. |
| `created` | The timestamp when the conversation was created (formatted as a date string). |
| `is_archived` | Indicates whether the conversation is archived (true) or not (false). |
| `is_general` | Indicates whether the conversation is the general channel (true) or not (false). |
| `purpose` | The purpose of the conversation, if specified, or "Not specified" if not available. |
| `topic` | The topic of the conversation, if specified, or "Not specified" if not available. |
| `last_read` | The timestamp of the last read message in the conversation. |
| `unlinked` | The number of unlinked members in the conversation. |
| `parent_conversation` | The ID of the parent conversation, if any, or "None" if not applicable. |
| `creator` | The user ID of the conversation creator. |
| `is_shared` | Indicates whether the conversation is shared (true) or not (false). |
| `is_org_shared` | Indicates whether the conversation is shared within the organization (true) or not (false). |
| `shared_team_ids` | An array of team IDs with which the conversation is shared. |
| `pending_shared` | An array of pending shared members. |
| `context_team_id` | The ID of the context team. |

