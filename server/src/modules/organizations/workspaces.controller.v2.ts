import { Controller, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { ListWorkspacesV2QueryDto, UpdateWorkspaceV2Dto } from './dto/v2';

// External API v2 Workspaces, beside the dashboard's organizations routes so both share one service.
// Create lives in setup-organization, next to the dashboard's create.
@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.ORGANIZATIONS)
// No class-level guards: @UseGuards metadata is inherited and appended, so guards declared here would run
// before the Enterprise controller's ExternalApiAuthGuard. The CE stub registers no routes.
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationsWorkspacesControllerV2 {
  listWorkspaces(
    query: ListWorkspacesV2QueryDto,
    request: Request,
    response: Response,
    user?: UserEntity
  ): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  getWorkspace(workspaceIdentifier: string, user?: UserEntity): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  updateWorkspace(workspaceIdentifier: string, dto: UpdateWorkspaceV2Dto): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  archiveWorkspace(workspaceIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  unarchiveWorkspace(workspaceIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setDefaultWorkspace(workspaceIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
