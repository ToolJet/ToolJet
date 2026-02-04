export type SourceOptions = {
  apiLoginId: string;
  transactionKey: string;
  environment: 'sandbox' | 'production';
};

export type QueryOptions = {
  operation: string;
  requestBody?: string;
};
