import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/app/guard';
import { User } from '@modules/app/decorators/user.decorator';
import { ResolveApprovalDto } from '@modules/workflows/dto/resolve-approval.dto';
import { ListApprovalsDto } from '@modules/workflows/dto/list-approvals.dto';
import { ApprovalListItem } from '@modules/workflows/types/approval-list';

@Controller('workflow-approvals')
@InitModule(MODULES.WORKFLOWS)
export class WorkflowApprovalsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.LIST_APPROVAL_REQUESTS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  // Explicit return type to match the EE override (see the note on resolve below).
  async list(
    @Query() query: ListApprovalsDto,
    @User() user?: any
  ): Promise<{ requests: ApprovalListItem[]; meta: { page: number; perPage: number; total: number } }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @Get(':token')
  async get(@Param('token') token: string) {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_APPROVAL_REQUESTS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('by-id/:id/resolve')
  // Explicit return type to match the EE override (see the note on resolve below).
  async resolveById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveApprovalDto,
    @User() user: any
  ): Promise<{ status: 'resolved' }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @Post(':token/resolve')
  // Return type must match the EE override (which returns the resolve result), or the EE
  // subclass trips TS2416 (its concrete return isn't assignable to an inferred Promise<void>).
  async resolve(@Param('token') token: string, @Body() dto: ResolveApprovalDto): Promise<{ status: 'resolved' }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post(':id/cancel')
  // Explicit return type to match the EE override (see the note on resolve above).
  async cancel(@Param('id', ParseUUIDPipe) id: string, @User() user): Promise<{ status: 'cancelled' }> {
    throw new Error('Method not implemented.');
  }
}
