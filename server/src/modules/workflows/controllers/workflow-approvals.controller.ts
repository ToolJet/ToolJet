import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/app/guard';
import { User } from '@modules/app/decorators/user.decorator';
import { WorkflowApprovalsService } from '@modules/workflows/services/workflow-approvals.service';
import { ResolveApprovalDto } from '@modules/workflows/dto/resolve-approval.dto';

@Controller('workflow-approvals')
@InitModule(MODULES.WORKFLOWS)
export class WorkflowApprovalsController {
  constructor(private readonly approvalsService: WorkflowApprovalsService) {}

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @Get(':token')
  async get(@Param('token') token: string) {
    return this.approvalsService.getByToken(token);
  }

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @Post(':token/resolve')
  async resolve(@Param('token') token: string, @Body() dto: ResolveApprovalDto) {
    return this.approvalsService.resolve(token, dto);
  }

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @User() user) {
    return this.approvalsService.cancel(id, user);
  }
}
