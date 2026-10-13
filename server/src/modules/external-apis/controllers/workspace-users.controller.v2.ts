import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisWorkspaceUsersControllerV2 } from '../Interfaces/IController';
import { UpdateWorkspaceUserV2Dto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisWorkspaceUsersControllerV2 implements IExternalApisWorkspaceUsersControllerV2 {
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
}
