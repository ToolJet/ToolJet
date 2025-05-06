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

@Controller('git-sync')
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async getOrgGitByOrgId(@User() user: UserEntity, @Param('id') organizationId: string) {
    throw new NotFoundException();
  }

  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() user: UserEntity, @Param('id') organizationId: string) {
    throw new NotFoundException();
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async create(@User() user: UserEntity, @Body() orgGitCreateDto: OrganizationGitCreateDto) {
    throw new NotFoundException();
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async update(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto
  ) {
    throw new NotFoundException();
  }

  @Put('finalize/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async setFinalizeConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }

  @Put('status/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async changeStatus(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ) {
    throw new NotFoundException();
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC, UserEntity))
  async deleteConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }
}
