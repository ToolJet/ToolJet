import { CreateInstanceSettingsDto, UpdateUserSettingsDto } from './dto';
import { IInstanceSettingsService } from './Interfaces/IService';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstanceSettingsService implements IInstanceSettingsService {
  constructor() {}
  listSettings(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  create(params: CreateInstanceSettingsDto): Promise<InstanceSettings> {
    throw new Error('Method not implemented.');
  }
  update(params: UpdateUserSettingsDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(settings_id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
