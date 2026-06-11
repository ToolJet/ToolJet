import { InstanceSettings } from '@entities/instance_settings.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { RequestContext } from '@modules/request-context/service';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

const REQUEST_MEMO_KEY = 'tj_license_setting';

@Injectable()
export class LicenseRepository {
  async getLicense(manager?: EntityManager): Promise<InstanceSettings> {
    // skip memo for tx-bound manager — caller owns isolation
    if (manager) {
      return manager.findOneOrFail(InstanceSettings, { where: { key: 'LICENSE_KEY' } });
    }

    const ctx = RequestContext.currentContext;
    const cached = ctx?.res?.locals?.[REQUEST_MEMO_KEY] as InstanceSettings | undefined;
    if (cached) return cached;

    const setting = await dbTransactionWrap((m: EntityManager) => {
      return m.findOneOrFail(InstanceSettings, { where: { key: 'LICENSE_KEY' } });
    });

    if (ctx) RequestContext.setLocals(REQUEST_MEMO_KEY, setting);
    return setting;
  }
}
