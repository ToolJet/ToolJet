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
  UploadedFiles,
} from '@nestjs/common';
import { Express } from 'express';
import { PluginsService } from '../services/plugins.service';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Connection } from 'typeorm';
import { decode } from 'js-base64';

@Controller('plugins')
@UseInterceptors(ClassSerializerInterceptor)
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService, private connection: Connection) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'operations', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
      { name: 'manifest', maxCount: 1 },
    ])
  )
  create(
    @Body() createPluginDto: CreatePluginDto,
    @UploadedFiles()
    files: { operations: Express.Multer.File[]; icon: Express.Multer.File[]; manifest: Express.Multer.File[] }
  ) {
    // return this.pluginsService.create(createPluginDto, files);
  }

  @Post('install')
  install(@Body() installPluginDto: any) {
    return this.pluginsService.install(installPluginDto);
  }

  @Get()
  async findAll() {
    const plugins = await this.pluginsService.findAll();
    return plugins.map((plugin) => {
      plugin.iconFile.data = `data:image/svg+xml;base64,${plugin.iconFile.data.toString('utf8')}`;
      plugin.manifestFile.data = JSON.parse(decode(plugin.manifestFile.data.toString('utf8')));
      return plugin;
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePluginDto: UpdatePluginDto) {
    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pluginsService.remove(id);
  }
}
