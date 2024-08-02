import { Injectable } from '@nestjs/common';
import { defaultInstanceSettings } from '@instance_settings/constants';

@Injectable()
export class InstanceSettingsService {
  async getSettings(key?: string | string[], getAllData = false, type?: any): Promise<any> {
    const settings = Object.keys(defaultInstanceSettings)
      .filter((e) => (Array.isArray(key) ? key.includes(e) : key === e))
      .map((e) => ({ key: e, value: defaultInstanceSettings[e] }));

    const instanceConfigs = {};
    settings?.forEach((config) => {
      instanceConfigs[config.key] = getAllData ? config : config.value;
    });

    const res = Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
    return res;
  }
}
