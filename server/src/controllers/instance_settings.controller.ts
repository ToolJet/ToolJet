import { Controller, Get, Post, UseGuards, Body, Delete, Param, Patch } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';

@Controller('instance-settings')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class InstanceSettingsController {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  @Get()
  async index() {
    const settings = await this.instanceSettingsService.listSettings(InstanceSettingsType.USER);
    return decamelizeKeys({ settings });
  }

  @Post()
  async create(@Body() body: CreateInstanceSettingsDto) {
    const result = await this.instanceSettingsService.create(body);
    return decamelizeKeys({ setting: result });
  }

  @Patch()
  async update(@Body() body) {
    await this.instanceSettingsService.updateParams(body);
    return;
  }

  @Delete(':id')
  async delete(@Param('id') id) {
    await this.instanceSettingsService.delete(id);
    return;
  }
}
