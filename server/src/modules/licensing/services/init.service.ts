import { Injectable } from '@nestjs/common';
import License from '@modules/licensing/configs/License';
import { EntityManager } from 'typeorm';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseInitService as ILicenseInitService } from '../interfaces/IService';
import { getLicenseFieldValue } from '../helper';
import LicenseBase from '../configs/LicenseBase';

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

  async initForCloud(): Promise<void> {
    throw new Error('License initialization for cloud is not supported');
  }

  getLicenseFieldValue(type: LICENSE_FIELD, licenseInstance: LicenseBase): Promise<any> {
    return getLicenseFieldValue(type, licenseInstance);
  }
}
