import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { LicenseWorkflowsService } from '../services/workflows.service';
import { ILicenseWorkflowsController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

@Controller('license/workflows')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseWorkflowsController implements ILicenseWorkflowsController {
  constructor(protected readonly licenseWorkflowsService: LicenseWorkflowsService) {}

  @InitFeature(FEATURE_KEY.GET_WORKFLOW_LIMITS)
  @Get('limits/:limitFor')
  async getWorkflowLimit(@User() user: UserEntity, @Param('limitFor') limitFor: string) {
    // limitFor - instance | workspace
    const params = {
      limitFor: limitFor,
      workspaceId: user.organizationId,
    };

    return await this.licenseWorkflowsService.getWorkflowLimit(params);
  }
}
