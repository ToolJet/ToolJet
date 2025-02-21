---
id: marketplace-plugin-openai
title: OpenAI
---

ToolJet integrates with OpenAI to utilize its AI capabilities. This integration enables ToolJet to generate text based on user prompts, facilitate chat interactions, create images tailored to specific inputs, and generate vector embeddings.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to OpenAI, the following credentials are required:

- **API key**: API key for OpenAI can be generated [here](https://platform.openai.com/account/api-keys).
- **Organization ID**: Find the Organization ID [here](https://platform.openai.com/account/org-settings).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/connection-v4.png" alt="Configuring OpenAI in ToolJet" />
</div>

## Supported Operations

- **[Chat](#chat)**
- **[Completions](#completions)**
- **[Generate AI Image(s)](#generate-ai-images)**
- **[Generate embedding](#generate-embedding)**

### Chat

The function of this operation is to examine the user's input and generate a suitable response that simulates human-like conversation.

#### Required Parameters

- **Model**: The model to use for generating the chat response. The available models are:
    - GPT-4.0
    - GPT-4.0 mini
    - GPT-4 Turbo
    - GPT-3.5 Turbo
- **Prompt**: A prompt is the initial message or question that is provided as input to the chatbot model to start a conversation.

#### Optional Parameters

- **Max Tokens**: This parameter specifies the maximum number of tokens to generate in the text completion output. For example, if you set it to 50, then it will generate a text completion that contains up to 50 tokens.
- **Temperature**: Temperature is used to control the creativity and randomness of the generated text. It ranges from 0 to 2, a higher value such as 0.8 will increase the randomness of the output, whereas a lower value such as 0.2 will make it more focused and deterministic.
- **Stop sequence**: This Stop sequence/parameter is used to specify when the API should stop generating text completions. This parameter is optional and can be used to customize the length and quality of the generated text.
- **Suffix**: The suffix that follows the inserted text completion.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/chat-v3.png" alt="Chat Operation" />
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Model: GPT-4 Turbo
Prompt: What are the key principles of machine learning?
Max Tokens: 100
Temperature: 0.7
Stop sequence: END
Suffix: \n
```

</details>

<details>
<summary>**Response Example**</summary>

```json
"Machine learning, a subset of artificial intelligence, is fundamentally about designing and implementing algorithms that can learn from and make predictions or decisions based on data. The key principles of machine learning can be outlined as follows:nn1. **Learning from Data**: At its core, machine learning involves developing algorithms that can learn from and make predictions or inferences from data. Models are trained using a large set of data known as training data, which helps them make decisions or predictions without being explicitly programmed for the task.nn2"
```

</details>

### Completions

The purpose of this operation is to generate text completions based on a given prompt.

#### Required Parameters

- **Model**: The model to use for generating the text completion. The available models are:
    - GPT-3.5 Turbo
- **Prompt**: OpenAI uses the prompt as a starting point to generate a continuation or completion of the text, which can be in the form of a sentence, paragraph, or even an entire article. The quality and relevance of the generated text output can depend on the quality and specificity of the prompt provided.

#### Optional Parameters

- **Max Tokens**: This parameter specifies the maximum number of tokens to generate in the text completion output. For example, if you set it to 50, then it will generate a text completion that contains up to 50 tokens.
- **Temperature**: Temperature is used to control the creativity and randomness of the generated text. It ranges from 0 to 1, a higher value such as 0.8 will increase the randomness of the output, whereas a lower value such as 0.2 will make it more focused and deterministic.
- **Stop sequence**: Stop sequence is used to specify when the API should stop generating text completions. This parameter is optional and can be used to customize the length and quality of the generated text.
- **Suffix**: The suffix that follows the inserted text completion.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/completions-v3.png" alt="Completions Operation" />
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Model: GPT-3.5 Turbo
Prompt: The benefits of using low code platforms for software development include
Max Tokens: 100
Temperature: 0.6
Stop sequence: END
Suffix: \n
```

</details>

<details>
<summary>**Response Example**</summary>

``` json
":1. Increased Speed and Efficiency: Low code platforms allow developers to quickly build and deploy applications without having to write extensive lines of code. This significantly reduces development time and increases efficiency.nn2. Cost Savings: With low code platforms, businesses can save on development costs by reducing the need for a large team of developers. This also leads to lower maintenance costs as the applications are easier to maintain and update.nn3. User-Friendly Interface: Low code platforms are designed to be user-friendly and require minimal"
```

</details>

### Generate AI Image(s)

This operation generates AI images based on the given prompt.

#### Required Parameters

- **Model**: The model to use for generating the image. The available models are:
    - DALL-E 3
    - DALL-E 2
- **Prompt**: The prompt is the initial message or question that is provided as input to the AI model to generate an image.

#### Optional Parameters

- **Size (in pixels)**: The size of the image to be generated in pixels. The default value is 1024x1024. The allowed sizes depend on the model:
    - **DALL-E 2**: Must be one of `256x256`, `512x512`, or `1024x1024`.
    - **DALL-E 3**: Must be one of `1024x1024`, `1792x1024`, or `1024x1792`.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/openai/generate-ai-images-v2.png" alt="Generate AI Images Operation" />
</div>

<details>
<summary>**Example Values**</summary>

```yaml
Model: DALL-E 3
Prompt: A futuristic cityscape with flying cars and holographic billboards at sunset
Size(in pixels): 1024x1024
```

</details>

<details>
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
    - text-embedding-3-small
    - text-embedding-3-large
    - text-embedding-ada-002

- **Input**: The text input used for generating the vector embedding.

#### Optional Parameters

- **Encoding format**: Specifies the output format of the vector embedding from the dropdown, float or base64.
- **Dimensions**: Defines the number of values in the generated embedding vector, affecting its size and level of detail.

<img className="screenshot-full" src="/img/marketplace/plugins/openai/embedding-v2.png" alt="Generate Vector Embedding" />

<details>
<summary>**Example Values**</summary>

```yaml
Model: text-embedding-3-large
Input: ToolJet is a low code platform used to build internal tools
Encoding format: Float
Dimensions: 10
```

</details>

<details>
<summary>**Response Example**</summary>

```json
{
  "embedding": [
    -0.49750686,
    -0.7019393,
    -0.23043627,
    -0.12421317,
    -0.076866604,
    0.2191516,
    0.2548046,
    0.1453106,
    -0.20050736,
    0.10516006
  ]
}
```
</details>