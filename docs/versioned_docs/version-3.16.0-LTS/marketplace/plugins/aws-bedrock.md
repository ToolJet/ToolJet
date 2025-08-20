---
id: marketplace-plugin-aws-bedrock
title: AWS Bedrock
---

Use the AWS Bedrock plugin in ToolJet to list available foundation models and generate content using them, right from your ToolJet application. This makes it easy to build AI-powered features like text generation, summarization, and classification with minimal setup.

## Connection

To connect AWS Bedrock with ToolJet, following credentials are required:
- **Access Key ID**
- **Secret Access Key**
- **Region**
- **Session Token** (Required only while using temporary credentials.)

You can generate the required credentials from the AWS IAM Console, refer to [Generate Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) guide for more information.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/bedrock/connection.png" alt="AWS Bedrock Connection"/>

## Supported Operation

### Generate Content

Sends input to the selected foundation model and returns the generated output based on the model's capabilities (e.g., text generation or summarization).

**Required Parameters**
- **Model ID**: The identifier of the foundation model to be used for content generation.
- **Request body**: The input payload sent to the selected model, containing the prompt or data for generation.

**Optional Parameters**
- **Content-Type**: Specifies the format of the request body, typically `application/json`.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/bedrock/generate-content.png" alt="AWS Bedrock Connection"/>

### List Foundation Models

Fetches all available foundation models from your AWS Bedrock account, including model ID, provider, and supported input/output types.

**Optional Parameters**
- **Provider**: Filter models by the model provider (e.g., Anthropic, Amazon, Cohere).
- **Customization Type**: Filter by customization type such as fine-tuned or base models.
- **Inference Type**: Filter models based on the inference mode, like on-demand or provisioned.
- **Output Modality**: Filter by the type of output the model supports, such as text, embeddings or images.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/bedrock/foundation-models.png" alt="AWS Bedrock Connection"/>
