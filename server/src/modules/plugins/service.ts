import { InternalServerErrorException } from '@nestjs/common';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { PluginsUtilService } from './util.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { Plugin } from '@entities/plugin.entity';
import { UpdateFileDto } from '@modules/files/dto';
import { encode } from 'js-base64';
import { FilesRepository } from '@modules/files/repository';
import { IPluginsService } from './interfaces/IService';
import { Injectable } from '@nestjs/common';
const fs = require('fs');

@Injectable()
export class PluginsService implements IPluginsService {
  constructor(
    protected readonly pluginsUtilService: PluginsUtilService,
    protected readonly fileRepository: FilesRepository
  ) {}

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

  install(body: CreatePluginDto): Promise<boolean | any> {
    return this.pluginsUtilService.install(body);
  }

  async update(id: string, body: UpdatePluginDto) {
    const { pluginId, repo } = body;
    const [index, operations, icon, manifest, version] = await this.pluginsUtilService.fetchPluginFiles(pluginId, repo);
    return await this.pluginsUtilService.upgrade(id, body, version, { index, operations, icon, manifest });
  }

  async reload(id: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const plugin = await this.findOne(id);
        const { pluginId, repo, version } = plugin;

        const [index, operations, icon, manifest] = await this.pluginsUtilService.fetchPluginFiles(pluginId, repo);

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

        const updatedPlugin = new Plugin();

        updatedPlugin.id = plugin.id;
        updatedPlugin.repo = repo || '';
        updatedPlugin.version = version;

        return manager.save(updatedPlugin);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        await queryRunner.commitTransaction();
        await queryRunner.release();
      }
    });
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

  remove(id: string): Promise<void> {
    return this.pluginsUtilService.remove(id);
  }

  async checkIfPluginsToBeInstalled(
    dataSources
  ): Promise<{ pluginsToBeInstalled: Array<string>; pluginsListIdToDetailsMap: any }> {
    try {
      const { pluginsListIdToDetailsMap } = this.pluginsUtilService.listMarketplacePlugins();
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

  autoInstallPluginsForTemplates(pluginsToBeInstalled: Array<string>, shouldAutoInstall: boolean) {
    return this.pluginsUtilService.autoInstallPluginsForTemplates(pluginsToBeInstalled, shouldAutoInstall);
  }

  async uninstallPlugins(pluginsId: Array<string>) {
    return this.pluginsUtilService.uninstallPlugins(pluginsId);
  }
}
