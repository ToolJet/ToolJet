export type SourceOptions = {
  apiKey: string;
  virtualKey: string;
  config: Record<string, any>;
};

// export type QueryOptions = {
//   operation: Operation;
//   prompt?: string;
//   max_tokens?: number | string;
//   temperature?: number | string;
//   stop_sequence?: [string];
//   suffix?: string | null;
// };
interface CredentialsBase {
  config?: Record<string, any> | null;
  virtualKey?: string | null;
}
export enum Operation {
  Completion = 'completion',
  Chat = 'chat',
  PromptCompletion = 'prompt_completion',
  CreateEmbedding = 'create_embedding',
}
interface CompletionQueryBase extends CredentialsBase {
  operation: Operation;
  model: string;
  temperature?: number | string;
  max_tokens?: number | string;
  stop_sequences?: string;
  metadata?: Record<string, any> | null;
  other_parameters?: Record<string, any> | null;
}

interface Message {
  role: string;
  content: string;
}
export interface ChatCompletionQueryOptions extends CompletionQueryBase {
  messages: Array<Message>
}

export interface TextCompletionQueryOptions extends CompletionQueryBase {
  prompt: string
}

export interface PromptCompletionQueryOptions extends CredentialsBase {
  operation: Operation;
  promptId: string;
  variables?: Record<string, any>;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EmbeddingQueryOptions extends CredentialsBase {
  operation: Operation;
  input: string;
  model: string;
  metadata?: Record<string, any>;
}

export type QueryOptions = TextCompletionQueryOptions | ChatCompletionQueryOptions | PromptCompletionQueryOptions | EmbeddingQueryOptions;