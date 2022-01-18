export interface EmailOptions {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
  isMultiple: boolean;
}
