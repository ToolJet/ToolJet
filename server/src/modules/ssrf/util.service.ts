import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { INSTANCE_SETTINGS_TYPE } from '@modules/instance-settings/constants';
import { SSRF_SETTINGS } from './constants';

/**
 * Writes this module's rows in instance_settings. Reads go through the instance-settings module's util
 * service; writes stay here so that module carries no SSRF code.
 */
@Injectable()
export class SsrfUtilService {
  async saveSettings(values: Partial<Record<SSRF_SETTINGS, string>>): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      for (const [key, value] of Object.entries(values)) {
        const { affected } = await manager.update(
          InstanceSettings,
          { key, type: INSTANCE_SETTINGS_TYPE.SYSTEM },
          { value }
        );
        if (!affected) throw new NotFoundException(`Instance setting ${key} is missing`);
      }
    });
  }
}
