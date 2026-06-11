import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetadataService } from '@modules/meta/service';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { IMetadataController } from './interfaces/IController';

@InitModule(MODULES.METADATA)
@UseGuards(FeatureAbilityGuard)
@Controller('metadata')
export class MetadataController implements IMetadataController {
  constructor(protected readonly metadataService: MetadataService) {}

  @InitFeature(FEATURE_KEY.GET_METADATA)
  @UseGuards(FeatureAbilityGuard)
  @Get()
  async getMetadata() {
    return await this.metadataService.getMetadata();
  }
}
