export type SourceOptions = {
  apiKey: string;
};
export type QueryOptions = {
  operation: Operation;
  email: string;
  text: string;
  url: string;
  inputType: string;
  content: string;
  language: string;
  voicetone: string;
  resume: string;
};

export enum Operation {
  ValidateEmail = "validate_email",
  SummarizeText = "summarize_text",
  TranslateText = "translate_text",
  ParseResume = "parse_resume"
}