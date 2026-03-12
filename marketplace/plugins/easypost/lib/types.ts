export interface SourceOptions {
  api_key: string;
}

export interface EasyPostError {
  error: {
    code?: string;
    message: string;
    errors?: Array<{
      field?: string;
      message?: string;
    }>;
  };
}