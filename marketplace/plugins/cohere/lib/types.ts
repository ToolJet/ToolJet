export type SourceOptions = {
  apiKey: string;
};

export type QueryOptions = {
  model?: string;
  operation: Operation;
  history?: string;
  message?: string;
  texts?: string;
  input_type?: EmbedInputType;
  query?: string;
  documents?: string;
  advanced_parameters?: string;
};

export enum Operation {
  TextGeneration = 'text_generation',
  Chat = 'chat',
  Embed = 'embed',
  Rerank = 'rerank',
}

export type EmbedInputType = 'search_document' | 'search_query' | 'classification' | 'clustering' | 'image';

export type ModelEndpoint = 'chat' | 'embed' | 'rerank';

// Cohere's model list is filtered by the endpoint the query will call.
export const MODEL_ENDPOINTS: Record<Operation, ModelEndpoint> = {
  [Operation.TextGeneration]: 'chat',
  [Operation.Chat]: 'chat',
  [Operation.Embed]: 'embed',
  [Operation.Rerank]: 'rerank',
};
