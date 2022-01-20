export interface EmailOptions {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
  isMultiple: boolean;
}

export type SourceOptions = { 
  api_key: string; 
};