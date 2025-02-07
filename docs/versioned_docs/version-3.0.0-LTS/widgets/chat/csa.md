---
id: csa
title: Component Specific Actions & Exposed Variables
---

This guide covers component-specific actions for the chat component and its exposed variables. To learn how to build a chatbot, refer to the [Chat Component Overview](/docs/widgets/chat/) guide. For more information on Chat Component Properties, check out the [Properties](/docs/widgets/chat/properties) guide.

## Component Specific Actions (CSA)

| <div style={{ width:'170px' }}> Action </div> | <div style={{ width:'200px' }}> Description </div> | How to Access |
|--------|-------------|---------------|
| sendMessage( ) | Sends a message in the chat. | Employ a RunJS query (for e.g. `components.chat1.sendMessage({message: "Hey! How can I help you?", type: "response"})`) or trigger it using an event. |
| clearHistory( ) | Clear chat history. | Employ a RunJS query (for e.g. `components.chat1.clearHistory()`) or trigger it using an event. |
| deleteMessage( ) | Delete a message using the MessageID | Employ a RunJS query (for e.g. `components.chat1.deleteMessage(MessageID)`) or trigger it using an event. |
| downloadChat( ) | Download the chat in JSON format. | Employ a RunJS query (for e.g. `components.chat1.downloadChat()`) or trigger it using an event. |
| setHistory( ) | Sets the chat history. | Employ a RunJS query (for e.g. `components.chat1.setHistory(History Object)`) or trigger it using an event. |
| appendHistory( ) | Appends chat history. | Employ a RunJS query (for e.g. `components.chat1.appendHistory(Message Object)`) or trigger it using an event. |
| setResponderAvatar( ) | Sets Responder's Avatar. | Employ a RunJS query (for e.g. `components.chat1.setResponderAvatar(Image URL)`) or trigger it using an event. |
| setUserAvatar( ) | Sets User's Avatar. | Employ a RunJS query (for e.g. `components.chat1.setUserAvatar(Image URL)`) or trigger it using an event. |

## Exposed Variables

| Variable | <div style={{ width:'200px' }}> Description </div> | How to Access |
|----------|-------------|---------------|
| history | Access the chat history. | Accessible dynamically with JS (for e.g., `{{components.chat1.history}}`). |
| isHistoryLoading | Indicates if the history is loading. | Accessible dynamically with JS (for e.g., `{{components.chat1.isHistoryLoading}}`). |
| isResponseLoading | Indicates if the response is loading. | Accessible dynamically with JS (for e.g., `{{components.chat1.isResponseLoading}}`). |
| isInputDisabled | Indicates if the input is disabled. | Accessible dynamically with JS (for e.g., `{{components.chat1.isInputDisabled}}`). |
| isVisible | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.chat1.isVisible}}`). |
| lastMessage | Holds the last message sent by the user. | Accessible dynamically with JS (for e.g., `{{components.chat1.lastMessage.message}}`). |
| lastResponse | Holds the last response sent by the responder. | Accessible dynamically with JS (for e.g., `{{components.chat1.lastResponse.message}}`). |
