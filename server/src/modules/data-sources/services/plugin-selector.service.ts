import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { decode } from 'js-base64';
import allPlugins from '@tooljet/plugins/dist/server';
import { PluginsRepository } from '@modules/plugins/repository';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { runInNewContext } from 'vm';

@Injectable()
export class PluginsServiceSelector {
  protected readonly plugins: any = {};
  protected static instance: PluginsServiceSelector;

  constructor(
    protected pluginsRepository: PluginsRepository,
    protected tooljetDbDataOperationsService: TooljetDbDataOperationsService
  ) {
    if (PluginsServiceSelector.instance) {
      return PluginsServiceSelector.instance;
    }

    PluginsServiceSelector.instance = this;
    return PluginsServiceSelector.instance;
  }

  async getService(pluginId: string, kind: string) {
    const isToolJetDatabaseKind = kind === 'tooljetdb';
    const isMarketplacePlugin = !!pluginId;

    try {
      if (isToolJetDatabaseKind) return this.tooljetDbDataOperationsService;
      if (isMarketplacePlugin) return await this.findMarketplacePluginService(pluginId);

      return new allPlugins[kind]();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  protected async findMarketplacePluginService(pluginId: string) {
    const isMarketplaceDev = process.env.ENABLE_MARKETPLACE_DEV_MODE === 'true';
    let decoded: string;

    if (!isMarketplaceDev && this.plugins[pluginId]) {
      decoded = this.plugins[pluginId];
    } else {
      const plugin = await this.pluginsRepository.findById(pluginId, ['indexFile']);
      decoded = decode(plugin.indexFile.data.toString());
      this.plugins[pluginId] = decoded;
    }

    interface PluginModule {
      default: new () => any;
      [key: string]: any;
    }

    // Create a module context with CommonJS support
    const moduleWrapper = {
      exports: {} as PluginModule,
    };

    const sandbox = {
      module: moduleWrapper,
      exports: moduleWrapper.exports,
      require: require,
      console: console,
      process: process,
      Buffer: Buffer,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      __dirname: process.cwd(), // or path.dirname(fileURLToPath(import.meta.url))
      __filename: __filename,
      global: global,
    };

    // Execute the plugin code
    runInNewContext(decoded, sandbox);

    // Get the exported service
    const service = new sandbox.module.exports.default();

    return service;
  }
}
