import { Controller, Get, Post, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';

@Controller('apps/:appId/versions/:versionId/history')
export class AppHistoryController {
  constructor() {}

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

  @Get(':historyId')
  async getHistoryEntry(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('historyId', ParseUUIDPipe) historyId: string
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Post(':historyId/restore')
  async restoreHistory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Body() restoreDto: any
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Patch(':historyId')
  async updateHistoryDescription(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Body() updateDto: any
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
