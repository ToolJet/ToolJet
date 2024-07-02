---
id: marketplace-plugin-openai
title: OpenAI
---

ToolJet can integrate with OpenAI to access two main services: Completions and Chat. The Completions service enables ToolJet to produce text from a given prompt or context. Meanwhile, the Chat service facilitates user interaction with an AI-driven chatbot based on OpenAI's language models. 

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to OpenAI, following credentials are required:
- **API key**: API key for OpenAI can be generated here: https://platform.openai.com/account/api-keys
- **Organization ID**: Find the Organization ID here: https://platform.openai.com/account/org-settings

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/connection-v2.png" alt="Configuring OpenAI in ToolJet" />
</div>

## Supported queries

- **[Completions](#completions)**
- **[Chat](#chat)**

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/list-v2.png" alt="List of Supported Queries" />
</div>

### Completions

The purpose of this query is to generate text completions based on a given prompt.

#### Required parameters: 

- **Prompt**: OpenAI uses the prompt as a starting point to generate a continuation or completion of the text, which can be in the form of a sentence, paragraph, or even an entire article. The quality and relevance of the generated text output can depend on the quality and specificity of the prompt provided.

#### Optional parameters: 

- **Max Tokens**: This parameter specifies the maximum number of tokens to generate in the text completion output. For example, if you set it to 50, then it will generate a text completion that contains up to 50 tokens.
- **Temperature**: Temperature is used to control the creativity and randomness of the generated text. It ranges from 0 to 1, a higher value such as 0.8 will increase the randomness of the output, whereas a lower value such as 0.2 will make it more focused and deterministic.
- **Stop sequence**: Stop sequence is used to specify when the API should stop generating text completions. This parameter is optional and can be used to customize the length and quality of the generated text.
- **Suffix**: The suffix that follows the inserted text completion.

### Chat

The function of this query is to examine the user's input and generate a suitable response that simulates human-like conversation.

#### Required parameters:

- **Prompt**: A prompt is the initial message or question that is provided as input to the chatbot model to start a conversation.

#### Optional parameters: 

- **Max Tokens**: This parameter specifies the maximum number of tokens to generate in the text completion output. For example, if you set it to 50, then it will generate a text completion that contains up to 50 tokens.
- **Temperature**: Temperature is used to control the creativity and randomness of the generated text. It ranges from 0 to 2, a higher value such as 0.8 will increase the randomness of the output, whereas a lower value such as 0.2 will make it more focused and deterministic.
- **Stop sequence**: This Stop sequence/parameter is used to specify when the API should stop generating text completions. This parameter is optional and can be used to customize the length and quality of the generated text.
- **Suffix**: The suffix that follows the inserted text completion.