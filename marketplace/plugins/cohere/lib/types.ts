export type SourceOptions = {
  apiKey: string;
};
export type QueryOptions = {
  model?: string;
  operation: Operation;
  history?: string;
  message?: string;
  advanced_parameters?: string;
};

export enum Operation {
  TextGeneration = 'text_generation',
  Chat = 'chat',
}