import { User } from '@entities/user.entity';
import {
  CreateInstanceSettingsDto,
  SsrfSettingsResponseDto,
  UpdateSsrfSettingsDto,
  UpdateUserSettingsDto,
} from '../dto';
import { InstanceSettings } from '@entities/instance_settings.entity';

export interface IInstanceSettingsService {
  listSettings(): Promise<any>;

  create(params: CreateInstanceSettingsDto): Promise<InstanceSettings>;

  update(params: UpdateUserSettingsDto, user: User): Promise<void>;

  delete(settings_id: string): Promise<void>;

  getSsrfSettings(): Promise<SsrfSettingsResponseDto>;

  updateSsrfSettings(params: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto>;

  dismissSsrfUpgradeNotice(): Promise<void>;
}
