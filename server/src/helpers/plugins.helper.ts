import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { decode } from 'js-base64';
import { requireFromString } from 'module-from-string';
import { Plugin } from 'src/entities/plugin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import allPlugins from '@tooljet/plugins/dist/server';

@Injectable()
export class PluginsHelper {
  private readonly plugins: any = {};
  private static instance: PluginsHelper;

  constructor(
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>
  ) {
    if (PluginsHelper.instance) {
      return PluginsHelper.instance;
    }

    PluginsHelper.instance = this;
    return PluginsHelper.instance;
  }

  async getService(pluginId: string, kind: string) {
    const isMarketPlaceDev = process.env.ENABLE_MARKETPLACE_DEV_MODE === 'true';

    try {
      if (pluginId) {
        let decoded: string;

        if (!isMarketPlaceDev && this.plugins[pluginId]) {
          decoded = this.plugins[pluginId];
        } else {
          const plugin = await this.pluginsRepository.findOne({ where: { id: pluginId }, relations: ['indexFile'] });
          decoded = decode(plugin.indexFile.data.toString());
          this.plugins[pluginId] = decoded;
        }
        const code = requireFromString(decoded, { useCurrentGlobal: true });
        const service = new code.default();
        return service;
      } else {
        return new allPlugins[kind]();
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
