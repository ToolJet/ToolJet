import { Controller, Get, Post, Request, UseGuards, Body, Delete, Param, Patch } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { CreateInstanceSettingsDto, UpdateInstanceSettingsDto } from '@dto/create_instance_settings.dto';

@Controller('instance_settings')
export class InstanceSettingsController {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req) {
    const settings = await this.instanceSettingsService.getSettings();
    return decamelizeKeys({ settings });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateInstanceSettingsDto) {
    const result = await this.instanceSettingsService.create(body);
    return decamelizeKeys({ setting: result });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id, @Body() body: UpdateInstanceSettingsDto) {
    await this.instanceSettingsService.update(id, body);
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id) {
    return await this.instanceSettingsService.delete(id);
  }
}
