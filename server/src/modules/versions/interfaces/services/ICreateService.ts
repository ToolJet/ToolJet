import { AppVersion } from '@entities/app_version.entity';
import { EntityManager } from 'typeorm';

export interface IVersionsCreateService {
  setupNewVersion(
    appVersion: AppVersion,
    versionFrom: AppVersion,
    organizationId: string,
    manager: EntityManager
  ): Promise<void>;
}
