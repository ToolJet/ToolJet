export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
  useInstanceMetadataCredentials?: boolean;
  roleArn?: string;
};

export type QueryOptions = {
  operation: string;
  send_mail_to: string[];
  send_mail_from: string;
  cc_to: string[];
  bcc_to: string[];
  reply_to: string[];
  subject: string;
  body: string;
};

export type AssumeRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
