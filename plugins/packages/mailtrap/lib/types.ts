export type SendingStream = 'transactional' | 'bulk' | 'sandbox';

export type SourceOptions = {
  api_token: string;
  sending_stream: SendingStream;
  inbox_id?: string;
};

export type Address = {
  email: string;
  name?: string;
};

export type FileInput = {
  name?: string;
  filename?: string;
  type?: string;
  base64Data?: string;
  dataURL?: string;
  content?: string;
};

export type Attachment = {
  filename: string;
  content: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
};

export type QueryOptions = {
  operation: 'send_email' | 'send_template_email';
  from_email: string;
  from_name?: string;
  to: unknown;
  cc?: unknown;
  bcc?: unknown;
  reply_to?: string;
  subject?: string;
  text?: string;
  html?: string;
  category?: string;
  template_uuid?: string;
  template_variables?: unknown;
  custom_variables?: unknown;
  headers?: unknown;
  attachments?: unknown;
};

export type SendPayload = {
  from: Address;
  to: Address[];
  cc?: Address[];
  bcc?: Address[];
  reply_to?: Address;
  subject?: string;
  text?: string;
  html?: string;
  category?: string;
  template_uuid?: string;
  template_variables?: Record<string, unknown>;
  custom_variables?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  attachments?: Attachment[];
};
