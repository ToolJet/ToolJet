import { Controller, Get, Post, Put, Param, Body, Delete, NotFoundException } from '@nestjs/common';
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
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@Controller('git-sync')
@InitModule(MODULES.GIT_SYNC)
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @InitFeature(FEATURE_KEY.GIT_SYNC_GET_ORG_GIT)
  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async getOrgGitByOrgId(@User() user: UserEntity, @Param('id') organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_GET_ORG_GIT_STATUS)
  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() user: UserEntity, @Param('id') organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_CREATE_ORG_GIT)
  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async create(@User() user: UserEntity, @Body() orgGitCreateDto: OrganizationGitCreateDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_UPDATE_ORG_GIT)
  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async update(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_FINALIZE_ORG_GIT)
  @Put('finalize/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async setFinalizeConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_CHANGE_STATUS)
  @Put('status/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async changeStatus(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_DELETE_ORG_GIT)
  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async deleteConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }
}
