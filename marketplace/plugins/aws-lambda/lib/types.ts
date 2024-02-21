export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
};

export type QueryOptions = {
  operation?: Operation;
  functionName?: string;
  payload?: any; // Adjust based on the expected payload structure
};

export enum Operation {
  InvokeLambda = 'invoke_lambda'
}