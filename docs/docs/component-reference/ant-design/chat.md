---
id: chat
title: Chat
---

<div className="badge badge--primary">Ant Design</div>

The **Chat** component shows a conversation between the user and a respondent, such as an AI assistant or a support agent, with a box for typing messages. Your app sends each message to a query and adds the reply with the **Append to history** action.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading at the top of the chat. | Text. Default: `Assistant` |
| History | Messages shown when the app loads, as a list of `{message, type}`, where `type` is `message` for the user and `response` for the respondent. | Array |
| User name | Name shown on the user's messages. | Text. Default: `You` |
| User avatar | Image URL of the user's avatar. When empty, the avatar shows the initials of **User name**. | Text |
| Respondent name | Name shown on the respondent's messages. | Text. Default: `Assistant` |
| Respondent avatar | Image URL of the respondent's avatar. When empty, the avatar shows the initials of **Respondent name**. | Text |
| Placeholder | Hint shown in the message box while it is empty. | Text. Default: `Type a message` |
| Empty text | Message shown when the chat has no messages. | Text. Default: `No messages yet` |
| Show avatars | Shows an avatar beside each group of messages. | On or off. Default: On |
| Show timestamps | Shows the time each message was sent. | On or off. Default: On |
| Clear button | Shows a button in the header that clears all messages. | On or off. Default: Off |
| Download button | Shows a button in the header that downloads the conversation as a JSON file. | On or off. Default: Off |
| Response loading | Shows typing dots from the respondent, while a reply is on its way. | On or off. Default: Off |
| History loading | Shows a spinner in place of the messages, while past messages load. | On or off. Default: Off |
| Input disabled | Stops the user from typing and sending messages. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On message sent | Triggers when the user sends a message, by pressing Enter or the send button, or when the **Send message** action runs. |
| On clear history | Triggers when the messages are cleared, by the clear button or the **Clear history** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Send message | Sends the given **Message** as the user and fires **On message sent**. | `components.chat1.sendMessage("")` |
| Append to history | Adds one or more messages to the conversation, as text or `{message, type}`. Plain text is added as a respondent's reply. | `components.chat1.appendHistory("")` |
| Set history | Replaces the whole conversation with the given **History**, a list of `{message, type}`. | `components.chat1.setHistory("")` |
| Clear history | Removes all messages and fires **On clear history**. | `components.chat1.clearHistory()` |
| Download chat | Downloads the conversation as a JSON file. | `components.chat1.downloadChat()` |
| Set response loading | Shows or hides the respondent's typing dots. | `components.chat1.setResponseLoading("")` |
| Set history loading | Shows or hides the loading spinner in place of the messages. | `components.chat1.setHistoryLoading("")` |
| Disable input | Turns the message box off or on. | `components.chat1.setInputDisable("")` |
| Set user avatar | Changes the user's avatar to the image at the given **Avatar URL**. | `components.chat1.setUserAvatar("")` |
| Set respondent avatar | Changes the respondent's avatar to the image at the given **Avatar URL**. | `components.chat1.setResponderAvatar("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.chat1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.chat1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.chat1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Heading at the top of the chat. | `{{components.chat1.title}}` |
| `initialChat` | Messages shown when the app loads, as a list of `{message, type}`, where `type` is `message` for the user and `response` for the respondent. | `{{components.chat1.initialChat}}` |
| `userName` | Name shown on the user's messages. | `{{components.chat1.userName}}` |
| `userAvatar` | Image URL of the user's avatar. When empty, the avatar shows the initials of **User name**. | `{{components.chat1.userAvatar}}` |
| `respondentName` | Name shown on the respondent's messages. | `{{components.chat1.respondentName}}` |
| `respondentAvatar` | Image URL of the respondent's avatar. When empty, the avatar shows the initials of **Respondent name**. | `{{components.chat1.respondentAvatar}}` |
| `placeholder` | Hint shown in the message box while it is empty. | `{{components.chat1.placeholder}}` |
| `emptyText` | Message shown when the chat has no messages. | `{{components.chat1.emptyText}}` |
| `showAvatars` | Shows an avatar beside each group of messages. | `{{components.chat1.showAvatars}}` |
| `showTimestamps` | Shows the time each message was sent. | `{{components.chat1.showTimestamps}}` |
| `allowClear` | Shows a button in the header that clears all messages. | `{{components.chat1.allowClear}}` |
| `allowDownload` | Shows a button in the header that downloads the conversation as a JSON file. | `{{components.chat1.allowDownload}}` |
| `responseLoading` | Shows typing dots from the respondent, while a reply is on its way. | `{{components.chat1.responseLoading}}` |
| `historyLoading` | Shows a spinner in place of the messages, while past messages load. | `{{components.chat1.historyLoading}}` |
| `inputDisabled` | Stops the user from typing and sending messages. | `{{components.chat1.inputDisabled}}` |
| `history` | All messages in the conversation, each with `message`, `type`, `name`, `avatar` and `timestamp`. | `{{components.chat1.history}}` |
| `lastMessage` | The last message the user sent. | `{{components.chat1.lastMessage}}` |
| `lastResponse` | The last respondent message added to the conversation. | `{{components.chat1.lastResponse}}` |
| `isVisible` | Whether the component is visible. | `{{components.chat1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.chat1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.chat1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
