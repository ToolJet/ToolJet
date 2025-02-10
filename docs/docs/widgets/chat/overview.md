---
id: overview
title: Overview
slug: /widgets/chat/
---

The **Chat Component** is used to implement a chat-based interface in an application. It can be integrated with AI plugins to build an AI-enabled chatbot or used for traditional chat functionalities, making it suitable for both AI-powered and human-to-human conversations.

This guide explains how to build an AI-enabled support chatbot using the Chat Component. For more details, refer to the following guides:
- **[Chat Component Properties](/docs/widgets/chat/properties)**
- **[Component Specific Actions (CSA)](/docs/widgets/chat/csa)**

## Building AI Enabled Chatbot

1. Drag a **Chat Component** on the canvas.

<img className="screenshot-full" src="/img/widgets/chat/component.png" alt="Drag a New Chat Component" />

2. Customize the **Chat Component**.

    a. Enter a Chat Title. <br/>
    b. Set Initial Chat. <br/>
    c. Configure User Name and Avatar. <br/>
    d. Configure Respondent Name and Avatar. <br/>

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/set-component.png" alt="Customize your Chat Component" />

3. Setup an AI query to generate responses. Check out **[marketplace](/docs/marketplace/marketplace-overview)** for all the available plugins.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/query.png" alt="Setup the AI Query" />

4. Add a new event handler for the query with the following configurations:
    - Event: **Query Success**
    - Action: **Control Component**
    - Component: **chat1** *(Select your chat component name from the dropdown.)*
    - Action: **Append History**
    - Message: 
        `{{{message: queries.openai1.data, type:"response"}}}`

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/query-eh.png" alt="Query Event Handler" />

5. Now add a new event handler for the **Chat Component**, with the following configuration:
    - Event: **On Message Sent**
    - Action: **Run Query**
    - Query: **openai1** *(Select your AI query name from the dropdown.)*

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/component-eh.png" alt="Component Event Handler" />

6. To add Response loading state, click on **fx** in front of Response loading state option and configure it with `{{queries.openai1.isLoading}}`.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/response-loading.png" alt="Add Response Loading State" />

By following the above steps, your AI Enabled Chatbot will be ready.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/chat/final-bot.png" alt="Final Chatbot" />


