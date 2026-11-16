export type SourceOptions = {
  apiKey: string;
  /** Any OpenAI-compatible endpoint. Defaults to OpenRouter; set it to reach Together, Groq,
   *  LiteLLM, vLLM or a self-hosted gateway with the same connector. */
  baseUrl?: string;
  /** OpenRouter attributes usage to a site and app name when these are sent. Optional everywhere else. */
  siteUrl?: string;
  appName?: string;
};

export type QueryOptions = {
  operation: Operation;
  model?: string;
  prompt?: string;
  system_prompt?: string;
  message_history?: string | any[];
  max_tokens?: number | string;
  temperature?: number | string;
  top_p?: number | string;
  stop_sequence?: string;
  json_mode?: boolean | string;
  /** Comma-separated models to try if the first is unavailable: an OpenRouter routing feature. */
  fallback_models?: string;
  /** Refuse providers that train on prompts. The literal OpenRouter values are "allow" and "deny". */
  data_collection?: string;
  /** Embeddings */
  input?: string;
  encoding_format?: string;
};

export enum Operation {
  Chat = 'chat',
  GenerateEmbedding = 'generate_embedding',
  ListModels = 'list_models',
}
