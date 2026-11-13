import { SsrfSettingsResponseDto, UpdateSsrfSettingsDto } from '../dto';

export interface ISsrfService {
  getSettings(): Promise<SsrfSettingsResponseDto>;
  updateSettings(params: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto>;
  dismissUpgradeNotice(): Promise<void>;
}
