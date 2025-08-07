import { BedrockClient } from "@aws-sdk/client-bedrock";
import {
  InvokeModelCommand,
  BedrockRuntimeClient,
} from "@aws-sdk/client-bedrock-runtime";
import {
  ListFoundationModelsCommand,
  ModelCustomization,
  ModelModality,
  InferenceType,
} from "@aws-sdk/client-bedrock";

interface GenerateContentOptions {
  model_id: string;
  request_body: Record<string, any> | string;
  content_type?: string;
}

export async function generateContent(
  client: BedrockRuntimeClient,
  options: GenerateContentOptions
): Promise<Record<string, any>> {
  try {
    const requestBody =
      typeof options.request_body === "string"
        ? options.request_body
        : JSON.stringify(options.request_body);

    const command = new InvokeModelCommand({
      modelId: options.model_id,
      body: Buffer.from(requestBody),
      contentType: options.content_type || "application/json",
    });

    const response = await client.send(command);
    return JSON.parse(Buffer.from(response.body).toString("utf-8"));
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}

export async function listFoundationModels(
  client: BedrockClient,
  options: {
    customization_type?: ModelCustomization;
    inference_type?: InferenceType;
    output_modality?: ModelModality;
    provider?: string;
  }
): Promise<any[]> {
  const input: any = {};

  if (options.customization_type)
    input.byCustomizationType = options.customization_type;
  if (options.inference_type) input.byInferenceType = options.inference_type;
  if (options.output_modality) input.byOutputModality = options.output_modality;
  if (options.provider) input.byProvider = options.provider;

  const command = new ListFoundationModelsCommand(input);
  const response = await client.send(command);
  if (!response.modelSummaries || response.modelSummaries.length === 0) {
    throw new Error("No foundation models were found for the selected filters. Please adjust your criteria and try again.");
  }
  return response.modelSummaries;
}
