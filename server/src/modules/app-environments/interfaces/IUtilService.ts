import { EntityManager } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { IAppEnvironmentResponse } from './IAppEnvironmentResponse';
import { AppVersion } from '@entities/app_version.entity';

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
  init(
    editorVersion: Partial<AppVersion>,
    organizationId: string,
    isMultiEnvironmentEnabled: boolean,
    manager?: EntityManager
  ): Promise<IAppEnvironmentResponse>;
}
