export type SourceOptions = {
  api_key: string;
};
export type QueryOptions = {
  operation: string;
  model: string;
  messages: string;
  max_tokens: string;
  temperature: string;
  top_p: string;
  stop_tokens: string;
  random_seed: string;
  response_format: string;
  presence_penalty: string;
  frequency_penalty: string;
  completions: string;
  safe_prompt: Value;
};

type Value = {
  value: string;
};
