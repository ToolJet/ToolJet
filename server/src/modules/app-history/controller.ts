import { Controller, Get, Post, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@Controller('apps/versions/:versionId/history')
export class AppHistoryController {
  constructor() {}

  @InitFeature(FEATURE_KEY.LIST_HISTORY)
  @Get()
  async getHistory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 20,
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.RESTORE_HISTORY)
  @Post(':historyId/restore')
  async restoreHistory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Body() restoreDto: any
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_DESCRIPTION)
  @Patch(':historyId')
  async updateHistoryDescription(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Body() updateDto: any
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
