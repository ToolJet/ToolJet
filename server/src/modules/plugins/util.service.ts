import { dbTransactionWrap } from '@helpers/database.helper';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { EntityManager } from 'typeorm';
import { FilesRepository } from '@modules/files/repository';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Plugin } from '@entities/plugin.entity';
import { encode } from 'js-base64';
import { File } from 'src/entities/file.entity';
import * as jszip from 'jszip';
import * as fs from 'fs';
import { CreateFileDto, UpdateFileDto } from '@modules/files/dto';
import { IPluginsUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataSourceEntity } from '@modules/app/decorators/data-source.decorator';
import * as path from 'path';

const jszipInstance = new jszip();
@Injectable()
export class PluginsUtilService implements IPluginsUtilService {
  constructor(
    protected readonly filesRepository: FilesRepository,
    protected readonly dataSourcesRepository: DataSourcesRepository,
    protected readonly configService: ConfigService
  ) {}
  async create(
    createPluginDto: CreatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    }
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
        await Promise.all(
          Object.keys(files).map(async (key) => {
            return await dbTransactionWrap(async (manager: EntityManager) => {
              const file = files[key];
              const fileDto = new CreateFileDto();
              fileDto.data = encode(file);
              fileDto.filename = key;
              uploadedFiles[key] = await this.filesRepository.createOne(fileDto, manager);
            });
          })
        );

        const plugin = new Plugin();
        plugin.pluginId = createPluginDto.id;
        plugin.name = createPluginDto.name;
        plugin.repo = createPluginDto.repo || '';
        plugin.version = version || createPluginDto.version;
        plugin.description = createPluginDto.description;
        plugin.indexFileId = uploadedFiles.index.id;
        plugin.operationsFileId = uploadedFiles.operations.id;
        plugin.iconFileId = uploadedFiles.icon.id;
        plugin.manifestFileId = uploadedFiles.manifest.id;

