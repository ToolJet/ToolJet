import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { WorkflowAccessGuard } from '../guards/workflow-access.guard';
import { User } from '@modules/app/decorators/user.decorator';
import {
  UpdatePackagesDto,
  PackageSearchQueryDto,
  PackageSearchResult,
  GetPackagesResult,
  BundleStatus,
  UpdatePackagesResult,
  RebuildBundleDto,
  RebuildBundleResult,
} from '../dto/workflow-bundle.dto';

@Controller('workflows')
export class WorkflowBundlesController {
  @Get('packages/search')
  @UseGuards(JwtAuthGuard)
  async searchPackages(@Query() query: PackageSearchQueryDto, @User() user: any): Promise<PackageSearchResult[]> {
    throw new HttpException('Enterprise feature: NPM package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get(':appVersionId/packages')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async getPackages(@Param('appVersionId') appVersionId: string, @User() user: any): Promise<GetPackagesResult> {
    throw new HttpException('Enterprise feature: NPM package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Put(':appVersionId/packages')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async updatePackages(
    @Param('appVersionId') appVersionId: string,
    @Body() dto: UpdatePackagesDto,
    @User() user: any
  ): Promise<UpdatePackagesResult> {
    throw new HttpException('Enterprise feature: NPM package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get(':appVersionId/bundle/status')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async getBundleStatus(@Param('appVersionId') appVersionId: string, @User() user: any): Promise<BundleStatus> {
    throw new HttpException('Enterprise feature: NPM package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Post(':appVersionId/bundle/rebuild')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async rebuildBundle(
    @Param('appVersionId') workflowId: string,
    @Body() dto: RebuildBundleDto,
    @User() user: any
  ): Promise<RebuildBundleResult> {
    throw new HttpException('Enterprise feature: NPM package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}