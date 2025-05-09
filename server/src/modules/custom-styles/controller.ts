import { Controller, Post, Body, Get } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { CustomStylesCreateDto } from '@modules/custom-styles/dto/custom_styles.dto';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { ICustomStylesController } from './interface/IController';
@Controller('custom-styles')
export class CustomStylesController implements ICustomStylesController {
  constructor() {}

  @Get()
  async get(@User() user) {
    throw new Error('Method not implemented.');
  }

  @Get('/app')
  async getCustomStylesforApp(@User() user) {
    throw new Error('Method not implemented.');
  }

  @Get(':app_slug')
  async getStylesFromApp(@App() app) {
    throw new Error('Method not implemented.');
  }

  @Post()
  async create(@User() user, @Body() orgStylesDto: CustomStylesCreateDto) {
    throw new Error('Method not implemented.');
  }
}
