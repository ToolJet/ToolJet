export type SourceOptions = {
  apiKey: string;
};

export type QueryOptions = {
  operation: Operation; 
  model: string; 
  system_prompt?: string; 
  prompt?: string; 
  user_prompt?: string; 
  history?: string; 
  max_tokens?: number | string; 
  temperature?: number | string; 
};

export enum Operation {
  TextGeneration = "text_generation",
  Chat = "chat",
}
