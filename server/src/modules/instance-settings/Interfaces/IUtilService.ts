import { INSTANCE_SETTINGS_TYPE } from '../constants';
import { UpdateUserSettingsDto } from '../dto';
import { UpdateSystemSettingsDto } from '../types';

export interface IInstanceSettingsUtilService {
  getSettings(
    key?: string | string[],
    getAllData?: boolean,
    type?: INSTANCE_SETTINGS_TYPE.USER | INSTANCE_SETTINGS_TYPE.SYSTEM
  ): Promise<any>;

  updateSystemParams(params: UpdateSystemSettingsDto): Promise<void>;

  updateUserParams(params: UpdateUserSettingsDto): Promise<void>;
}
