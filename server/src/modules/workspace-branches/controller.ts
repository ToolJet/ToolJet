import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { WorkspaceBranchService } from './service';
import { CreateBranchDto, WorkspacePushDto, WorkspacePullDto, EnsureDraftDto } from './dto';
import { IWorkspaceBranchController } from './interfaces/IController';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from './ability/guard';

@InitModule(MODULES.WORKSPACE_BRANCHES)
@Controller('workspace-branches')
export class WorkspaceBranchController implements IWorkspaceBranchController {
  constructor(protected workspaceBranchService: WorkspaceBranchService) {}

  @InitFeature(FEATURE_KEY.LIST_BRANCHES)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  async list(@User() user) {
    return this.workspaceBranchService.list(user.organizationId);
  }

  @InitFeature(FEATURE_KEY.CHECK_UPDATES)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('check-updates')
  async checkForUpdates(@User() user, @Query('branch') branch?: string) {
    return this.workspaceBranchService.checkForUpdates(user.organizationId, branch);
  }

  @InitFeature(FEATURE_KEY.CREATE_BRANCH)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  async create(@User() user, @Body() dto: CreateBranchDto) {
    return this.workspaceBranchService.createBranch(user.organizationId, dto, user);
  }

  @InitFeature(FEATURE_KEY.SWITCH_BRANCH)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put(':id/activate')
  async switchBranch(@User() user, @Param('id') branchId: string, @Body() body?: { appId?: string }) {
    return this.workspaceBranchService.switchBranch(user.organizationId, branchId, body?.appId);
  }

  @InitFeature(FEATURE_KEY.DELETE_BRANCH)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id')
  async deleteBranch(@User() user, @Param('id') branchId: string) {
    await this.workspaceBranchService.deleteBranch(user.organizationId, branchId, user);
    return { success: true };
  }

  @InitFeature(FEATURE_KEY.PUSH_WORKSPACE)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('push')
  async pushWorkspace(@User() user, @Body() dto: WorkspacePushDto) {
    return this.workspaceBranchService.pushWorkspace(user.organizationId, dto, user);
  }

  @InitFeature(FEATURE_KEY.PULL_WORKSPACE)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('pull')
  async pullWorkspace(@User() user, @Body() dto?: WorkspacePullDto) {
    return this.workspaceBranchService.pullWorkspace(user.organizationId, user, dto?.sourceBranch, dto?.branchId);
  }

  @InitFeature(FEATURE_KEY.ENSURE_DRAFT)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('ensure-draft')
  async ensureAppDraft(@User() user: any, @Body() dto: EnsureDraftDto) {
    return this.workspaceBranchService.ensureAppDraft(
      user.organizationId,
      dto.appId,
      dto.branchId,
      user,
      dto.tagSha,
      dto.tagName
    );
  }

  @InitFeature(FEATURE_KEY.LIST_REMOTE_BRANCHES)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('remote')
  async listRemoteBranches(@User() user) {
    return this.workspaceBranchService.listRemoteBranches(user.organizationId);
  }

  @InitFeature(FEATURE_KEY.FETCH_PULL_REQUESTS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('pull-requests')
  async getPullRequests(@User() user) {
    return this.workspaceBranchService.getPullRequests(user.organizationId);
  }
}
