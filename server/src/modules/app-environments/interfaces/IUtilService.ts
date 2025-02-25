import { EntityManager, DeleteResult } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { OrganizationConstantType } from '@modules/organization-constants/constants';

export interface IAppEnvironmentUtilService {
  getByPriority(organizationId: string, ASC?: boolean, manager?: EntityManager): Promise<AppEnvironment>;
  updateOptions(options: object, environmentId: string, dataSourceId: string, manager?: EntityManager): Promise<void>;
  createDefaultEnvironments(organizationId: string, manager?: EntityManager): Promise<void>;
  getEnvironmentByName(name: string, organizationId: string, manager?: EntityManager): Promise<AppEnvironment>;
  getAllEnvironments(organizationId: string, manager?: EntityManager): Promise<AppEnvironment[]>;
  calculateButtonVisibility(
    isMultiEnvironmentEnabled: boolean,
    appVersionEnvironment?: AppEnvironment,
    appId?: string,
    versionId?: string,
    manager?: EntityManager
  ): Promise<{ shouldRenderPromoteButton: boolean; shouldRenderReleaseButton: boolean }>;
  getSelectedVersion(selectedEnvironmentId: string, appId: string, manager?: EntityManager): Promise<any>;
  get(
    organizationId: string,
    id?: string,
    priorityCheck?: boolean,
    manager?: EntityManager,
    licenseCheck?: boolean
  ): Promise<AppEnvironment>;
  getAll(organizationId: string, appId?: string, manager?: EntityManager): Promise<AppEnvironment[]>;
  getOptions(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSourceOptions>;
}
