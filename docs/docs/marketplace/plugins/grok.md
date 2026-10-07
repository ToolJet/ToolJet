---
id: marketplace-plugin-grok
title: Grok (xAI)
---

Grok by xAI can be integrated with ToolJet to leverage powerful large language models for chat completion, vision analysis, image generation, and model metadata querying.

## Connection

To connect with Grok, you will need an **API Key**, which can be generated from the **[xAI Console](https://console.x.ai/)**.

## Supported Operations

### Chat Completion

Use this operation to generate text and conversational responses using Grok language models.

**Parameters**
- **Model**: Select a standard Grok model (such as `grok-2-latest`, `grok-2`, `grok-2-1212`, `grok-beta`).
- **Custom Model ID**: Optional custom model identifier (overrides the dropdown if provided).
- **System Prompt**: Instructions to guide the behavior of the model.
- **Messages**: Structured array of message objects (e.g., `[{"role": "user", "content": "Hello"}]`).
- **User Message**: Prompt text sent to the model (used if structured messages are not specified).
- **Temperature**: Sampling temperature between 0 and 2 (default `0.7`).
- **Max Tokens**: Maximum tokens to generate in response.
- **Top P**: Nucleus sampling probability mass.

### Chat with Vision (Image Input)

Perform multimodal queries providing both textual questions and images to Grok vision models.

**Parameters**
- **Model**: Vision-capable Grok model (`grok-2-vision-1212`, `grok-vision-beta`, `grok-2-latest`).
- **User Message / Question**: Prompt or question regarding the image.
- **Image URL**: Public URL or Base64 data URI of the target image.
- **Detail Level**: Resolution detail level (`auto`, `high`, `low`).
- **System Prompt**: Optional instructions guiding model behavior.
- **Temperature**: Sampling temperature.
- **Max Tokens**: Maximum tokens to generate.

### Generate Image

Generate images from textual descriptions.

**Parameters**
- **Prompt**: Detailed text description of the desired image.
- **Model**: Image generation model (default `grok-2-image`).
- **Number of Images**: Number of images to generate (default `1`).
- **Response Format**: Format of the generated image (`url` or `b64_json`).

### List Models

Retrieve the list of all currently available models from the xAI API.

### Get Model

Retrieve detailed metadata and permissions for a specific Grok model.

**Parameters**
- **Model ID**: Identifier of the target model (e.g., `grok-2-latest`).
