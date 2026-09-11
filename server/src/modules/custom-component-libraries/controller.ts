import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/custom-component-libraries/constants';
import { ICustomComponentLibrariesController } from './interface/IController';

// CE stub — the feature is EE/paid; real implementation lives in ee/custom-component-libraries/.
@InitModule(MODULES.CUSTOM_COMPONENT_LIBRARIES)
@Controller('custom-component-libraries')
export class CustomComponentLibrariesController implements ICustomComponentLibrariesController {
  constructor() {}

  @InitFeature(FEATURE_KEY.CREATE_LIBRARY)
  @Post()
  async create(@User() user, @Body() body: { name: string }): Promise<{ id: string; name: string }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.FIND_OR_CREATE_LIBRARY)
  @Post('find-or-create')
  async findOrCreateLibrary(@User() user, @Body() body: { correlationId: string; name: string }): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_LIBRARIES)
  @Get()
  async list(@User() user): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPLOAD_DEV_BUNDLE)
  @Post(':correlationId/dev')
  async uploadDev(@User() user, @Param('correlationId') correlationId: string, files?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.PUBLISH_REVISION)
  @Post(':correlationId/revisions')
  async publishRevision(
    @User() user,
    @Param('correlationId') correlationId: string,
    files?: any,
    body?: { version: string; message?: string }
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.SERVE_BUNDLE)
  @Get(':id/revisions/:version/files/:file')
  async serveRevisionFile(
    @Param('id') id: string,
    @Param('version') version: string,
    @Param('file') file: string,
    res?: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.SERVE_BUNDLE)
  @Get(':id/dev/:userId/files/:file')
  async serveDevFile(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Param('file') file: string,
    res?: any
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.STREAM_DEV_BUNDLE)
  @Get(':id/dev/:userId/stream')
  async streamDev(@User() user, @Param('id') id: string, @Param('userId') userId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.GET_LIBRARY)
  @Get(':correlationId')
  async get(@User() user, @Param('correlationId') correlationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.DELETE_LIBRARY)
  @Delete(':id')
  async deleteLibrary(@User() user, @Param('id') id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
