export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
};

export type QueryOptions = {
  operation: string;
  send_mail_to: string[];
  send_mail_from: string;
  cc_to: string[];
  bcc_to: string[];
  reply_to: string[];
  subject: string;
  text: string;
  html: string;
};
