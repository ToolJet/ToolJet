export type SourceOptions = {
  apiKey: string;
  organizationId?: string;
};

export type QueryOptions = {
  model?: string; // Added model as an optional field
  operation: Operation;
  prompt?: string;
  max_tokens?: number | string;
  temperature?: number | string;
  stop_sequence?: string;
  suffix?: string | null;
  //num_images?: number | string; // Number of images for generation
  size?: string; // Size of the generated image
  model_embedding: string;
  input_M1: string;
  input_M2: string;
  input_M3: string;
  encoding_format_M1: string;
  encoding_format_M2: string;
  encoding_format_M3: string;
  dimensions_M1: string;
  dimensions_M2: string;
};

export enum Operation {
  Completion = 'completion',
  Chat = 'chat',
  ImageGeneration = 'image_generation',
  GenerateEmbedding = 'generate_embedding',
}
