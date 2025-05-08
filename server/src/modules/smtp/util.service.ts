import { Injectable } from '@nestjs/common';
import { ISMTPUtilService } from './interfaces/IUtilService';
import { getDefaultInstanceSettings } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';

@Injectable()
export class SMTPUtilService implements ISMTPUtilService {
  constructor(protected instanceSettingsUtilService: InstanceSettingsUtilService) {}
  async getSmtpEnv(key?: string | string[], getAllData = false, type?: any): Promise<any> {
    const defaultInstanceSettings = getDefaultInstanceSettings();
    const instanceSmtpConfig = await this.instanceSettingsUtilService.getSettings(key, false, type);

    if (instanceSmtpConfig.SMTP_ENV_CONFIGURED === 'true') {
      let settings = Object.keys(defaultInstanceSettings)
        .filter((e) => (Array.isArray(key) ? key.includes(e) : key === e))
        .map((e) => ({ key: e, value: defaultInstanceSettings[e] }));

      if (!settings) {
        settings = [];
      }

      if (key) {
        (Array.isArray(key) ? key : [key]).forEach((s) => {
          if (!settings.some((e) => e.key === s)) {
            settings.push({ key: s, value: null });
          }
        });
      }

      const instanceConfigs = {};
      settings?.forEach((config) => {
        instanceConfigs[config.key] = getAllData ? config : config.value;
      });

      return Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
    }

    return instanceSmtpConfig;
  }
}
