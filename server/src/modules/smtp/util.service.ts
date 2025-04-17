import { Injectable } from "@nestjs/common";
import { ISMTPUtilService } from "./interfaces/IUtilService";

@Injectable()
export class SMTPUtilService implements ISMTPUtilService {
  getSmtpEnv(key?: string | string[], getAllData = false, type?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
}