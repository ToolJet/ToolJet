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
  file: string;
};

export enum Operation {
  ValidateEmail = "validate_email",
  SummarizeText = "summarize_text",
  TranslateText = "translate_text",
  ParseResume = "parse_resume",
  ProofreadText = "proofread_text",
  ParaphraseText = "paraphrase_text",
  GenerateSeoTags = "generate_seo_tags",
  DocumentDataExtraction = "extract_document_data",
  OCRDocumentExtraction = "ocr_multipage", // Add this line
  TranslateDocuments = "translate_documents",
  ExtractWebpageText = "extract_webpage_text",
  ExtractPDFText = "extract_pdf_text"
};