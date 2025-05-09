---
id: marketplace-plugin-portkey
title: Portkey
---

ToolJet can integrate with Portkey to access AI services such as text completion, chat completion, prompt completion, and embedding creation. This integration enables ToolJet to leverage Portkey's LMOps platform to develop, launch, maintain, and iterate on generative AI features.

<div style={{textAlign: 'center', paddingBottom: '24px'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/overview.png" alt="Portkey Dashboard Overview" />
</div>

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to Portkey, the following credentials are required:

- **API Key**: Your Portkey API Key. Refer to the **[Portkey API Authentication Documentation](https://docs.portkey.ai/docs/api-reference/authentication#obtaining-your-api-key)** for instructions on obtaining your API Key.
- **Default Virtual Key** (Optional): Your default Portkey Virtual Key. Visit the **[Portkey Virtual Keys Documentation](https://docs.portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/virtual-keys#creating-virtual-keys)** to learn how to create and retrieve your Virtual Key.
- **Config** (Optional): Your default Portkey configuration.
- **Gateway URL** (Optional): Your default Portkey Gateway URL. See the **[Portkey API Authentication Documentation](https://docs.portkey.ai/docs/api-reference/authentication#obtaining-your-api-key)** for details on how to obtain your Gateway URL.

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
- **Model**: The AI model to use.
- **Max Tokens**: Maximum number of tokens to generate.
- **Temperature**: Controls randomness.
- **Stop Sequences**: Sequences where the API will stop generating further tokens.
- **Metadata**: Additional metadata for the request.
- **Other Parameters**: Any other parameters to include in the request.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/completion.png" alt="Completion Operation for Portkey" />
</div>

    <details id="tj-dropdown">
    <summary>**Response Example**</summary>
    ```json
{
  "id": "cmpl-9vNUfM8OP0SwSqXcnPwkqzR7ep8Sy",
  "object": "text_completion",
  "created": 1723462033,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
    {
      "text": "nn"Experience the perfect brew at Bean There."",
      "index": 0,
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 10,
    "total_tokens": 23
  }
}
    ```
    </details>

### Chat

This operation generates chat completions based on a series of messages.

#### Parameters:

- **Messages**: An array of message objects representing the conversation.
- **Model**: The AI model to use.
- **Max Tokens**: Maximum number of tokens to generate.
- **Temperature**: Controls randomness.
- **Stop Sequence**: Sequences where the API will stop generating further tokens.
- **Metadata**: Additional metadata for the request.
- **Other Parameters**: Any other parameters to include in the request.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/chat.png" alt="Chat Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
  "id": "chatcmpl-9vNIlfllXOPEmroKFajK2nlJHzhXA",
  "object": "chat.completion",
  "created": 1723461295,
  "model": "gpt-3.5-turbo-0125",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris.",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 7,
    "total_tokens": 31
  },
  "system_fingerprint": null
}
```
</details>

### Prompt Completion

This operation generates completions based on a pre-defined prompt.

#### Parameters:

- **Prompt ID**: The ID of the pre-defined prompt to use.
- **Variables**: Variables to be used in the prompt.
- **Parameters**: Additional parameters for the prompt completion.
- **Metadata**: Additional metadata for the request.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/prompt-completion.png" alt="Prompt Completion Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
  "id": "chatcmpl-9w6D8jZciWVf1DzkgqNZK14KUvA4d",
  "object": "chat.completion",
  "created": 1723633926,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The Industrial Revolution, starting in the late 18th century, transformed production from hand methods to machine-based processes, introducing new manufacturing techniques, steam power, and machine tools. It marked a shift from bio-fuels to coal, with the textile industry leading the way. This period resulted in significant population growth, increased average income, and improved living standards.",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 145,
    "completion_tokens": 71,
    "total_tokens": 216
  },
  "system_fingerprint": "fp_48196bc67a"
}
```
</details>

### Create Embedding

This operation creates embeddings for given input text.

#### Parameters:

- **Input**: The input text to create embeddings for.
- **Model**: The AI model to use for creating embeddings.
- **Metadata**: Additional metadata for the request.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/portkey/embedding.png" alt="Create Embedding Operation for Portkey" />
</div>

  <details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.02083237,
        -0.016892163,
        -0.0045676464,
        -0.05084554,
        -0.025968939,
        0.029597048,
        0.029987168,
        0.02907689,
        0.0105982395,
        -0.024356445,
        -0.00935636,
        0.0066352785,
        0.034018397,
        -0.042002838,
        0.03856979,
        -0.014681488,
        ...,
        0.024707552
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  }
}
```
</details>

For all operations, you can optionally specify:
- **Config**: Configuration options for the request.
- **Virtual Key**: A specific virtual key to use for the request, overriding the default.

---