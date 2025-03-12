import { Injectable } from '@nestjs/common';
import { ListSMTPDto, UpdateSmtpEnvSettingChangedDto, UpdateSMTPSettingsDto, UpdateSmtpStatusChangedDto } from './dto';
import { SMTPServiceInterface } from './interfaces/IService';

@Injectable()
export class SMTPService implements SMTPServiceInterface {
  get(): Promise<ListSMTPDto> {
    throw new Error('Method not implemented.');
  }
  update(updateSmtpSettingsDto: UpdateSMTPSettingsDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateEnvSettings(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
