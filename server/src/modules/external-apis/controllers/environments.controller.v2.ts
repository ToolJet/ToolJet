import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisEnvironmentsControllerV2 } from '../Interfaces/IController';
import { ListEnvironmentsV2ResponseDto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisEnvironmentsControllerV2 implements IExternalApisEnvironmentsControllerV2 {
  listEnvironments(workspaceIdentifier: string): Promise<ListEnvironmentsV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
}
