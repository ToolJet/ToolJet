import { ClassSerializerInterceptor, Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LicenseService } from '../service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { ILicensePlansController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';
import { PlanCatalogDto } from '../dto/plan-catalog.dto';

@InitModule(MODULES.LICENSING)
@UseGuards(FeatureAbilityGuard)
@Controller('license')
export class LicensePlansController implements ILicensePlansController {
  constructor(protected readonly licenseService: LicenseService) {}

  @InitFeature(FEATURE_KEY.GET_PLANS)
  /* Public API */
  @Get('plans')
  async plans(): Promise<any> {
    return await this.licenseService.plans();
  }

  // Declared once here; the EE controller inherits it.
  @InitFeature(FEATURE_KEY.GET_PLAN_CATALOG)
  /* Public API */
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('plan-catalog')
  planCatalog(): PlanCatalogDto {
    return plainToInstance(PlanCatalogDto, this.licenseService.planCatalog());
  }
}
