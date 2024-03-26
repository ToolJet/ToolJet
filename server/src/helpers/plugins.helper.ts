import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { decode } from 'js-base64';
import { requireFromString } from 'module-from-string';
import { Plugin } from 'src/entities/plugin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import allPlugins from '@tooljet/plugins/dist/server';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';

@Injectable()
export class PluginsHelper {
  private readonly plugins: any = {};
  private static instance: PluginsHelper;

  constructor(
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>,
    private tooljetDbOperationsService: TooljetDbOperationsService
  ) {
    if (PluginsHelper.instance) {
      return PluginsHelper.instance;
    }

    PluginsHelper.instance = this;
    return PluginsHelper.instance;
  }

  async getService(pluginId: string, kind: string) {
    const isToolJetDatabaseKind = kind === 'tooljetdb';
    const isMarketplacePlugin = !!pluginId;

    try {
      if (isToolJetDatabaseKind) return this.tooljetDbOperationsService;
      if (isMarketplacePlugin) return await this.findMarketplacePluginService(pluginId);

      return new allPlugins[kind]();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private async findMarketplacePluginService(pluginId: string) {
    const isMarketplaceDev = process.env.ENABLE_MARKETPLACE_DEV_MODE === 'true';
    let decoded: string;

    if (!isMarketplaceDev && this.plugins[pluginId]) {
      decoded = this.plugins[pluginId];
    } else {
      const plugin = await this.pluginsRepository.findOne({ where: { id: pluginId }, relations: ['indexFile'] });
      decoded = decode(plugin.indexFile.data.toString());
      this.plugins[pluginId] = decoded;
    }
    const code = requireFromString(decoded, { useCurrentGlobal: true });
    const service = new code.default();

    return service;
  }
}
