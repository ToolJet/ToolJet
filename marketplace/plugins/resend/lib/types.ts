export type SourceOptions = {
  apiKey: string;
};

export type QueryOptions = {
  operation: string;
  from?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  scheduled_at?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
  }>;
  batch?: Array<any>;
  email_id?: string;
  domain_id?: string;
  name?: string;
  region?: string;
  audience_id?: string;
  contact_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  unsubscribed?: boolean;
  broadcast_id?: string;
  [key: string]: any;
};
