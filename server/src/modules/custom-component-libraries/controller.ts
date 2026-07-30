import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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

  @Get(':id')
  async get(@User() user, @Param('id') id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
