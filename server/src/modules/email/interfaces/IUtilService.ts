export interface IEmailUtilService {
  retrieveWhiteLabelSettings(): Promise<any>;
  retrieveSmtpSettings(): Promise<any>;
}
