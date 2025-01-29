---
id: marketplace-plugin-cohere
title: Cohere
---

Cohere can be integrated with ToolJet to use its advanced AI models for tasks such as text generation or building a chatbot assistant by configuring parameters to optimize results.

## Connection

To connect with Cohere, you will need the **Access token**, which can be generated from **[Cohere Dashboard](https://dashboard.cohere.com/api-keys)**.

<img className="screenshot-full" src="/img/marketplace/plugins/cohere/config.png" alt="Cohere Configuration" />

## Supported Operations

### Text Generation

Use this operation to generate creative text content by selecting the desired model and defining additional parameters.

**Required Parameters**

- **Model**: The model to use for generating the text. The available models are:
    - command-r7b-12-2024
    - command-r-plus-08-2024
    - command-r-plus-04-2024
    - command-r-plus
    - command-r-08-2024
    - command-r-03-2024
    - command-r
    - command
    - command-nightly
    - command-light
    - command-light-nightly
    - c4ai-aya-expanse-8b
    - c4ai-aya-expanse-32b

- **Message**: The main user input for generating response.

**Optional Parameter**

- **Advanced parameters**: Additional parameters to configure the model response. Example Parameters:

```js 
{
    "response_format": {"type": "text"},
    "temperature": 0.3,
    "max_tokens": 512,
    "seed": 3,
    "p": 0.3,
    "k": 1,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "citation_options": {"mode": "fast"},
    "safety_mode": "off",
    "stop_sequences": ["spam", "fraud"]
}
```

<img className="screenshot-full" src="/img/marketplace/plugins/cohere/text-generation.png" alt="Cohere Text generation" />

<details>
<summary>**Response Example**</summary>

ToolJet is an open-source no-code platform that allows you to build your own tools and automate your workflows in minutes. It is built on top of the powerful Airbyte open-source standard for data integration, focusing on user-friendliness and extensibility. With ToolJet, you can create custom solutions for your business without any prior coding knowledge.

Here's a high-level overview of the features and capabilities of ToolJet:

1. **No-Code Builder**: ToolJet offers a visual interface where you can quickly create powerful applications, workflows, and automation scripts without writing a single line of code.

2. **Data Integration**: ToolJet leverages Airbyte to provide seamless data integration capabilities. You can sync data from various sources like databases, APIs, or SaaS applications to build custom dashboards, data pipelines, or extensions.

3. **Visual Automation Builder**: Create automated workflows using a drag-and-drop interface. Connect various tools, apps, and APIs to automate tasks, notifications, data manipulation, and more.

4. **Open Source**: Being open-source means you get full transparency over the platform's underlying code. Plus, you can contribute to the project and customize or extend it according to your needs.

5. **Extensions & APIs**: ToolJet provides a marketplace for sharing and discovering extensions, APIs, and pre-built workflows. You can extend the functionality of ToolJet with community-built solutions.

6. **Dashboard & Reports**: Create interactive dashboards and reports using the built-in charting and visualization tools. Visualize data from various sources in one place and share insights with your team.

7. **Forms & UI**: Easily create forms and user interfaces using ToolJet's intuitive form builder. Collect data, feedback, or insights from your users or systems.

8. **Collaboration & Security**: Control user access and permissions with robust security features. Collaborate with team members on different projects and ensure data privacy and compliance.

9. **Integration with External Tools**: ToolJet integrates with popular productivity, collaboration, and data tools, including Slack, Google Workspace, Microsoft Office, Airbyte, and more.

10. **Open API & Extensibility**: ToolJet has a robust application programming interface (API), which allows developers to extend its capabilities. You can customize and connect any external service or application.

ToolJet is a versatile platform that spans several use cases, including business process automation, data management, workflow optimization

</details>

### Chat

Use this operation for a chat-like conversation, where the model responds based on the given prompts and instructions. It provides relevant and context-appropriate answers, maintaining a smooth conversational flow.

**Required Parameters**

- **Model**: Specifies the model to use for generating responses in the chat. The available models are:
    - command-r7b-12-2024
    - command-r-plus-08-2024
    - command-r-plus-04-2024
    - command-r-plus
    - command-r-08-2024
    - command-r-03-2024
    - command-r
    - command
    - command-nightly
    - command-light
    - command-light-nightly
    - c4ai-aya-expanse-8b
    - c4ai-aya-expanse-32b

- **History**: Keeps track of previous interactions to maintain context in the conversation.

- **Message**: The main user input for generating response in the chat.

**Optional Parameter**

- **Advanced parameters**: Additional parameters to configure the model response. Example Parameters:

```js 
{
    "response_format": {"type": "text"},
    "temperature": 0.3,
    "max_tokens": 512,
    "seed": 3,
    "p": 0.3,
    "k": 1,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "citation_options": {"mode": "fast"},
    "safety_mode": "off",
    "stop_sequences": ["spam", "fraud"]
}
```

<img className="screenshot-full" src="/img/marketplace/plugins/cohere/chat.png" alt="Cohere Chat" />

<details>
<summary>**Response Example**</summary>

ToolJet is a no-code platform that allows you to build custom internal tools with drag and drop functionality. You can integrate Cohere with ToolJet to enable an added advantage of AI features in your apps built on ToolJet. 

To integrate Cohere AI into your ToolJet app, you should have a Cohere AI API key. If you don't have one, you can sign up for a free Cohere AI account and get your API key. 

As a next step, you can refer to our documentation to see a step-by-step guide to integrate Cohere AI with ToolJet. If you have any further questions, please let me know!

</details>
