import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsService } from '../services/plugins.service';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { decode } from 'js-base64';
import { PluginsAbilityFactory } from 'src/modules/casl/abilities/plugins-ability.factory';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { IsPluginApiEnabledGuard } from 'src/modules/casl/plugins.guard';

@Controller('plugins')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService, private pluginsAbilityFactory: PluginsAbilityFactory) {}

  @Post('install')
  @UseGuards(JwtAuthGuard)
  async install(@User() user, @Body() createPluginDto: CreatePluginDto) {
    const ability = await this.pluginsAbilityFactory.pluginActions(user);

    if (!ability.can('installPlugin', Plugin)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return this.pluginsService.install(createPluginDto);
  }

  @Get()
  async findAll() {
    const plugins = await this.pluginsService.findAll();
    return plugins.map((plugin) => {
      plugin.iconFile.data = plugin.iconFile.data.toString('utf8');
      plugin.manifestFile.data = JSON.parse(decode(plugin.manifestFile.data.toString('utf8')));
      return plugin;
    });
  }

  @Get(':id')
  @UseGuards(IsPluginApiEnabledGuard)
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(IsPluginApiEnabledGuard)
  async update(@User() user, @Param('id') id: string, @Body() updatePluginDto: UpdatePluginDto) {
    const ability = await this.pluginsAbilityFactory.pluginActions(user);

    if (!ability.can('updatePlugin', Plugin)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  @UseGuards(IsPluginApiEnabledGuard)
  async remove(@User() user, @Param('id') id: string) {
    const ability = await this.pluginsAbilityFactory.pluginActions(user);

    if (!ability.can('deletePlugin', Plugin)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return this.pluginsService.remove(id);
  }

  @Post(':id/reload')
  @UseGuards(IsPluginApiEnabledGuard)
  async reload(@Param('id') id: string) {
    return this.pluginsService.reload(id);
  }
}
