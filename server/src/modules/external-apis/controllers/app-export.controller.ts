import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisAppExportController {
  exportApp(_appId: string, _appSlug: string): Promise<object> {
    throw new Error('Method not implemented.');
  }
}
