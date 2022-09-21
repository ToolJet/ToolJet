import { Controller, Get, Post, UseGuards, Body, Delete, Param, Patch } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';

@Controller('instance-settings')
export class InstanceSettingsController {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  async index() {
    const settings = await this.instanceSettingsService.listSettings();
    return decamelizeKeys({ settings });
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  async create(@Body() body: CreateInstanceSettingsDto) {
    const result = await this.instanceSettingsService.create(body);
    return decamelizeKeys({ setting: result });
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch()
  async update(@Body() body) {
    await this.instanceSettingsService.update(body);
    return {};
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  async delete(@Param('id') id) {
    return await this.instanceSettingsService.delete(id);
  }
}
