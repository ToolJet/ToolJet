import { Injectable } from '@nestjs/common';
import { ListSMTPDto, UpdateSmtpEnvSettingChangedDto, UpdateSMTPSettingsDto, UpdateSmtpStatusChangedDto } from './dto';
import { SMTPServiceInterface } from './interfaces/IService';
import { User } from '@entities/user.entity';

@Injectable()
export class SMTPService implements SMTPServiceInterface {
  get(): Promise<ListSMTPDto> {
    throw new Error('Method not implemented.');
  }
  update(updateSmtpSettingsDto: UpdateSMTPSettingsDto, user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateEnvSettings(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto, user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto, user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
