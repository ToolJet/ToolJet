export type SourceOptions = {
  auth_type: 'public' | 'private';
  apiKey?: string;
};

export enum Operation {
  GetConversationToken = 'get_conversation_token',
  GetSignedUrl = 'get_signed_url',
}

export type QueryOptions = {
  operation: Operation;
  agent_id: string;
};
