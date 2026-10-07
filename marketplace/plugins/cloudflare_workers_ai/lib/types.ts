export type SourceOptions = {
  apiToken: string;
  accountId: string;
};

export type QueryOptions = {
  operation: Operation;
  model?: string;
  input?: string;
  prompt?: string;
  text?: string;
  texts?: string;
  audio?: string;
  audioContentType?: string;
  language?: string;
  targetLanguage?: string;
  imageOptions?: string;
  search?: string;
  task?: string;
  page?: number | string;
  perPage?: number | string;
  hideExperimental?: boolean | string;
  includeDeprecated?: boolean | string;
};

export enum Operation {
  RunModel = 'run_model',
  TextGeneration = 'text_generation',
  TextEmbeddings = 'text_embeddings',
  TextToImage = 'text_to_image',
  SpeechRecognition = 'speech_recognition',
  Translation = 'translation',
  ListModels = 'list_models'
}
