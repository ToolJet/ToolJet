import { ListSMTPDto, UpdateSmtpEnvSettingChangedDto, UpdateSMTPSettingsDto, UpdateSmtpStatusChangedDto } from '../dto';

export interface SMTPServiceInterface {
  get(): Promise<ListSMTPDto>;

  update(updateSmtpSettingsDto: UpdateSMTPSettingsDto): Promise<void>;

  updateEnvSettings(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto): Promise<void>;

  updateStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto): Promise<void>;
}
