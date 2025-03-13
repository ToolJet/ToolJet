import { CreateAppEnvironmentDto, UpdateAppEnvironmentDto, AppEnvironmentActionParametersDto } from '../dto';

export interface IAppEnvironmentsController {
  init(user: any, editingVersionId: string): Promise<any>;
  environmentActions(
    user: any,
    action: string,
    appEnvironmentActionParametersDto: AppEnvironmentActionParametersDto
  ): Promise<any>;
  index(user: any, appId: string): Promise<any>;
  getDefaultEnvironment(user: any, req: any): Promise<any>;
  getVersionsByEnvironment(user: any, environmentId: string, appId: string): Promise<{ appVersions: any }>;
  create(user: any, versionId: string, createAppEnvironmentDto: CreateAppEnvironmentDto): Promise<any>;
  update(user: any, id: string, versionId: string, updateAppEnvironmentDto: UpdateAppEnvironmentDto): Promise<any>;
  delete(user: any, id: string, versionId: string): Promise<any>;
  getEnvironmentById(user: any, id: string): Promise<any>;
}
