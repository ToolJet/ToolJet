import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { WorkflowAccessGuard } from '../guards/workflow-access.guard';
import {
  UpdateJavascriptPackagesDto,
  UpdatePythonPackagesDto,
  PackageSearchQueryDto,
  JavascriptPackageSearchResult,
  GetJavascriptPackagesResult,
  GetPythonPackagesResult,
  UpdatePackagesResult,
  RebuildBundleDto,
  RebuildBundleResult,
  PythonPackageSearchResult,
  BundleLanguage,
  UnifiedPackageInfo,
  UnifiedPackageVersionsResult,
  UnifiedBundleStatus,
} from '../dto/workflow-bundle.dto';

@Controller('workflows')
export class WorkflowBundlesController {
  @Get('packages/:language/search')
  @UseGuards(JwtAuthGuard)
  async searchPackagesByLanguage(
    @Param('language') language: BundleLanguage,
    @Query() query: PackageSearchQueryDto
  ): Promise<JavascriptPackageSearchResult[] | PythonPackageSearchResult[]> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get('packages/:language/:name')
  @UseGuards(JwtAuthGuard)
  async getPackageInfoByLanguage(
    @Param('language') language: BundleLanguage,
    @Param('name') packageName: string
  ): Promise<UnifiedPackageInfo> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get('packages/:language/:name/versions')
  @UseGuards(JwtAuthGuard)
  async getPackageVersionsByLanguage(
    @Param('language') language: BundleLanguage,
    @Param('name') packageName: string
  ): Promise<UnifiedPackageVersionsResult> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get(':appVersionId/packages/:language')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async getPackagesByLanguage(
    @Param('appVersionId') appVersionId: string,
    @Param('language') language: BundleLanguage
  ): Promise<GetJavascriptPackagesResult | GetPythonPackagesResult> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Put(':appVersionId/packages/:language')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async updatePackagesByLanguage(
    @Param('appVersionId') appVersionId: string,
    @Param('language') language: BundleLanguage,
    @Body() dto: UpdateJavascriptPackagesDto | UpdatePythonPackagesDto
  ): Promise<UpdatePackagesResult> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get(':appVersionId/bundle/:language/status')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async getBundleStatusByLanguage(
    @Param('appVersionId') appVersionId: string,
    @Param('language') language: BundleLanguage
  ): Promise<UnifiedBundleStatus> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Post(':appVersionId/bundle/:language/rebuild')
  @UseGuards(JwtAuthGuard, WorkflowAccessGuard)
  async rebuildBundleByLanguage(
    @Param('appVersionId') appVersionId: string,
    @Param('language') language: BundleLanguage,
    @Body() dto: RebuildBundleDto
  ): Promise<RebuildBundleResult> {
    throw new HttpException('Enterprise feature: Package management requires ToolJet Enterprise Edition', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
