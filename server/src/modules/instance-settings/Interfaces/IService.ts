import { CreateInstanceSettingsDto, UpdateUserSettingsDto } from '../dto';
import { InstanceSettings } from '@entities/instance_settings.entity';

export interface IInstanceSettingsService {
  listSettings(): Promise<any>;

  create(params: CreateInstanceSettingsDto): Promise<InstanceSettings>;

  update(params: UpdateUserSettingsDto): Promise<void>;

  delete(settings_id: string): Promise<void>;
}
