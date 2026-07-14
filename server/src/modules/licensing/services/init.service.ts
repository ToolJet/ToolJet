import { Injectable } from '@nestjs/common';
import License from '@modules/licensing/configs/License';
import { EntityManager } from 'typeorm';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseInitService as ILicenseInitService } from '../interfaces/IService';
import { getLicenseFieldValue } from '../helper';
import LicenseBase from '../configs/LicenseBase';

@Injectable()
export class LicenseInitService extends ILicenseInitService {
  /**
   * IMPORTANT: Do not modify this function signature - it is used in data migrations.
   *
   * Used in migrations:
   * - 1720434737529-MigrateCustomGroupToNewUserGroup.ts
   * - 1742369617678-EnforceNewBasicPlanLimits.ts
   * - 1720352990850-CreateDefaultGroupInExistingWorkspace.ts
   */
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

  isEnvConfigured(): boolean {
    return false;
  }

  isUsingEnvLicense(): boolean {
    return false;
  }

  setUseEnvLicense(_value: boolean): void {
    return;
  }
}
