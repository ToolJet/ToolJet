import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisTjdbController {
  exportTableAsCSV(
    workspaceId: string,
    tableName: string,
    limit: number,
    offset: number,
    response: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
