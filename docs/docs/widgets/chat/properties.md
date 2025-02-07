---
id: properties
title: Properties
---

The **Chat Component** can be customized by setting different properties or performing actions by adding events. To learn how to build a chatbot, refer to the [Chat Component Overview](#) guide. For more information on CSAs and Exposed Variables, check out the [Component Specific Actions](#) guide.

## Properties

| Property | Description | Expected Value |
|----------|-------------|--------------- |
| Chat Title | Title of the chat component. | String (e.g. ToolJet Support Chatbot) |
| Initial Chat | Initial messages to be loaded when the chat starts. | Array of Objects ( e.g. `{{[ { message: 'Hey! Welcome to ToolJet. How may I help you?' } ]}}` ) |
| User Name | Defines the user's name. | String (e.g. John Doe) |
| User Avatar | Defines the user's avatar. | Image URL |
| Respondent Name | Defines the respondent's name. | String (e.g. ToolJet Bot) |
| Respondent Avatar | Defines the respondent's avatar. | Image URL |

## Message Object Properties

| Property | Description | Required | Expected Value |
|----------|-------------|----------|----------------|
| Message | The content of the message. | ✅ | String (e.g. "Hey! How can I help you?") |
| Message ID | ID of the message. | Auto-generated | String (e.g. "e3dd6f60-d5e8-46c5-b73b-006f2f4a34f2") |
| Timestamp | Date and Time of the message. | Auto-generated | DateTime in ISO 8601 format (e.g. "2025-02-05T09:33:32.468Z") |
| Name | Message sender's name. | ❌ | String (e.g. "John Doe") |
| Avatar | Message sender's avatar. | ❌ | Image URL |
| Type | Type of the message. | ✅ | Accepted Values: "response", "message" or "error". |

## Events

| Event | Description |
|-------|-------------|
| On history cleared | Triggers whenever the history is cleared. |
| On message sent | Triggers whenever a message is sent. |

## Additional Actions

All the following actions can be enabled or disabled either by using the toggle switch or by dynamically configuring the value by clicking on **fx** and entering a logical expression.

| Action | Description |
|--------|-------------|
| Visibility | Controls component visibility. Toggle or set dynamically. |
| Disable inpur state | Enables or disables the input state. |
| Histroy loading state | Enables the history loading state, often used with `isLoading` to indicate progress. |
| Response loading state | Enables the response loading state, often used with `isLoading` to indicate progress. |
| Enable clear history button | Enables or disables the clear history button. |
| Enable download history button | Enables or disables the delete history button. | 

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

