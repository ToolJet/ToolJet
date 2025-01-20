
export type SourceOptions = {
  apiKey: string;
};

export type QueryOptions = {
  model?: string; 
  operation: Operation; 
  system_prompt?: string; 
  message?: string; 
  temperature?: number | string; 
  max_size?: number | string; 
};

//for vision operation
/*export type MessageParam = {
  role: "user" | "assistant";
  content: string | Content[];
};

export type Content = {
  type: "text" | "image";
  text?: string; 
  source?: ImageSource; 
};

export type ImageSource = {
  type: "base64";
  media_type: "image/jpeg";
  data: string;
};*/

export enum Operation {
  Chat = "chat",
  Vision = "vision"
}
