export type SourceOptions = {
  apiKey: string;
};

// export type QueryOptions = {
//   operation: Operation;
//   prompt?: string;
//   max_tokens?: number | string;
//   temperature?: number | string;
//   stop_sequence?: [string];
//   suffix?: string | null;
// };

export enum Operation {
  Completion = 'completion',
  Chat = 'chat',
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

export interface TextCompletionQueryOptions extends CompletionQueryBase {
  prompt: string
}

interface Message {
  role: string;
  content: string;
}

export type QueryOptions = ChatCompletionQueryOptions | TextCompletionQueryOptions;

export type PromptOptions = {
  promptId: string;
  variables: Object;

}