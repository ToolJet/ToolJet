import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';
import { AppUpdateDto } from '../dto';
import { AppEnvironment } from '@entities/app_environments.entity';
import { AppBase } from '@entities/app_base.entity';
export interface IAppsUtilService {
  create(name: string, user: User, type: string, manager: EntityManager): Promise<App>;
  findAppWithIdOrSlug(slug: string, organizationId: string): Promise<App>;
  validateVersionEnvironment(
    environmentName: string,
    environmentId: string,
    currentEnvIdOfVersion: string,
    organizationId: string
  ): Promise<AppEnvironment>;
  getAppOrganizationDetails(app: App): Promise<Organization>;
  update(app: App, appUpdateDto: AppUpdateDto, organizationId?: string, manager?: EntityManager): Promise<void>;
  all(user: User, page: number, searchKey: string, type: string): Promise<AppBase[]>;
  count(user: User, searchKey: string, type: string): Promise<number>;
  mergeDefaultComponentData(pages: any[]): any[];
}
