import { Injectable } from '@nestjs/common';
import License from '@modules/licensing/configs/License';
import { EntityManager } from 'typeorm';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseInitService as ILicenseInitService } from '../interfaces/IService';
import { getLicenseFieldValue } from '../helper';

@Injectable()
export class LicenseInitService extends ILicenseInitService {
  async initForMigration(manager?: EntityManager): Promise<{ isValid: boolean }> {
    License.Reload('', new Date());
    return { isValid: false };
  }

  async init(): Promise<void> {
    console.log('Skip license initialization');
    License.Reload('', new Date());
    return;
  }

  getLicenseFieldValue(type: LICENSE_FIELD): any {
    return getLicenseFieldValue(type, License.Instance());
  }
}
