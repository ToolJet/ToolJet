import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisWorkspaceUsersControllerV2 } from '../Interfaces/IController';
import {
  CreateWorkspaceUserV2Dto,
  UpdateWorkspaceUserV2Dto,
  BulkUpdateWorkspaceUsersV2Dto,
  ListWorkspaceUsersV2QueryDto,
  ListWorkspaceUserGroupsV2QueryDto,
} from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisWorkspaceUsersControllerV2 implements IExternalApisWorkspaceUsersControllerV2 {
  createWorkspaceUser(workspaceIdentifier: string, dto: CreateWorkspaceUserV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  bulkCreateWorkspaceUsers(workspaceIdentifier: string, body: any, file?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listWorkspaceUsers(workspaceIdentifier: string, query: ListWorkspaceUsersV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateWorkspaceUser(
    workspaceIdentifier: string,
    userIdentifier: string,
    dto: UpdateWorkspaceUserV2Dto
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  bulkUpdateWorkspaceUsers(workspaceIdentifier: string, dto: BulkUpdateWorkspaceUsersV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  archiveWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  unarchiveWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listWorkspaceUserGroups(
    workspaceIdentifier: string,
    userIdentifier: string,
    query: ListWorkspaceUserGroupsV2QueryDto
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
