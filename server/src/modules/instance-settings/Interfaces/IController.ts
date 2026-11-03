import { User } from '@entities/user.entity';
import {
  CreateInstanceSettingsDto,
  SsrfSettingsResponseDto,
  UpdateSsrfSettingsDto,
  UpdateUserSettingsDto,
} from '../dto';

export interface IInstanceSettingsController {
  get(): Promise<object>;
  create(body: CreateInstanceSettingsDto): Promise<void>;
  update(body: UpdateUserSettingsDto, user: User): Promise<void>;
  delete(id: string): Promise<void>;
  getSsrfSettings(): Promise<SsrfSettingsResponseDto>;
  updateSsrfSettings(body: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto>;
  dismissSsrfUpgradeNotice(): Promise<void>;
}