        return await manager.save(plugin);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        await queryRunner.release();
      }
    });
  }

  fetchPluginFiles(id: string, repo: string) {
    if (repo && repo.length > 0) {
      return this.fetchPluginFilesFromRepo(repo);
    }

    return this.fetchPluginFilesFromS3(id);
  }

  async fetchPluginFilesFromRepo(repo: string) {
    const releaseResponse = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    const latestRelease = await releaseResponse.json();
    const [zipballResponse, indexResponse] = await Promise.all([
      fetch(`${latestRelease.zipball_url}`),
      fetch(`${latestRelease.assets[0].browser_download_url}`),
    ]);
    const zipball = await zipballResponse.arrayBuffer();
    const index = await indexResponse.arrayBuffer();

    const result = await jszipInstance.loadAsync(zipball);

    let manifestFileKey: string;
    let iconFileKey: string;
    let operationsFileKey: string;

    Object.keys(result.files).forEach(async (key) => {
      if (key.includes('manifest.json')) {
        manifestFileKey = key;
      } else if (key.includes('icon.svg')) {
        iconFileKey = key;
      } else if (key.includes('operations.json')) {
        operationsFileKey = key;
      }
    });

    const [manifestFile, iconFile, operations] = await Promise.all([
      result.files[manifestFileKey].async('arraybuffer'),
      result.files[iconFileKey].async('arraybuffer'),
      result.files[operationsFileKey].async('arraybuffer'),
    ]);

    const version = latestRelease.name.replace('v', '');

    return [index, operations, iconFile, manifestFile, version];
  }

  private async fetchPluginFilesFromS3(id: string) {
    if (process.env.NODE_ENV === 'production') {
      const host = this.configService.get<string>(
        'TOOLJET_MARKETPLACE_URL',
        'https://tooljet-plugins-production.s3.us-east-2.amazonaws.com'
      );

      const promises = await Promise.all([
        fetch(`${host}/marketplace-assets/${id}/dist/index.js`),
        fetch(`${host}/marketplace-assets/${id}/lib/operations.json`),
        fetch(`${host}/marketplace-assets/${id}/lib/icon.svg`),
        fetch(`${host}/marketplace-assets/${id}/lib/manifest.json`),
      ]);

      const files = promises.map(async (promise) => {
        if (!promise.ok) throw new InternalServerErrorException();
        const arrayBuffer = await promise.arrayBuffer();
        const textDecoder = new TextDecoder();
        return textDecoder.decode(arrayBuffer);
      });

      const [indexFile, operationsFile, iconFile, manifestFile] = await Promise.all(files);

      return [indexFile, operationsFile, iconFile, manifestFile];
    }

    async function readFile(filePath) {
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        let fileContent = '';

        readStream.on('data', (chunk) => {
          fileContent += chunk;
        });

        readStream.on('error', (err) => {
          reject(err);
        });

        readStream.on('end', () => {
          resolve(fileContent);
        });
      });
    }

    const [indexFile, operationsFile, iconFile, manifestFile] = await Promise.all([
      readFile(`../marketplace/plugins/${id}/dist/index.js`),
      readFile(`../marketplace/plugins/${id}/lib/operations.json`),
      readFile(`../marketplace/plugins/${id}/lib/icon.svg`),
      readFile(`../marketplace/plugins/${id}/lib/manifest.json`),
    ]);

    return [indexFile, operationsFile, iconFile, manifestFile];
  }

  async upgrade(
    id: string,
    updatePluginDto: UpdatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    }
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const currentPlugin = await manager.findOneOrFail(Plugin, {
          where: { id },
        });

        const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
        await Promise.all(
          Object.keys(files).map(async (key) => {
            return await dbTransactionWrap(async (manager: EntityManager) => {
              const file = files[key];
              const fileDto = new UpdateFileDto();
              fileDto.data = encode(file);
              fileDto.filename = key;
              uploadedFiles[key] = await this.filesRepository.updateOne(
                currentPlugin[`${key}FileId`],
                fileDto,
                manager
              );
            });
          })
        );

        const plugin = new Plugin();
        plugin.id = currentPlugin.id;
        plugin.repo = updatePluginDto.repo || '';
        plugin.version = version ?? updatePluginDto.version;

        return manager.save(plugin);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        await queryRunner.release();
      }
    });
  }

  private getPluginsJsonDirectory() {
    const isProduction = process.env.NODE_ENV == 'production';
    const buildExists = __dirname.includes('dist');
    const baseDir = isProduction && buildExists ? path.join(__dirname) : __dirname.replace('/dist/', '/');
    return path.join(baseDir, '../../assets/marketplace/plugins.json');
  }

  listMarketplacePlugins() {
    const jsonpath = this.getPluginsJsonDirectory();

    if (fs.existsSync(jsonpath)) {
      const pluginsList = JSON.parse(fs.readFileSync(jsonpath, 'utf-8'));
      const pluginsListIdToDetailsMap = Object.fromEntries(pluginsList.map((plugin: any) => [plugin.id, plugin]));
      return { pluginsList, pluginsListIdToDetailsMap };
    } else {
      throw new NotFoundException('Plugins list not found');
    }
  }

  async install(body: CreatePluginDto) {
    const { id, repo, name } = body;

    const existingPlugin = await dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Plugin, { where: { pluginId: id } });
    });
    if (existingPlugin) throw new BadRequestException(`Plugin '${name}' is already installed.`);

    const [index, operations, icon, manifest, version] = await this.fetchPluginFiles(id, repo);
    let shouldCreate = false;

    try {
      // validate manifest and operations as JSON files
      const validManifest = JSON.parse(manifest.toString()) ? manifest : null;
      const validOperations = JSON.parse(operations.toString()) ? operations : null;

      if (validManifest && validOperations) {
        shouldCreate = true;
      }
    } catch {
      throw new InternalServerErrorException('Invalid plugin files');
    }

    return shouldCreate && (await this.create(body, version, { index, operations, icon, manifest }));
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

  async remove(id: string) {
    const dataSourcesByMarketplacePlugin = await this.dataSourcesRepository.getDatasourceByPluginId(id);
    if (dataSourcesByMarketplacePlugin.length) {
      const queries = [];
      dataSourcesByMarketplacePlugin?.forEach((datasource: DataSourceEntity) => {
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

  async autoInstallPluginsForTemplates(pluginsToBeInstalled: Array<string>, shouldAutoInstall: boolean) {
    const installedPluginsList = [];
    const installedPluginsInfo = [];
    try {
      const { pluginsListIdToDetailsMap } = this.listMarketplacePlugins();
      if (shouldAutoInstall && pluginsToBeInstalled.length) {
        for (const pluginId of pluginsToBeInstalled) {
          const pluginDetails = pluginsListIdToDetailsMap[pluginId];
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
}
