import { Controller, Get, Post, Put, Param, Body, Delete, Query, NotFoundException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { User as UserEntity } from 'src/entities/user.entity';
import { IGitSyncController } from './Interfaces/IController';

@Controller('git-sync')
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() user: UserEntity, @Param('id') organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

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

  // IMPORTANT : Don't modify this caution : Keep this endpoint last until refactored to avoid conflict with routes using ':id', which may lead to misinterpretation of parameters (e.g., 'gitpull').
  @Get(':id')
  async getOrgGitByOrgId(
    @User() user: UserEntity,
    @Param('id') organizationId: string,
    @Query('gitType') gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }
}
