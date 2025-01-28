export type SourceOptions = {
  personal_access_token: string;
  use_cache: boolean;
  wait_for_model: boolean;
};
export type QueryOptions = {
  operation: string;
  model: string;
  input: string;
  operation_parameters: string;
  model_summarisation: string;
  input_summarisation: string;
  operation_parameters_summarisation: string;
};
