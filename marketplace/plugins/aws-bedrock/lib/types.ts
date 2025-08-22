import {
  ModelCustomization,
  InferenceType,
  ModelModality,
} from "@aws-sdk/client-bedrock";

export interface SourceOptions {
  access_key: string;
  secret_access_key: string;
  region: string;
  session_token?: string;
}

export interface QueryOptions {
  operation?: "generate_content" | "list_foundation_models";
  model_id?: string;
  request_body?: any;
  content_type?: string;
  customization_type?: ModelCustomization;
  inference_type?: InferenceType;
  output_modality?: ModelModality;
  provider?: string;
}
