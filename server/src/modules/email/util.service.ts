import { IEmailUtilService } from '@modules/email/interfaces/IUtilService';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { WhiteLabellingUtilService } from '@modules/white-labelling/util.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailUtilService implements IEmailUtilService {
  constructor(
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly whiteLabellingUtilService: WhiteLabellingUtilService
  ) {}

  async retrieveWhiteLabelSettings(organizationId?: string | null): Promise<any> {
    const whiteLabelSetting = await this.whiteLabellingUtilService.getProcessedSettings(organizationId);
    return whiteLabelSetting;
  }

  async retrieveSmtpSettings(): Promise<any> {
    const smtpSetting = await this.instanceSettingsUtilService.getSettings(
      [
        INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED,
        INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PORT,
        INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME,
        INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD,
        INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL,
        INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED,
      ],
      false,
      INSTANCE_SETTINGS_TYPE.SYSTEM
    );
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] = smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] === 'true';
    smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] =
      smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED] === 'true'
        ? process.env.DEFAULT_FROM_EMAIL
        : smtpSetting[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL] || 'hello@tooljet.io';
    return smtpSetting;
  }
}
