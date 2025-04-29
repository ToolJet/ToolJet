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
  ExtractPDFText = "extract_pdf_text",
}
export interface DocumentExtractionOptions {
  url?: string;
  file?: string;
}

export interface DocumentExtractionResponse {
  data: {
    [key: string]: {
      content: string;
    };
  };
}

export interface TranslationOptions {
  url?: string;
  file?: string;
  language: string;
  file_type?: string;
  transliteration?: boolean;
}

export interface TranslationResponse {
  detected_language: {
    language: string;
    score: number;
  };
  translated_language: string;
  translation: string;
  transliteration?: string;
}

export interface WebpageExtractOptions {
  url: string;
  preserve_paragraphs?: boolean;
}

export interface WebpageExtractResponse {
  data: string;
}

export interface PdfExtractOptions {
  url?: string;
  file?: string;
}

export interface PdfExtractResponse {
  data: string;
}

export interface DocumentDataExtractionOptions {
  url?: string;
  file?: string;
}

export interface DocumentDataExtractionResponse {
  data: {
    [key: string]: {
      content: string;
      metadata: any;
    };
  };
}
