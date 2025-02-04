export type SourceOptions = {
  api_key: string;
};
export type QueryOptions = {
  operation: string;
  model: ValueType;
  messages: string;
  max_tokens: string;
  temperature: string;
  top_p: string;
  stop_tokens: string;
  random_seed: string;
  response_format: ValueType;
  presence_penalty: string;
  frequency_penalty: string;
  completions: string;
  safe_prompt: ValueType;
};

export type ValueType = {
  value: string;
};
