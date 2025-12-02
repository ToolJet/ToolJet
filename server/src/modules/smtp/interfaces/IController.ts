import { User } from '@entities/user.entity';
import { ListSMTPDto, UpdateSMTPSettingsDto, UpdateSmtpEnvSettingChangedDto, UpdateSmtpStatusChangedDto } from '../dto';

export interface SmtpControllerInterface {
  getSMTPSettings(): Promise<ListSMTPDto>;

  updateSmtpSettings(updateSmtpSettingsDto: UpdateSMTPSettingsDto, user: User): Promise<void>;

  updateSmtpEnvSetting(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto, user: User): Promise<void>;

  updateSmtpEnvStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto, user: User): Promise<void>;
}
