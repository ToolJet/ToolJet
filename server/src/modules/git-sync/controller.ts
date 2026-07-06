import { Controller, Get, Post, Put, Param, Body, Delete, Query, NotFoundException, Patch } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { User as UserEntity } from 'src/entities/user.entity';
import { IGitSyncController } from './Interfaces/IController';
import { ProviderConfigDTO } from './dto/provider-config.dto';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { UpdateGitEnvConfigDTO } from '@modules/git-sync/providers/dto/provider-config.dto';

@Controller('git-sync')
@InitModule(MODULES.GIT_SYNC)
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @Post()
  async create(
    @User() user: UserEntity,
    @Body() orgGitCreateDto: OrganizationGitCreateDto,
    @Query('gitType') gitType: string
  ) {
    throw new NotFoundException();
  }

  @Put(':id')
  async update(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto,
    @Query('gitType') gitType: string
  ) {
    throw new NotFoundException();
  }

  @Put('finalize/:id')
  async setFinalizeConfig(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() configDto: ProviderConfigDTO,
    @Query('gitType') gitType: string
  ) {
    throw new NotFoundException();
  }

  @Put('status/:id')
  async changeStatus(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Body() organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ) {
    throw new NotFoundException();
  }

  @Delete(':id')
  async deleteConfig(
    @User() user: UserEntity,
    @Param('id') organizationGitId: string,
    @Query('gitType') gitType: string
  ) {
    throw new NotFoundException();
  }

  @Patch('env-configs')
  async toggleEnvConfig(@User() user: UserEntity, @Body() configData: UpdateGitEnvConfigDTO) {
    throw new NotFoundException();
  }

  // ─── Auto-Sync Stubs (EE overrides) ───

  @Post('auto-sync/enable')
  async enableAutoSync(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Post('auto-sync/disable')
  async disableAutoSync(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Post('auto-sync/rotate-secret')
  async rotateAutoSyncSecret(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Get('auto-sync/status')
  async getAutoSyncStatus(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Get('auto-sync/events')
  async getAutoSyncEvents(
    @User() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<any> {
    throw new NotFoundException();
  }

  // IMPORTANT : Don't modify this caution : Keep parameterized :id routes last to avoid conflict with static routes like auto-sync/*
  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() user: UserEntity, @Param('id') organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

  @Get(':id')
  async getOrgGitByOrgId(
    @User() user: UserEntity,
    @Param('id') organizationId: string,
    @Query('gitType') gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }
}
