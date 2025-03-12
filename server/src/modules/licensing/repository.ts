import { InstanceSettings } from '@entities/instance_settings.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class LicenseRepository {
  getLicense(manager?: EntityManager): Promise<InstanceSettings> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOneOrFail(InstanceSettings, { where: { key: 'LICENSE_KEY' } });
    }, manager);
  }
}
