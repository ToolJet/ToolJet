import { ListSMTPDto, UpdateSMTPSettingsDto, UpdateSmtpEnvSettingChangedDto, UpdateSmtpStatusChangedDto } from '../dto';

export interface SmtpControllerInterface {
  getSMTPSettings(): Promise<ListSMTPDto>;

  updateSmtpSettings(updateSmtpSettingsDto: UpdateSMTPSettingsDto): Promise<void>;

  updateSmtpEnvSetting(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto): Promise<void>;

  updateSmtpEnvStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto): Promise<void>;
}
