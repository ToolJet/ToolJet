import { User } from '@entities/user.entity';
import { ListSMTPDto, UpdateSmtpEnvSettingChangedDto, UpdateSMTPSettingsDto, UpdateSmtpStatusChangedDto } from '../dto';

export interface SMTPServiceInterface {
  get(): Promise<ListSMTPDto>;

  update(updateSmtpSettingsDto: UpdateSMTPSettingsDto, user: User): Promise<void>;

  updateEnvSettings(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto, user: User): Promise<void>;

  updateStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto, user: User): Promise<void>;
}
