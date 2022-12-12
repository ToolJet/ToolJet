export interface EmailOptions {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
}
export type SourceOptions = {
  api_key: string;
  domain: string;
  eu_hosted: boolean;
};
export type QueryOptions = {
  operation: string;
  send_mail_to: string[];
  send_mail_from: string;
  subject: string;
  text: string;
  html: string;
};
