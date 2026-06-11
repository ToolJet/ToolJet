import { getDefaultInstanceSettings } from './constants';
import { IInstanceSettingsUtilService } from './Interfaces/IUtilService';
import { UpdateSystemSettingsDto } from './types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstanceSettingsUtilService implements IInstanceSettingsUtilService {
  updateSystemParams(params: UpdateSystemSettingsDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateUserParams(params): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async getSettings(key?: string | string[], getAllData = false, type?: any): Promise<any> {
    const defaultInstanceSettings = getDefaultInstanceSettings();
    let settings = Object.keys(defaultInstanceSettings)
      .filter((e) => (Array.isArray(key) ? key.includes(e) : key === e))
      .map((e) => ({ key: e, value: defaultInstanceSettings[e] }));

    if (!settings) {
      settings = [];
    }
    (Array.isArray(key) ? key : [key]).forEach((s) => {
      if (!settings.some((e) => e.key === s)) {
        // Key is not included on settings, adding empty value
        settings.push({ key: s, value: null });
      }
    });

    const instanceConfigs = {};
    settings?.forEach((config) => {
      instanceConfigs[config.key] = getAllData ? config : config.value;
    });

    const res = Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
    return res;
  }
}
