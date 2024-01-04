export type SourceOptions = {
  apiKey: string;
  organizationId?: string;
};

export type QueryOptions = {
  operation: Operation;
  prompt?: string;
  max_tokens?: number | string;
  temperature?: number | string;
  stop_sequence?: string;
  suffix?: string | null;
};

export enum Operation {
  Completion = 'completion',
  Chat = 'chat',
}
