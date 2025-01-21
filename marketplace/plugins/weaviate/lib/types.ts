export interface SourceOptions {
  instanceUrl: string;
  apiKey: string;
}

export interface QueryOptions {
  operation: Operation;
  className?: string;
  objectId?: string;
  properties?: Record<string, any>;
}

export enum Operation {
  GetSchema = 'GetSchema',
  CreateClass = 'CreateClass',
  ListObjects = 'ListObjects',
  CreateObject = 'CreateObject',
}
