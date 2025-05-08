import { Controller, Get, Post, Put, Param, Body, Delete, Query } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { ORGANIZATION_RESOURCE_ACTIONS } from 'src/constants/global.constant';
import { User as UserEntity } from 'src/entities/user.entity';
import { CheckPolicies } from '@modules/casl/check_policies.decorator';
import { AppAbility } from '@modules/casl/casl-ability.factory';
import { IGitSyncController } from './Interfaces/IController';
import { GitSyncService } from './service';

@Controller('git-sync')
export class GitSyncController implements IGitSyncController {
  constructor(protected gitSyncService: GitSyncService) {}

  // IMPORTANT : Don't modify this caution : Keep this endpoint last until refactored to avoid conflict with routes using ':id', which may lead to misinterpretation of parameters (e.g., 'gitpull').
  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async getOrgGitByOrgId(
    @User() user: UserEntity,
    @Param('id') organizationId: string,
    @Query('gitType') gitType: string
  ) {
    return await this.gitSyncService.getOrganizationById(user.organizationId, organizationId, gitType);
  }

  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() user: UserEntity, @Param('id') organizationId: string) {
    return await this.gitSyncService.getOrgGitStatusById(user.organizationId, organizationId);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async create(
    @User() user: UserEntity,
    @Body() orgGitCreateDto: OrganizationGitCreateDto,
    @Query('gitType') gitType: string
  ) {
    return await this.gitSyncService.createOrganizationGit(orgGitCreateDto, user.organizationId);
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async update(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto,
    @Query('gitType') gitType: string
  ) {
    return await this.gitSyncService.updateOrgGit(user.organizationId, organizationGitId, orgGitUpdateDto, gitType);
  }

  @Put('finalize/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async setFinalizeConfig(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Query('gitType') gitType: string
  ) {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(
      user.organizationId,
      gitType
    );
    await this.sourceControlStrategy.setFinalizeConfig(user.id, user.organizationId, organizationGitId);
    return;
  }

  @Put('status/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async changeStatus(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ) {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(user?.organizationId);
    await this.sourceControlStrategy.updateOrgGitStatus(
      user.organizationId,
      organizationGitId,
      organizationGitStatusUpdateDto
    );
    return;
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async deleteConfig(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Query('gitType') gitType: string
  ) {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(
      user?.organizationId,
      gitType
    );
    await this.sourceControlStrategy.deleteConfig(user.organizationId, organizationGitId);
    return;
  }
}
