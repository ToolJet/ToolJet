import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { ExportAppAdminDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisAppExportController {
  exportApp(_exportAppAdminDto: ExportAppAdminDto): Promise<object> {
    throw new Error('Method not implemented.');
  }
}
