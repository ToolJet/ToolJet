export type SourceOptions = {
  endpoint: string;
  signingKey:string;
  apiSecret: string;
  apiKey: string;
};

export type QueryOptions = {
  operation: Operation;
  identifier?: string;
  profile?: object;
  notification_title?: string;
  message?:string;
  url?: string;
  icon?:string;
  reciepient?: string;
  data?: any;
  category?: string;
  override?: any;
};

export enum Operation {
  createOrUpdateUser = 'create_or_update_user',
  sendNotification = 'send_notification',
  generateUserToken = 'generate_user_token'
}

export interface IEngagespotClientOptions{
  baseUrl?: string;
  signingKey?:string;
  apiSecret: string;
  apiKey: string;
}