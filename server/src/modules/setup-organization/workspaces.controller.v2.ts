import { Controller, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { CreateWorkspaceV2Dto } from '@modules/organizations/dto/v2';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.ORGANIZATIONS)
// No @UseGuards here: inherited guards would run before the Enterprise auth guard.
@UseInterceptors(ClassSerializerInterceptor)
export class SetupOrganizationsWorkspacesControllerV2 {
  createWorkspace(dto: CreateWorkspaceV2Dto, user?: UserEntity): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
