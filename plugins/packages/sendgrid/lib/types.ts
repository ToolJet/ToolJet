export interface EmailOptions {
  to: string[];
  from: string | { email: string; name: string };
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
  send_mail_from_name?: string;
  subject: string;
  text: string;
  multiple_recipients: boolean;
  html: string;
};
