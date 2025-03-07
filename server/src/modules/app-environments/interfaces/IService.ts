import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppEnvironmentActionParametersDto } from '../dto';
import { IAppEnvironmentResponse } from './IAppEnvironmentResponse';
import { EntityManager } from 'typeorm';

export interface IAppEnvironmentService {
  init(editingVersionId: string, organizationId: string): Promise<IAppEnvironmentResponse>;
  processActions(
    organizationId: string,
    action: string,
    actionParameters: AppEnvironmentActionParametersDto
  ): Promise<any>;
  get(
    organizationId: string,
    id?: string,
    priorityCheck?: boolean,
    licenseCheck?: boolean,
    manager?: EntityManager
  ): Promise<AppEnvironment>;
  create(organizationId: string, name: string, isDefault?: boolean, priority?: number): Promise<AppEnvironment>;
  update(id: string, name: string, organizationId: string): Promise<any>;
  getAll(organizationId: string, appId?: string): Promise<AppEnvironment[]>;
  getVersionsByEnvironment(organizationId: string, appId: string, currentEnvironmentId?: string): Promise<AppVersion[]>;
  delete(id: string, organizationId: string): Promise<any>;
  getVersion(id: string): Promise<AppVersion>;
}
