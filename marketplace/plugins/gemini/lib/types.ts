export type SourceOptions = {
  apiKey: string;
};

export enum Operation {
  Chat = 'chat'
  // TODO: Add more operations
}

interface CompletionQueryBase {
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

interface Message {
  role: string;
  content: string;
}

export type QueryOptions = ChatCompletionQueryOptions;

export type PromptOptions = {
  promptId: string;
  variables: Object;
}