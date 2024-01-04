import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from 'src/entities/file.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { Repository, Connection, EntityManager } from 'typeorm';
import { CreateFileDto } from '../dto/create-file.dto';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { FilesService } from './files.service';
import { encode } from 'js-base64';
import { ConfigService } from '@nestjs/config';
import * as jszip from 'jszip';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { UpdateFileDto } from '@dto/update-file.dto';

const jszipInstance = new jszip();
const fs = require('fs');

@Injectable()
export class PluginsService {
  constructor(
    private readonly filesService: FilesService,
    private connection: Connection,
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>,
    private configService: ConfigService
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
    const queryRunner = this.connection.createQueryRunner();

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
            uploadedFiles[key] = await this.filesService.create(fileDto, manager);
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

      return this.pluginsRepository.save(plugin);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
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
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentPlugin = await this.pluginsRepository.findOne({
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
            uploadedFiles[key] = await this.filesService.update(currentPlugin[`${key}FileId`], fileDto, manager);
          });
        })
      );

      const plugin = new Plugin();
      plugin.id = currentPlugin.id;
      plugin.repo = updatePluginDto.repo || '';
      plugin.version = version ?? updatePluginDto.version;

      return this.pluginsRepository.save(plugin);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.pluginsRepository.find({ relations: ['iconFile', 'manifestFile'] });
  }

  async findOne(id: string) {
    const plugin = await this.pluginsRepository.findOne({ where: { id }, relations: ['indexFile'] });
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }
    return plugin;
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

  async fetchPluginFilesFromS3(id: string) {
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

  fetchPluginFiles(id: string, repo: string) {
    if (repo && repo.length > 0) {
      return this.fetchPluginFilesFromRepo(repo);
    }

    return this.fetchPluginFilesFromS3(id);
  }

  async install(body: CreatePluginDto) {
    const { id, repo } = body;
    const [index, operations, icon, manifest, version] = await this.fetchPluginFiles(id, repo);
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

    return shouldCreate && (await this.create(body, version, { index, operations, icon, manifest }));
  }

  async update(id: string, body: UpdatePluginDto) {
    const { pluginId, repo } = body;
    const [index, operations, icon, manifest, version] = await this.fetchPluginFiles(pluginId, repo);
    return await this.upgrade(id, body, version, { index, operations, icon, manifest });
  }

  async remove(id: string) {
    return await this.pluginsRepository.delete(id);
  }

  async reload(id: string) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const plugin = await this.findOne(id);
      const { pluginId, repo, version } = plugin;

      const [index, operations, icon, manifest] = await this.fetchPluginFiles(pluginId, repo);

      const files = { index, operations, icon, manifest };

      const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
      await Promise.all(
        Object.keys(files).map(async (key) => {
          return await dbTransactionWrap(async (manager: EntityManager) => {
            const file = files[key];
            const fileDto = new UpdateFileDto();
            fileDto.data = encode(file);
            fileDto.filename = key;
            uploadedFiles[key] = await this.filesService.update(plugin[`${key}FileId`], fileDto, manager);
          });
        })
      );

      const updatedPlugin = new Plugin();

      updatedPlugin.id = plugin.id;
      updatedPlugin.repo = repo || '';
      updatedPlugin.version = version;

      return this.pluginsRepository.save(updatedPlugin);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
  }
}
