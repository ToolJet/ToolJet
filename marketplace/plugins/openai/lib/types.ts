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
};

export enum Operation {
  Completion = 'completion',
  Chat = 'chat',
  ImageGeneration = 'image_generation' // New operation for image generation
}
