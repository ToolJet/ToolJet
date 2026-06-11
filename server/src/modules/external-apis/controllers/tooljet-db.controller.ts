import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { ExportTjdbTableAsCsvDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisTjdbController {
  exportTableAsCSV(
    workspaceId: string,
    tableName: string,
    exportDto: ExportTjdbTableAsCsvDto,
    response: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
