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
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { decode } from 'js-base64';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityGuard } from './ability/guard';
import { PluginsService } from './service';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { IPluginsController } from './interfaces/IController';
import { FilesRepository } from '@modules/files/repository';

@Controller('plugins')
@UseInterceptors(ClassSerializerInterceptor)
@InitModule(MODULES.PLUGINS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class PluginsController implements IPluginsController {
  constructor(
    protected readonly pluginsService: PluginsService,
    protected readonly filesRepository: FilesRepository
  ) {}

  @Post('install')
  @InitFeature(FEATURE_KEY.INSTALL)
  async install(@Body() createPluginDto: CreatePluginDto) {
    return this.pluginsService.install(createPluginDto);
  }

  @Get()
  @InitFeature(FEATURE_KEY.GET)
  async findAll() {
    const plugins = await this.pluginsService.findAll();
    return plugins.map((plugin) => {
      plugin.iconFile.data = plugin.iconFile.data.toString('utf8');
      plugin.manifestFile.data = JSON.parse(decode(plugin.manifestFile.data.toString('utf8')));
      return plugin;
    });
  }

  // Must be declared before @Get(':id') to avoid route collision — ':id' wildcard would capture 'specs'
  @Get('specs/:pluginKind/:specName')
  @InitFeature(FEATURE_KEY.GET_SPEC)
  async getSpec(@Param('pluginKind') pluginKind: string, @Param('specName') specName: string, @Res() res: Response) {
    const plugin = await this.pluginsService.findByKind(pluginKind);
    if (!plugin?.specFilesMap || !plugin.specFilesMap[specName]) {
      throw new NotFoundException(`Spec '${specName}' not found for plugin '${pluginKind}'`);
    }

    const fileId = plugin.specFilesMap[specName];
    const file = await this.filesRepository.getOne(fileId);

    const content = decode(file.data.toString('utf8'));
    const isJson = specName.endsWith('.json') || content.trimStart().startsWith('{');
    res.setHeader('Content-Type', isJson ? 'application/json' : 'text/yaml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(content);
  }

  @Get(':id')
  @InitFeature(FEATURE_KEY.GET_ONE)
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  @InitFeature(FEATURE_KEY.UPDATE)
  async update(@User() user, @Param('id') id: string, @Body() updatePluginDto: UpdatePluginDto) {
    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  @InitFeature(FEATURE_KEY.DELETE)
  async remove(@User() user, @Param('id') id: string) {
    return this.pluginsService.remove(id);
  }

  @Post(':id/reload')
  @InitFeature(FEATURE_KEY.RELOAD)
  async reload(@Param('id') id: string) {
    return this.pluginsService.reload(id);
  }

  @Post('findDependentPlugins')
  @InitFeature(FEATURE_KEY.DEPENDENT_PLUGINS)
  async findDependentPluginsToBeInstalledFromDataSources(@Body() dataSources) {
    return this.pluginsService.checkIfPluginsToBeInstalled(dataSources);
  }

  @Post('installDependentPlugins')
  @InitFeature(FEATURE_KEY.INSTALL_DEPENDENT_PLUGINS)
  async installDependentPlugins(
    @Body('dependentPlugins') dependentPlugins,
    @Body('shouldAutoImportPlugin') shouldAutoImportPlugin
  ) {
    return this.pluginsService.autoInstallPluginsForTemplates(dependentPlugins, shouldAutoImportPlugin);
  }

  @Post('uninstallPlugins')
  @InitFeature(FEATURE_KEY.UNINSTALL_PLUGINS)
  async uninstallPlugins(@Body('pluginsId') pluginsId) {
    return this.pluginsService.uninstallPlugins(pluginsId);
  }
}
