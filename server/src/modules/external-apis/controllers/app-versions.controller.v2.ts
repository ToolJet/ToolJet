import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisVersionsControllerV2 } from '../Interfaces/IController';
import { ListAppVersionsV2QueryDto, ListAppVersionsV2ResponseDto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisAppVersionsControllerV2 implements IExternalApisVersionsControllerV2 {
  listVersions(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    query: ListAppVersionsV2QueryDto
  ): Promise<ListAppVersionsV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
}
