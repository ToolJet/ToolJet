---
id: chat
title: Chat
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Chat** component is a message thread with an input box, for building assistants, support chats or AI helpers. When the user sends a message, run a query in **On message sent** and add the reply with **Append history**.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Chat title | Title shown at the top of the chat. | Text. Default: `Chat` |
| Initial chat | Messages the chat starts with. Each is an object with `message`, `messageId`, `timestamp`, `name`, `avatar` and `type` (`message`, `response` or `error`). Changing it replaces the history. | Array |
| User name | Name shown on the user's messages. | Text. Default: `You` |
| User avatar | Image URL for the user's avatar. Without one, the user's initials are shown. | Text |
| Respondent name | Name shown on replies. | Text. Default: `Assistant` |
| Respondent avatar | Image URL for the respondent's avatar. Without one, the respondent's initials are shown. | Text |
| Placeholder for input field | Hint text shown in the empty message box. | Text. Default: `Ask me anything!` |
| Empty chat text | Text shown when the chat has no messages. | Text. Default: `Start the conversation` |
| Disable input state | Stops the user from typing or sending messages. | On or off. Default: Off |
| History loading state | Shows placeholder messages while the history loads. | On or off. Default: Off |
| Response loading state | Shows a typing indicator from the respondent and blocks sending until it is turned off. | On or off. Default: Off |
| Enable clear history icon | Shows a button in the header that clears the history. | On or off. Default: On |
| Enable download history icon | Shows a button in the header that downloads the history as a JSON file. | On or off. Default: On |
| Show avatars | Shows avatars next to messages. | On or off. Default: On |
| Show timestamps | Shows the time next to each sender's name. | On or off. Default: On |

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
| On message sent | Triggers when the user sends a message. |
| On history cleared | Triggers when the user clears the history with the header button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Append history | Adds **Message** to the history. Plain text is added as a reply; an object can set its own `type`. | `components.chat1.appendHistory("{{{}}}")` |
| Clear history | Resets the history to **Initial chat** without firing **On history cleared**. | `components.chat1.clearHistory()` |
| Download chat | Downloads the history as a JSON file. | `components.chat1.downloadChat()` |
| Send message | Adds **Message** to the history as a message from the user, without firing **On message sent**. | `components.chat1.sendMessage("{{{}}}")` |
| Set error | Shows **Error** as an error message at the end of the chat. The next message added clears it. | `components.chat1.setError("")` |
| Set history | Replaces the whole history with **History**, a list of message objects. | `components.chat1.setHistory("{{[]}}")` |
| Set history loading | Turns the history loading placeholders on or off. | `components.chat1.setHistoryLoading("{{false}}")` |
| Set input disable | Turns off, or back on, the user's ability to type and send messages. | `components.chat1.setInputDisable("{{false}}")` |
| Set respondent avatar | Changes the respondent's avatar to the image URL in **Avatar**. | `components.chat1.setResponderAvatar("")` |
| Set response loading | Turns the respondent's typing indicator on or off. | `components.chat1.setResponseLoading("{{false}}")` |
| Set user avatar | Changes the user's avatar to the image URL in **Avatar**. | `components.chat1.setUserAvatar("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.chat1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.chat1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.chat1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `chatTitle` | Title shown at the top of the chat. | `{{components.chat1.chatTitle}}` |
| `initialChat` | Messages the chat starts with. Each is an object with `message`, `messageId`, `timestamp`, `name`, `avatar` and `type` (`message`, `response` or `error`). Changing it replaces the history. | `{{components.chat1.initialChat}}` |
| `userName` | Name shown on the user's messages. | `{{components.chat1.userName}}` |
| `userAvatar` | Image URL for the user's avatar. Without one, the user's initials are shown. | `{{components.chat1.userAvatar}}` |
| `respondentName` | Name shown on replies. | `{{components.chat1.respondentName}}` |
| `respondentAvatar` | Image URL for the respondent's avatar. Without one, the respondent's initials are shown. | `{{components.chat1.respondentAvatar}}` |
| `placeholder` | Hint text shown in the empty message box. | `{{components.chat1.placeholder}}` |
| `emptyText` | Text shown when the chat has no messages. | `{{components.chat1.emptyText}}` |
| `disableInput` | Stops the user from typing or sending messages. | `{{components.chat1.disableInput}}` |
| `loadingHistory` | Shows placeholder messages while the history loads. | `{{components.chat1.loadingHistory}}` |
| `loadingResponse` | Shows a typing indicator from the respondent and blocks sending until it is turned off. | `{{components.chat1.loadingResponse}}` |
| `enableClearHistoryButton` | Shows a button in the header that clears the history. | `{{components.chat1.enableClearHistoryButton}}` |
| `enableDownloadHistoryButton` | Shows a button in the header that downloads the history as a JSON file. | `{{components.chat1.enableDownloadHistoryButton}}` |
| `showAvatars` | Shows avatars next to messages. | `{{components.chat1.showAvatars}}` |
| `showTimestamps` | Shows the time next to each sender's name. | `{{components.chat1.showTimestamps}}` |
| `history` | All messages in the chat, in order. | `{{components.chat1.history}}` |
| `isHistoryLoading` | `true` while the history loading placeholders are shown. | `{{components.chat1.isHistoryLoading}}` |
| `isInputDisabled` | `true` while the user cannot type or send messages. | `{{components.chat1.isInputDisabled}}` |
| `isResponseLoading` | `true` while the typing indicator is shown. | `{{components.chat1.isResponseLoading}}` |
| `lastMessage` | The last message from the user. Use `lastMessage.message` to send its text to a query. | `{{components.chat1.lastMessage}}` |
| `lastResponse` | The last reply added with **Append history**. | `{{components.chat1.lastResponse}}` |
| `isVisible` | Whether the component is visible. | `{{components.chat1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.chat1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.chat1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | Theme: Surface 1 |
| Border | Theme: Default border |
| Border radius | — |
| Accent (your messages, send button, focus) | Theme: Brand primary |
| Reply bubble background | Theme: Surface 3 |
| Name color | Theme: Primary text |
| Message text color | Theme: Primary text |
| Timestamp color | Theme: Placeholder text |
| Input background | Theme: Surface 1 |
| Input border | Theme: Default border |
| Input text color | Theme: Primary text |
| Send icon color | Theme: Surface 1 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
