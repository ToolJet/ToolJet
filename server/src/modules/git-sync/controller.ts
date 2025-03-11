import { Controller, Get, Post, Put, Param, Body, Delete, NotFoundException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { User as UserEntity } from 'src/entities/user.entity';
import { IGitSyncController } from './Interfaces/IController';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
@Controller('git-sync')
@InitModule(MODULES.GIT_SYNC)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @InitFeature(FEATURE_KEY.GIT_SYNC_GET_ORG_GIT)
  @Get(':id')
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
  async create(@User() user: UserEntity, @Body() orgGitCreateDto: OrganizationGitCreateDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_UPDATE_ORG_GIT)
  @Put(':id')
  async update(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_FINALIZE_ORG_GIT)
  @Put('finalize/:id')
  async setFinalizeConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_CHANGE_STATUS)
  @Put('status/:id')
  async changeStatus(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_DELETE_ORG_GIT)
  @Delete(':id')
  async deleteConfig(@User() user: UserEntity, @Param('id') organizationGitId: string) {
    throw new NotFoundException();
  }
}
