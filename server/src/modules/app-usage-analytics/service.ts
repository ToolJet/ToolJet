import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  ActiveUsersSeriesResponseDto,
  AnalyticsRangeQueryDto,
  AnalyticsSeriesQueryDto,
  AnalyticsStatusResponseDto,
  AppSummaryResponseDto,
  AppUsersQueryDto,
  AppUsersResponseDto,
  WorkspaceAppsQueryDto,
  WorkspaceAppsResponseDto,
  WorkspaceSummaryResponseDto,
} from './dto';

/** Usage analytics is an EE/Cloud feature; the CE build only carries this contract. */
@Injectable()
export class AppUsageAnalyticsService {
  async getStatus(_workspaceId: string): Promise<AnalyticsStatusResponseDto> {
    throw new NotImplementedException();
  }

  async getWorkspaceSummary(
    _workspaceId: string,
    _query: AnalyticsRangeQueryDto
  ): Promise<WorkspaceSummaryResponseDto> {
    throw new NotImplementedException();
  }

  async getWorkspaceActiveUsers(
    _workspaceId: string,
    _query: AnalyticsSeriesQueryDto
  ): Promise<ActiveUsersSeriesResponseDto> {
    throw new NotImplementedException();
  }

  async getWorkspaceApps(_workspaceId: string, _query: WorkspaceAppsQueryDto): Promise<WorkspaceAppsResponseDto> {
    throw new NotImplementedException();
  }

  async getAppSummary(
    _workspaceId: string,
    _appId: string,
    _query: AnalyticsRangeQueryDto
  ): Promise<AppSummaryResponseDto> {
    throw new NotImplementedException();
  }

  async getAppActiveUsers(
    _workspaceId: string,
    _appId: string,
    _query: AnalyticsSeriesQueryDto
  ): Promise<ActiveUsersSeriesResponseDto> {
    throw new NotImplementedException();
  }

  async getAppUsers(_workspaceId: string, _appId: string, _query: AppUsersQueryDto): Promise<AppUsersResponseDto> {
    throw new NotImplementedException();
  }
}
