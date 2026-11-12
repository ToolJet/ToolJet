import { Controller, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { ListWorkspacesV2QueryDto, UpdateWorkspaceV2Dto } from './dto/v2';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.ORGANIZATIONS)
// No @UseGuards here: inherited guards would run before the Enterprise auth guard.
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
