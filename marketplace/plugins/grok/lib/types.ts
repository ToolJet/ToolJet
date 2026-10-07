export type SourceOptions = {
  apiKey: string;
};

export type QueryOptions = {
  operation: string;
  model?: string;
  custom_model?: string;
  system_prompt?: string;
  messages?: string | any[];
  prompt?: string;
  temperature?: number | string;
  max_tokens?: number | string;
  top_p?: number | string;
  image_url?: string;
  detail?: string;
  n?: number | string;
  response_format?: string;
  model_id?: string;
};
