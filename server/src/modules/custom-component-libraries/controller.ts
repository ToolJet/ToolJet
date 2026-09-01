import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { ICustomComponentLibrariesController } from './interface/IController';

// CE stub — the feature is EE/paid; real implementation lives in ee/custom-component-libraries/.
@Controller('custom-component-libraries')
export class CustomComponentLibrariesController implements ICustomComponentLibrariesController {
  constructor() {}

  @Post()
  async create(@User() user, @Body() body: { name: string }): Promise<{ id: string; name: string }> {
    throw new Error('Method not implemented.');
  }

  @Post('find-or-create')
  async findOrCreateLibrary(@User() user, @Body() body: { correlationId: string; name: string }): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Get()
  async list(@User() user): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Post(':id/dev')
  async uploadDev(@User() user, @Param('id') id: string, files?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Post(':id/revisions')
  async publishRevision(@User() user, @Param('id') id: string, files?: any, body?: { message?: string }): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Get(':id/revisions/:version/files/:file')
  async serveRevisionFile(
    @Param('id') id: string,
    @Param('version') version: string,
    @Param('file') file: string,
    res?: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @Get(':id/dev/:userId/files/:file')
  async serveDevFile(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Param('file') file: string,
    res?: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @Get(':id/dev/:userId/stream')
  async streamDev(@User() user, @Param('id') id: string, @Param('userId') userId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Get(':id')
  async get(@User() user, @Param('id') id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Delete(':id')
  async deleteLibrary(@User() user, @Param('id') id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
