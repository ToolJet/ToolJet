---
id: marketplace-plugin-openai
title: OpenAI
---

ToolJet integrates with OpenAI to utilize its AI capabilities. This integration enables ToolJet to generate text based on user prompts, facilitate chat interactions, create images tailored to specific inputs, and generate vector embeddings.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

For connecting to OpenAI, the following credential is required:

- **API Key**: API key for OpenAI can be generated [here](https://platform.openai.com/account/api-keys).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-l" src="/img/marketplace/plugins/openai/connection-v5.png" alt="OpenAI data source connection form with the API Key field" />
</div>

## Supported Operations

- **[Chat](#chat)**
- **[Generate AI Image(s)](#generate-ai-images)**
- **[Generate embedding](#generate-embedding)**

### Chat

The function of this operation is to examine the user's input and generate a suitable response that simulates human-like conversation.

#### Required Parameters

- **Model**: The model to use for generating the chat response. If no model is selected, `gpt-4o` is used. The available models are:
    - **GPT-6 Astra**
    - **GPT-6 Sol**
    - **GPT-6 Luna**
    - **GPT-5.6 Terra**
    - **GPT-5.6 Sol**
    - **GPT-5.6 Luna**
    - **GPT-5.2**
    - **GPT-5.1**
    - **GPT-5**
    - **GPT-5 Mini**
    - **GPT-5 Nano**
    - **o4 Mini**
    - **o3**
    - **o3 Mini**
    - **o1**
    - **GPT-4.1**
    - **GPT-4.1 Mini**
    - **GPT-4.1 Nano**
    - **GPT-4**
    - **GPT-4 Turbo**
    - **GPT-4o**
    - **GPT-4o Mini**
    - **GPT-3.5 Turbo**

- **User message**: The message the model replies to. ToolJet sends it as the last `user` message, after the **System Prompt** and **Message History**.

#### Optional Parameters

- **System Prompt**: Defines the role, context and behavior of the model. ToolJet sends it as a `system` message at the start of the conversation.
- **Message History**: Earlier turns of the conversation, as a JSON array of objects with `role` and `content`, for example `[{ "role": "user", "content": "Hello" }, { "role": "assistant", "content": "Hi! How can I help?" }]`. The query fails if the value isn't valid JSON.
- **Max Tokens**: This parameter specifies the maximum number of tokens to generate in the text completion output. For example, if you set it to 50, then it will generate a text completion that contains up to 50 tokens.
- **Temperature**: Temperature is used to control the creativity and randomness of the generated text. It ranges from 0 to 2, a higher value such as 0.8 will increase the randomness of the output, whereas a lower value such as 0.2 will make it more focused and deterministic.
- **Stop sequence**: This Stop sequence/parameter is used to specify when the API should stop generating text completions. This parameter is optional and can be used to customize the length and quality of the generated text.
- **Suffix**: The suffix that follows the inserted text completion.

:::note
Reasoning models don't accept a temperature. The **Temperature** field isn't shown for the GPT-6 and GPT-5.6 models, and for any model whose name starts with `o` (o-series), `gpt-5` or `gpt-6`, ToolJet doesn't send a temperature even if one is entered.
:::

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: GPT-4 Turbo
System Prompt: You are a helpful assistant.
User message: What are the key principles of machine learning?
Max Tokens: 100
Temperature: 0.7
Stop sequence: END
Suffix: \n
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/chat-v5.png" alt="Chat operation with System Prompt, Message History and User message filled in for the GPT-4.1 model" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
"Machine learning, a subset of artificial intelligence, is fundamentally about designing and implementing algorithms that can learn from and make predictions or decisions based on data. The key principles of machine learning can be outlined as follows:nn1. **Learning from Data**: At its core, machine learning involves developing algorithms that can learn from and make predictions or inferences from data. Models are trained using a large set of data known as training data, which helps them make decisions or predictions without being explicitly programmed for the task.nn2"
```
</details>

### Generate AI Image(s)

This operation generates AI images based on the given prompt.

#### Required Parameters

- **Model**: The model to use for generating the image. The default is **GPT Image 2.5 Flare**. The available models are:
    - **GPT Image 2.5 Sunburst**
    - **GPT Image 2.5 Flare**
    - **GPT Image 2**
    - **GPT Image 1.5**
    - **GPT Image 1**
    - **GPT Image 1 Mini**
    - **DALL-E 3 (Deprecated)**
    - **DALL-E 2 (Deprecated)**
- **Prompt**: The prompt is the initial message or question that is provided as input to the AI model to generate an image.

#### Optional Parameters

- **Size (in pixels)**: The size of the image to be generated in pixels. The default value is `1024x1024`, which is also used when the entered size isn't allowed for the selected model. The allowed sizes depend on the model:
    - **GPT Image 2.5 Sunburst** and **GPT Image 2.5 Flare**: Any `WIDTHxHEIGHT` with both sides a multiple of 16, up to 3840px and an aspect ratio between 1:3 and 3:1 (for example `1920x1088`), or `1024x1024`, `1536x1024`, `1024x1536` or `auto`.
    - **GPT Image 2**: Any `WIDTHxHEIGHT` up to `3840x2160` (for example `1920x1080`), or `1024x1024`, `1536x1024`, `1024x1536` or `auto`.
    - **GPT Image 1.5**, **GPT Image 1** and **GPT Image 1 Mini**: One of `1024x1024`, `1536x1024`, `1024x1536` or `auto`.
    - **DALL-E 3**: One of `1024x1024`, `1792x1024` or `1024x1792`.
    - **DALL-E 2**: One of `256x256`, `512x512` or `1024x1024`.

:::note
GPT Image models return the generated image as base64 in `data.b64_json`. DALL-E models return a link to the image in `data.url`, as in the response example below.
:::

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: DALL-E 3
Prompt: A futuristic cityscape with flying cars and holographic billboards at sunset
Size(in pixels): 1024x1024
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/generate-image-v4.png" alt="Generate AI Images Operation" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "status": "success",
  "message": "Image generated successfully",
  "data": {
    "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/org-CpkCwFjT48kGZ33uOV2L4QxH/user-3QrXKnZO1PJUBeNP6xiQV9Rs/img-XXIds2QvTdcUfcJ2qmNWLwsC.png?st=2024-10-09T10%3A24%3A34Z&se=2024-10-09T12%3A24%3A34Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-10-09T03%3A29%3A32Z&ske=2024-10-10T03%3A29%3A32Z&sks=b&skv=2024-08-04&sig=qPBYkPdQjLwBWJAS8fWmhs3B5TNSYbxhuMe15NcmgM4%3D"
  }
}
```
</details>

### Generate Embedding

This operation is used to generate vector embeddings from the given text, which can be used to build AI applications.

#### Required Parameters

- **Model**: The model to use for generating the vector embedding. The available models are:
    - **text-embedding-3-small**
    - **text-embedding-3-large**
    - **text-embedding-ada-002**

- **Input**: The text input used for generating the vector embedding.

#### Optional Parameters

- **Encoding format**: Specifies the output format of the vector embedding from the dropdown, float or base64.
- **Dimensions**: Defines the number of values in the generated embedding vector, affecting its size and level of detail.

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Model: text-embedding-3-large
Input: ToolJet is a low code platform used to build internal tools
Encoding format: Float
Dimensions: 10
```
</details>

<img className="screenshot-full img-full" src="/img/marketplace/plugins/openai/generate-embed.png" alt="Generate Vector Embedding" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "embedding": [
    -0.49750686, -0.7019393, -0.23043627, -0.12421317, -0.076866604, 0.2191516,
    0.2548046, 0.1453106, -0.20050736, 0.10516006
  ]
}
```
</details>
