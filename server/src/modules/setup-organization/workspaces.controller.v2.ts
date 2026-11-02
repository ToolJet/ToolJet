import { Controller, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { CreateWorkspaceV2Dto } from '@modules/organizations/dto/v2';

// External API v2 create workspace, beside the dashboard's create so both use the same workspace setup.
@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.ORGANIZATIONS)
// No class-level guards: @UseGuards metadata is inherited and appended, so guards declared here would run
// before the Enterprise controller's ExternalApiAuthGuard. The CE stub registers no routes.
@UseInterceptors(ClassSerializerInterceptor)
export class SetupOrganizationsWorkspacesControllerV2 {
  createWorkspace(dto: CreateWorkspaceV2Dto, user?: UserEntity): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
