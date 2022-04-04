export interface EmailOptions {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
  isMultiple: boolean;
}
export type SourceOptions = {
  api_key: string;
};
export type QueryOptions = {
  operation: string;
  send_mail_to: string[];
  send_mail_from: string;
  subject: string;
  text: string;
  multiple_recipients: boolean;
  html: string;
};
