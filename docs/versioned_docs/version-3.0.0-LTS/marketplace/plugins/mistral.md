---
id: marketplace-plugin-mistral_ai
title: Mistral AI
---

Mistral AI can be integrated with ToolJet to generate high-quality text content. By defining various roles, it enables the creation of contextually relevant and dynamic content.

## Connection

To connect with Mistral AI, you will need an **API Key**, which can be generated from **[Mistral AI Console](https://console.mistral.ai/api-keys/)**.

<img className="screenshot-full" src="/img/marketplace/plugins/mistral/config.png" alt="Anthropic Configuration" />

## Supported Operations

### Text Generation

Use this operation to generate text content by controlling various parameters to achieve precise results.

**Required Parameters**

- **Model**: Use to specify the AI model for generating content. The available models are:

    - mistral-large-latest
    - mistral-moderation-latest
    - ministral-3b-latest
    - ministral-8b-latest
    - open-mistral-nemo
    - mistral-small-latest

- **Messages**: Provide structured input to define the context or conversation.

**Optional Parameters**

- **Max size**: Set the maximum length for the generated content.
- **Temperature**: Adjust to control the creativity and diversity of the output.
- **Top P**: Use to limit randomness by setting a probability threshold.
- **Stop token(s)**: Specify tokens or phrases to end the content generation.
- **Random seed**: Set to ensure consistent results by initializing the generator.
- **Response format**: Choose between plain text or structured JSON output.
- **Presence penalty**: Apply to reduce repetition of words or phrases.
- **Frequency penalty**: Use to discourage frequent word usage for more varied responses.
- **Completions (N)**: Set the number of response variations to generate.
- **Safe prompt**: Ensure the prompt is free of inappropriate or sensitive content.

<img className="screenshot-full" src="/img/marketplace/plugins/mistral/query.png" alt="Anthropic Configuration" />

<details>
<summary>**Response Example**</summary>

"ToolJet is often considered one of the best low-code platforms for several reasons. Here are some key features and advantages that set it apart:

1. **Open-Source**: ToolJet is open-source, which means it's free to use, and you can customize it to fit your specific needs. It also has an active community of contributors, ensuring continuous improvement and innovation.

2. **Easy to Use**: ToolJet provides a drag-and-drop interface for building internal tools, making it accessible for both technical and non-technical users. This lowers the barrier to entry and enables a wider range of people to create and manage tools.

3. **Integration Capabilities**: ToolJet allows you to connect to various data sources and APIs, making it easy to integrate with other tools and services in your tech stack. This includes databases like PostgreSQL, MongoDB, and MySQL, as well as external APIs.

4. **Flexibility and Extensibility**: Despite being a low-code platform, ToolJet offers the flexibility to write custom code when needed. This means you can extend its capabilities and build more complex tools if required.

5. **Pre-built Widgets**: ToolJet comes with a library of pre-built widgets, which are reusable UI components. These widgets can help you build tools faster and with less effort.

6. **Real-time Collaboration**: ToolJet supports real-time collaboration, allowing multiple users to work on the same tool simultaneously. This is particularly useful for teams working remotely.

7. **Security and Permissions**: ToolJet provides fine-grained access control, ensuring that your tools and data are secure. You can set permissions at the tool, page, and even individual widget levels.

8. **Self-Hosted**: ToolJet can be self-hosted, giving you full control over your data and tools. This is particularly important for businesses with strict data privacy and security requirements.

9. **Active Community and Support**: ToolJet has an active community of users and developers. This means you can get help and support when you need it, and you can contribute to the platform's development if you wish.

10. **Cost-Effective**: As an open-source platform, ToolJet can be a cost-effective solution for businesses looking to build internal tools without breaking the bank.

These features make ToolJet a strong contender in the low-code platform space, particularly for businesses looking for an open-source, flexible, and user-friendly solution. However, the "best" platform ultimately depends on your specific needs and context."

</details>