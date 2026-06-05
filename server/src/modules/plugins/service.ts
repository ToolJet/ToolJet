import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { PluginsUtilService } from './util.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { Plugin } from '@entities/plugin.entity';
import { UpdateFileDto } from '@modules/files/dto';
import { encode } from 'js-base64';
import { FilesRepository } from '@modules/files/repository';
import { IPluginsService } from './interfaces/IService';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { DataSourcesRepository } from '@modules/data-sources/repository';
const fs = require('fs');

@Injectable()
export class PluginsService implements IPluginsService {
  constructor(
    protected readonly pluginsUtilService: PluginsUtilService,
    protected readonly fileRepository: FilesRepository,
    protected readonly dataSourcesRepository: DataSourcesRepository
  ) {}

  async install(body: CreatePluginDto) {
    const { id, repo, name } = body;

    const existingPlugin = await dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Plugin, { where: { pluginId: id } });
    });
    if (existingPlugin) throw new BadRequestException(`Plugin '${name}' is already installed.`);

    const result = await this.pluginsUtilService.fetchPluginFiles(id, repo);
    const [index, operations, icon, manifest, version, specFiles] = result;
    let shouldCreate = false;

    try {
      // validate manifest and operations as JSON files
      const validManifest = JSON.parse(manifest.toString()) ? manifest : null;
      const validOperations = JSON.parse(operations.toString()) ? operations : null;

      if (validManifest && validOperations) {
        shouldCreate = true;
      }
    } catch (error) {
      throw new InternalServerErrorException('Invalid plugin files');
    }

    return (
      shouldCreate &&
      (await this.pluginsUtilService.create(body, version, { index, operations, icon, manifest }, specFiles))
    );
  }

  async findAll() {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(Plugin, { relations: ['iconFile', 'manifestFile'] });
    });
  }

  async findOne(id: string) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Plugin, { where: { id } });
    });
  }

  async findByKind(pluginKind: string) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Plugin, { where: { pluginId: pluginKind } });
    });
  }

  async update(id: string, body: UpdatePluginDto) {
    const { pluginId, repo } = body;
    const result = await this.pluginsUtilService.fetchPluginFiles(pluginId, repo);
    const [index, operations, icon, manifest, version, specFiles] = result;
    return await this.pluginsUtilService.upgrade(id, body, version, { index, operations, icon, manifest }, specFiles);
  }

  async remove(id: string) {
    const dataSourcesByMarketplacePlugin = await this.dataSourcesRepository.getDatasourceByPluginId(id);
    if (dataSourcesByMarketplacePlugin.length) {
      const queries = [];
      dataSourcesByMarketplacePlugin?.forEach((datasource) => {
        if (datasource.dataQueries.length) queries.push(...datasource.dataQueries);
      });
      if (queries.length) {
        throw new InternalServerErrorException(`Plugin can't be removed, queries of plugin are in use`);
      }
    }

    return dbTransactionWrap((manager: EntityManager) => {
      return manager.delete(Plugin, id);
    });
  }

  async reload(id: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const plugin = await this.findOne(id);
        const { pluginId, repo, version } = plugin;

        const result = await this.pluginsUtilService.fetchPluginFiles(pluginId, repo);
        const [index, operations, icon, manifest, , specFiles] = result;

        const files = { index, operations, icon, manifest };

        const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
        await Promise.all(
          Object.keys(files).map(async (key) => {
            return await dbTransactionWrap(async (manager: EntityManager) => {
              const file = files[key];
              const fileDto = new UpdateFileDto();
              fileDto.data = encode(file);
              fileDto.filename = key;
              uploadedFiles[key] = await this.fileRepository.updateOne(plugin[`${key}FileId`], fileDto, manager);
            });
          })
        );

        // Update spec files via the util service
        const specFilesMap = await this.pluginsUtilService.updateSpecFilesForReload(
          plugin.specFilesMap,
          specFiles,
          manager
        );

        const updatedPlugin = new Plugin();

        updatedPlugin.id = plugin.id;
        updatedPlugin.repo = repo || '';
        updatedPlugin.version = version;
        updatedPlugin.specFilesMap = specFilesMap;

        return manager.save(updatedPlugin);
      } catch (error) {
        if (!queryRunner.isReleased) await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        if (!queryRunner.isReleased) await queryRunner.release();
      }
    });
  }

  private getPluginsJsonDirectory() {
    const isProduction = process.env.NODE_ENV == 'production';
    const buildExists = __dirname.includes('dist');
    const baseDir = isProduction && buildExists ? path.join(__dirname) : __dirname.replace('/dist/', '/');
    return path.join(baseDir, '../../assets/marketplace/plugins.json');
  }

  private listMarketplacePlugins() {
    const jsonpath = this.getPluginsJsonDirectory();

    if (fs.existsSync(jsonpath)) {
      const pluginsList = JSON.parse(fs.readFileSync(jsonpath, 'utf-8'));
      const pluginsListIdToDetailsMap = Object.fromEntries(pluginsList.map((plugin) => [plugin.id, plugin]));
      return { pluginsList, pluginsListIdToDetailsMap };
    } else {
      throw new NotFoundException('Plugins list not found');
    }
  }

  private filterMarketplacePluginsFromDatasources(dataSources, pluginsListIdToDetailsMap): Array<string> {
    const marketplacePluginsUsed: Set<string> = new Set();
    dataSources.forEach((dataSource) => {
      // Next iteration: Plugin versioning should be considered.
      if (pluginsListIdToDetailsMap[dataSource.kind]) marketplacePluginsUsed.add(dataSource.kind);
    });
    return Array.from(marketplacePluginsUsed);
  }

  private async findPluginsToBeInstalled(pluginsId: Array<string>): Promise<{ pluginsToBeInstalled: Array<string> }> {
    const pluginsToBeInstalled = [];
    if (!pluginsId.length) return { pluginsToBeInstalled };

    const pluginsInstalled = await this.findAll();
    const installedPluginsIdToDetailsMap = Object.fromEntries(
      pluginsInstalled.map((plugin) => [plugin.pluginId, plugin])
    );

    pluginsId.forEach((pluginId) => {
      if (!installedPluginsIdToDetailsMap[pluginId]) pluginsToBeInstalled.push(pluginId);
    });
    return { pluginsToBeInstalled };
  }

  async checkIfPluginsToBeInstalled(
    dataSources
  ): Promise<{ pluginsToBeInstalled: Array<string>; pluginsListIdToDetailsMap: any }> {
    try {
      const { pluginsListIdToDetailsMap } = this.listMarketplacePlugins();
      const marketplacePluginsUsed = this.filterMarketplacePluginsFromDatasources(
        dataSources,
        pluginsListIdToDetailsMap
      );
      const { pluginsToBeInstalled } = await this.findPluginsToBeInstalled(marketplacePluginsUsed);
      return { pluginsToBeInstalled, pluginsListIdToDetailsMap };
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'An error occurred while checking whether plugins need to be installed.'
      );
    }
  }

  async autoInstallPluginsForTemplates(pluginsToBeInstalled: Array<string>, shouldAutoInstall: boolean) {
    const installedPluginsList = [];
    const installedPluginsInfo = [];
    try {
      const { pluginsListIdToDetailsMap } = this.listMarketplacePlugins();
      if (shouldAutoInstall && pluginsToBeInstalled.length) {
        for (const pluginId of pluginsToBeInstalled) {
          const pluginDetails = pluginsListIdToDetailsMap[pluginId];
          if (!pluginDetails) continue;
          const installedPluginInfo = await this.install(pluginDetails);
          installedPluginsList.push(installedPluginInfo.name);
          installedPluginsInfo.push(installedPluginInfo);
        }
        return { installedPluginsList, installedPluginsInfo };
      }

      if (!shouldAutoInstall && pluginsToBeInstalled.length) {
        throw new NotFoundException(
          `Plugins ( ${pluginsToBeInstalled
            .map((pluginToBeInstalled) => pluginsListIdToDetailsMap[pluginToBeInstalled].name || pluginToBeInstalled)
            .join(', ')} ) is not installed yet!`
        );
      }
    } catch (error) {
      if (installedPluginsInfo.length) {
        const pluginsId = installedPluginsInfo.map((pluginInfo) => pluginInfo.id);
        await this.uninstallPlugins(pluginsId);
      }
      throw new InternalServerErrorException(error, 'Error while installing marketplace plugins');
    }
  }

  async uninstallPlugins(pluginsId: Array<string>) {
    try {
      if (!pluginsId.length) return;
      for (const pluginId of pluginsId) {
        await this.remove(pluginId);
      }
      return;
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error while uninstalling marketplace plugins');
    }
  }
}
