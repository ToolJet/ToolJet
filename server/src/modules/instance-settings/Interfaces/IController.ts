import { User } from '@entities/user.entity';
import { CreateInstanceSettingsDto, UpdateUserSettingsDto } from '../dto';

export interface IInstanceSettingsController {
  get(): Promise<object>;
  create(body: CreateInstanceSettingsDto): Promise<void>;
  update(body: UpdateUserSettingsDto, user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
