export type SourceOptions = {
  host: string;
  port: string;
  user: string;
  password: string;
};
type MailAddress = string | { name?: string; address: string };
type MailAddresses = MailAddress | MailAddress[];
export type QueryOptions = {
  operation: string;
  from: string;
  from_name: string;
  to: MailAddresses;
  cc: MailAddresses;
  bcc: MailAddresses;
  subject: string;
  textContent: string;
  htmlContent: string;
  attachment_array?: string | { name: string; dataURL: string }[];
};
