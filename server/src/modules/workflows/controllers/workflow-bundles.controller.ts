import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { WorkflowAccessGuard } from '../guards/workflow-access.guard';
import { 
  PackageSearchQueryDto, 
  UpdatePackagesDto, 
  RebuildBundleDto,
  PackageSearchResult,
  GetPackagesResult,
  UpdatePackagesResult,
  BundleStatus,
  RebuildBundleResult
} from '../dto/workflow-bundle.dto';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowBundlesController {
  @Get('packages/search')
  async searchPackages(@Query() searchQuery: PackageSearchQueryDto, @User() user?: any): Promise<PackageSearchResult[]> {
    // Base implementation - not available in CE
    throw new ForbiddenException('NPM package search not available in Community Edition');
  }

  @Get(':workflowId/packages')
  @UseGuards(WorkflowAccessGuard)
  async getWorkflowPackages(@Param('workflowId') workflowId: string): Promise<GetPackagesResult> {
    // Base implementation - return empty dependencies
    return { dependencies: {} };
  }

  @Put(':workflowId/packages')
  @UseGuards(WorkflowAccessGuard)
  async updateWorkflowPackages(
    @Param('workflowId') workflowId: string,
    @Body() updatePackagesDto: UpdatePackagesDto
  ): Promise<UpdatePackagesResult> {
    // Base implementation - not available in CE
    throw new ForbiddenException('NPM package management not available in Community Edition');
  }

  @Get(':workflowId/bundle/status')
  @UseGuards(WorkflowAccessGuard)
  async getBundleStatus(@Param('workflowId') workflowId: string, @User() user?: any): Promise<BundleStatus> {
    // Base implementation - return none status
    return {
      status: 'none',
      dependencies: {}
    };
  }

  @Post(':workflowId/bundle/rebuild')
  @UseGuards(WorkflowAccessGuard)
  async rebuildBundle(
    @Param('workflowId') workflowId: string,
    @Body() rebuildBundleDto: RebuildBundleDto,
    @User() user?: any
  ): Promise<RebuildBundleResult> {
    // Base implementation - not available in CE
    throw new ForbiddenException('Bundle rebuild not available in Community Edition');
  }
}