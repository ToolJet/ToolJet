import widgets from '@modules/apps/services/widget-config';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from './service';
import { IConfigController } from '@modules/configs/interfaces/IController';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';

@InitModule(MODULES.CONFIGS)
@Controller('config')
export class ConfigController implements IConfigController {
  constructor(protected configService: ConfigService) {}

  @InitFeature(FEATURE_KEY.GET_PUBLIC_CONFIGS)
  @UseGuards(FeatureAbilityGuard)
  @Get()
  index() {
    return this.configService.public_config();
  }

  @InitFeature(FEATURE_KEY.GET_WIDGETS)
  @UseGuards(FeatureAbilityGuard)
  @Get('/widgets')
  getWidgets() {
    return widgets;
  }
}
