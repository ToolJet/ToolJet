---
id: marketplace-plugin-portkey
title: Portkey
---

ToolJet can integrate with Portkey to access AI services including text completion, chat completion, prompt completion, and embedding creation. This integration allows ToolJet to leverage Portkey's AI capabilities for various tasks.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to Portkey, the following credentials are required:

- **API Key**: Your Portkey API Key. You can obtain this from your Portkey account.
- **Default Virtual Key** (Optional): Your default Portkey Virtual Key.
- **Config** (Optional): Your default Portkey configuration.
- **Gateway URL** (Optional): Your default Portkey Gateway URL.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/configuration.png" alt="Configuring Portkey in ToolJet" />
</div>

## Supported Operations

Portkey in ToolJet supports the following operations:

- **[Completion](#completion)**
- **[Chat](#chat)**
- **[Prompt Completion](#prompt-completion)**
- **[Create Embedding](#create-embedding)**

### Completion

This operation generates text completions based on a given prompt.

#### Parameters:

- **Prompt**: The input text to generate completions for.
- **Model**: The AI model to use (default: 'davinci-002').
- **Max Tokens**: Maximum number of tokens to generate (default: 256).
- **Temperature**: Controls randomness (0-1, default: 1).
- **Stop Sequences**: Sequences where the API will stop generating further tokens.
- **Metadata**: Additional metadata for the request.
- **Other Parameters**: Any other parameters to include in the request.

### Chat

This operation generates chat completions based on a series of messages.

#### Parameters:

- **Messages**: An array of message objects representing the conversation.
- **Model**: The AI model to use (default: 'gpt-3.5-turbo').
- **Max Tokens**: Maximum number of tokens to generate (default: 256).
- **Temperature**: Controls randomness (0-1, default: 1).
- **Stop Sequence**: Sequences where the API will stop generating further tokens.
- **Metadata**: Additional metadata for the request.
- **Other Parameters**: Any other parameters to include in the request.

### Prompt Completion

This operation generates completions based on a pre-defined prompt.

#### Parameters:

- **Prompt ID**: The ID of the pre-defined prompt to use.
- **Variables**: Variables to be used in the prompt.
- **Parameters**: Additional parameters for the prompt completion.
- **Metadata**: Additional metadata for the request.

### Create Embedding

This operation creates embeddings for given input text.

#### Parameters:

- **Input**: The input text to create embeddings for.
- **Model**: The AI model to use for creating embeddings.
- **Metadata**: Additional metadata for the request.

For all operations, you can optionally specify:
- **Config**: Configuration options for the request.
- **Virtual Key**: A specific virtual key to use for the request, overriding the default.

---