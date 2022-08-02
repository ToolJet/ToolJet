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
} from '@nestjs/common';
import { PluginsService } from '../services/plugins.service';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { Connection } from 'typeorm';
import { decode } from 'js-base64';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';

@Controller('plugins')
@UseInterceptors(ClassSerializerInterceptor)
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService, private connection: Connection) {}

  @Post('install')
  @UseGuards(JwtAuthGuard)
  install(@Body() installPluginDto: any) {
    return this.pluginsService.install(installPluginDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const plugins = await this.pluginsService.findAll();
    return plugins.map((plugin) => {
      plugin.iconFile.data = plugin.iconFile.data.toString('utf8');
      plugin.manifestFile.data = JSON.parse(decode(plugin.manifestFile.data.toString('utf8')));
      return plugin;
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updatePluginDto: UpdatePluginDto) {
    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.pluginsService.remove(id);
  }
}
