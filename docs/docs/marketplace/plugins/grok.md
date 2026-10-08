---
id: marketplace-plugin-grok
title: Grok (xAI)
---

**Grok** is xAI's family of advanced large language models built to assist with text generation, multimodal reasoning, and image generation. Integrating Grok with ToolJet allows you to query Grok models, analyze images, generate AI images, and dynamically retrieve model capabilities directly within your internal tools and applications.

---

## Connection

To connect ToolJet with Grok, configure the following credentials:

| Field | Description | Encrypted |
|:---|:---|:---:|
| **API Key** | Your personal xAI API key obtained from the xAI console. | Yes |

### Obtaining an API Key

1. Sign up or log in to the **[xAI Console](https://console.x.ai/)**.
2. Navigate to the **API Keys** section.
3. Click **Create API Key**, copy the key, and paste it into the **API Key** input in ToolJet.

### Authentication & Test Connection

- Authentication is managed via a `Bearer` token header sent securely to `https://api.x.ai/v1`.
- Click **Test Connection** in the datasource modal to verify your API key against the xAI API before saving.
- All credentials are treated as secrets and encrypted in the ToolJet database.

---

## Supported Operations

The Grok plugin supports five core operations:

1. **Chat Completion**
2. **Chat with Vision (Image Input)**
3. **Generate Image**
4. **List Models**
5. **Get Model**

---

### 1. Chat Completion

Generates conversational responses and performs natural language processing using Grok models.

#### Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---:|:---|
| **Model** | Dynamic Selector | Yes | Select a model fetched dynamically from the xAI API. Supports Fx mode for expressions. |
| **Custom Model ID** | String | No | Enter a custom model identifier (overrides the selected dropdown model if provided). |
| **System Prompt** | String | No | Instructions defining the persona, behavior, or role of the assistant. |
| **Messages** | JSON Array / String | No | Full conversation history as an array of message objects, e.g. `[{"role": "user", "content": "Hello"}]`. |
| **User Message** | String | Conditional | Input prompt sent to the model (required if **Messages** is not provided). |
| **Temperature** | Number | No | Sampling temperature between `0` and `2` (default: `0.7`). Lower values are more deterministic. |
| **Max Tokens** | Number | No | Maximum number of tokens to generate in the completion. |
| **Top P** | Number | No | Nucleus sampling probability threshold between `0` and `1`. |

#### Example Response

```json
{
  "id": "chatcmpl-a1b2c3d4",
  "object": "chat.completion",
  "created": 1728345600,
  "model": "grok-2-latest",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Grok is designed to provide insightful and helpful answers."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 12,
    "total_tokens": 26
  }
}
```

---

### 2. Chat with Vision (Image Input)

Performs multimodal understanding by combining image inputs with text prompts using Grok's vision models.

#### Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---:|:---|
| **Model** | Dynamic Selector | Yes | Vision-capable Grok model (e.g., `grok-2-vision-1212`). |
| **Custom Model ID** | String | No | Custom model identifier override. |
| **User Message / Question** | String | Yes | Question or instructions about the image. |
| **Image URL** | String | Yes | Publicly accessible image URL (e.g. `https://example.com/chart.png`) or Base64 data URI (`data:image/jpeg;base64,...`). |
| **Detail Level** | Dropdown | No | Image fidelity level: `auto`, `high`, or `low` (default: `auto`). |
| **System Prompt** | String | No | System instructions guiding vision analysis. |
| **Temperature** | Number | No | Sampling temperature between `0` and `2`. |
| **Max Tokens** | Number | No | Maximum tokens to generate. |

#### Example Response

```json
{
  "id": "chatcmpl-v1b2c3",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The image shows a quarterly revenue bar chart displaying an upward trend from Q1 to Q4."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

### 3. Generate Image

Generates high-resolution images from textual prompts using Grok's image generation models.

#### Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---:|:---|
| **Prompt** | String | Yes | Descriptive text prompt describing the desired image. |
| **Model** | String | No | Image model ID (defaults to `grok-2-image`). |
| **Number of Images (N)** | Number | No | Number of images to generate (default: `1`). |
| **Response Format** | Dropdown | No | Output format: `url` (downloadable image link) or `b64_json` (Base64 JSON). |

#### Example Response

```json
{
  "created": 1728345600,
  "data": [
    {
      "url": "https://imgen.x.ai/images/generated-example-1.png"
    }
  ]
}
```

---

### 4. List Models

Retrieves the list of available models from the xAI API along with metadata.

#### Parameters

This operation takes no required parameters.

#### Example Response

```json
[
  {
    "id": "grok-2-latest",
    "object": "model",
    "created": 1728340000,
    "owned_by": "xai"
  },
  {
    "id": "grok-2-vision-1212",
    "object": "model",
    "created": 1728340000,
    "owned_by": "xai"
  }
]
```

---

### 5. Get Model

Retrieves metadata, owner details, and capabilities for a specific model ID.

#### Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---:|:---|
| **Model ID** | String | Yes | ID of the model to inspect (e.g., `grok-2-latest`). |

#### Example Response

```json
{
  "id": "grok-2-latest",
  "object": "model",
  "created": 1728340000,
  "owned_by": "xai"
}
```

---

## Dynamic Model Selection

The Grok plugin dynamically populates the **Model** selector by querying the xAI `/v1/models` API in real-time. This ensures new model releases from xAI appear automatically without requiring plugin updates.

- **Auto-fetch**: Models are retrieved automatically when configuring a query.
- **Fx Mode**: You can toggle the `Fx` button on the Model field to bind dynamic expressions or variables like `{{components.dropdown1.value}}`.
- **Custom Model ID**: If a private beta or fine-tuned model ID is not listed, specify it directly in the **Custom Model ID** field.

---

## Error Handling & Troubleshooting

The plugin categorizes errors from xAI and provides informative error messages while ensuring no credentials or authorization headers are exposed:

| Status Code | Error Type | Cause and Resolution |
|:---|:---|:---|
| `400` | **Invalid Request** | Check that required parameters (such as `prompt` or `image_url`) are provided and formatted properly. |
| `401` | **Authentication Failed** | Verify that your xAI API key is valid, active, and has not expired or been revoked. |
| `403` | **Permission Denied** | The API key lacks permissions for the requested model or feature. Check your xAI plan and organization settings. |
| `404` | **Model / Resource Not Found** | The specified `model` or `model_id` does not exist or is unavailable. Use **List Models** to see available IDs. |
| `429` | **Rate Limit Exceeded** | You have exceeded xAI's requests-per-minute or token limits. Implement backoff or request higher quotas in the xAI Console. |
| `5xx` | **Server Error** | An internal issue occurred at xAI. Retry after a few moments. |
| Network | **Connection Failure** | ToolJet could not reach `https://api.x.ai`. Check network connectivity and firewall settings. |
