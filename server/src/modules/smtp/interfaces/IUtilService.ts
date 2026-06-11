export interface ISMTPUtilService {
  getSmtpEnv(
    key?: string | string[],
    getAllData?: boolean,
    type?: any
  ): Promise<any>;
}