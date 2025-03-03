import { dbTransactionWrap } from '@helpers/database.helper';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { EntityManager } from 'typeorm';
import { FilesRepository } from '@modules/files/repository';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { Plugin } from '@entities/plugin.entity';
import { encode } from 'js-base64';
import { File } from 'src/entities/file.entity';
import * as jszip from 'jszip';
import * as fs from 'fs';
import { CreateFileDto, UpdateFileDto } from '@modules/files/dto';
import { IPluginsUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';

const jszipInstance = new jszip();
@Injectable()
export class PluginsUtilService implements IPluginsUtilService {
  constructor(protected readonly filesRepository: FilesRepository, protected readonly configService: ConfigService) {}
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
        const currentPlugin = await manager.findOne(Plugin, {
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
}
